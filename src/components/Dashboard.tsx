import React, { useEffect, useState } from "react";
import { useAudioState } from "@/contexts/AudioStateContext";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import VolumeSlider from "./VolumeSlider";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import NewSoundMixesDialog from "./NewSoundMixesDialog";
import SaveMixDialog from "./SaveMixDialog";

// Particle component
const Particle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-white rounded-full"
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
      x: [0, (Math.random() - 0.5) * 50],
      y: [0, (Math.random() - 0.5) * 50],
    }}
    transition={{
      duration: 1.5,
      delay,
      ease: "easeOut",
      repeat: Infinity,
    }}
  />
);

// Circle Wave component
const CircleWave = ({ isPlaying }: { isPlaying: boolean }) => (
  <AnimatePresence>
    {isPlaying && (
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 1, opacity: 0 }}
        animate={{
          scale: [1, 1.5],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
        style={{
          border: "2px solid rgba(255, 255, 255, 0.3)",
        }}
      />
    )}
  </AnimatePresence>
);

const Dashboard: React.FC = () => {
  const { 
    activeSounds, 
    masterVolume, 
    setMasterVolume, 
    isPlaying, 
    togglePlayPause,
    isCurrentMixPredefined
  } = useAudioState();
  
  const isMobile = useIsMobile();
  const [particles] = useState(() => Array.from({ length: 8 }, (_, i) => i * 0.2));
  const [showMixes, setShowMixes] = useState(false);
  const [showSaveMixDialog, setShowSaveMixDialog] = useState(false);
  
  // Determine if the save mix button should be disabled
  const isSaveButtonDisabled = activeSounds.length === 0 || isCurrentMixPredefined();

  if (activeSounds.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className={`bg-white/20 backdrop-blur-lg border-t border-white/20 p-4 sm:p-5 mb-2.5 rounded-[10px] ${!isMobile ? 'max-w-[650px] mx-auto' : 'mx-2.5'}`}
      style={{
        boxShadow: "0 -8px 32px -8px rgba(255, 255, 255, 0.1), 0 0 20px 0px rgba(255, 255, 255, 0.15)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="w-full">
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
                
                {/* Save Custom Mix Button */}
                <Button
                  variant="outline"
                  className={`w-full mt-4 bg-white text-black hover:bg-white/90 transition-all ${isSaveButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setShowSaveMixDialog(true)}
                  disabled={isSaveButtonDisabled}
                >
                  Save this custom mix
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-4 text-white/60 text-sm">
                No sounds selected
              </div>
            )}
          </div>
          
          {/* Right column - Playback controls */}
          <div className="flex flex-col items-center justify-between py-3 px-2 h-full space-y-6">
            <div className="relative">
              <CircleWave isPlaying={isPlaying} />
              {isPlaying && particles.map((delay, index) => (
                <Particle key={index} delay={delay} />
              ))}
              <Button 
                className="rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/90 border border-white/20 hover:bg-white transition-all duration-300 relative z-10"
                style={{
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.2)"
                }}
                onClick={togglePlayPause}
              >
                {isPlaying ? 
                  <Pause className="h-6 w-6 md:h-7 md:w-7 text-black fill-black" /> : 
                  <Play className="h-6 w-6 md:h-7 md:w-7 text-black fill-black" />
                }
              </Button>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <Button
                variant="ghost"
                className="p-0 hover:bg-transparent"
                onClick={() => setShowMixes(true)}
              >
                <img 
                  src="/maahol/images/cassete.png" 
                  alt="Sound Mixes" 
                  className="w-[2.9rem] aspect-[512/330] md:w-[3.4rem] hover:opacity-90 transition-all duration-300"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))",
                    boxShadow: "0 0 15px rgba(255, 255, 255, 0.3)",
                  }}
                />
              </Button>
              <span className="text-xs font-medium text-whie/80">Mixes</span>
            </div>
          </div>
        </div>
      </div>
      <NewSoundMixesDialog open={showMixes} onOpenChange={setShowMixes} />
      <SaveMixDialog open={showSaveMixDialog} onOpenChange={setShowSaveMixDialog} />
    </motion.div>
  );
};

export default Dashboard;
