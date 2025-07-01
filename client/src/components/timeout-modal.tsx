import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import { formatTime, isTimeoutOvertime } from "@/lib/timeout-utils";

interface TimeoutModalProps {
  isOpen: boolean;
  onClose: (timeoutDuration: string) => void;
  playerName: string;
}

export default function TimeoutModal({ isOpen, onClose, playerName }: TimeoutModalProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isOpen && !isRunning) {
      setSeconds(0);
      setIsRunning(true);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStop = () => {
    setIsRunning(false);
    const timeoutDuration = formatTime(seconds);
    onClose(timeoutDuration);
    setSeconds(0);
  };

  const isOvertime = isTimeoutOvertime(seconds);
  const timeDisplay = formatTime(seconds);

  return (
    <Dialog open={isOpen} onOpenChange={() => handleStop()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="text-center text-lg font-bold">
          {playerName}'s Timeout
        </DialogTitle>
        
        <div className="text-center py-8">
          <Clock className="h-16 w-16 mx-auto mb-4 text-blue-600" />
          
          <div className={`text-6xl font-mono font-bold mb-4 transition-colors ${
            isOvertime ? 'text-red-700' : 'text-gray-800'
          }`}>
            {timeDisplay}
          </div>
          
          {isOvertime && (
            <p className="text-red-600 text-sm font-medium mb-4">
              Timeout has exceeded 1:00 minute
            </p>
          )}
          
          <Button 
            onClick={handleStop}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
          >
            End Timeout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}