import React, { useState, useEffect, useMemo } from "react";
import { useAudioState } from "@/contexts/AudioStateContext";
import { motion } from "framer-motion";
import { sounds } from "@/data/sounds";
import { useIsMobile } from "@/hooks/use-mobile";
import { getLuminosity } from "@/lib/color";
import { SoundMix } from "@/lib/audio/AudioStateManager";
import { X } from "lucide-react";
import { soundMixes } from "@/data/soundMixes";
import { cn } from "@/lib/utils";

const MixesTab: React.FC = () => {
  const { applyMix, getCustomMixes, deleteCustomMix, isCurrentMixSaved, getActiveSounds } = useAudioState();
  const isMobile = useIsMobile();
  
  // Add state to track when mixes are updated
  const [mixesUpdated, setMixesUpdated] = useState(0);
  // Add state to store custom mixes
  const [customMixes, setCustomMixes] = useState<SoundMix[]>([]);
  
  // Use effect to refresh custom mixes when mixesUpdated changes
  useEffect(() => {
    setCustomMixes(getCustomMixes());
  }, [getCustomMixes, mixesUpdated]);

  const handleApplyMix = (mix: SoundMix) => {
    applyMix(mix);
  };
  
  const handleDeleteMix = (e: React.MouseEvent, mixName: string) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    deleteCustomMix(mixName);
    // Increment counter to trigger re-render and refresh the custom mixes list
    setMixesUpdated(prev => prev + 1);
  };

  // Helper function to check if a mix is currently active
  const isMixActive = (mix: SoundMix): boolean => {
    const activeSounds = getActiveSounds();
    const activeSoundIds = activeSounds.map(sound => sound.id);

    // If number of sounds doesn't match, it's not a match
    if (mix.sounds.length !== activeSoundIds.length) return false;

    // Check if all sounds in the mix are active
    return mix.sounds.every(mixSound => {
      return activeSoundIds.includes(mixSound.id);
    });
  };

  // Sort mixes to bring active ones to the top
  const sortedPredefinedMixes = useMemo(() => {
    return [...soundMixes].sort((a, b) => {
      const isActiveA = isMixActive(a);
      const isActiveB = isMixActive(b);
      
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      return 0;
    });
  }, [getActiveSounds]);

  // Sort custom mixes to bring active ones to the top
  const sortedCustomMixes = useMemo(() => {
    return [...customMixes].sort((a, b) => {
      const isActiveA = isMixActive(a);
      const isActiveB = isMixActive(b);
      
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      return 0;
    });
  }, [customMixes, getActiveSounds]);

  return (
    <div className={`flex flex-col gap-4 py-1 pb-24 ${isMobile ? 'px-4' : 'max-w-[650px] mx-auto px-4'}`}>
      {/* Predefined Mixes Section */}
      {sortedPredefinedMixes.length > 0 && (
        <div className="mb-2">
          <h3 className="text-white/80 text-sm font-medium mb-4 px-1"></h3>
          <div className="flex flex-col gap-4">
            {sortedPredefinedMixes.map((mix, index) => {
              const isActive = isMixActive(mix);
              
              return (
                <motion.div
                  key={mix.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full"
                >
                  <button
                    className={cn(
                      "w-full h-auto p-4 px-5 flex flex-col items-start gap-3 transition-colors overflow-visible rounded-lg relative", 
                      isActive 
                        ? "bg-white/25 border-2 border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                        : "bg-white/10 hover:bg-white/15 border border-white/10"
                    )}
                    onClick={() => handleApplyMix(mix)}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-white text-black text-xs font-bold py-1 px-3 rounded-bl-lg rounded-tr-lg">
                        NOW PLAYING
                      </div>
                    )}
                    <div className="w-full text-left pr-2">
                      <span className={cn(
                        "text-base text-white block",
                        isActive ? "font-bold" : "font-medium"
                      )}>{mix.name}</span>
                      
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
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Custom Mixes Section */}
      {sortedCustomMixes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-white/80 text-sm font-medium mb-3 px-1">Your Custom Mixes</h3>
          <div className="flex flex-col gap-4">
            {sortedCustomMixes.map((mix, index) => {
              const isActive = isMixActive(mix);
              
              return (
                <motion.div
                  key={`custom-${mix.name}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full"
                >
                  <button
                    className={cn(
                      "w-full h-auto p-4 px-5 flex flex-col items-start gap-3 transition-colors overflow-visible relative rounded-lg", 
                      isActive 
                        ? "bg-white/25 border-2 border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                        : "bg-white/10 hover:bg-white/15 border border-white/10"
                    )}
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
                      {isActive && (
                        <div className="absolute top-0 right-10 bg-white text-black text-xs font-bold py-1 px-3 rounded-bl-lg rounded-tr-lg z-10">
                          NOW PLAYING
                        </div>
                      )}
                      <span className={cn(
                        "text-base text-white block",
                        isActive ? "font-bold" : "font-medium"
                      )}>{mix.name}</span>
                      
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
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* No mixes message */}
      {sortedCustomMixes.length === 0 && (
        <div className="mt-4 text-center text-white/60 text-sm">
          You haven't saved any custom mixes yet.
        </div>
      )}
    </div>
  );
};

export default MixesTab;