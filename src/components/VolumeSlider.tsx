import React, { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Sound } from "@/data/sounds";
import { useAudio } from "@/contexts/AudioContext";

interface VolumeSliderProps {
  sound: Sound;
  volume: number;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ sound, volume }) => {
  const { setVolumeForSound } = useAudio();
  const [localVolume, setLocalVolume] = useState(volume);
  const sliderRef = useRef<HTMLDivElement>(null);

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
