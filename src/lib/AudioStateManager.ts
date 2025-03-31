import { Sound } from "@/data/sounds";

// Types
export type TimerOption = 
  | "5min"
  | "15min" 
  | "30min" 
  | "45min" 
  | "60min" 
  | "75min" 
  | "90min" 
  | "endless";

export interface ActiveSound {
  sound: Sound;
  audio: HTMLAudioElement;
  volume: number;
}

export interface AudioState {
  activeSounds: ActiveSound[];
  masterVolume: number;
  isPlaying: boolean;
  timer: TimerOption;
  timeRemaining: number | null;
  timerEndTime: number | null;
  soundStates: Record<string, SoundState>;
}

export interface SoundState {
  volume: number;
  isPlaying: boolean;
}

export interface SoundMix {
  name: string;
  description: string;
  sounds: { id: string; volume: number }[];
}

// Action types
export type AudioAction =
  | { type: 'TOGGLE_SOUND'; sound: Sound }
  | { type: 'SET_VOLUME'; soundId: string; volume: number }
  | { type: 'SET_MASTER_VOLUME'; volume: number }
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'SET_TIMER'; timer: TimerOption }
  | { type: 'CANCEL_TIMER' }
  | { type: 'UPDATE_TIMER'; timeRemaining: number | null }
  | { type: 'PAUSE_ALL_SOUNDS' }
  | { type: 'PLAY_ALL_SOUNDS' }
  | { type: 'APPLY_MIX'; mix: SoundMix }
  | { type: 'INITIALIZE_STATE'; savedState: Record<string, SoundState> };

// Constants
export const MAX_CONCURRENT_SOUNDS = 3;
const LOCAL_STORAGE_KEY = 'maahol_audio_state';

// Initial state
export const initialAudioState: AudioState = {
  activeSounds: [],
  masterVolume: 0.7,
  isPlaying: false,
  timer: 'endless',
  timeRemaining: null,
  timerEndTime: null,
  soundStates: {}
};

// Helper functions
const createAudioElement = (sound: Sound, volume: number, masterVolume: number): HTMLAudioElement => {
  const audio = new Audio(sound.audioSrc);
  audio.loop = false; // We'll handle looping with crossfade
  audio.volume = volume * masterVolume;
  audio.preload = 'auto';
  return audio;
};

const attachCrossfadeListener = (
  audio: HTMLAudioElement, 
  sound: Sound, 
  volume: number, 
  masterVolume: number,
  onCrossfade: (oldAudio: HTMLAudioElement, newAudio: HTMLAudioElement) => void
) => {
  // Use a custom property to avoid multiple triggers
  (audio as any)._crossfadeTriggered = false;
  
  const handleTimeUpdate = () => {
    if ((audio as any)._crossfadeTriggered) return;
    if (!audio.duration || audio.duration === Infinity) return;
    
    if (audio.currentTime >= audio.duration - 3) {
      (audio as any)._crossfadeTriggered = true;
      
      // Create a new audio element for the same sound
      const newAudio = new Audio(sound.audioSrc);
      newAudio.loop = false;
      newAudio.preload = "auto";
      newAudio.volume = 0;
      
      // Attach the crossfade listener for future loops
      attachCrossfadeListener(newAudio, sound, volume, masterVolume, onCrossfade);
      
      newAudio.play().catch(e => {
        console.error("Crossfade new audio play failed:", e);
      });
      
      const fadeDuration = 3000; // 3 seconds in ms
      const fadeSteps = 60; // number of steps for the fade
      const stepInterval = fadeDuration / fadeSteps;
      const oldInitialVolume = audio.volume;
      const targetVolume = volume * masterVolume;
      
      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        currentStep++;
        const progress = currentStep / fadeSteps;
        // Use quadratic easing for a smoother transition
        const easedProgress = progress * progress;
        const newVol = targetVolume * easedProgress;
        const oldVol = oldInitialVolume * (1 - easedProgress);
        
        audio.volume = oldVol;
        newAudio.volume = newVol;
        
        if (currentStep >= fadeSteps) {
          clearInterval(fadeInterval);
          audio.pause();
          audio.src = "";
          // Ensure the new audio ends at the exact target volume
          newAudio.volume = targetVolume;
          
          // Notify the state manager to update the audio reference
          onCrossfade(audio, newAudio);
        }
      }, stepInterval);
    }
  };
  
  audio.addEventListener("timeupdate", handleTimeUpdate);
  return handleTimeUpdate;
};

// Reducer function
export const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'TOGGLE_SOUND': {
      const { sound } = action;
      const existingIndex = state.activeSounds.findIndex(as => as.sound.id === sound.id);
      
      if (existingIndex !== -1) {
        // Remove the sound if it's already active
        const newActiveSounds = [...state.activeSounds];
        const audioElement = newActiveSounds[existingIndex].audio;
        audioElement.pause();
        audioElement.src = "";
        newActiveSounds.splice(existingIndex, 1);
        
        // Remove from sound states
        const newSoundStates = { ...state.soundStates };
        delete newSoundStates[sound.id];
        
        // Update localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
        
        // If removing the last sound, pause playback
        const newIsPlaying = newActiveSounds.length === 0 ? false : state.isPlaying;
        
        return {
          ...state,
          activeSounds: newActiveSounds,
          soundStates: newSoundStates,
          isPlaying: newIsPlaying
        };
      } else {
        // Check if we've reached the max number of concurrent sounds
        if (state.activeSounds.length >= MAX_CONCURRENT_SOUNDS) {
          return state; // No change if max sounds reached
        }
        
        // Get the saved volume for this sound or use default
        const savedState = state.soundStates[sound.id];
        const volume = savedState?.volume ? savedState.volume / 100 : 1;
        
        // Create new audio element
        const audio = createAudioElement(sound, volume, state.masterVolume);
        
        // Create new active sound
        const newSound: ActiveSound = {
          sound,
          audio,
          volume
        };
        
        // Update sound states
        const newSoundStates = {
          ...state.soundStates,
          [sound.id]: {
            volume: volume * 100,
            isPlaying: state.isPlaying
          }
        };
        
        // Update localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
        
        // Determine if we should start playing
        let newIsPlaying = state.isPlaying;
        if (state.activeSounds.length === 0) {
          newIsPlaying = true;
        }
        
        // Play the sound if we're in playing state
        if (newIsPlaying) {
          audio.play().catch(e => {
            console.error("Failed to play audio:", e);
          });
        }
        
        return {
          ...state,
          activeSounds: [...state.activeSounds, newSound],
          soundStates: newSoundStates,
          isPlaying: newIsPlaying
        };
      }
    }
    
    case 'SET_VOLUME': {
      const { soundId, volume } = action;
      
      // Update active sound's volume
      const newActiveSounds = state.activeSounds.map(activeSound => {
        if (activeSound.sound.id === soundId) {
          activeSound.audio.volume = volume * state.masterVolume;
          return { ...activeSound, volume };
        }
        return activeSound;
      });
      
      // Update sound states
      const newSoundStates = {
        ...state.soundStates,
        [soundId]: {
          ...state.soundStates[soundId],
          volume: volume * 100 // Convert to 0-100 scale for storage
        }
      };
      
      // Update localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
      
      return {
        ...state,
        activeSounds: newActiveSounds,
        soundStates: newSoundStates
      };
    }
    
    case 'SET_MASTER_VOLUME': {
      const { volume } = action;
      
      // Update all active sounds with new master volume
      const newActiveSounds = state.activeSounds.map(activeSound => {
        activeSound.audio.volume = activeSound.volume * volume;
        return activeSound;
      });
      
      return {
        ...state,
        masterVolume: volume,
        activeSounds: newActiveSounds
      };
    }
    
    case 'TOGGLE_PLAY_PAUSE': {
      const newIsPlaying = !state.isPlaying;
      
      // Update all active sounds' play state
      state.activeSounds.forEach(({ audio }) => {
        if (newIsPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.error("Audio play failed:", e);
            });
          }
        } else {
          audio.pause();
        }
      });
      
      // Update sound states
      const newSoundStates = { ...state.soundStates };
      Object.keys(newSoundStates).forEach(key => {
        newSoundStates[key] = { 
          ...newSoundStates[key], 
          isPlaying: newIsPlaying 
        };
      });
      
      // Update localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
      
      return {
        ...state,
        isPlaying: newIsPlaying,
        soundStates: newSoundStates
      };
    }
    
    case 'SET_TIMER': {
      const { timer } = action;
      
      if (timer === "endless") {
        return {
          ...state,
          timer: "endless",
          timeRemaining: null,
          timerEndTime: null
        };
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
      const endTime = Date.now() + milliseconds;
      
      return {
        ...state,
        timer,
        timeRemaining: milliseconds,
        timerEndTime: endTime
      };
    }
    
    case 'CANCEL_TIMER': {
      return {
        ...state,
        timer: "endless",
        timeRemaining: null,
        timerEndTime: null
      };
    }
    
    case 'UPDATE_TIMER': {
      return {
        ...state,
        timeRemaining: action.timeRemaining
      };
    }
    
    case 'PAUSE_ALL_SOUNDS': {
      // Pause all active sounds
      state.activeSounds.forEach(({ audio }) => {
        audio.pause();
      });
      
      // Update sound states
      const newSoundStates = { ...state.soundStates };
      Object.keys(newSoundStates).forEach(key => {
        newSoundStates[key] = { 
          ...newSoundStates[key], 
          isPlaying: false 
        };
      });
      
      // Update localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
      
      return {
        ...state,
        isPlaying: false,
        soundStates: newSoundStates
      };
    }
    
    case 'PLAY_ALL_SOUNDS': {
      // Play all active sounds
      state.activeSounds.forEach(({ audio }) => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Audio play failed:", e);
          });
        }
      });
      
      // Update sound states
      const newSoundStates = { ...state.soundStates };
      Object.keys(newSoundStates).forEach(key => {
        newSoundStates[key] = { 
          ...newSoundStates[key], 
          isPlaying: true 
        };
      });
      
      // Update localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
      
      return {
        ...state,
        isPlaying: true,
        soundStates: newSoundStates
      };
    }
    
    case 'APPLY_MIX': {
      const { mix } = action;
      const { sounds: mixSounds } = mix;
      
      // Create a map of current active sounds for quick lookup
      const currentActiveSoundMap = new Map();
      state.activeSounds.forEach(as => {
        currentActiveSoundMap.set(as.sound.id, as);
      });
      
      // Create a map of target sounds from the mix
      const targetSoundMap = new Map();
      mixSounds.forEach(({ id, volume }) => {
        targetSoundMap.set(id, { id, volume });
      });
      
      // Determine sounds to remove (in current but not in target)
      const soundsToRemove = [];
      currentActiveSoundMap.forEach((activeSound, id) => {
        if (!targetSoundMap.has(id)) {
          soundsToRemove.push(activeSound);
        }
      });
      
      // Remove sounds that are not in the mix
      let newActiveSounds = [...state.activeSounds];
      let newSoundStates = { ...state.soundStates };
      
      soundsToRemove.forEach(activeSound => {
        const { sound, audio } = activeSound;
        audio.pause();
        audio.src = "";
        
        // Remove from active sounds
        newActiveSounds = newActiveSounds.filter(as => as.sound.id !== sound.id);
        
        // Remove from sound states
        delete newSoundStates[sound.id];
      });
      
      // Process sounds in the mix
      mixSounds.forEach(({ id, volume }) => {
        const normalizedVolume = volume; // Assuming volume is already 0-1
        
        if (currentActiveSoundMap.has(id)) {
          // Update volume for existing sound
          newActiveSounds = newActiveSounds.map(activeSound => {
            if (activeSound.sound.id === id) {
              activeSound.audio.volume = normalizedVolume * state.masterVolume;
              return { ...activeSound, volume: normalizedVolume };
            }
            return activeSound;
          });
          
          // Update sound state
          newSoundStates[id] = {
            ...newSoundStates[id],
            volume: normalizedVolume * 100 // Convert to 0-100 scale for storage
          };
        } else {
          // Add new sound from the mix
          const soundData = mixSounds.find(s => s.id === id);
          if (!soundData) return;
          
          // Find the sound object
          const sound = sounds.find(s => s.id === id);
          if (!sound) return;
          
          // Create new audio element
          const audio = createAudioElement(sound, normalizedVolume, state.masterVolume);
          
          // Create new active sound
          const newSound: ActiveSound = {
            sound,
            audio,
            volume: normalizedVolume
          };
          
          // Add to active sounds
          newActiveSounds.push(newSound);
          
          // Add to sound states
          newSoundStates[id] = {
            volume: normalizedVolume * 100, // Convert to 0-100 scale for storage
            isPlaying: state.isPlaying
          };
          
          // Play the sound if we're in playing state
          if (state.isPlaying) {
            audio.play().catch(e => {
              console.error("Failed to play audio:", e);
            });
          }
        }
      });
      
      // Update localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
      
      return {
        ...state,
        activeSounds: newActiveSounds,
        soundStates: newSoundStates
      };
    }
    
    case 'INITIALIZE_STATE': {
      const { savedState } = action;
      
      return {
        ...state,
        soundStates: savedState
      };
    }
    
    default:
      return state;
  }
};

// Audio State Manager Class
class AudioStateManager {
  private state: AudioState;
  private listeners: Set<(state: AudioState) => void>;
  private timerInterval: number | null;
  
  constructor() {
    this.state = initialAudioState;
    this.listeners = new Set();
    this.timerInterval = null;
    
    // Load saved state from localStorage
    this.loadSavedState();
    
    // Start timer if needed
    this.startTimerIfNeeded();
  }
  
  private loadSavedState() {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        
        // Initialize state with saved volumes but mark all as not playing initially
        const restoredState = Object.entries(parsedState).reduce((acc, [key, state]) => {
          acc[key] = {
            volume: (state as any).volume, // Preserve the exact volume value
            isPlaying: false // Always start paused
          };
          return acc;
        }, {} as Record<string, SoundState>);
        
        this.dispatch({ type: 'INITIALIZE_STATE', savedState: restoredState });
        
        // Add all previously active sounds to activeSounds but in paused state
        Object.entries(parsedState).forEach(([soundId, state]) => {
          const sound = sounds.find(s => s.id === soundId);
          if (sound && (state as any).volume > 0) {
            this.toggleSound(sound);
          }
        });
      } catch (error) {
        console.error('Error restoring audio state:', error);
      }
    }
  }
  
  private startTimerIfNeeded() {
    if (this.state.timerEndTime) {
      this.startTimer();
    }
  }
  
  private startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = window.setInterval(() => {
      if (!this.state.timerEndTime) {
        this.stopTimer();
        return;
      }
      
      const remaining = this.state.timerEndTime - Date.now();
      
      if (remaining <= 0) {
        // Timer has finished
        this.dispatch({ type: 'UPDATE_TIMER', timeRemaining: 0 });
        this.dispatch({ type: 'PAUSE_ALL_SOUNDS' });
        this.dispatch({ type: 'CANCEL_TIMER' });
        this.stopTimer();
      } else {
        this.dispatch({ type: 'UPDATE_TIMER', timeRemaining: remaining });
      }
    }, 1000);
  }
  
  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  private dispatch(action: AudioAction) {
    this.state = audioReducer(this.state, action);
    
    // Special handling for timer-related actions
    if (action.type === 'SET_TIMER' && action.timer !== 'endless') {
      this.startTimer();
    } else if (action.type === 'CANCEL_TIMER') {
      this.stopTimer();
    }
    
    // Notify all listeners of state change
    this.listeners.forEach(listener => listener(this.state));
  }
  
  // Public API
  public getState(): AudioState {
    return this.state;
  }
  
  public subscribe(listener: (state: AudioState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  // Audio Actions
  public toggleSound(sound: Sound) {
    this.dispatch({ type: 'TOGGLE_SOUND', sound });
  }
  
  public setVolumeForSound(soundId: string, volume: number) {
    this.dispatch({ type: 'SET_VOLUME', soundId, volume });
  }
  
  public setMasterVolume(volume: number) {
    this.dispatch({ type: 'SET_MASTER_VOLUME', volume });
  }
  
  public togglePlayPause() {
    this.dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
  }
  
  public setTimer(timer: TimerOption) {
    this.dispatch({ type: 'SET_TIMER', timer });
  }
  
  public cancelTimer() {
    this.dispatch({ type: 'CANCEL_TIMER' });
  }
  
  public pauseAllSounds() {
    this.dispatch({ type: 'PAUSE_ALL_SOUNDS' });
  }
  
  public playAllSounds() {
    this.dispatch({ type: 'PLAY_ALL_SOUNDS' });
  }
  
  public applyMix(mix: SoundMix) {
    this.dispatch({ type: 'APPLY_MIX', mix });
  }
  
  // Cleanup
  public cleanup() {
    // Stop all active sounds
    this.state.activeSounds.forEach(({ audio }) => {
      audio.pause();
      audio.src = "";
    });
    
    // Clear timer
    this.stopTimer();
    
    // Clear listeners
    this.listeners.clear();
  }
  
  // Handle crossfade
  public handleCrossfade(oldAudio: HTMLAudioElement, newAudio: HTMLAudioElement) {
    // Update the audio reference in activeSounds
    this.state = {
      ...this.state,
      activeSounds: this.state.activeSounds.map(activeSound => {
        if (activeSound.audio === oldAudio) {
          return { ...activeSound, audio: newAudio };
        }
        return activeSound;
      })
    };
    
    // Notify all listeners of state change
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Create a singleton instance
export const audioStateManager = new AudioStateManager();

// Import sounds at the end to avoid circular dependencies
import { sounds } from "@/data/sounds";