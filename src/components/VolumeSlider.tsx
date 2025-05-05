import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Update local volume when sound state changes
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    setVolumeForSound(sound.id, newVolume);
  }, [sound.id, setVolumeForSound]);

  const calculateVolumeFromPosition = useCallback((clientX: number) => {
    const track = sliderRef.current;
    if (!track) return null;

    const rect = track.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    return Math.max(0, Math.min(1, offsetX / rect.width));
  }, []);

  const handleTrackClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const newVolume = calculateVolumeFromPosition(event.clientX);
    if (newVolume !== null) {
      handleVolumeChange([newVolume]);
    }
  }, [calculateVolumeFromPosition, handleVolumeChange]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault(); // Prevent scrolling while adjusting
    setIsDragging(true);
    const newVolume = calculateVolumeFromPosition(event.touches[0].clientX);
    if (newVolume !== null) {
      handleVolumeChange([newVolume]);
    }
  }, [calculateVolumeFromPosition, handleVolumeChange]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newVolume = calculateVolumeFromPosition(event.touches[0].clientX);
    if (newVolume !== null) {
      handleVolumeChange([newVolume]);
    }
  }, [isDragging, calculateVolumeFromPosition, handleVolumeChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for touch events outside the component
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove as any, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("touchmove", handleTouchMove as any);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  return (
    <div className="flex flex-col space-y-1 w-full py-1">
      <div className="flex justify-between items-center">
        <div className="text-white font-medium text-sm text-left truncate">
          {sound.name}
        </div>
        <div className="text-white/80 text-xs font-medium">
          {Math.round(localVolume * 100)}%
        </div>
      </div>
      <div 
        ref={sliderRef}
        className={`relative w-full cursor-pointer py-1.5 touch-action-none ${isDragging ? 'active-slider' : ''}`}
        onClick={handleTrackClick}
        onTouchStart={handleTouchStart}
        aria-label={`Volume slider for ${sound.name}`}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(localVolume * 100)}
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
