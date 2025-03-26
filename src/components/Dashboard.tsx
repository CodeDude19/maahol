
import React from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2 } from "lucide-react";
import VolumeSlider from "./VolumeSlider";
import TimerSelector from "./TimerSelector";
import { motion, AnimatePresence } from "framer-motion";

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
      className="glass-effect rounded-2xl p-4 sm:p-6 max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Now Playing</h2>
        <Button 
          className="rounded-full w-12 h-12 flex items-center justify-center glass-effect border-white/30 hover:bg-white/20"
          variant="outline"
          onClick={togglePlayPause}
        >
          {isPlaying ? 
            <Pause className="h-5 w-5" /> : 
            <Play className="h-5 w-5 ml-0.5" />
          }
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Volume2 className="h-4 w-4 mr-2" />
          <span className="text-sm">Master Volume</span>
          <span className="ml-auto text-xs font-mono">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
        <Slider 
          value={[masterVolume]} 
          min={0} 
          max={1} 
          step={0.01}
          onValueChange={(values) => setMasterVolume(values[0])}
        />
      </div>

      <AnimatePresence>
        {activeSounds.length > 0 ? (
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {activeSounds.map(({ sound, volume }) => (
              <VolumeSlider 
                key={sound.id} 
                sound={sound} 
                volume={volume}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-6 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No sounds selected. Choose sounds from the grid above.
          </motion.div>
        )}
      </AnimatePresence>

      <TimerSelector />
    </motion.div>
  );
};

export default Dashboard;
