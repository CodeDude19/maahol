
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimerOption, useAudio } from "@/contexts/AudioContext";
import { Timer, X } from "lucide-react";

interface TimerOption {
  value: TimerOption;
  label: string;
}

const timerOptions: TimerOption[] = [
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
    <div className="flex items-center justify-center mt-4 mb-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-full flex items-center glass-effect border-white/30 hover:bg-white/20"
          >
            <Timer className="h-4 w-4 mr-2" />
            {timeRemaining !== null ? (
              <span className="font-mono">{formatTimeRemaining(timeRemaining)}</span>
            ) : (
              <span>Set Timer</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 glass-effect border-white/30">
          <div className="grid gap-1">
            <div className="text-sm font-medium px-2 py-1">Select Duration</div>
            {timerOptions.map((option) => (
              <Button
                key={option.value}
                variant={timer === option.value ? "default" : "ghost"}
                className="justify-start font-normal"
                onClick={() => setTimer(option.value)}
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
    </div>
  );
};

export default TimerSelector;
