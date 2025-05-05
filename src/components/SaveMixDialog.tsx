import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAudioState } from "@/contexts/AudioStateContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SaveMixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SaveMixDialog: React.FC<SaveMixDialogProps> = ({ open, onOpenChange }) => {
  const { getActiveSounds, soundStates, saveCustomMix } = useAudioState();
  const isMobile = useIsMobile();
  const [mixName, setMixName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!mixName.trim()) {
      toast({
        description: "Please enter a name for your mix",
      });
      return;
    }

    // Get active sounds
    const activeSounds = getActiveSounds();
    
    // Create a mix object from the current active sounds
    const customMix = {
      name: mixName,
      description: description || "Custom mix",
      sounds: activeSounds.map(sound => ({
        id: sound.id,
        volume: soundStates[sound.id] ? soundStates[sound.id].volume / 100 : 1,
      })),
    };

    // Save the custom mix
    saveCustomMix(customMix);
    
    // Dispatch a custom event to notify components that a mix was saved
    const mixSavedEvent = new CustomEvent('mixsaved', { detail: { mix: customMix } });
    window.dispatchEvent(mixSavedEvent);
    
    // Reset form and close dialog
    setMixName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-black/60 backdrop-blur-lg border-white/20",
          isMobile
            ? "!p-4 !w-[90%] !max-w-[90%] !rounded-xl"
            : "w-full max-w-md"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-white">
            Save Custom Mix
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="mix-name" className="text-sm font-medium text-white/80">
              Mix Name
            </label>
            <Input
              id="mix-name"
              value={mixName}
              onChange={(e) => setMixName(e.target.value)}
              placeholder="Enter a name for your mix"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="mix-description" className="text-sm font-medium text-white/80">
              Description (optional)
            </label>
            <Input
              id="mix-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your mix"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div className="pt-2">
            <Button
              onClick={handleSave}
              className="w-full bg-white hover:bg-white/90 text-black font-medium"
            >
              Save Mix
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveMixDialog;