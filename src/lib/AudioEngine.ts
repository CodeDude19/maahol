import { Sound } from "@/data/sounds";
import { TimerOption } from "./AudioStateManager";

// Define our basic types
export interface SoundNode {
  id: string;
  buffer: AudioBuffer | null;
  gainNode: GainNode;
  sourceNode: AudioBufferSourceNode | null;
  isPlaying: boolean;
  volume: number;
  lastStartTime: number;
  bufferPromise: Promise<AudioBuffer> | null;
}

export interface SoundMix {
  name: string;
  description: string;
  sounds: { id: string; volume: number }[];
}

// Constants
export const MAX_CONCURRENT_SOUNDS = 3;
const CROSSFADE_DURATION = 2; // in seconds

// Cache for storing loaded audio buffers to avoid repeated fetching
const bufferCache = new Map<string, AudioBuffer>();

export class AudioEngine {
  private context: AudioContext;
  private soundNodes: Map<string, SoundNode>;
  private masterGain: GainNode;
  private isPlaying: boolean = false;
  private timerEndTime: number | null = null;
  private timerInterval: number | null = null;
  private timerCallbacks: Set<(timeRemaining: number | null) => void>;
  private stateChangeCallbacks: Set<() => void>;
  
  constructor() {
    // Create Audio Context
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.soundNodes = new Map();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 0.7; // Default master volume
    this.timerCallbacks = new Set();
    this.stateChangeCallbacks = new Set();
    
    // Resume context on user interaction (needed for browsers with autoplay policy)
    const resumeAudioContext = () => {
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      
      document.removeEventListener('touchstart', resumeAudioContext);
      document.removeEventListener('click', resumeAudioContext);
    };
    
    document.addEventListener('touchstart', resumeAudioContext, false);
    document.addEventListener('click', resumeAudioContext, false);
  }
  
  // Clean up resources
  public cleanup() {
    this.stopAllSounds();
    if (this.timerInterval) {
      window.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerCallbacks.clear();
    this.stateChangeCallbacks.clear();
    
    // Close the audio context if supported
    if (this.context && this.context.close) {
      this.context.close();
    }
  }
  
  // Load a sound's audio buffer
  private async loadBuffer(sound: Sound): Promise<AudioBuffer> {
    // Return from cache if available
    if (bufferCache.has(sound.id)) {
      return bufferCache.get(sound.id)!;
    }
    
    try {
      console.log(`Loading audio buffer for sound: ${sound.name}`);
      const startTime = performance.now();
      
      const response = await fetch(sound.audioSrc);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      const loadTime = performance.now() - startTime;
      console.log(`Loaded audio buffer for ${sound.name} in ${loadTime.toFixed(1)}ms`);
      
      // Store in cache
      bufferCache.set(sound.id, audioBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load sound ${sound.id}:`, error);
      throw error;
    }
  }
  
  // Preload all sounds to avoid delay when applying mixes
  public async preloadAllSounds(): Promise<void> {
    console.log("Starting to preload all sounds...");
    try {
      // Dynamically import sounds to avoid circular dependencies
      const { sounds } = await import('@/data/sounds');
      
      // Load all sounds in parallel
      const loadPromises = sounds.map(async (sound) => {
        try {
          if (!bufferCache.has(sound.id)) {
            await this.loadBuffer(sound);
            console.log(`Preloaded sound: ${sound.name}`);
          }
        } catch (error) {
          console.error(`Failed to preload sound ${sound.id}:`, error);
        }
      });
      
      await Promise.all(loadPromises);
      console.log("All sounds preloaded successfully");
    } catch (error) {
      console.error("Error preloading sounds:", error);
    }
  }
  
  // Create or get a sound node
  private async getSoundNode(sound: Sound, volume: number = 1): Promise<SoundNode> {
    // Check if we already have this sound
    if (this.soundNodes.has(sound.id)) {
      const node = this.soundNodes.get(sound.id)!;
      
      // Update volume if needed
      if (node.volume !== volume) {
        node.volume = volume;
        node.gainNode.gain.value = volume * this.masterGain.gain.value;
      }
      
      return node;
    }
    
    // Create a new gain node for this sound
    const gainNode = this.context.createGain();
    gainNode.connect(this.masterGain);
    gainNode.gain.value = volume * this.masterGain.gain.value;
    
    // Create the initial sound node object
    const soundNode: SoundNode = {
      id: sound.id,
      buffer: null,
      gainNode,
      sourceNode: null,
      isPlaying: false,
      volume,
      lastStartTime: 0,
      bufferPromise: null
    };
    
    // Store in our map
    this.soundNodes.set(sound.id, soundNode);
    
    // Start loading the buffer
    soundNode.bufferPromise = this.loadBuffer(sound)
      .then(buffer => {
        soundNode.buffer = buffer;
        soundNode.bufferPromise = null;
        return buffer;
      })
      .catch(error => {
        console.error(`Failed to load buffer for ${sound.id}:`, error);
        soundNode.bufferPromise = null;
        throw error;
      });
    
    // If we're in playing state, start playing this sound
    if (this.isPlaying) {
      try {
        await this.playSound(soundNode);
      } catch (error) {
        console.error(`Failed to automatically play new sound ${sound.id}:`, error);
      }
    }
    
    return soundNode;
  }
  
  // Play a specific sound node
  private async playSound(soundNode: SoundNode): Promise<void> {
    if (soundNode.isPlaying) return;
    
    // Make sure we have a buffer
    if (!soundNode.buffer && soundNode.bufferPromise) {
      try {
        soundNode.buffer = await soundNode.bufferPromise;
      } catch (error) {
        console.error(`Failed to load buffer for ${soundNode.id}:`, error);
        throw error;
      }
    }
    
    if (!soundNode.buffer) {
      console.error(`No buffer available for sound ${soundNode.id}`);
      return;
    }
    
    // Create a new source node
    const sourceNode = this.context.createBufferSource();
    sourceNode.buffer = soundNode.buffer;
    sourceNode.connect(soundNode.gainNode);
    soundNode.sourceNode = sourceNode;
    
    // Calculate when to schedule the next loop with crossfade
    // The loop will start CROSSFADE_DURATION seconds before the end
    const scheduleNextLoop = () => {
      if (!soundNode.isPlaying || !soundNode.buffer) return;
      
      const loopStartTime = this.context.currentTime + soundNode.buffer.duration - CROSSFADE_DURATION;
      
      // Schedule the next loop
      setTimeout(() => {
        if (soundNode.isPlaying) {
          this.crossfadeLoop(soundNode);
        }
      }, (loopStartTime - this.context.currentTime) * 1000);
    };
    
    // Set up the ended handler for manual looping
    sourceNode.onended = () => {
      // This should only trigger if the source finishes without a new crossfade
      // being scheduled, which should be rare since we schedule crossfades before ending
      if (soundNode.isPlaying && soundNode.sourceNode === sourceNode) {
        console.log(`Sound ${soundNode.id} ended without crossfade, restarting`);
        this.crossfadeLoop(soundNode);
      }
    };
    
    // Start the source
    sourceNode.start(0);
    soundNode.isPlaying = true;
    soundNode.lastStartTime = this.context.currentTime;
    
    // Schedule the next loop
    scheduleNextLoop();
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Stop a specific sound
  private stopSound(soundNode: SoundNode): void {
    if (!soundNode.isPlaying) return;
    
    // Stop the source node if it exists
    if (soundNode.sourceNode) {
      try {
        soundNode.sourceNode.stop();
        soundNode.sourceNode.disconnect();
      } catch (e) {
        // Ignore errors from stopping already stopped sources
      }
      soundNode.sourceNode = null;
    }
    
    soundNode.isPlaying = false;
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Handle crossfade looping
  private crossfadeLoop(soundNode: SoundNode): void {
    if (!soundNode.buffer || !soundNode.isPlaying) return;
    
    // Create a new source node for the crossfade
    const newSource = this.context.createBufferSource();
    newSource.buffer = soundNode.buffer;
    
    // Create a gain node for the new source with 0 initial gain
    const newGain = this.context.createGain();
    newGain.gain.value = 0;
    
    // Connect the new chain
    newSource.connect(newGain);
    newGain.connect(this.masterGain);
    
    // Keep reference to the old source and gain for fading out
    const oldSource = soundNode.sourceNode;
    const oldGain = soundNode.gainNode;
    
    // Update the sound node to use the new gain node
    soundNode.gainNode = newGain;
    soundNode.sourceNode = newSource;
    
    // Schedule the crossfade
    const now = this.context.currentTime;
    const targetVolume = soundNode.volume * this.masterGain.gain.value;
    
    // Set up time ramps for the crossfade
    newGain.gain.setValueAtTime(0, now);
    newGain.gain.linearRampToValueAtTime(targetVolume, now + CROSSFADE_DURATION);
    
    if (oldSource && oldGain) {
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);
      
      // Disconnect old source after fade completes
      setTimeout(() => {
        if (oldSource) {
          try {
            oldSource.stop();
            oldSource.disconnect();
          } catch (e) {
            // Ignore errors from stopping already stopped sources
          }
        }
        if (oldGain) {
          try {
            oldGain.disconnect();
          } catch (e) {
            // Ignore disconnection errors
          }
        }
      }, CROSSFADE_DURATION * 1000 + 100); // Add a little buffer time
    }
    
    // Start the new source
    newSource.start(0);
    soundNode.lastStartTime = now;
    
    // Schedule the next loop
    const loopStartTime = now + soundNode.buffer.duration - CROSSFADE_DURATION;
    setTimeout(() => {
      if (soundNode.isPlaying) {
        this.crossfadeLoop(soundNode);
      }
    }, (loopStartTime - now) * 1000);
  }
  
  // Public API methods
  
  // Toggle a sound on or off
  public async toggleSound(sound: Sound, initialVolume: number = 1): Promise<boolean> {
    const soundId = sound.id;
    
    // If sound exists and is playing, stop and remove it
    if (this.soundNodes.has(soundId)) {
      const soundNode = this.soundNodes.get(soundId)!;
      
      if (soundNode.isPlaying) {
        this.stopSound(soundNode);
        return false; // Indicate sound was turned off
      }
      
      // Sound exists but isn't playing, so play it
      try {
        await this.playSound(soundNode);
        return true; // Indicate sound was turned on
      } catch (error) {
        console.error(`Failed to play sound ${soundId}:`, error);
        return false;
      }
    }
    
    // Check if we've hit the max concurrent sounds
    if (this.getActiveSounds().length >= MAX_CONCURRENT_SOUNDS) {
      console.warn('Maximum number of concurrent sounds reached');
      return false;
    }
    
    // Sound doesn't exist yet, create it
    try {
      const soundNode = await this.getSoundNode(sound, initialVolume);
      if (this.isPlaying) {
        await this.playSound(soundNode);
      }
      return true; // Indicate sound was added
    } catch (error) {
      console.error(`Failed to add sound ${soundId}:`, error);
      return false;
    }
  }
  
  // Set volume for a specific sound
  public setVolumeForSound(soundId: string, volume: number): void {
    if (!this.soundNodes.has(soundId)) return;
    
    const soundNode = this.soundNodes.get(soundId)!;
    soundNode.volume = volume;
    soundNode.gainNode.gain.value = volume * this.masterGain.gain.value;
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Set the master volume
  public setMasterVolume(volume: number): void {
    this.masterGain.gain.value = volume;
    
    // Update individual sound volumes
    this.soundNodes.forEach(soundNode => {
      soundNode.gainNode.gain.value = soundNode.volume * volume;
    });
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Toggle between playing and paused states
  public togglePlayPause(): boolean {
    if (this.isPlaying) {
      this.pauseAllSounds();
      return false;
    } else {
      this.playAllSounds();
      return true;
    }
  }
  
  // Pause all active sounds
  public pauseAllSounds(): void {
    this.isPlaying = false;
    
    this.soundNodes.forEach(soundNode => {
      if (soundNode.isPlaying) {
        this.stopSound(soundNode);
      }
    });
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Play all sounds that should be active
  public async playAllSounds(): Promise<void> {
    this.isPlaying = true;
    
    const soundsToPlay = Array.from(this.soundNodes.values())
      .filter(soundNode => soundNode.buffer || soundNode.bufferPromise);
    
    // Play sounds sequentially with a small delay to prevent audio glitches
    for (const soundNode of soundsToPlay) {
      try {
        await this.playSound(soundNode);
        // Small delay between each sound start
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
        console.error(`Error playing sound ${soundNode.id}:`, e);
      }
    }
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Stop all sounds completely
  public stopAllSounds(): void {
    this.isPlaying = false;
    
    this.soundNodes.forEach(soundNode => {
      this.stopSound(soundNode);
    });
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Remove a sound completely
  public removeSound(soundId: string): void {
    if (!this.soundNodes.has(soundId)) return;
    
    const soundNode = this.soundNodes.get(soundId)!;
    this.stopSound(soundNode);
    this.soundNodes.delete(soundId);
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Apply a sound mix
  public async applyMix(mix: SoundMix): Promise<void> {
    console.log(`AudioEngine: Applying mix '${mix.name}'`);
    
    // Get current active sound IDs
    const currentSoundIds = new Set(this.soundNodes.keys());
    const mixSoundIds = new Set(mix.sounds.map(s => s.id));
    
    // Find sounds to remove (in current but not in mix)
    const soundsToRemove = [...currentSoundIds].filter(id => !mixSoundIds.has(id));
    
    // Remove sounds not in the mix
    soundsToRemove.forEach(id => {
      this.removeSound(id);
    });
    
    // Load mix sounds in parallel
    const loadPromises = mix.sounds.map(async ({ id, volume }) => {
      const sound = await this.getSoundFromId(id);
      if (!sound) {
        console.error(`Sound with ID ${id} not found for mix`);
        return;
      }
      
      if (this.soundNodes.has(id)) {
        // Update volume for existing sound
        this.setVolumeForSound(id, volume);
      } else {
        // Add new sound
        await this.getSoundNode(sound, volume);
      }
    });
    
    await Promise.all(loadPromises);
    
    // Add a slight delay to let the audio context process all the changes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // If we're in playing state, ensure all mix sounds are playing
    if (this.isPlaying) {
      // Start playing sounds sequentially with a small delay between each
      // This helps reduce the load on the audio context and prevents glitches
      for (const { id } of mix.sounds) {
        if (this.soundNodes.has(id)) {
          const soundNode = this.soundNodes.get(id)!;
          if (!soundNode.isPlaying) {
            try {
              await this.playSound(soundNode);
              // Small delay between starting each sound
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (e) {
              console.error(`Error playing sound ${id} in mix:`, e);
            }
          }
        }
      }
    }
    
    // Notify state change
    this.notifyStateChange();
  }
  
  // Set a timer
  public setTimer(timer: TimerOption): void {
    // Clear existing timer
    this.cancelTimer();
    
    if (timer === 'endless') {
      return;
    }
    
    // Calculate minutes based on option
    let minutes = 0;
    switch (timer) {
      case "5min": minutes = 5; break;
      case "15min": minutes = 15; break;
      case "30min": minutes = 30; break;
      case "45min": minutes = 45; break;
      case "60min": minutes = 60; break;
      case "75min": minutes = 75; break;
      case "90min": minutes = 90; break;
    }
    
    // Calculate end time
    const milliseconds = minutes * 60 * 1000;
    this.timerEndTime = Date.now() + milliseconds;
    
    // Start timer
    this.startTimerInterval();
    
    // Notify timer callbacks
    this.notifyTimerUpdate(milliseconds);
  }
  
  // Cancel the current timer
  public cancelTimer(): void {
    if (this.timerInterval) {
      window.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.timerEndTime = null;
    
    // Notify timer callbacks
    this.notifyTimerUpdate(null);
  }
  
  // Start the timer interval
  private startTimerInterval(): void {
    if (this.timerInterval) {
      window.clearInterval(this.timerInterval);
    }
    
    this.timerInterval = window.setInterval(() => {
      if (!this.timerEndTime) {
        this.cancelTimer();
        return;
      }
      
      const remaining = this.timerEndTime - Date.now();
      
      if (remaining <= 0) {
        // Timer has finished
        this.notifyTimerUpdate(0);
        this.pauseAllSounds();
        this.cancelTimer();
      } else {
        this.notifyTimerUpdate(remaining);
      }
    }, 1000);
  }
  
  // Get sound object from ID
  private async getSoundFromId(id: string): Promise<Sound | null> {
    // We need to dynamically import sounds to avoid circular dependencies
    const { sounds } = await import('@/data/sounds');
    return sounds.find(s => s.id === id) || null;
  }
  
  // Get all active sounds
  public getActiveSounds(): { id: string; volume: number }[] {
    return Array.from(this.soundNodes.values())
      .filter(node => node.isPlaying || (this.isPlaying && (node.buffer || node.bufferPromise)))
      .map(node => ({
        id: node.id,
        volume: node.volume
      }));
  }
  
  // Get the player state
  public getPlayerState(): boolean {
    return this.isPlaying;
  }
  
  // Get the master volume
  public getMasterVolume(): number {
    return this.masterGain.gain.value;
  }
  
  // Get the timer end time
  public getTimerEndTime(): number | null {
    return this.timerEndTime;
  }
  
  // Subscribe to timer updates
  public subscribeToTimerUpdates(callback: (timeRemaining: number | null) => void): () => void {
    this.timerCallbacks.add(callback);
    return () => this.timerCallbacks.delete(callback);
  }
  
  // Notify timer callbacks
  private notifyTimerUpdate(timeRemaining: number | null): void {
    this.timerCallbacks.forEach(callback => callback(timeRemaining));
  }
  
  // Subscribe to state changes
  public subscribeToStateChanges(callback: () => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }
  
  // Notify state change callbacks
  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => callback());
  }
}

// Create a singleton instance
export const audioEngine = new AudioEngine();