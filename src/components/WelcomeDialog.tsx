import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAudio } from "@/contexts/AudioContext";
import { sounds } from "@/data/sounds";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const { toggleSound, updateVolume, activeSounds, pauseAllSounds, setVolumeForSound } = useAudio();
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

  const playRecommendedSounds = async () => {
    // First pause all sounds
    pauseAllSounds();

    // Clear all active sounds
    const soundsToClear = [...activeSounds];
    for (const { sound } of soundsToClear) {
      // Remove the sound - this will also clean up its state
      toggleSound(sound);
    }

    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get all recommended sounds
    const heavyRain = sounds.find(s => s.id === 'heavy-rain');
    const rainWindow = sounds.find(s => s.id === 'rain-window');
    const thunder = sounds.find(s => s.id === 'thunder');

    if (heavyRain && rainWindow && thunder) {
      // Set volumes in audioState first
      updateVolume(heavyRain.id, 40);
      updateVolume(rainWindow.id, 90);
      updateVolume(thunder.id, 80);

      // Then add each sound
      toggleSound(heavyRain);
      toggleSound(rainWindow);
      toggleSound(thunder);

      // Finally set the active sound volumes
      setVolumeForSound(heavyRain.id, 0.4);
      setVolumeForSound(rainWindow.id, 0.9);
      setVolumeForSound(thunder.id, 0.8);
    }

    handleDialogClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
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

          {isFirstVisit && (
            <div className="space-y-2 mt-4">
              <h3 className="font-medium text-lg">Try My Favorite Mix ✨</h3>
              <p className="text-white/85">
                I've curated a perfect blend of heavy rain, rain on windshield, and thunder that I use for deep work and peaceful sleep.
              </p>
              <button
                onClick={playRecommendedSounds}
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
  );
} 