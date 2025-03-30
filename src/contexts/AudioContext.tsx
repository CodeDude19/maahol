import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Sound, sounds } from "@/data/sounds";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    webkitAudioContext: new (contextOptions?: AudioContextOptions) => AudioContext;
  }
}

export type TimerOption = 
  | "5min"
  | "15min" 
  | "30min" 
  | "45min" 
  | "60min" 
  | "75min" 
  | "90min" 
  | "endless";

interface ActiveSound {
  sound: Sound;
  audio: HTMLAudioElement;
  volume: number;
}

interface AudioState {
  [key: string]: {
    volume: number;
    isPlaying: boolean;
  };
}

interface AudioContextType {
  activeSounds: ActiveSound[];
  masterVolume: number;
  isPlaying: boolean;
  timer: TimerOption;
  timeRemaining: number | null;
  audioState: AudioState;
  toggleSound: (sound: Sound) => void;
  setVolumeForSound: (soundId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  togglePlayPause: () => void;
  setTimer: (timer: TimerOption) => void;
  cancelTimer: () => void;
  updateVolume: (soundId: string, volume: number) => void;
  pauseAllSounds: () => void;
  playAllActiveSounds: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const MAX_CONCURRENT_SOUNDS = 3;

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([]);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimerState] = useState<TimerOption>("endless");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({});
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const initializeAudioContext = useCallback(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ctx);
    }
  }, [audioContext]);

  // Initialize context on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initializeAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [initializeAudioContext]);

  // Initialize audio context to prevent safari auto-play issues
  useEffect(() => {
    // Create a silent audio context to unlock audio on iOS
    const unlockAudio = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const silentBuffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
    
    document.addEventListener('touchstart', unlockAudio, false);
    document.addEventListener('click', unlockAudio, false);
    
    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Load saved state on initial mount
  useEffect(() => {
    const savedState = localStorage.getItem('maahol_audio_state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        
        // Set the audio state with saved volumes but mark all as not playing
        const restoredState = Object.entries(parsedState).reduce((acc, [key, state]) => {
          acc[key] = {
            volume: (state as any).volume, // Preserve the exact volume value
            isPlaying: false // Always start paused
          };
          return acc;
        }, {} as AudioState);
        
        setAudioState(restoredState);

        // Add all previously active sounds to activeSounds but in paused state
        Object.entries(parsedState).forEach(([soundId, state]) => {
          const sound = sounds.find(s => s.id === soundId);
          if (sound && (state as any).volume > 0) {
            const audio = new Audio(sound.audioSrc);
            audio.loop = false;
            audio.volume = ((state as any).volume / 100) * masterVolume;
            
            setActiveSounds(prev => [...prev, {
              sound,
              audio,
              volume: (state as any).volume / 100
            }]);
          }
        });
      } catch (error) {
        console.error('Error restoring audio state:', error);
      }
    }
  }, [masterVolume]);

  // Save state whenever it changes
  useEffect(() => {
    if (Object.keys(audioState).length > 0) {
      localStorage.setItem('maahol_audio_state', JSON.stringify(audioState));
    }
  }, [audioState]);

  // Handle play/pause for all active sounds
  const updatePlayState = useCallback((shouldPlay: boolean) => {
    activeSounds.forEach(({ audio }) => {
      if (shouldPlay) {
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
    setIsPlaying(shouldPlay && activeSounds.length > 0);
  }, [activeSounds]);

  // Helper function to attach crossfade listener to an audio element
  const attachCrossfadeListener = useCallback((audio: HTMLAudioElement, sound: Sound, volume: number) => {
    // Use a custom property to avoid multiple triggers
    (audio as any)._crossfadeTriggered = false;
    audio.addEventListener("timeupdate", function onTimeUpdate() {
      if ((audio as any)._crossfadeTriggered) return;
      if (!audio.duration || audio.duration === Infinity) return;
      if (audio.currentTime >= audio.duration - 3) {
        (audio as any)._crossfadeTriggered = true;
        crossfadeSound(audio, sound, volume);
      }
    });
  }, []);

  // Helper function to perform a 3-second crossfade transition
  const crossfadeSound = useCallback((oldAudio: HTMLAudioElement, sound: Sound, volume: number) => {
    // Create a new audio element for the same sound
    const newAudio = new Audio(sound.audioSrc);
    newAudio.loop = false;
    newAudio.preload = "auto";
    newAudio.volume = 0;
    // Attach the crossfade listener for future loops
    attachCrossfadeListener(newAudio, sound, volume);

    newAudio.play().catch(e => {
      console.error("Crossfade new audio play failed:", e);
    });

    const fadeDuration = 3000; // 3 seconds in ms
    const fadeSteps = 60; // number of steps for the fade (adjustable)
    const stepInterval = fadeDuration / fadeSteps;
    const oldInitialVolume = oldAudio.volume;
    const targetVolume = volume * masterVolume; // current masterVolume

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / fadeSteps;
      // Use quadratic easing for a smoother transition
      const easedProgress = progress * progress;
      const newVol = targetVolume * easedProgress;
      const oldVol = oldInitialVolume * (1 - easedProgress);
      oldAudio.volume = oldVol;
      newAudio.volume = newVol;
      if (currentStep >= fadeSteps) {
        clearInterval(fadeInterval);
        oldAudio.pause();
        oldAudio.src = "";
        // Ensure the new audio ends at the exact target volume
        newAudio.volume = targetVolume;
        setActiveSounds(prev =>
          prev.map(asound => {
            if (asound.audio === oldAudio) {
              return { ...asound, audio: newAudio };
            }
            return asound;
          })
        );
      }
    }, stepInterval);
  }, [masterVolume, attachCrossfadeListener]);

  // Toggle a sound on/off
  const toggleSound = useCallback((sound: Sound) => {
    // Check if this sound is already active
    const existingIndex = activeSounds.findIndex(as => as.sound.id === sound.id);
    
    if (existingIndex !== -1) {
      // Remove the sound if it's already active
      const newActiveSounds = [...activeSounds];
      const audioElement = newActiveSounds[existingIndex].audio;
      audioElement.pause();
      audioElement.src = "";
      newActiveSounds.splice(existingIndex, 1);
      setActiveSounds(newActiveSounds);
      
      // Update audio state to mark as not playing and remove from persistence
      setAudioState(prev => {
        const newState = { ...prev };
        delete newState[sound.id]; // Remove the sound completely from state
        // Save to localStorage
        localStorage.setItem('maahol_audio_state', JSON.stringify(newState));
        return newState;
      });
      
      // If removing the last sound, pause playback
      if (newActiveSounds.length === 0) {
        setIsPlaying(false);
      }
      
      toast({
        description: `${sound.name} has been removed`,
      });
    } else {
      // Check if we've reached the max number of concurrent sounds
      if (activeSounds.length >= MAX_CONCURRENT_SOUNDS) {
        toast({
          description: `Three is harmony, above ${MAX_CONCURRENT_SOUNDS} is chaos!`,
          variant: "destructive"
        });
        return;
      }

      // Get the saved volume for this sound or use default
      const savedState = audioState[sound.id];
      const volume = savedState?.volume ? savedState.volume / 100 : 1;

      // Safari-friendly audio handling
      try {
        // Initialize audio context if not already done
        initializeAudioContext();
        
        const audio = new Audio(sound.audioSrc);
        audio.loop = true;
        audio.volume = volume * masterVolume;
        
        // For Safari: preload the audio
        audio.preload = 'auto';
        
        // Attach crossfade listener for seamless looping
        attachCrossfadeListener(audio, sound, volume);
        
        const newSound: ActiveSound = {
          sound,
          audio,
          volume
        };
        
        setActiveSounds(prev => [...prev, newSound]);

        // Update audio state to mark as playing and save to persistence
        setAudioState(prev => {
          const newState = {
            ...prev,
            [sound.id]: {
              volume: volume * 100,
              isPlaying: true
            }
          };
          // Save to localStorage
          localStorage.setItem('maahol_audio_state', JSON.stringify(newState));
          return newState;
        });

        // If this is the first sound or if already playing, play this new sound
        if (activeSounds.length === 0 || isPlaying) {
          // Safari-friendly play attempt
          const playAudio = async () => {
            try {
              // Try to resume AudioContext for Safari
              if (audioContext?.state === 'suspended') {
                await audioContext.resume();
              }
              
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                await playPromise;
              }
              
              // Auto-play when it's the first sound
              if (activeSounds.length === 0) {
                setIsPlaying(true);
              }
            } catch (e) {
              console.error("Failed to play audio:", e);
              toast({
                title: "Playback Failed",
                description: "Could not play the audio. Try clicking anywhere on the screen first.",
                variant: "destructive"
              });
            }
          };
          
          playAudio();
        }
        
        toast({
          description: `${sound.name} is now playing`,
        });
      } catch (e) {
        console.error("Error creating audio element:", e);
        toast({
          title: "Audio Error",
          description: "There was an error setting up the audio. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [activeSounds, isPlaying, masterVolume, audioState, audioContext, initializeAudioContext, attachCrossfadeListener]);

  // Update volume for a specific sound
  const setVolumeForSound = useCallback((soundId: string, volume: number) => {
    // Update active sound's volume
    setActiveSounds(prev => 
      prev.map(activeSound => {
        if (activeSound.sound.id === soundId) {
          activeSound.audio.volume = volume * masterVolume;
          return { ...activeSound, volume };
        }
        return activeSound;
      })
    );
    
    // Also update audioState to persist the volume setting
    updateVolume(soundId, volume * 100); // Convert to 0-100 scale for storage
  }, [masterVolume]);

  // Set master volume and apply it to all sounds
  const setMasterVolumeAndUpdate = useCallback((volume: number) => {
    setMasterVolume(volume);
    activeSounds.forEach(activeSound => {
      activeSound.audio.volume = activeSound.volume * volume;
    });
  }, [activeSounds]);

  // Toggle between playing and paused states
  const togglePlayPause = useCallback(() => {
    const newPlayState = !isPlaying;
    updatePlayState(newPlayState);
  }, [isPlaying, updatePlayState]);

  // Handle timer setup
  const setTimer = useCallback((timerOption: TimerOption) => {
    if (timerOption === "endless") {
      setTimerState("endless");
      setTimeRemaining(null);
      setTimerEndTime(null);
      toast({
        title: "Timer Disabled",
        description: "Playback will continue indefinitely",
      });
      return;
    }
    
    // Calculate minutes based on option
    let minutes = 0;
    switch (timerOption) {
      case "5min": minutes = 5; break;
      case "15min": minutes = 15; break;
      case "30min": minutes = 30; break;
      case "45min": minutes = 45; break;
      case "60min": minutes = 60; break;
      case "75min": minutes = 75; break;
      case "90min": minutes = 90; break;
    }
    
    // Set timer state
    setTimerState(timerOption);
    
    // Calculate end time
    const milliseconds = minutes * 60 * 1000;
    const endTime = Date.now() + milliseconds;
    setTimerEndTime(endTime);
    setTimeRemaining(milliseconds);
    
    toast({
      title: "Timer Set",
      description: `Playback will stop in ${minutes} minutes`,
    });
  }, []);

  // Cancel the current timer
  const cancelTimer = useCallback(() => {
    setTimerState("endless");
    setTimeRemaining(null);
    setTimerEndTime(null);
    toast({
      title: "Timer Cancelled",
      description: "Playback will continue indefinitely",
    });
  }, []);

  // Update timer countdown
  useEffect(() => {
    if (!timerEndTime) return;
    
    const interval = setInterval(() => {
      const remaining = timerEndTime - Date.now();
      
      if (remaining <= 0) {
        // Timer has finished
        setTimeRemaining(0);
        updatePlayState(false);
        setTimerState("endless");
        setTimerEndTime(null);
        toast({
          title: "Timer Ended",
          description: "Playback has been stopped",
        });
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerEndTime, updatePlayState]);

  // Update volumes when master volume changes
  useEffect(() => {
    activeSounds.forEach(activeSound => {
      activeSound.audio.volume = activeSound.volume * masterVolume;
    });
  }, [masterVolume, activeSounds]);

  // Clean up audio elements when component unmounts
  useEffect(() => {
    return () => {
      activeSounds.forEach(({ audio }) => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  const updateVolume = (soundId: string, volume: number) => {
    setAudioState(prev => {
      const newState = {
        ...prev,
        [soundId]: {
          ...prev[soundId],
          volume
        }
      };
      
      // Save immediately to localStorage
      localStorage.setItem('maahol_audio_state', JSON.stringify(newState));
      
      return newState;
    });
  };

  const pauseAllSounds = () => {
    setIsPlaying(false);
    setAudioState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (newState[key].isPlaying) {
          newState[key] = { ...newState[key], isPlaying: false };
        }
      });
      return newState;
    });
  };

  const playAllActiveSounds = () => {
    setIsPlaying(true);
    setAudioState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (newState[key].volume > 0) {
          newState[key] = { ...newState[key], isPlaying: true };
        }
      });
      return newState;
    });
  };

  useEffect(() => {
    const hasAnyPlaying = Object.values(audioState).some(state => state.isPlaying);
    setIsPlaying(hasAnyPlaying);
  }, [audioState]);

  const contextValue: AudioContextType = {
    activeSounds,
    masterVolume,
    isPlaying,
    timer,
    timeRemaining,
    audioState,
    toggleSound,
    setVolumeForSound,
    setMasterVolume: setMasterVolumeAndUpdate,
    togglePlayPause,
    setTimer,
    cancelTimer,
    updateVolume,
    pauseAllSounds,
    playAllActiveSounds,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
