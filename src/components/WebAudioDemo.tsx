import React, { useEffect, useState } from 'react';
import { Sound } from '@/data/sounds';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { audioEngine, SoundMix } from '@/lib/AudioEngine';
import { TimerOption } from '@/lib/AudioStateManager';
import { Switch } from './ui/switch';

interface WebAudioDemoProps {
  allSounds: Sound[];
  soundMixes: SoundMix[];
}

const WebAudioDemo: React.FC<WebAudioDemoProps> = ({ allSounds, soundMixes }) => {
  // State
  const [activeSounds, setActiveSounds] = useState<{ id: string; sound: Sound; volume: number }[]>([]);
  const [masterVolume, setMasterVolume] = useState<number>(0.7);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedMix, setSelectedMix] = useState<string>('');
  const [timer, setTimer] = useState<TimerOption>('endless');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appliedMix, setAppliedMix] = useState<string | null>(null);
  
  // Initialize and subscribe to audio engine
  useEffect(() => {
    // Subscribe to state changes
    const unsubscribeState = audioEngine.subscribeToStateChanges(async () => {
      // Get active sounds with complete Sound objects
      const engineSounds = audioEngine.getActiveSounds();
      const soundsWithDetails = await Promise.all(
        engineSounds.map(async ({ id, volume }) => {
          const sound = allSounds.find(s => s.id === id);
          return sound ? { id, sound, volume } : null;
        })
      );
      
      // Filter out nulls
      setActiveSounds(soundsWithDetails.filter(Boolean) as { id: string; sound: Sound; volume: number }[]);
      
      // Update other state
      setMasterVolume(audioEngine.getMasterVolume());
      setIsPlaying(audioEngine.getPlayerState());
    });
    
    // Subscribe to timer updates
    const unsubscribeTimer = audioEngine.subscribeToTimerUpdates((remaining) => {
      setTimeRemaining(remaining);
      
      // Only update timer option on completion
      if (remaining === null) {
        setTimer('endless');
      }
    });
    
    // Preload all sounds when component mounts
    const preloadSounds = async () => {
      try {
        setIsLoading(true);
        await audioEngine.preloadAllSounds();
        setIsLoading(false);
      } catch (error) {
        console.error("Error during preloading:", error);
        setIsLoading(false);
      }
    };
    
    // Start preloading
    preloadSounds();
    
    // Cleanup
    return () => {
      unsubscribeState();
      unsubscribeTimer();
    };
  }, [allSounds]);
  
  // Format remaining time
  const formatRemainingTime = (milliseconds: number | null): string => {
    if (milliseconds === null) return 'endless';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle sound toggle
  const handleToggleSound = async (sound: Sound) => {
    await audioEngine.toggleSound(sound);
  };
  
  // Handle master volume change
  const handleMasterVolumeChange = (value: number[]) => {
    audioEngine.setMasterVolume(value[0]);
  };
  
  // Handle sound volume change
  const handleSoundVolumeChange = (soundId: string, value: number[]) => {
    audioEngine.setVolumeForSound(soundId, value[0]);
  };
  
  // Handle play/pause toggle
  const handlePlayPauseToggle = () => {
    audioEngine.togglePlayPause();
  };
  
  // Handle mix selection
  const handleMixSelection = async (mixName: string) => {
    if (mixName === '') return;
    
    setIsLoading(true);
    setAppliedMix(mixName);
    
    try {
      const selectedMix = soundMixes.find(mix => mix.name === mixName);
      if (selectedMix) {
        await audioEngine.applyMix(selectedMix);
      }
    } catch (error) {
      console.error(`Error applying mix ${mixName}:`, error);
    } finally {
      setIsLoading(false);
      setSelectedMix('');
    }
  };
  
  // Handle timer selection
  const handleTimerSelection = (timerOption: TimerOption) => {
    audioEngine.setTimer(timerOption);
    setTimer(timerOption);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-black/80 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        Web Audio API Demo
        {isLoading && (
          <div className="ml-3 animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        )}
      </h1>
      
      {isLoading && appliedMix && (
        <div className="mb-4 p-3 bg-blue-900/50 border border-blue-500/50 rounded-lg">
          <p className="text-white flex items-center">
            <span className="animate-pulse mr-2">⏳</span> 
            Applying mix: {appliedMix}... This may take a moment as sounds are being loaded.
          </p>
        </div>
      )}
      
      {/* Controls Section */}
      <div className="mb-6 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Controls</h2>
          <div className="flex items-center gap-4">
            <Button onClick={handlePlayPauseToggle} variant="secondary">
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">Master Volume:</span>
              <Slider 
                value={[masterVolume]} 
                min={0} 
                max={1} 
                step={0.01} 
                onValueChange={handleMasterVolumeChange} 
                className="w-32" 
              />
            </div>
          </div>
        </div>
        
        {/* Mix Selection */}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2 text-white">Apply Sound Mix</h3>
          <div className="flex gap-2 flex-wrap">
            {soundMixes.map(mix => (
              <Button 
                key={mix.name} 
                variant="outline" 
                size="sm"
                className="border-white/30 text-white hover:bg-white/20 hover:text-white"
                onClick={() => handleMixSelection(mix.name)}
              >
                {mix.name}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Timer Selection */}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2 text-white">Timer: {formatRemainingTime(timeRemaining)}</h3>
          <div className="flex gap-2 flex-wrap">
            {(['5min', '15min', '30min', '45min', '60min', '90min', 'endless'] as TimerOption[]).map(timerOption => (
              <Button 
                key={timerOption} 
                variant={timer === timerOption ? "default" : "outline"} 
                size="sm"
                className={timer === timerOption ? "" : "border-white/30 text-white hover:bg-white/20"}
                onClick={() => handleTimerSelection(timerOption)}
              >
                {timerOption}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Active Sounds */}
      {activeSounds.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Active Sounds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSounds.map(({ id, sound, volume }) => (
              <div key={id} 
                className="p-4 rounded-lg border border-white/20 backdrop-blur-md"
                style={{ 
                  backgroundColor: `${sound.color}40`,
                  boxShadow: `0 0 15px ${sound.color}30`
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-white">{sound.name}</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white/30 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => handleToggleSound(sound)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">Volume:</span>
                  <Slider 
                    value={[volume]} 
                    min={0} 
                    max={1} 
                    step={0.01} 
                    onValueChange={(value) => handleSoundVolumeChange(id, value)} 
                    className="w-full" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available Sounds */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">Available Sounds</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allSounds.map(sound => {
            const isActive = activeSounds.some(as => as.id === sound.id);
            return (
              <div 
                key={sound.id} 
                className={`p-3 rounded-lg cursor-pointer border border-white/20 backdrop-blur-md`}
                style={{ 
                  backgroundColor: isActive ? `${sound.color}60` : `${sound.color}20`,
                  boxShadow: isActive ? `0 0 15px ${sound.color}50` : 'none'
                }}
                onClick={() => handleToggleSound(sound)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{sound.name}</span>
                  <Switch checked={isActive} />
                </div>
                <p className="text-sm text-white/80 mt-1">{sound.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WebAudioDemo;