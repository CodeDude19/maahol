
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAudio } from "@/contexts/AudioContext";
import { Timer, X } from "lucide-react";

// Define our option type interface separately from the imported one
interface TimerOptionItem {
  value: string;
  label: string;
}

const timerOptions: TimerOptionItem[] = [
  { value: "15min", label: "15 minutes" },
  { value: "30min", label: "30 minutes" },
  { value: "45min", label: "45 minutes" },
  { value: "60min", label: "1 hour" },
  { value: "75min", label: "1h 15m" },
  { value: "90min", label: "1h 30m" },
  { value: "endless", label: "Endless" }
];

const formatTimeRemaining = (ms: number): string => {
  if (ms <= 0) return "00:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const TimerSelector: React.FC = () => {
  const { timer, timeRemaining, setTimer, cancelTimer } = useAudio();

  return (
    <div className="flex items-center justify-center">
      {timeRemaining !== null ? (
        <Button 
          variant="outline" 
          className="rounded-[10px] flex items-center justify-center gap-1 border-white/30 bg-white text-black hover:bg-white/90"
        >
          <Timer className="h-4 w-4" />
          <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
        </Button>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="rounded-[10px] flex items-center justify-center gap-1 border-white/30 bg-white text-black hover:bg-white/90"
            >
              <Timer className="h-4 w-4" />
              <span>Timer</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 border-white/30 bg-black/60 backdrop-blur-lg">
            <div className="grid gap-1">
              <div className="text-sm font-medium px-2 py-1">Select Duration</div>
              {timerOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timer === option.value ? "default" : "ghost"}
                  className="justify-start font-normal"
                  onClick={() => setTimer(option.value as any)}
                >
                  {option.label}
                </Button>
              ))}
              
              {timeRemaining !== null && (
                <Button 
                  variant="ghost" 
                  className="justify-start font-normal text-destructive"
                  onClick={cancelTimer}
                >
                  <X className="h-4 w-4 mr-2" /> Cancel Timer
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default TimerSelector;
