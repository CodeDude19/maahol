import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Sound } from "@/data/sounds";
import { useAudioState } from "@/contexts/AudioStateContext";

interface VolumeSliderProps {
  sound: Sound;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ sound }) => {
  const { setVolumeForSound, soundStates } = useAudioState();
  const soundState = soundStates[sound.id];
  const volume = soundState ? soundState.volume / 100 : 1; // Convert from 0-100 to 0-1
  
  const [localVolume, setLocalVolume] = useState(volume);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Update local volume when sound state changes
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    setVolumeForSound(sound.id, newVolume);
  };

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const track = sliderRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const offsetX = clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, offsetX / rect.width));
    
    handleVolumeChange([newVolume]);
  };

  return (
    <div className="flex flex-col space-y-1 w-full">
      <div className="text-white/80 font-medium text-sm text-left truncate">
        {sound.name}
      </div>
      <div 
        ref={sliderRef}
        className="relative w-full cursor-pointer"
        onClick={handleTrackClick}
        onTouchStart={handleTrackClick}
      >
        <Slider
          value={[localVolume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default VolumeSlider;
