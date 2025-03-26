
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
    <div className="flex items-center space-x-4">
      <div className="text-white font-medium w-1/3 text-left truncate">
        {sound.name}
      </div>
      <div className="flex-1">
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
