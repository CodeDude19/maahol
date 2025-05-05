import React, { useEffect, useState } from "react";
import { useAudioState } from "@/contexts/AudioStateContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, Plus } from "lucide-react";
import VolumeSlider from "./VolumeSlider";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
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
    soundStates, 
    masterVolume, 
    setMasterVolume, 
    isPlaying, 
    togglePlayPause,
    isCurrentMixSaved,
    getActiveSounds
  } = useAudioState();
  
  const isMobile = useIsMobile();
  const [particles] = useState(() => Array.from({ length: 8 }, (_, i) => i * 0.2));
  const [showSaveMixDialog, setShowSaveMixDialog] = useState(false);
  
  // Get active sounds from the sound states
  const activeSounds = getActiveSounds();
  
  // Determine if the save mix button should be disabled
  const isSaveButtonDisabled = activeSounds.length === 0 || isCurrentMixSaved();

  // Return early if no active sounds
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
        <div className="grid grid-cols-[70%_30%] gap-4">
          {/* Left column - Volume controls (70%) */}
          <div className="space-y-4 py-2">
            {activeSounds.length > 0 ? (
              <div className="space-y-4">
                {activeSounds.map((sound) => (
                  <VolumeSlider 
                    key={sound.id} 
                    sound={sound}
                  />
                ))}
                
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-4 text-white/60 text-sm">
                No sounds selected
              </div>
            )}
          </div>
          
          {/* Right column - Play/Pause and Save Mix buttons (30%) */}
          <div className="flex flex-col items-center justify-center py-3 px-2 h-full space-y-4">
            <div className="relative">
              <CircleWave isPlaying={isPlaying} />
              {isPlaying && particles.map((delay, index) => (
                <Particle key={index} delay={delay} />
              ))}
              <Button 
                className="rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/90 border border-white/20 hover:bg-white transition-all duration-300 relative z-10"
                style={{
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.2)"
                }}
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    className="w-8 h-8 md:w-10 md:h-10 text-black"
                  >
                    <rect x="6" y="4" width="4" height="16" fill="currentColor"></rect>
                    <rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    className="w-8 h-8 md:w-10 md:h-10 text-black"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
                  </svg>
                )}
              </Button>
            </div>
            
            {/* Circular Save Mix Button */}
            <div className="flex flex-col items-center">
              <Button 
                className={`rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center border border-white/20 transition-all duration-300 relative z-10 ${isSaveButtonDisabled ? 'bg-white/30 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-white/90'}`}
                style={{
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.2)"
                }}
                onClick={() => setShowSaveMixDialog(true)}
                disabled={isSaveButtonDisabled}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  className={`w-8 h-8 md:w-10 md:h-10 ${isSaveButtonDisabled ? 'text-white/50' : 'text-black'}`}
                >
                  <rect x="11" y="5" width="2" height="14" fill="currentColor" />
                  <rect x="5" y="11" width="14" height="2" fill="currentColor" />
                </svg>
              </Button>
              <span className="text-xs font-medium text-white/80 mt-1">Save Mix</span>
            </div>
          </div>
        </div>
      </div>
      <SaveMixDialog open={showSaveMixDialog} onOpenChange={setShowSaveMixDialog} />
    </motion.div>
  );
};

export default Dashboard;
