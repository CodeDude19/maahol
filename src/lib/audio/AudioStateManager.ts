import { Sound } from "@/data/sounds";
import { audioEngine } from "./AudioEngine";

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

export interface AudioState {
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
  | { type: 'INITIALIZE_STATE'; savedState: Record<string, SoundState> }
  | { type: 'SAVE_CUSTOM_MIX'; mix: SoundMix };

// Constants
const LOCAL_STORAGE_KEY = 'maahol_audio_state';
const CUSTOM_MIXES_KEY = 'maahol_custom_mixes';

// Initial state
export const initialAudioState: AudioState = {
  masterVolume: 0.7,
  isPlaying: false,
  timer: 'endless',
  timeRemaining: null,
  timerEndTime: null,
  soundStates: {}
};

// Reducer function
export const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'TOGGLE_SOUND': {
      const { sound } = action;
      const soundExists = audioEngine.hasSound(sound.id);
      
      if (soundExists) {
        // Remove the sound
        audioEngine.removeSound(sound.id);
        
        // Update sound states
        const newSoundStates = { ...state.soundStates };
        delete newSoundStates[sound.id];
        
        // Update localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
        
        return {
          ...state,
          soundStates: newSoundStates
        };
      } else {
        // Get saved volume or use default
        const savedState = state.soundStates[sound.id];
        const volume = savedState?.volume ? savedState.volume / 100 : 1;
        
        // Add the sound to engine
        const added = audioEngine.addSound(sound, volume);
        if (!added) {
          // Could not add (max sounds reached)
          return state;
        }
        
        // Update sound states
        const newSoundStates = {
          ...state.soundStates,
          [sound.id]: {
            volume: volume * 100, // Store as 0-100
            isPlaying: state.isPlaying
          }
        };
        
        // Update localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
        
        return {
          ...state,
          soundStates: newSoundStates
        };
      }
    }
    
    case 'SET_VOLUME': {
      const { soundId, volume } = action;
      
      // Update volume in engine
      audioEngine.setVolume(soundId, volume);
      
      // Update sound states
      const newSoundStates = {
        ...state.soundStates,
        [soundId]: {
          ...state.soundStates[soundId],
          volume: volume * 100 // Store as 0-100
        }
      };
      
      // Update localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
      
      return {
        ...state,
        soundStates: newSoundStates
      };
    }
    
    case 'SET_MASTER_VOLUME': {
      const { volume } = action;
      
      // Update master volume in engine
      audioEngine.masterVolume = volume;
      
      return {
        ...state,
        masterVolume: volume
      };
    }
    
    case 'TOGGLE_PLAY_PAUSE': {
      const newIsPlaying = !state.isPlaying;
      
      // Update playing state in engine
      if (newIsPlaying) {
        audioEngine.play();
      } else {
        audioEngine.pause();
      }
      
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
      // Pause in engine
      audioEngine.pause();
      
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
      // Play in engine
      audioEngine.play();
      
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
      
      // First clear all existing sounds
      audioEngine.getActiveSounds().forEach(({ sound }) => {
        audioEngine.removeSound(sound.id);
      });
      
      // Create new sound states
      const newSoundStates: Record<string, SoundState> = {};
      
      // Add each sound from the mix
      mixSounds.forEach(({ id, volume }) => {
        // Find the sound data
        const soundData = sounds.find(s => s.id === id);
        if (!soundData) return;
        
        // Add to the engine
        audioEngine.addSound(soundData, volume);
        
        // Add to sound states
        newSoundStates[id] = {
          volume: volume * 100, // Convert to 0-100 scale for storage
          isPlaying: state.isPlaying
        };
      });
      
      // Update localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSoundStates));
      
      return {
        ...state,
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
    
    case 'SAVE_CUSTOM_MIX': {
      // This doesn't modify the state, but the AudioStateManager will handle saving the mix
      return state;
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
  private customMixes: SoundMix[];
  
  constructor() {
    this.state = initialAudioState;
    this.listeners = new Set();
    this.timerInterval = null;
    this.customMixes = [];
    
    // Initialize audio engine
    audioEngine.masterVolume = this.state.masterVolume;
    
    // Load saved state from localStorage
    this.loadSavedState();
    
    // Load custom mixes from localStorage
    this.loadCustomMixes();
    
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
        
        // Temporarily set isPlaying to false to prevent auto-play during initialization
        this.state = {
          ...this.state,
          isPlaying: false
        };
        
        // Add all previously active sounds to the engine but in paused state
        Object.entries(parsedState).forEach(([soundId, state]) => {
          const sound = sounds.find(s => s.id === soundId);
          if (sound && (state as any).volume > 0) {
            this.toggleSound(sound);
          }
        });
        
        // Notify listeners of the final state
        this.listeners.forEach(listener => listener(this.state));
      } catch (error) {
        console.error('Error restoring audio state:', error);
      }
    }
  }
  
  private loadCustomMixes() {
    const savedMixes = localStorage.getItem(CUSTOM_MIXES_KEY);
    if (savedMixes) {
      try {
        this.customMixes = JSON.parse(savedMixes);
      } catch (error) {
        console.error('Error loading custom mixes:', error);
        this.customMixes = [];
      }
    }
  }
  
  private saveCustomMixesToStorage() {
    localStorage.setItem(CUSTOM_MIXES_KEY, JSON.stringify(this.customMixes));
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
    } else if (action.type === 'SAVE_CUSTOM_MIX') {
      // Handle saving custom mix
      const existingIndex = this.customMixes.findIndex(m => m.name === action.mix.name);
      if (existingIndex !== -1) {
        // Update existing mix
        this.customMixes[existingIndex] = action.mix;
      } else {
        // Add new mix
        this.customMixes.push(action.mix);
      }
      this.saveCustomMixesToStorage();
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
  
  public saveCustomMix(mix: SoundMix) {
    this.dispatch({ type: 'SAVE_CUSTOM_MIX', mix });
  }
  
  public getCustomMixes(): SoundMix[] {
    return [...this.customMixes];
  }
  
  public deleteCustomMix(mixName: string) {
    const index = this.customMixes.findIndex(mix => mix.name === mixName);
    if (index !== -1) {
      this.customMixes.splice(index, 1);
      this.saveCustomMixesToStorage();
    }
  }
  
  // Cleanup
  public cleanup() {
    // Stop all active sounds
    audioEngine.dispose();
    
    // Clear timer
    this.stopTimer();
    
    // Clear listeners
    this.listeners.clear();
  }
}

// Create and export a singleton instance
export const audioStateManager = new AudioStateManager();

// Import sounds at the end to avoid circular dependencies
import { sounds } from "@/data/sounds";