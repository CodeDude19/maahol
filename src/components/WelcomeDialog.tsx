import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAudioState } from "@/contexts/AudioStateContext";
import { sounds } from "@/data/sounds";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const { toggleSound, updateVolume, pauseAllSounds, playAllActiveSounds, setVolumeForSound, getActiveSounds } = useAudioState();
  const [isFirstVisit, setIsFirstVisit] = React.useState(true);

  // Check if this is first visit when dialog opens
  React.useEffect(() => {
    if (open) {
      const hasVisited = localStorage.getItem('maahol_has_visited');
      setIsFirstVisit(!hasVisited);
    }
  }, [open]);

  const handleDialogClose = () => {
    // Mark as visited when dialog is closed
    localStorage.setItem('maahol_has_visited', 'true');
    onOpenChange(false);
  };

  const playRecommendedSounds = () => {
    console.log("Starting playback of recommended sounds");
    
    try {
      // First pause all sounds
      pauseAllSounds();
      
      // Then clear existing sounds
      const currentSounds = getActiveSounds();
      currentSounds.forEach(sound => {
        toggleSound(sound);
      });
      
      // Get recommended sounds from the sounds array
      const rainWindowSound = sounds.find(s => s.id === 'rain-window');
      const thunderSound = sounds.find(s => s.id === 'thunder');
      const heavyRainSound = sounds.find(s => s.id === 'heavy-rain');
      
      console.log("Found sounds:", {
        rainWindow: !!rainWindowSound,
        thunder: !!thunderSound, 
        heavyRain: !!heavyRainSound
      });
      
      // Add them one by one with a slight delay
      setTimeout(() => {
        if (rainWindowSound) {
          toggleSound(rainWindowSound);
          console.log("Added rain on windshield sound");
        }
        
        setTimeout(() => {
          if (thunderSound) {
            toggleSound(thunderSound);
            console.log("Added thunder sound");
          }
          
          setTimeout(() => {
            if (heavyRainSound) {
              toggleSound(heavyRainSound);
              // Set heavy rain to 30% volume
              setVolumeForSound(heavyRainSound.id, 0.3);
              console.log("Added heavy rain sound at 30% volume");
            }
          }, 300);
          
          // After all sounds have been added, start playback
          setTimeout(() => {
            console.log("Starting playback of sounds");
            playAllActiveSounds();
          }, 600);
        }, 300);
      }, 300);
    } catch (error) {
      console.error("Error playing recommended sounds:", error);
    }

    // Close the dialog only after sounds are added
    setTimeout(() => {
      handleDialogClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="bg-black/80 backdrop-blur-lg border-white/20 text-white mx-auto max-w-4xl w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium flex items-center gap-2">
            <img src="/maahol/images/Maahol.png" alt="Maahol icon" className="w-8 h-8 rounded-full" />
            माहौल - Maahol
          </DialogTitle>
          <DialogDescription className="sr-only">
            Welcome to Maahol - Create your perfect sound environment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-white/90 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">Best with Earphones</span> 🎧
          </div>
          
          <p className="leading-relaxed">Welcome to Maahol (माहौल) - your personal sound sanctuary. Transform any space into your perfect environment with carefully crafted ambient soundscapes that help you focus, relax, or find your flow.</p>
          
          {isFirstVisit && (
            <div className="space-y-2 mt-4">
              <h3 className="font-medium text-lg">Try My Favorite Mix ✨</h3>
              <p className="text-white/85">
                I've curated a perfect blend of rain on windshield, thunder, and soft heavy rain that I use for deep work and peaceful sleep.
              </p>
              <button
                onClick={() => {
                  // Add logging to debug
                  console.log("Try Now button clicked");
                  playRecommendedSounds();
                }}
                className="w-full px-4 py-2 mt-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500/90 transition-colors text-white font-medium"
              >
                Try Now
              </button>
            </div>
          )}
          
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
            <p><span className="font-medium">Pro Tip:</span> Try Heavy Rain + Thunder + Rain Windshield for deep focus! 💫</p>
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
  );
}