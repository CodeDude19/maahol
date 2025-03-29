import React from "react";
import { motion } from "framer-motion";
import { useAudio } from "@/contexts/AudioContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

const AppBar: React.FC = () => {
  const { isPlaying } = useAudio();
  const [showInfo, setShowInfo] = React.useState(false);
  return (
    <>
      <motion.div 
        className="sticky top-2 z-50 py-4 px-4 mx-4 mt-2.5 rounded-[10px] backdrop-blur-lg bg-white/30 border border-white/20 cursor-pointer"
        onClick={() => setShowInfo(true)}
      style={{
        boxShadow: "0 8px 32px -8px rgba(255, 255, 255, 0.1), 0 0 20px 0px rgba(255, 255, 255, 0.15)",
        '--appbar-height': '60px'
      } as React.CSSProperties}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-medium tracking-tight flex items-center">
          <img src="/serene-symphony-soundscapes/images/Maahol.png" alt="Maahol icon" className="w-8 h-8 mr-2 rounded-full" style={{boxShadow: '0 0 30px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.7)', clipPath: 'circle(50% at 50% 50%)', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))'}} />
          <span className="text-white mr-2">Maahol</span> 
        </h1>
        
        <div className="w-8 h-8">
          <img 
            src={isPlaying ? "/serene-symphony-soundscapes/images/wave.gif" : "/serene-symphony-soundscapes/images/oval.gif"} 
            alt="Playback status" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </motion.div>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="bg-black/80 backdrop-blur-lg border-white/20 text-white mx-auto max-w-4xl w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium flex items-center gap-2">
              <img src="/serene-symphony-soundscapes/images/Maahol.png" alt="Maahol icon" className="w-8 h-8 rounded-full" />
              माहौल - Maahol
            </DialogTitle>
          </DialogHeader>

          
          <div className="space-y-4 text-white/90">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">Best with Earphones</span> 🎧
            </div>
            
            <p>An App to create a माहौल or an environment in your sound space, to elevate you and get rid of surrounding noise & distraction.</p>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">How to Use</h3>
              <p>Use it for Work, Sleep & Focus.</p>
              <p>Mix 2-3 Different ambient sounds together to create that Magic</p>
            </div>
            
            <div className="space-y-2">
              <p><span className="font-medium">Personal Favourite:</span> Heavy Rain + Thunder + Brown Noise</p>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-white/20">
              <p className="font-medium">Creator: Yasser Arafat</p>
              <a 
                href="https://www.linkedin.com/in/yasserarafat007/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Reach me Here!
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>

  );
};

export default AppBar;