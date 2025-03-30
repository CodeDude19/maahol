import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/contexts/AudioContext";
import { motion } from "framer-motion";
import { sounds } from "@/data/sounds";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SoundMix {
  name: string;
  description: string;
  sounds: { id: string; volume: number }[];
}

const soundMixes: SoundMix[] = [
  {
    name: "Rainy Night",
    description: "Perfect for sleeping with gentle rain and distant thunder",
    sounds: [
      { id: "rain", volume: 0.7 },
      { id: "thunder", volume: 0.3 },
      { id: "wind", volume: 0.2 }
    ]
  },
  {
    name: "Forest Ambience",
    description: "Immerse yourself in a peaceful forest setting",
    sounds: [
      { id: "birds", volume: 0.5 },
      { id: "wind", volume: 0.4 },
      { id: "leaves", volume: 0.3 }
    ]
  },
  {
    name: "Ocean Waves",
    description: "Calming ocean waves for relaxation",
    sounds: [
      { id: "waves", volume: 0.6 },
      { id: "seagulls", volume: 0.2 },
      { id: "wind", volume: 0.3 }
    ]
  },
  {
    name: "Cafe Ambience",
    description: "Cozy cafe atmosphere with gentle chatter",
    sounds: [
      { id: "cafe", volume: 0.5 },
      { id: "coffee", volume: 0.3 },
      { id: "people", volume: 0.4 }
    ]
  }
];

interface SoundMixesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SoundMixesDialog: React.FC<SoundMixesDialogProps> = ({ open, onOpenChange }) => {
  const { toggleSound, setVolumeForSound, activeSounds } = useAudio();
  const isMobile = useIsMobile();

  const applyMix = (mix: SoundMix) => {
    // First, stop all current sounds
    activeSounds.forEach(({ sound }) => {
      toggleSound(sound);
    });

    // Then apply the new mix
    mix.sounds.forEach(({ id, volume }) => {
      const sound = sounds.find(s => s.id === id);
      if (sound) {
        toggleSound(sound);
        setVolumeForSound(id, volume);
      }
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "bg-black/60 backdrop-blur-lg border-white/20",
          isMobile 
            ? "!p-4 !w-[90%] !h-[90%] !max-w-[90%] !max-h-[90%] !rounded-xl" 
            : "w-full max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-white">Sound Mixes</DialogTitle>
        </DialogHeader>
        <div className={`grid gap-4 py-4 ${isMobile ? 'h-[calc(100%-4rem)] overflow-y-auto pr-2' : ''}`}>
          {soundMixes.map((mix, index) => (
            <motion.div
              key={mix.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-start gap-2 border-white/20 hover:bg-white/10 transition-colors"
                onClick={() => applyMix(mix)}
              >
                <span className="text-lg font-medium text-white">{mix.name}</span>
                <span className="text-sm text-white/60">{mix.description}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SoundMixesDialog; 