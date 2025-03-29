import React from "react";
import { Sound } from "@/data/sounds";
import { useAudio } from "@/contexts/AudioContext";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { getLuminosity } from "@/lib/color";

interface SoundGridProps {
  sounds: Sound[];
}

const SoundGrid: React.FC<SoundGridProps> = ({ sounds }) => {
  const { activeSounds, toggleSound } = useAudio();
  const isMobile = useIsMobile();
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
  };

  // Sort sounds to put active ones first
  const sortedSounds = [...sounds].sort((a, b) => {
    const aActive = activeSounds.some(as => as.sound.id === a.id);
    const bActive = activeSounds.some(as => as.sound.id === b.id);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  return (
    <motion.div 
      className={`grid gap-3 px-3 py-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6'}`}
      variants={container}
      initial="hidden"
      animate="show"
      style={!isMobile ? { maxWidth: '650px', margin: '0 auto' } : undefined}
    >
      <AnimatePresence>
        {sortedSounds.map((sound) => {
          const isActive = activeSounds.some(as => as.sound.id === sound.id);
          
          return (
            <motion.div 
              key={sound.id} 
              layout
              variants={item}
              onClick={() => toggleSound(sound)}
              className="relative aspect-square flex flex-col items-center justify-center rounded-lg overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundColor: isActive ? sound.color : 'rgba(255, 255, 255, 0.3)',
                boxShadow: isActive ? `0 0 22px ${sound.color}90` : 'none',
                transition: 'background-color 0.3s ease',
                maxWidth: isMobile ? undefined : '100px',
                maxHeight: isMobile ? undefined : '100px',
                width: '100%',
                height: '100%'
              }}
            >
              {isActive && (
                <div 
                  className="absolute inset-0 neon-glow" 
                  style={{
                    backgroundColor: `${sound.color}50`,
                    backgroundImage: `radial-gradient(circle at center, ${sound.color}90 0%, ${sound.color}70 70%, ${sound.color}50 100%),`
                  }}
                />
              )}
              <div className="flex flex-col items-center justify-center space-y-2 z-10 px-2 w-full h-full">
                <img 
                  src={isActive && getLuminosity(sound.color) > 0.7 ? sound.iconPath.replace('-W.png', '-B.png') : sound.iconPath}
                  alt={sound.name}
                  className="w-7 h-7 object-contain"
                />
                <h3 
                  className={`${isActive && getLuminosity(sound.color) > 0.7 ? 'text-black font-semibold' : 'text-white font-medium'} ${isMobile ? 'text-xs' : ''} break-words text-center`}
                  style={{ 
                    fontWeight: isMobile ? 300 : (isActive && getLuminosity(sound.color) > 0.7 ? 600 : 400),
                    letterSpacing: isMobile ? '0.01em' : 'normal',
                    lineHeight: '1.2',
                    fontSize: isMobile ? '0.675rem' : '0.81rem'
                  }}
                >
                  {sound.name}
                </h3>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default SoundGrid;
