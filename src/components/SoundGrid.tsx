
import React from "react";
import { Sound } from "@/data/sounds";
import { useAudio } from "@/contexts/AudioContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // Define neon colors for different sound types
  const getNeonColor = (soundId: string) => {
    switch (true) {
      case soundId.includes('rain'):
        return '#00ffff'; // Cyan
      case soundId.includes('thunder'):
        return '#ff00ff'; // Magenta
      case soundId.includes('forest'):
        return '#39ff14'; // Neon green
      case soundId.includes('wave'):
      case soundId.includes('ocean'):
        return '#4d4dff'; // Neon blue
      case soundId.includes('fire'):
        return '#ff3131'; // Neon red
      case soundId.includes('wind'):
        return '#dfff00'; // Neon yellow/lime
      default:
        return '#aa00ff'; // Neon purple as default
    }
  };

  return (
    <motion.div 
      className={`grid gap-3 px-3 py-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6'}`}
      variants={container}
      initial="hidden"
      animate="show"
      style={!isMobile ? { maxWidth: '650px', margin: '0 auto' } : undefined}
    >
      {sounds.map((sound) => {
        const isActive = activeSounds.some(as => as.sound.id === sound.id);
        const neonColor = getNeonColor(sound.id);
        
        return (
          <motion.div 
            key={sound.id} 
            variants={item}
            onClick={() => toggleSound(sound)}
            className="relative aspect-square flex flex-col items-center justify-center rounded-lg overflow-hidden"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              backgroundColor: isActive ? `${neonColor}15` : 'rgba(30, 30, 30, 0.6)',
              boxShadow: isActive ? `0 0 15px ${neonColor}30` : 'none',
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
                  backgroundColor: `${neonColor}08`,
                  backgroundImage: `radial-gradient(circle at center, ${neonColor}20 0%, ${neonColor}05 70%, transparent 100%)`,
                }}
              />
            )}
            <div className="text-center z-10 px-2 w-full">
              <h3 
                className={`font-medium text-white ${isMobile ? 'text-xs' : 'text-sm'} break-words`}
                style={{ 
                  fontWeight: isMobile ? 300 : 400,
                  letterSpacing: isMobile ? '0.01em' : 'normal',
                  lineHeight: '1.2'
                }}
              >
                {sound.name}
              </h3>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default SoundGrid;
