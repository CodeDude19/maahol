
import React from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import VolumeSlider from "./VolumeSlider";
import TimerSelector from "./TimerSelector";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard: React.FC = () => {
  const { 
    activeSounds, 
    masterVolume, 
    setMasterVolume, 
    isPlaying, 
    togglePlayPause 
  } = useAudio();
  
  const isMobile = useIsMobile();

  return (
    <motion.div 
      className="bg-white/20 backdrop-blur-lg border-t border-white/20 p-4 sm:p-5 mx-2.5 mb-2.5 rounded-[10px]"
      style={{
        boxShadow: "0 -8px 32px -8px rgba(255, 255, 255, 0.1), 0 0 20px 0px rgba(255, 255, 255, 0.15)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-[65%_35%] gap-4">
          {/* Left column - Volume controls (expandable - 65%) */}
          <div className="space-y-4 py-2">
            {activeSounds.length > 0 ? (
              <div className="space-y-4">
                {activeSounds.map(({ sound, volume }) => (
                  <VolumeSlider 
                    key={sound.id} 
                    sound={sound} 
                    volume={volume}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-4 text-white/60 text-sm">
                No sounds selected
              </div>
            )}
          </div>
          
          {/* Right column - Playback controls */}
          <div className="flex flex-col items-center justify-between py-3 px-2 h-full space-y-4">
            <Button 
              className="rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/90 border border-white/20 hover:bg-white transition-all duration-300"
              style={{
                boxShadow: isPlaying ? "0 0 15px rgba(74, 222, 128, 0.6)" : "0 0 10px rgba(255, 255, 255, 0.2)"
              }}
              onClick={togglePlayPause}
            >
              {isPlaying ? 
                <Pause className="h-6 w-6 md:h-7 md:w-7 text-green-400" /> : 
                <Play className="h-6 w-6 md:h-7 md:w-7 text-black fill-black" />
              }
            </Button>
            
            <div className="w-full">
              <TimerSelector />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
