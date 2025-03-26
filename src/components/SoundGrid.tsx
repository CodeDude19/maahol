
import React from "react";
import { Sound } from "@/data/sounds";
import { useAudio } from "@/contexts/AudioContext";
import { motion } from "framer-motion";

interface SoundGridProps {
  sounds: Sound[];
}

const SoundGrid: React.FC<SoundGridProps> = ({ sounds }) => {
  const { activeSounds, toggleSound } = useAudio();
  
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
      className="grid grid-cols-3 gap-4 px-4 py-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {sounds.map((sound) => {
        const isActive = activeSounds.some(as => as.sound.id === sound.id);
        const neonColor = getNeonColor(sound.id);
        
        return (
          <motion.div 
            key={sound.id} 
            variants={item}
            onClick={() => toggleSound(sound)}
            className="relative aspect-square flex flex-col items-center justify-center rounded-lg"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.8)',
              boxShadow: isActive ? `0 0 15px ${neonColor}, 0 0 30px ${neonColor}70` : 'none',
              transition: 'box-shadow 0.3s ease, background-color 0.3s ease'
            }}
          >
            <div 
              className="absolute inset-0 rounded-lg" 
              style={{
                border: `2px solid ${neonColor}`, 
                opacity: isActive ? 0.8 : 0.4,
                transition: 'opacity 0.3s ease'
              }}
            />
            <div className="text-center z-10">
              <div className="text-4xl mb-3" style={{ color: neonColor }}>{sound.icon}</div>
              <h3 className="font-medium text-white">{sound.name}</h3>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default SoundGrid;
