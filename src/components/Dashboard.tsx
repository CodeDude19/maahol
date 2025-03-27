
import React from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import VolumeSlider from "./VolumeSlider";
import TimerSelector from "./TimerSelector";
import { motion } from "framer-motion";

const Dashboard: React.FC = () => {
  const { 
    activeSounds, 
    masterVolume, 
    setMasterVolume, 
    isPlaying, 
    togglePlayPause 
  } = useAudio();

  return (
    <motion.div 
      className="bg-black/50 border-t border-white/10 p-4 sm:p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left column - Volume controls */}
          <div className="space-y-3">
            {activeSounds.length > 0 ? (
              <div className="space-y-3">
                {activeSounds.map(({ sound, volume }) => (
                  <VolumeSlider 
                    key={sound.id} 
                    sound={sound} 
                    volume={volume}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-white/60 text-sm">
                No sounds selected
              </div>
            )}
          </div>
          
          {/* Right column - Controls */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <Button 
              className="rounded-full w-14 h-14 flex items-center justify-center bg-black/80 border border-white/20 hover:bg-white/10"
              style={{
                boxShadow: isPlaying ? "0 0 10px rgba(74, 222, 128, 0.5)" : "none"
              }}
              onClick={togglePlayPause}
            >
              {isPlaying ? 
                <Pause className="h-7 w-7 text-green-400" /> : 
                <Play className="h-7 w-7 ml-1 text-white" />
              }
            </Button>
            
            <TimerSelector />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
