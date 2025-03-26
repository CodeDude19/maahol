
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Sound, sounds } from "@/data/sounds";
import { toast } from "@/hooks/use-toast";

export type TimerOption = 
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

interface AudioContextType {
  activeSounds: ActiveSound[];
  masterVolume: number;
  isPlaying: boolean;
  timer: TimerOption;
  timeRemaining: number | null;
  toggleSound: (sound: Sound) => void;
  setVolumeForSound: (soundId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  togglePlayPause: () => void;
  setTimer: (timer: TimerOption) => void;
  cancelTimer: () => void;
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
      
      toast({
        title: "Sound Removed",
        description: `${sound.name} has been removed`,
      });
    } else {
      // Check if we've reached the max number of concurrent sounds
      if (activeSounds.length >= MAX_CONCURRENT_SOUNDS) {
        toast({
          title: "Maximum Sounds Reached",
          description: `You can only play ${MAX_CONCURRENT_SOUNDS} sounds at once. Please remove one first.`,
          variant: "destructive"
        });
        return;
      }

      // Add the new sound
      const audio = new Audio(sound.audioSrc);
      audio.loop = true;
      audio.volume = masterVolume;
      
      const newSound: ActiveSound = {
        sound,
        audio,
        volume: 1
      };
      
      setActiveSounds(prev => [...prev, newSound]);

      // If already playing, play this new sound
      if (isPlaying) {
        audio.play().catch(e => {
          console.error("Failed to play audio:", e);
          toast({
            title: "Playback Failed",
            description: "Could not play the audio. Please try again.",
            variant: "destructive"
          });
        });
      }
      
      toast({
        title: "Sound Added",
        description: `${sound.name} is now playing`,
      });
    }
  }, [activeSounds, isPlaying, masterVolume]);

  // Update volume for a specific sound
  const setVolumeForSound = useCallback((soundId: string, volume: number) => {
    setActiveSounds(prev => 
      prev.map(activeSound => {
        if (activeSound.sound.id === soundId) {
          activeSound.audio.volume = volume * masterVolume;
          return { ...activeSound, volume };
        }
        return activeSound;
      })
    );
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

  const contextValue: AudioContextType = {
    activeSounds,
    masterVolume,
    isPlaying,
    timer,
    timeRemaining,
    toggleSound,
    setVolumeForSound,
    setMasterVolume: setMasterVolumeAndUpdate,
    togglePlayPause,
    setTimer,
    cancelTimer
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
