import { Sound } from "@/data/sounds";
import { audioPreloader } from "./AudioPreloader";

/**
 * AudioTrack manages a single sound with crossfading capability
 */
export class AudioTrack {
  // Audio elements for crossfading
  private primaryAudio: HTMLAudioElement;
  private secondaryAudio: HTMLAudioElement;
  
  // Track state
  private sound: Sound;
  private _volume: number = 1;
  private _masterVolume: number = 1;
  private _isPlaying: boolean = false;
  private activeAudio: 'primary' | 'secondary' = 'primary';
  private crossfading: boolean = false;
  private isReady: boolean = false;
  private readyListeners: Array<() => void> = [];
  
  constructor(sound: Sound, initialVolume: number = 1) {
    this.sound = sound;
    this._volume = initialVolume;
    
    // Get audio elements from preloader
    const { primary, secondary } = audioPreloader.getAudioElements(sound);
    this.primaryAudio = primary;
    this.secondaryAudio = secondary;
    
    // Configure audio elements
    this.primaryAudio.loop = false;
    this.secondaryAudio.loop = false;
    
    // Set initial volumes
    this.updateVolumes();
    
    // Setup crossfading
    this.setupCrossfading();
    
    // Check if audio is already loaded or wait for it to load
    if (audioPreloader.isCached(sound.id)) {
      this.isReady = true;
    } else {
      // Wait for audio to load
      audioPreloader.getLoadPromise(sound.id)
        .then(() => {
          this.isReady = true;
          // Notify any listeners
          this.readyListeners.forEach(listener => listener());
          this.readyListeners = [];
        })
        .catch(error => {
          console.error(`Failed to load audio for ${sound.id}:`, error);
          // Still mark as ready to avoid blocking indefinitely
          this.isReady = true;
        });
    }
  }
  
  /**
   * Set up event listeners for crossfading between audio elements
   */
  private setupCrossfading(): void {
    // Handle primary audio nearing end
    this.primaryAudio.addEventListener('timeupdate', () => {
      if (this.activeAudio !== 'primary' || this.crossfading || !this._isPlaying) return;
      
      const timeLeft = this.primaryAudio.duration - this.primaryAudio.currentTime;
      if (timeLeft > 0 && timeLeft <= 2) {
        this.startCrossfade();
      }
    });
    
    // Handle secondary audio nearing end
    this.secondaryAudio.addEventListener('timeupdate', () => {
      if (this.activeAudio !== 'secondary' || this.crossfading || !this._isPlaying) return;
      
      const timeLeft = this.secondaryAudio.duration - this.secondaryAudio.currentTime;
      if (timeLeft > 0 && timeLeft <= 2) {
        this.startCrossfade();
      }
    });
  }
  
  /**
   * Start crossfading between active and inactive audio elements
   */
  private startCrossfade(): void {
    if (this.crossfading || !this._isPlaying) return;
    
    this.crossfading = true;
    
    const currentAudio = this.activeAudio === 'primary' ? this.primaryAudio : this.secondaryAudio;
    const nextAudio = this.activeAudio === 'primary' ? this.secondaryAudio : this.primaryAudio;
    
    // Reset the next audio element
    nextAudio.currentTime = 0;
    nextAudio.volume = 0;
    
    // Start playing the next audio
    nextAudio.play();
    
    // Perform crossfade
    const steps = 20;
    const interval = 100; // 100ms intervals
    let step = 0;
    
    const fade = setInterval(() => {
      step++;
      const ratio = step / steps;
      
      // If playback was stopped during crossfade
      if (!this._isPlaying) {
        clearInterval(fade);
        this.crossfading = false;
        return;
      }
      
      // Set volumes based on progress
      const effectiveVolume = this._volume * this._masterVolume;
      nextAudio.volume = effectiveVolume * ratio;
      currentAudio.volume = effectiveVolume * (1 - ratio);
      
      if (step >= steps) {
        clearInterval(fade);
        
        // Switch active audio
        this.activeAudio = this.activeAudio === 'primary' ? 'secondary' : 'primary';
        
        // Stop the previous audio
        currentAudio.pause();
        currentAudio.currentTime = 0;
        
        // Ensure next audio has correct volume
        nextAudio.volume = effectiveVolume;
        
        this.crossfading = false;
      }
    }, interval);
  }
  
  /**
   * Start playback of this track
   * @returns Promise that resolves when playback starts
   */
  public play(): Promise<void> {
    if (this._isPlaying) return Promise.resolve();
    
    this._isPlaying = true;
    
    // If audio is ready, play immediately
    if (this.isReady) {
      const currentAudio = this.activeAudio === 'primary' ? this.primaryAudio : this.secondaryAudio;
      return currentAudio.play()
        .catch(error => {
          console.error(`Error playing audio ${this.sound.id}:`, error);
          // Most common error is "play() failed because the user didn't interact with the document first"
          // This is a browser policy, not actually an error in our code
        });
    }
    
    // Otherwise, wait for audio to be ready
    return new Promise<void>(resolve => {
      this.readyListeners.push(() => {
        const currentAudio = this.activeAudio === 'primary' ? this.primaryAudio : this.secondaryAudio;
        currentAudio.play()
          .catch(error => {
            console.error(`Error playing audio ${this.sound.id}:`, error);
          })
          .finally(() => resolve());
      });
    });
  }
  
  /**
   * Pause playback of this track
   */
  public pause(): void {
    if (!this._isPlaying) return;
    
    this._isPlaying = false;
    
    this.primaryAudio.pause();
    this.secondaryAudio.pause();
    this.crossfading = false;
  }
  
  /**
   * Update volumes on both audio elements
   */
  private updateVolumes(): void {
    const effectiveVolume = this._volume * this._masterVolume;
    
    // Only set volume on the currently active audio
    if (this.activeAudio === 'primary') {
      this.primaryAudio.volume = effectiveVolume;
      // Secondary might be silent or crossfading
      if (!this.crossfading) {
        this.secondaryAudio.volume = 0;
      }
    } else {
      this.secondaryAudio.volume = effectiveVolume;
      // Primary might be silent or crossfading
      if (!this.crossfading) {
        this.primaryAudio.volume = 0;
      }
    }
  }
  
  /**
   * Set the volume for this track
   */
  public set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    this.updateVolumes();
  }
  
  /**
   * Get the current volume for this track
   */
  public get volume(): number {
    return this._volume;
  }
  
  /**
   * Set the master volume multiplier
   */
  public set masterVolume(value: number) {
    this._masterVolume = Math.max(0, Math.min(1, value));
    this.updateVolumes();
  }
  
  /**
   * Get the sound object for this track
   */
  public get soundData(): Sound {
    return this.sound;
  }
  
  /**
   * Get the playing state of this track
   */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }
  
  /**
   * Release resources used by this track
   */
  public dispose(): void {
    // Stop playback
    this.pause();
    
    // Remove event listeners
    this.primaryAudio.removeEventListener('timeupdate', () => {});
    this.secondaryAudio.removeEventListener('timeupdate', () => {});
    
    // Clear ready listeners
    this.readyListeners = [];
    
    // Note: We don't clear the audio sources here since they're managed by the preloader
  }
}