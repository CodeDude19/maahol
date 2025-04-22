import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sound } from '@/data/sounds';
import { toast } from '@/hooks/use-toast';
import { soundMixes } from '@/data/soundMixes';
import { audioEngine, SoundMix, MAX_CONCURRENT_SOUNDS } from '@/lib/AudioEngine';
import { TimerOption } from '@/lib/AudioStateManager';

// Create a type for active sounds that's simpler than before
interface ActiveSound {
  id: string;
  volume: number;
}

interface AudioContextType {
  activeSounds: { id: string; sound: Sound; volume: number }[];
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
  updateVolume: (soundId: string, volume: number) => void;
  pauseAllSounds: () => void;
  playAllActiveSounds: () => void;
  applyMix: (mix: SoundMix) => void;
  saveCustomMix: (mix: SoundMix) => void;
  deleteCustomMix: (mixName: string) => void;
  getCustomMixes: () => SoundMix[];
  isCurrentMixPredefined: () => boolean;
  isCurrentMixSaved: () => boolean;
}

const NewAudioStateContext = createContext<AudioContextType | undefined>(undefined);

export const NewAudioStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [activeSounds, setActiveSounds] = useState<{ id: string; sound: Sound; volume: number }[]>([]);
  const [masterVolume, setMasterVolumeState] = useState<number>(0.7);
  const [isPlaying, setIsPlayingState] = useState<boolean>(false);
  const [timer, setTimerState] = useState<TimerOption>('endless');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [customMixes, setCustomMixes] = useState<SoundMix[]>([]);
  
  // Constants
  const LOCAL_STORAGE_KEY = 'maahol_audio_state';
  const CUSTOM_MIXES_KEY = 'maahol_custom_mixes';
  
  // Initial setup
  useEffect(() => {
    // Load custom mixes from localStorage
    const savedMixes = localStorage.getItem(CUSTOM_MIXES_KEY);
    if (savedMixes) {
      try {
        setCustomMixes(JSON.parse(savedMixes));
      } catch (error) {
        console.error('Error loading custom mixes:', error);
      }
    }
    
    // Subscribe to AudioEngine state changes
    const unsubscribeState = audioEngine.subscribeToStateChanges(async () => {
      // Get active sounds with complete Sound objects
      const engineSounds = audioEngine.getActiveSounds();
      const soundsWithDetails = await Promise.all(
        engineSounds.map(async ({ id, volume }) => {
          const { sounds } = await import('@/data/sounds');
          const sound = sounds.find(s => s.id === id);
          return sound ? { id, sound, volume } : null;
        })
      );
      
      // Filter out nulls
      setActiveSounds(soundsWithDetails.filter(Boolean) as { id: string; sound: Sound; volume: number }[]);
      
      // Update other state
      setMasterVolumeState(audioEngine.getMasterVolume());
      setIsPlayingState(audioEngine.getPlayerState());
    });
    
    // Subscribe to timer updates
    const unsubscribeTimer = audioEngine.subscribeToTimerUpdates((remaining) => {
      setTimeRemaining(remaining);
      
      // Only update timer option on completion
      if (remaining === null) {
        setTimerState('endless');
      }
    });
    
    // Cleanup
    return () => {
      unsubscribeState();
      unsubscribeTimer();
    };
  }, []);
  
  // Save custom mixes to localStorage
  const saveCustomMixesToStorage = (mixes: SoundMix[]) => {
    localStorage.setItem(CUSTOM_MIXES_KEY, JSON.stringify(mixes));
  };
  
  // Audio control functions
  const toggleSound = async (sound: Sound) => {
    // Check if sound is already active
    const isActive = activeSounds.some(as => as.id === sound.id);
    
    // If not active and we already have MAX_CONCURRENT_SOUNDS, show toast and return
    if (!isActive && activeSounds.length >= MAX_CONCURRENT_SOUNDS) {
      toast({
        description: "Three create harmony, above 3 maahol is Chaos!",
      });
      return;
    }
    
    // Toggle the sound
    const initialVolume = isActive 
      ? activeSounds.find(as => as.id === sound.id)?.volume || 1 
      : 1;
    
    const result = await audioEngine.toggleSound(sound, initialVolume);
    
    // Show toast
    if (isActive && !result) {
      toast({
        description: `${sound.name} has been removed`,
      });
    } else if (!isActive && result) {
      toast({
        description: `${sound.name} is now playing`,
      });
    }
  };
  
  const setVolumeForSound = (soundId: string, volume: number) => {
    audioEngine.setVolumeForSound(soundId, volume);
  };
  
  const setMasterVolume = (volume: number) => {
    audioEngine.setMasterVolume(volume);
  };
  
  const togglePlayPause = () => {
    const isNowPlaying = audioEngine.togglePlayPause();
    setIsPlayingState(isNowPlaying);
  };
  
  const setTimer = (timerOption: TimerOption) => {
    audioEngine.setTimer(timerOption);
    setTimerState(timerOption);
    
    if (timerOption === "endless") {
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
    
    toast({
      title: "Timer Set",
      description: `Playback will stop in ${minutes} minutes`,
    });
  };
  
  const cancelTimer = () => {
    audioEngine.cancelTimer();
    setTimerState('endless');
    
    toast({
      title: "Timer Cancelled",
      description: "Playback will continue indefinitely",
    });
  };
  
  const updateVolume = (soundId: string, volume: number) => {
    audioEngine.setVolumeForSound(soundId, volume / 100); // Convert from 0-100 to 0-1
  };
  
  const pauseAllSounds = () => {
    audioEngine.pauseAllSounds();
  };
  
  const playAllActiveSounds = () => {
    audioEngine.playAllSounds();
  };
  
  const applyMix = async (mix: SoundMix) => {
    console.log('%c[MIX] Starting to apply mix:', 'color: #4CAF50; font-weight: bold', mix.name);
    
    // Log mix details for debugging
    mix.sounds.forEach(sound => {
      console.log(`[MIX] Sound ${sound.id} with volume ${sound.volume}`);
    });
    
    await audioEngine.applyMix(mix);
    
    toast({
      title: "Mix Applied",
      description: `${mix.name} mix has been applied`,
    });
  };
  
  const saveCustomMix = (mix: SoundMix) => {
    // Check if mix already exists
    const existingIndex = customMixes.findIndex(m => m.name === mix.name);
    let newCustomMixes = [...customMixes];
    
    if (existingIndex !== -1) {
      // Update existing mix
      newCustomMixes[existingIndex] = mix;
    } else {
      // Add new mix
      newCustomMixes.push(mix);
    }
    
    setCustomMixes(newCustomMixes);
    saveCustomMixesToStorage(newCustomMixes);
    
    toast({
      title: "Mix Saved",
      description: `${mix.name} has been saved to your custom mixes`,
    });
  };
  
  const getCustomMixes = (): SoundMix[] => {
    return customMixes;
  };
  
  const deleteCustomMix = (mixName: string) => {
    const newCustomMixes = customMixes.filter(mix => mix.name !== mixName);
    setCustomMixes(newCustomMixes);
    saveCustomMixesToStorage(newCustomMixes);
    
    toast({
      title: "Mix Deleted",
      description: `${mixName} has been removed from your custom mixes`,
    });
  };
  
  // Check if current mix matches any predefined or custom mix
  const isCurrentMixSaved = (): boolean => {
    if (activeSounds.length === 0) return false;
    
    // Helper function to check if a mix matches the current active sounds
    const doesMixMatch = (mix: SoundMix): boolean => {
      // If the number of sounds doesn't match, it's not the same mix
      if (mix.sounds.length !== activeSounds.length) return false;
      
      // Check if all sounds in the mix are in the active sounds with the same volume
      return mix.sounds.every(mixSound => {
        const activeSound = activeSounds.find(as => as.id === mixSound.id);
        if (!activeSound) return false;
        
        // Compare volumes with a small tolerance for floating point differences
        return Math.abs(activeSound.volume - mixSound.volume) < 0.01;
      });
    };
    
    // Check against predefined mixes
    if (soundMixes.some(doesMixMatch)) return true;
    
    // Check against custom mixes
    return customMixes.some(doesMixMatch);
  };
  
  // Alias for backward compatibility
  const isCurrentMixPredefined = isCurrentMixSaved;
  
  // Context value
  const contextValue: AudioContextType = {
    activeSounds,
    masterVolume,
    isPlaying,
    timer,
    timeRemaining,
    toggleSound,
    setVolumeForSound,
    setMasterVolume,
    togglePlayPause,
    setTimer,
    cancelTimer,
    updateVolume,
    pauseAllSounds,
    playAllActiveSounds,
    applyMix,
    saveCustomMix,
    deleteCustomMix,
    getCustomMixes,
    isCurrentMixPredefined,
    isCurrentMixSaved
  };
  
  return (
    <NewAudioStateContext.Provider value={contextValue}>
      {children}
    </NewAudioStateContext.Provider>
  );
};

export const useNewAudioState = () => {
  const context = useContext(NewAudioStateContext);
  if (context === undefined) {
    throw new Error("useNewAudioState must be used within a NewAudioStateProvider");
  }
  return context;
};