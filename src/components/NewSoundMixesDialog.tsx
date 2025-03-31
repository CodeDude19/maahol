import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAudioState } from "@/contexts/AudioStateContext";
import { motion } from "framer-motion";
import { sounds } from "@/data/sounds";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { getLuminosity } from "@/lib/color";
import { SoundMix } from "@/lib/AudioStateManager";

// Sound mixes definition
const soundMixes: SoundMix[] = [
  {
    name: "Snowy Night & Camping",
    description: "Cozy winter camping under the starlit sky",
    sounds: [
      { id: "campfire", volume: 1.0 },
      { id: "snow", volume: 1.0 },
      { id: "wind", volume: 1.0 }
    ]
  },
  {
    name: "Late Night Storm",
    description: "Intense thunderstorm in the dark of night",
    sounds: [
      { id: "thunder", volume: 1.0 },
      { id: "heavy-rain", volume: 1.0 },
      { id: "night", volume: 1.0 }
    ]
  },
  {
    name: "Sleepless Night City",
    description: "Urban ambience with passing trains in the night",
    sounds: [
      { id: "night", volume: 1.0 },
      { id: "city", volume: 1.0 },
      { id: "train", volume: 1.0 }
    ]
  },
  {
    name: "At a Beach Cafe",
    description: "Relaxing cafe atmosphere by the seaside",
    sounds: [
      { id: "cafe", volume: 1.0 },
      { id: "beach", volume: 1.0 }
    ]
  },
  {
    name: "Forest Canopy Rain",
    description: "Peaceful rain shower in a bird-filled forest",
    sounds: [
      { id: "forest", volume: 1.0 },
      { id: "rain-camping", volume: 1.0 },
      { id: "birds", volume: 1.0 }
    ]
  },
  {
    name: "Skyline Breeze",
    description: "Gentle wind flowing through the city",
    sounds: [
      { id: "city", volume: 1.0 },
      { id: "wind", volume: 1.0 }
    ]
  }
];

interface SoundMixesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewSoundMixesDialog: React.FC<SoundMixesDialogProps> = ({ open, onOpenChange }) => {
  const { applyMix } = useAudioState();
  const isMobile = useIsMobile();

  const handleApplyMix = (mix: SoundMix) => {
    // Using the new applyMix function from AudioStateContext
    applyMix(mix);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "bg-black/60 backdrop-blur-lg border-white/20",
          isMobile 
            ? "!p-4 !w-[90%] !h-[90%] !max-w-[90%] !max-h-[90%] !rounded-xl" 
            : "w-full max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-white">Best of Maahols</DialogTitle>
        </DialogHeader>
        <div className={`flex flex-col gap-4 py-4 px-1 ${isMobile ? 'h-[calc(100%-4rem)] overflow-y-auto pr-3' : 'overflow-y-auto max-h-[60vh] pr-3'}`}>
          {soundMixes.map((mix, index) => (
            <motion.div
              key={mix.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full h-auto p-4 px-5 flex flex-col items-start gap-3 border-white/20 hover:bg-white/10 transition-colors overflow-visible"
                onClick={() => handleApplyMix(mix)}
              >
                <div className="w-full text-left pr-2">
                  <span className="text-base font-medium text-white block">{mix.name}</span>
                  
                  {/* Sound icons displayed horizontally without names */}
                  <div className="flex flex-wrap gap-2 mt-2 w-full">
                    {mix.sounds.map(({ id }) => {
                      const soundData = sounds.find(s => s.id === id);
                      if (!soundData) return null;
                      
                      const isLightColor = getLuminosity(soundData.color) > 0.7;
                      
                      return (
                        <div 
                          key={id} 
                          className="flex items-center justify-center rounded-sm p-1"
                          style={{ 
                            backgroundColor: `${soundData.color}80`,
                            boxShadow: `0 0 8px ${soundData.color}60`
                          }}
                        >
                          <img 
                            src={isLightColor ? soundData.iconPath.replace('-W.png', '-B.png') : soundData.iconPath}
                            alt={soundData.name}
                            className="w-3 h-3 object-cover rounded-sm"
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Description with proper wrapping */}
                  <span className="text-xs text-white/60 block mt-2 break-words whitespace-normal pr-1">{mix.description}</span>
                  
                  {/* Sound names in format: Rain + Heavy Rain + Wind */}
                  <span className="text-xs text-white/70 block mt-1.5 italic">
                    {mix.sounds.map(({ id }, index) => {
                      const soundData = sounds.find(s => s.id === id);
                      return soundData ? (
                        <React.Fragment key={id}>
                          {index > 0 && " + "}
                          {soundData.name.split('\n')[0]}
                        </React.Fragment>
                      ) : null;
                    })}
                  </span>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSoundMixesDialog;