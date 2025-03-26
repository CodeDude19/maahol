
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
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4 py-6"
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
            className={`sound-tile ${isActive ? "active" : ""}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{sound.icon}</div>
              <h3 className="font-medium text-sm">{sound.name}</h3>
              
              {isActive && (
                <div className="flex justify-center mt-2 space-x-0.5">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 h-3 bg-primary rounded-full wave-animation"
                      style={{ "--i": i } as any}
                    >
                      <span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default SoundGrid;
