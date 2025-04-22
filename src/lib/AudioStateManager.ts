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
  | { type: 'SAVE_CUSTOM_MIX'; mix: SoundMix }
  | { type: 'INITIALIZE_STATE'; savedState: Record<string, SoundState> };

// Constants
export const MAX_CONCURRENT_SOUNDS = 3;
const LOCAL_STORAGE_KEY = 'maahol_audio_state';
const CUSTOM_MIXES_KEY = 'maahol_custom_mixes';

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
const createAudioElement = (sound: Sound, volume: number, masterVolume: number, onCrossfade?: (oldAudio: HTMLAudioElement, newAudio: HTMLAudioElement) => void): HTMLAudioElement => {
  const audio = new Audio(sound.audioSrc);
  // We set loop to false because we're implementing our own crossfade-based looping
  // This provides a smoother transition between loops than the native loop property
  audio.loop = false;
  audio.volume = volume * masterVolume;
  audio.preload = 'auto';

  if (onCrossfade) {
    // Attach listener that will handle the crossfade looping
    attachCrossfadeListener(audio, sound, volume, masterVolume, onCrossfade);
  }

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
  
  // Add an error handler to detect and recover from audio errors
  const handleAudioError = (e: Event) => {
    console.error(`Audio error for ${sound.name}:`, e);
    
    // If the audio element has an error, try to recover by recreating it
    if (audio.error && audio.error.code) {
      console.log(`Attempting to recover from error for ${sound.name}`);
      
      // Only attempt recovery if the audio isn't already being crossfaded
      if (!(audio as any)._crossfadeTriggered) {
        // Create a replacement audio element
        const replacementAudio = new Audio(sound.audioSrc);
        replacementAudio.loop = false;
        replacementAudio.preload = "auto";
        replacementAudio.volume = audio.volume; // Maintain the same volume
        
        // Attach the crossfade listener to the new audio
        attachCrossfadeListener(replacementAudio, sound, volume, masterVolume, onCrossfade);
        
        // If the original was playing, play the replacement
        if (!audio.paused) {
          replacementAudio.play().catch(err => {
            console.error(`Failed to play replacement audio for ${sound.name}:`, err);
          });
        }
        
        // Notify the state manager to update the audio reference
        console.log(`Replacing errored audio for ${sound.name}`);
        onCrossfade(audio, replacementAudio);
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if ((audio as any)._crossfadeTriggered) return;
    if (!audio.duration || audio.duration === Infinity) return;
    
    // Start crossfade 3 seconds before the end of the track
    if (audio.currentTime >= audio.duration - 3) {
      console.log(`Starting crossfade for ${sound.name}, duration: ${audio.duration}, current time: ${audio.currentTime}`);
      (audio as any)._crossfadeTriggered = true;
      
      // Create a new audio element for the same sound
      const newAudio = new Audio(sound.audioSrc);
      newAudio.loop = false; // We'll handle looping with our crossfade mechanism
      newAudio.preload = "auto";
      newAudio.volume = 0; // Start with zero volume for crossfade
      
      // Store the current playing state to apply to the new audio
      const isCurrentlyPlaying = !audio.paused;
      console.log(`Current playing state: ${isCurrentlyPlaying}`);
      
      // Save the current volume to properly transition to in the new audio
      // This is critical for when volume has been changed after the audio started playing
      const audioVolume = audio.volume / masterVolume; // Convert back to 0-1 scale independent of master volume
      
      // Attach the crossfade listener for future loops with the current volume
      attachCrossfadeListener(newAudio, sound, audioVolume, masterVolume, onCrossfade);
      
      // Ensure the audio source is valid before playing
      if (isCurrentlyPlaying && sound.audioSrc) {
        // Preload the audio
        newAudio.load();
        console.log(`Loading new audio for ${sound.name}`);
        
        // Add event listener for when the audio is ready to play
        newAudio.addEventListener('canplaythrough', () => {
          // Only check if currently playing, don't check newAudio.paused as it might be misleading
          if (isCurrentlyPlaying) {
            console.log(`Playing new audio for ${sound.name} after canplaythrough event`);
            newAudio.play().catch(e => {
              console.error("Crossfade new audio play failed:", e);
              // Try again after a short delay if it failed
              setTimeout(() => {
                if (isCurrentlyPlaying) {
                  console.log(`Retrying play for ${sound.name} after failure`);
                  newAudio.play().catch(retryErr => {
                    console.error(`Retry play also failed for ${sound.name}:`, retryErr);
                  });
                }
              }, 500);
            });
          }
        }, { once: true });
        
        // Also try to play directly, which will work if the audio is already loaded
        console.log(`Attempting to play new audio for ${sound.name} immediately`);
        newAudio.play().catch(e => {
          // This is expected to fail sometimes if the audio isn't loaded yet
          // The canplaythrough event will handle it
          console.log(`Initial play attempt for ${sound.name} failed, waiting for canplaythrough event`, e);
        });
      }
      
      const fadeDuration = 3000; // 3 seconds in ms
      const fadeSteps = 60; // number of steps for the fade
      const stepInterval = fadeDuration / fadeSteps;
      const oldInitialVolume = audio.volume;
      // Use the current audio volume as the target volume instead of the original volume
      // This is important when volume has been modified after the sound started playing
      const targetVolume = audio.volume; // Simply use the current volume directly
      
      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        // Check if audio was paused during crossfade
        if (!isCurrentlyPlaying || audio.paused) {
          // If paused during crossfade, also pause the new audio
          newAudio.pause();
          clearInterval(fadeInterval);
          audio.pause();
          audio.src = "";
          // Notify the state manager to update the audio reference
          console.log(`Crossfade interrupted for ${sound.name}, updating audio reference`);
          onCrossfade(audio, newAudio);
          return;
        }
        
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
          console.log(`Crossfade complete for ${sound.name}, updating audio reference`);
          onCrossfade(audio, newAudio);
        }
      }, stepInterval);
    }
  };
  
  // Add error event listener to detect and recover from audio errors
  audio.addEventListener("error", handleAudioError);
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
        
        // Create new audio element with crossfade handler
        const audio = createAudioElement(sound, volume, state.masterVolume, (oldAudio, newAudio) => {
          // We need to use the audioStateManager's handleCrossfade method
          // to properly update the state with the new audio element
          audioStateManager.handleCrossfade(oldAudio, newAudio);
        });
        
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
        // Only auto-start playing if this is a direct user action, not during initialization
        // This prevents auto-play on page reload
        
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
      state.activeSounds.forEach(({ audio, sound }) => {
        if (newIsPlaying) {
          // Check if the audio element has a valid source
          if (sound && sound.audioSrc && audio.src) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => {
                console.error("Audio play failed:", e);
                // If playback fails due to no source, try to reset the source and play again
                if (e.name === "NotSupportedError" && sound.audioSrc) {
                  console.log("Attempting to reset audio source and play again");
                  audio.src = sound.audioSrc;
                  audio.load();
                  audio.play().catch(innerErr => {
                    console.error("Retry play failed:", innerErr);
                  });
                }
              });
            }
          } else if (sound && sound.audioSrc) {
            // If audio.src is empty but we have sound.audioSrc, try to set it
            audio.src = sound.audioSrc;
            audio.load();
            audio.play().catch(e => {
              console.error("Audio play failed after source reset:", e);
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
      state.activeSounds.forEach(({ audio, sound }) => {
        // Check if the audio element has a valid source
        if (sound && sound.audioSrc && audio.src) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.error("Audio play failed:", e);
              // If playback fails due to no source, try to reset the source and play again
              if (e.name === "NotSupportedError" && sound.audioSrc) {
                console.log("Attempting to reset audio source and play again");
                audio.src = sound.audioSrc;
                audio.load();
                audio.play().catch(innerErr => {
                  console.error("Retry play failed:", innerErr);
                });
              }
            });
          }
        } else if (sound && sound.audioSrc) {
          // If audio.src is empty but we have sound.audioSrc, try to set it
          audio.src = sound.audioSrc;
          audio.load();
          audio.play().catch(e => {
            console.error("Audio play failed after source reset:", e);
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
      
      console.log(`AudioStateManager: Starting to apply mix: ${mix.name}`);
      
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
      
      // Process in series, first removing sounds that are not in the mix
      let newActiveSounds = [...state.activeSounds];
      let newSoundStates = { ...state.soundStates };
      
      // Remove sounds that are not in the mix
      soundsToRemove.forEach(activeSound => {
        const { sound, audio } = activeSound;
        
        console.log(`AudioStateManager: Removing sound ${sound.name} that is not in the mix`);
        
        // First pause the audio
        audio.pause();
        
        // Then clear the source
        try {
          audio.src = "";
        } catch (e) {
          console.log(`AudioStateManager: Minor error clearing audio src for ${sound.name}:`, e);
        }
        
        // Remove from active sounds
        newActiveSounds = newActiveSounds.filter(as => as.sound.id !== sound.id);
        
        // Remove from sound states
        delete newSoundStates[sound.id];
      });
      
      // Process sounds in the mix - add one at a time with a small delay to prevent overloading
      let index = 0;
      for (const { id, volume } of mixSounds) {
        const normalizedVolume = volume; // Assuming volume is already 0-1
        
        if (currentActiveSoundMap.has(id)) {
          // Update volume for existing sound
          newActiveSounds = newActiveSounds.map(activeSound => {
            if (activeSound.sound.id === id) {
              // Check if we need to create a new audio element with proper crossfade for volume changes
              if ((activeSound.audio as any)._crossfadeTriggered === undefined) {
                // If no crossfade handler is attached, create a new audio element with one
                console.log(`Recreating audio element for ${activeSound.sound.name} with crossfade handler`);
                
                // Store the current playing state
                const wasPlaying = !activeSound.audio.paused;
                
                // Pause the old audio
                activeSound.audio.pause();
                
                // Create new audio element with crossfade handler
                const newAudio = createAudioElement(activeSound.sound, normalizedVolume, state.masterVolume, (oldAudio, newAudio) => {
                  audioStateManager.handleCrossfade(oldAudio, newAudio);
                });
                
                // Set the current time and playing state to match the previous audio
                if (activeSound.audio.currentTime) {
                  newAudio.currentTime = activeSound.audio.currentTime;
                }
                
                // Play the new audio if the old one was playing
                if (wasPlaying && state.isPlaying) {
                  setTimeout(() => {
                    newAudio.play().catch(e => {
                      console.error(`Failed to play recreated audio for ${activeSound.sound.name}:`, e);
                    });
                  }, 300 * index); // Stagger playback
                }
                
                return { ...activeSound, audio: newAudio, volume: normalizedVolume };
              } else {
                // If crossfade handler exists, just update the volume
                activeSound.audio.volume = normalizedVolume * state.masterVolume;
                return { ...activeSound, volume: normalizedVolume };
              }
            }
            return activeSound;
          });
          
          // Update sound state
          newSoundStates[id] = {
            ...newSoundStates[id],
            volume: normalizedVolume * 100 // Convert to 0-100 scale for storage
          };
        } else {
          // Find the sound object
          const sound = sounds.find(s => s.id === id);
          if (!sound) {
            console.error(`Sound with id ${id} not found in sounds library`);
            continue;
          }
          
          console.log(`AudioStateManager: Adding new sound ${sound.name} from mix`);
          
          // Create new audio element with crossfade handler
          const audio = createAudioElement(sound, normalizedVolume, state.masterVolume, (oldAudio, newAudio) => {
            // We need to use the audioStateManager's handleCrossfade method
            // to properly update the state with the new audio element
            audioStateManager.handleCrossfade(oldAudio, newAudio);
          });
          
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
          
          // Play the sound if we're in playing state - with a small delay to spread out load
          if (state.isPlaying) {
            // Add a small delay based on array position to stagger playback starts
            setTimeout(() => {
              if (state.isPlaying) { // Check again in case state changed
                console.log(`AudioStateManager: Playing sound ${sound.name} for mix`);
                audio.play().catch(e => {
                  console.error(`Failed to play audio for ${sound.name}:`, e);
                });
              }
            }, 300 * (index + 1)); // Stagger plays to reduce strain
          }
        }
        
        index++; // Increment index for staggered playback
      }
      
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
    
    case 'SAVE_CUSTOM_MIX': {
      const { mix } = action;
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
        const originalIsPlaying = this.state.isPlaying;
        this.state = {
          ...this.state,
          isPlaying: false
        };
        
        // Add all previously active sounds to activeSounds but in paused state
        Object.entries(parsedState).forEach(([soundId, state]) => {
          const sound = sounds.find(s => s.id === soundId);
          if (sound && (state as any).volume > 0) {
            this.toggleSound(sound);
          }
        });
        
        // Restore original isPlaying state (which is false by default)
        this.state = {
          ...this.state,
          isPlaying: false
        };
        
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
    // Stop all currently playing sounds first
    const wasPlaying = this.state.isPlaying;
    if (wasPlaying) {
      this.pauseAllSounds();
    }
    
    // Apply the mix
    this.dispatch({ type: 'APPLY_MIX', mix });
    
    // Resume playback if it was playing before
    if (wasPlaying) {
      // Use a small delay to help browser process the audio changes
      setTimeout(() => {
        this.playAllSounds();
      }, 100);
    }
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
    console.log('AudioStateManager: handleCrossfade called');
    
    // Check if either audio element is null or undefined first
    if (!oldAudio || !newAudio) {
      console.error('AudioStateManager: Invalid audio elements passed to handleCrossfade');
      return;
    }
    
    // Stop execution if oldAudio.src is empty - this means the audio was likely
    // already unloaded during a sound removal or mix change
    if (!oldAudio.src) {
      console.log('AudioStateManager: Old audio source is empty, likely already unloaded');
      return;
    }
    
    // Gather context about the current active sounds for debugging
    console.log('AudioStateManager: Current active sounds:', 
      this.state.activeSounds.map(as => `${as.sound.name} (src: ${as.audio.src})`));
      
    // Find the active sound that uses the old audio element
    let activeSound = this.state.activeSounds.find(as => as.audio === oldAudio);
    
    try {
      // Additional check - sometimes the object identity changes but the src remains the same
      if (!activeSound) {
        // Create a helper function to extract sound ID from URL to make debugging easier
        const extractSoundId = (url: string) => {
          // Get filename without extension
          const filename = url.split('/').pop()?.split('.')[0] || '';
          // Try to extract standard sound identifiers
          const soundIdentifiers = [
            'beach', 'birds', 'cafe', 'rain', 'wind', 'thunder', 'city', 'night',
            'forest', 'snow', 'train', 'campfire', 'fireplace', 'pink-noise',
            'brown-noise', 'white-noise', 'heavy-rain', 'rain-window', 'rain-camping', 'debug'
          ];
          
          // Check for exact matches
          for (const id of soundIdentifiers) {
            if (filename === id) return id;
          }
          
          // Check for partial matches
          for (const id of soundIdentifiers) {
            if (filename.includes(id)) return id;
            if (id.includes(filename)) return id;
          }
          
          // Special cases for compound names
          if (filename.includes('car') && filename.includes('rain')) return 'rain-window';
          if (filename.includes('camping') && filename.includes('rain')) return 'rain-camping';
          if (filename.includes('heavy') && filename.includes('rain')) return 'heavy-rain';
          
          // No match found
          return null;
        };
        
        const oldAudioId = extractSoundId(oldAudio.src);
        console.log('AudioStateManager: Extracted sound ID:', oldAudioId);
        
        if (oldAudioId) {
          // Try to find by ID
          activeSound = this.state.activeSounds.find(as => as.sound.id === oldAudioId);
        }
      }
      
      // If we still can't find the active sound, find matching new audio instead
      if (!activeSound) {
        console.log('AudioStateManager: Could not find matching active sound for old audio - trying newAudio...');
        
        const newAudioId = newAudio.src.split('/').pop()?.split('.')[0] || '';
        const probableSoundId = newAudioId.includes('ogg') || newAudioId.includes('mp3')
          ? newAudioId.split('.')[0]
          : newAudioId;
          
        console.log('AudioStateManager: Probable sound ID from new audio:', probableSoundId);
            
        // First try direct match by ID
        activeSound = this.state.activeSounds.find(as => as.sound.id === probableSoundId);
        
        // If that doesn't work, try to match by source URL
        if (!activeSound) {
          activeSound = this.state.activeSounds.find(as => 
            newAudio.src.includes(as.sound.id) || as.sound.id.includes(probableSoundId)
          );
        }
        
        // If we find a match with the new audio
        if (activeSound) {
          console.log(`AudioStateManager: Found matching active sound ${activeSound.sound.name} via new audio`);
          
          // Update the audio reference directly
          this.state = {
            ...this.state,
            activeSounds: this.state.activeSounds.map(as => {
              if (as === activeSound) {
                return { ...as, audio: newAudio };
              }
              return as;
            })
          };
          
          // Make sure the volume is correct
          newAudio.volume = activeSound.volume * this.state.masterVolume;
          
          // If state is playing, make sure the new audio is too
          if (this.state.isPlaying && !newAudio.paused) {
            console.log(`AudioStateManager: Ensuring new audio is playing for ${activeSound.sound.name}`);
            try {
              newAudio.play();
            } catch (e) {
              console.error(`AudioStateManager: Failed to play new audio for ${activeSound.sound.name}:`, e);
            }
          }
          
          // Notify all listeners of state change
          this.listeners.forEach(listener => listener(this.state));
          return;
        }
      }
      
      // If we still don't have an active sound match
      if (!activeSound) {
        console.log('AudioStateManager: Could not match audio to any active sound - ignoring crossfade request');
        return;
      }
      
      // We found the active sound, update its audio element
      console.log(`AudioStateManager: Replacing audio for ${activeSound.sound.name}`);
      
      // Update the audio reference in activeSounds
      this.state = {
        ...this.state,
        activeSounds: this.state.activeSounds.map(as => {
          if (as === activeSound) {
            return { ...as, audio: newAudio };
          }
          return as;
        })
      };
      
      // Ensure the volume is correct
      newAudio.volume = activeSound.volume * this.state.masterVolume;
      
      // Ensure the playing state matches
      if (this.state.isPlaying) {
        if (newAudio.paused) {
          newAudio.play().catch(e => {
            console.error(`AudioStateManager: Failed to play new audio for ${activeSound.sound.name}:`, e);
          });
        }
      } else {
        newAudio.pause();
      }
      
      // Notify all listeners of state change
      this.listeners.forEach(listener => listener(this.state));
    } catch (error) {
      console.error('AudioStateManager: Error in handleCrossfade:', error);
      // Don't rethrow - just log and continue
    }
  }
}

// Import sounds at the end to avoid circular dependencies
import { sounds } from "@/data/sounds";

// Create a singleton instance
export const audioStateManager = new AudioStateManager();