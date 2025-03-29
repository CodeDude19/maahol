import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAudio } from "@/contexts/AudioContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { WelcomeDialog } from "./WelcomeDialog";

interface AppBarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: { id: string; name: string; }[];
}

const AppBar: React.FC<AppBarProps> = ({ selectedCategory, setSelectedCategory, categories }) => {
  const { isPlaying } = useAudio();
  const [showInfo, setShowInfo] = React.useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('maahol_has_visited');
    if (!hasVisited) {
      // Show the info dialog
      setShowInfo(true);
    }
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 w-full px-4 pt-2">
        <div className={`mx-auto ${!isMobile ? 'max-w-[650px]' : ''}`}>
          <motion.div 
            className="py-4 px-4 rounded-[16px] backdrop-blur-lg bg-white/30 cursor-pointer w-full"
            onClick={() => setShowInfo(true)}
            style={{
              boxShadow: "0 8px 32px -8px rgba(255, 255, 255, 0.1), 0 0 20px 0px rgba(255, 255, 255, 0.15)",
              '--appbar-height': '68px'
            } as React.CSSProperties}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-medium tracking-tight flex items-center">
                <img src="/maahol/images/Maahol.png" alt="Maahol icon" className="w-8 h-8 mr-2 rounded-full" style={{boxShadow: '0 0 30px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.7)', clipPath: 'circle(50% at 50% 50%)', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))'}} />
                <span className="text-white mr-2">Maahol</span> 
              </h1>
              
              <div className="w-8 h-8 relative flex items-center justify-center">
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={isPlaying ? {
                    filter: "drop-shadow(0 0 8px rgba(255, 236, 179, 0.6))",
                  } : {
                    filter: "drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    {/* Bulb base */}
                    <path 
                      d="M9 21h6m-6-2h6m-3-12v-4" 
                      stroke={isPlaying ? "#ffd98a" : "#666"} 
                      strokeWidth="1.5" 
                      strokeLinecap="round"
                    />
                    {/* Bulb glass */}
                    <motion.path
                      d="M12 7c3.3 0 6 2.7 6 6 0 2.22-1.21 4.16-3 5.2-.46.27-1.22.8-1.5.8h-3c-.28 0-1.04-.53-1.5-.8-1.79-1.04-3-2.98-3-5.2 0-3.3 2.7-6 6-6z"
                      fill={isPlaying ? "rgba(255, 236, 179, 0.8)" : "rgba(255, 255, 255, 0.1)"}
                      stroke={isPlaying ? "#ffd98a" : "#666"}
                      strokeWidth="1.5"
                      initial={false}
                      animate={isPlaying ? {
                        fill: "rgba(255, 236, 179, 0.8)",
                        stroke: "#ffd98a",
                      } : {
                        fill: "rgba(255, 255, 255, 0.1)",
                        stroke: "#666",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Light rays when on */}
                    {isPlaying && (
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path d="M12 3v-1M3.5 7l-1-1M20.5 7l1-1M4 15H3M21 15h-1" stroke="#ffd98a" strokeWidth="1.5" strokeLinecap="round">
                          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                        </path>
                      </motion.g>
                    )}
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <WelcomeDialog open={showInfo} onOpenChange={setShowInfo} />
    </>
  );
};

export default AppBar;