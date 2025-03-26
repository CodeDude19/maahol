
import React, { useState } from "react";
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

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    setVolumeForSound(sound.id, newVolume);
  };

  return (
    <div className="flex items-center space-x-4 p-2 glass-effect rounded-lg mb-2">
      <div className="w-8 text-center">{sound.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate mb-1">{sound.name}</div>
        <Slider
          value={[localVolume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-full"
        />
      </div>
      <div className="text-xs font-mono w-8 text-center">
        {Math.round(localVolume * 100)}%
      </div>
    </div>
  );
};

export default VolumeSlider;
