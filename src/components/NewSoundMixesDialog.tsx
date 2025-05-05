import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAudioState } from "@/contexts/AudioStateContext";
import { motion } from "framer-motion";
import { sounds } from "@/data/sounds";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { getLuminosity } from "@/lib/color";
import { SoundMix } from "@/lib/audio/AudioStateManager";
import { X } from "lucide-react";

import { soundMixes } from "@/data/soundMixes";


interface SoundMixesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewSoundMixesDialog: React.FC<SoundMixesDialogProps> = ({ open, onOpenChange }) => {
  const { applyMix, getCustomMixes, deleteCustomMix } = useAudioState();
  const isMobile = useIsMobile();
  
  // Add state to track when mixes are updated
  const [mixesUpdated, setMixesUpdated] = useState(0);
  // Add state to store custom mixes
  const [customMixes, setCustomMixes] = useState<SoundMix[]>([]);
  
  // Use effect to refresh custom mixes when mixesUpdated changes or when dialog opens
  useEffect(() => {
    if (open) {
      setCustomMixes(getCustomMixes());
    }
  }, [getCustomMixes, mixesUpdated, open]);

  const handleApplyMix = (mix: SoundMix) => {
    // Using the new applyMix function from AudioStateContext
    applyMix(mix);
    onOpenChange(false);
  };
  
  const handleDeleteMix = (e: React.MouseEvent, mixName: string) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    deleteCustomMix(mixName);
    // Increment counter to trigger re-render and refresh the custom mixes list
    setMixesUpdated(prev => prev + 1);
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
          <DialogTitle className="text-xl font-medium text-white">Sound Mixes</DialogTitle>
        </DialogHeader>
        <div className={`flex flex-col gap-4 py-4 px-1 ${isMobile ? 'h-[calc(100%-4rem)] overflow-y-auto pr-3' : 'overflow-y-auto max-h-[60vh] pr-3'} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`}>
          {/* Predefined Mixes Section */}
          {soundMixes.length > 0 && (
            <div className="mb-2">
              <h3 className="text-white/80 text-sm font-medium mb-3">Best of Maahols</h3>
              <div className="flex flex-col gap-4">
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
            </div>
          )}
          
          {/* Custom Mixes Section */}
          {customMixes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-white/80 text-sm font-medium mb-3">Your Custom Mixes</h3>
              <div className="flex flex-col gap-4">
                {customMixes.map((mix, index) => (
                  <motion.div
                    key={`custom-${mix.name}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto p-4 px-5 flex flex-col items-start gap-3 border-white/20 hover:bg-white/10 transition-colors overflow-visible relative"
                      onClick={() => handleApplyMix(mix)}
                    >
                      <button 
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors z-10"
                        onClick={(e) => handleDeleteMix(e, mix.name)}
                        aria-label="Delete mix"
                      >
                        <X size={14} />
                      </button>
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
            </div>
          )}
          
          {/* No mixes message */}
          {customMixes.length === 0 && (
            <div className="mt-4 text-center text-white/60 text-sm">
              You haven't saved any custom mixes yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSoundMixesDialog;