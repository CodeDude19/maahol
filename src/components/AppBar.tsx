import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAudio } from "@/contexts/AudioContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { sounds } from "@/data/sounds";

interface AppBarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: { id: string; name: string; }[];
}

const AppBar: React.FC<AppBarProps> = ({ selectedCategory, setSelectedCategory, categories }) => {
  const { isPlaying, updateVolume, setVolumeForSound, toggleSound } = useAudio();
  const [showInfo, setShowInfo] = React.useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('maahol_has_visited');
    if (!hasVisited) {
      // Show the info dialog
      setShowInfo(true);
      // Mark as visited
      localStorage.setItem('maahol_has_visited', 'true');
    }
  }, []);

  return (
    <>
      <div className="w-full px-4">
        <div className={`mx-auto ${!isMobile ? 'max-w-[650px]' : ''}`}>
          <motion.div 
            className="sticky top-2 z-50 py-4 px-4 mt-2.5 rounded-[10px] backdrop-blur-lg bg-white/30 border border-white/20 cursor-pointer w-full"
            onClick={() => setShowInfo(true)}
            style={{
              boxShadow: "0 8px 32px -8px rgba(255, 255, 255, 0.1), 0 0 20px 0px rgba(255, 255, 255, 0.15)",
              '--appbar-height': '60px'
            } as React.CSSProperties}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-medium tracking-tight flex items-center">
                <img src="/serene-symphony-soundscapes/images/Maahol.png" alt="Maahol icon" className="w-8 h-8 mr-2 rounded-full" style={{boxShadow: '0 0 30px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.7)', clipPath: 'circle(50% at 50% 50%)', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))'}} />
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

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="bg-black/80 backdrop-blur-lg border-white/20 text-white mx-auto max-w-4xl w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <img src="/serene-symphony-soundscapes/images/Maahol.png" alt="Maahol icon" className="w-8 h-8 rounded-full" />
              माहौल - Maahol
            </DialogTitle>
          </DialogHeader>

          
          <div className="space-y-3 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">Best with Earphones</span> 🎧
            </div>
            
            <p className="leading-relaxed">Welcome to Maahol (माहौल) - your personal sound sanctuary. Transform any space into your perfect environment with carefully crafted ambient soundscapes that help you focus, relax, or find your flow.</p>
            
            <div className="space-y-2 mt-4">
              <h3 className="font-medium text-lg">Pro Tips 💡</h3>
              <ul className="space-y-2 text-white/85">
                <li>Mix rain sounds with thunder for a cozy storm</li>
                <li>Combine cafe ambience with light rain for focus</li>
                <li>Use white noise with nature sounds for sleep</li>
              </ul>
            </div>

            <div className="space-y-2 mt-4">
              <h3 className="font-medium text-lg">Try My Favorite Mix ✨</h3>
              <p className="text-white/85">
                I've curated a perfect blend of heavy rain, rain on windshield, and thunder that I use for deep work and peaceful sleep.
              </p>
              <button
                onClick={async () => {
                  const heavyRain = sounds.find(s => s.id === 'heavy-rain');
                  const rainWindow = sounds.find(s => s.id === 'rain-window');
                  const thunder = sounds.find(s => s.id === 'thunder');

                  if (heavyRain && rainWindow && thunder) {
                    // First set the volumes in the audio state
                    updateVolume(heavyRain.id, 40);
                    updateVolume(rainWindow.id, 90);
                    updateVolume(thunder.id, 80);

                    // Small delay to ensure state is updated
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Then toggle each sound which will use the stored volumes
                    toggleSound(heavyRain);
                    toggleSound(rainWindow);
                    toggleSound(thunder);

                    // Set the active volumes for currently playing sounds
                    setVolumeForSound(heavyRain.id, 0.4);
                    setVolumeForSound(rainWindow.id, 0.9);
                    setVolumeForSound(thunder.id, 0.8);
                  }
                  setShowInfo(false);
                }}
                className="w-full px-4 py-2 mt-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500/90 transition-colors text-white font-medium"
              >
                Try Now
              </button>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-medium">Perfect For:</h3>
              <ul className="grid grid-cols-2 gap-1 text-sm">
                <li>⚡️ Deep Work</li>
                <li>🧘 Meditation</li>
                <li>💤 Sleep</li>
                <li>✨ Relaxation</li>
              </ul>
            </div>
            
            <div className="space-y-1">
              <p><span className="font-medium">Pro Tip:</span> Try Heavy Rain + Thunder + Brown Noise for deep focus! 💫</p>
            </div>
            
            <div className="pt-3 border-t border-white/20 space-y-1">
              <p className="font-medium text-sm">Crafted with ❤️ by Yasser Arafat</p>
              <a 
                href="https://www.linkedin.com/in/yasserarafat007/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
              >
                Connect with me
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>

  );
};

export default AppBar;