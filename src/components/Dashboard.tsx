
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
      className="bg-black/60 backdrop-blur-lg border-t border-white/10 p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-md mx-auto">
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
          <div className="text-center py-4 text-white/60">
            No sounds selected. Choose sounds from the grid above.
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <TimerSelector />
          <Button 
            className="rounded-full w-16 h-16 flex items-center justify-center bg-black border border-white/20 shadow-lg hover:bg-white/10"
            style={{
              boxShadow: isPlaying ? "0 0 15px rgba(74, 222, 128, 0.7), 0 0 30px rgba(74, 222, 128, 0.4)" : "none"
            }}
            onClick={togglePlayPause}
          >
            {isPlaying ? 
              <Pause className="h-8 w-8 text-green-400" /> : 
              <Play className="h-8 w-8 ml-1 text-white" />
            }
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
