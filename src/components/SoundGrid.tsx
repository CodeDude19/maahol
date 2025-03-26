
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

  return (
    <motion.div 
      className="grid grid-cols-3 gap-4 px-4 py-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {sounds.map((sound) => {
        const isActive = activeSounds.some(as => as.sound.id === sound.id);
        
        return (
          <motion.div 
            key={sound.id} 
            variants={item}
            onClick={() => toggleSound(sound)}
            className={`sound-tile ${isActive ? "active" : ""} aspect-square flex flex-col items-center justify-center`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              backgroundColor: isActive ? 
                sound.id === 'rain-windshield' ? 'rgb(6, 182, 212)' : 
                sound.id === 'heavy-rain' ? 'rgb(139, 92, 246)' : 
                sound.id === 'thunder-storm' ? 'rgb(59, 130, 246)' : 
                'rgba(75, 85, 99, 0.6)' : 'rgba(75, 85, 99, 0.6)'
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{sound.icon}</div>
              <h3 className="font-medium text-white">{sound.name}</h3>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default SoundGrid;
