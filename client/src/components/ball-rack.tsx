import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BallInfo } from "@shared/schema";

interface BallRackProps {
  ballStates: BallInfo[];
  onBallTap: (ballNumber: number) => void;
  lockedBalls?: Set<number>;
  turnHistory?: any[]; // Turn history to check if 9-ball can be undone
  currentInning: number; // Current inning number for visibility decisions
  currentPlayer: 1 | 2; // Current player to determine turn-based visibility
}

const BALL_COLORS = {
  1: "", // Yellow - handled with custom gradient
  2: "", // Blue - handled with custom gradient
  3: "", // Red - handled with custom gradient
  4: "", // Purple - handled with custom gradient
  5: "", // Orange - handled with custom gradient
  6: "", // Green - handled with custom gradient
  7: "", // Maroon - handled with custom gradient
  8: "", // Black - handled with custom gradient
  9: "", // Yellow with stripe (handled separately)
};

export default function BallRack({ ballStates, onBallTap, lockedBalls = new Set(), turnHistory = [], currentInning, currentPlayer }: BallRackProps) {
  const getBallState = (ballNumber: number): BallInfo => {
    return ballStates.find(b => b.number === ballNumber) || {
      number: ballNumber as BallInfo['number'],
      state: 'active' as const,
    };
  };



  const getBallGradient = (ballNumber: number) => {
    const gradients = {
      1: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #fbbf24 50%, #eab308 70%, #d97706 85%, #92400e)',
      2: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #60a5fa 50%, #3b82f6 70%, #1d4ed8 85%, #1e3a8a)',
      3: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #f87171 50%, #ef4444 70%, #dc2626 85%, #991b1b)',
      4: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #a78bfa 50%, #8b5cf6 70%, #7c3aed 85%, #5b21b6)',
      5: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #fb923c 50%, #f97316 70%, #ea580c 85%, #c2410c)',
      6: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #4ade80 50%, #22c55e 70%, #16a34a 85%, #15803d)',
      7: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #dc2626 50%, #b91c1c 70%, #991b1b 85%, #7f1d1d)',
      8: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0.4) 30%, #6b7280 50%, #4b5563 70%, #374151 85%, #111827)',
      9: 'radial-gradient(ellipse 60% 40% at 25% 25%, rgba(255,255,255,0.9), rgba(255,255,255,0.6) 30%, #f9fafb 50%, #e5e7eb 70%, #d1d5db 85%, #9ca3af)'
    };
    return gradients[ballNumber as keyof typeof gradients] || '';
  };

  const renderBallContent = (ballNumber: number, state: BallInfo['state']) => {
    // Only render ball designs for active balls (scored/dead balls are hidden entirely)
    if (ballNumber === 9 && state === 'active') {
      // 9-ball design with new gradient system
      return (
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* Base gradient ball */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ background: getBallGradient(9) }}
          ></div>
          
          {/* Yellow horizontal stripe spanning full width */}
          <div 
            className="absolute left-0 right-0"
            style={{ 
              top: '22%',
              height: '56%',
              background: 'linear-gradient(to bottom, #fbbf24, #eab308, #d97706)'
            }}
          ></div>
          
          {/* White circle for number in center - no border */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="font-bold text-base text-black">9</span>
            </div>
          </div>
        </div>
      );
    } else {
      // For balls 1-8, use new gradient system with white circles and black numbers
      return (
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* Base gradient ball */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ background: getBallGradient(ballNumber) }}
          ></div>
          
          {/* White circle for number in center - no border */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="font-bold text-base text-black">{ballNumber}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  const getBallStyles = (ballNumber: number, state: BallInfo['state'], isLocked: boolean, isScoredThisInning: boolean) => {
    const baseStyles = "w-16 h-16 rounded-full shadow-xl flex items-center justify-center font-bold text-lg transition-all touch-target";
    
    if (isLocked) {
      return `${baseStyles} bg-gray-300 opacity-40 cursor-not-allowed`;
    } else if (isScoredThisInning && (state === 'scored' || state === 'dead')) {
      // Balls scored during current inning show with greyed background for check marks
      return `${baseStyles} bg-gray-100 text-gray-600 hover:shadow-2xl active:scale-95`;
    } else {
      // All active balls use custom gradients with no border
      return `${baseStyles} bg-transparent text-white overflow-hidden p-0 hover:shadow-2xl hover:scale-105 active:scale-95`;
    }
  };

  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Rack</h2>
      
      {/* Balls Grid */}
      <div className="grid grid-cols-3 gap-4 justify-items-center max-w-xs mx-auto">
        {Array.from({ length: 9 }, (_, i) => {
          const ballNumber = i + 1;
          const ballState = getBallState(ballNumber);
          const isLocked = lockedBalls.has(ballNumber);
          

          
          // Show balls based on turn-based visibility
          const isScoredThisInning = ballState.inning === currentInning;
          
          // Hide balls that have completed their turn cycle
          // Scored balls disappear after turn ends, but dead balls stay visible until new rack
          const shouldHideBall = ballState.state === 'scored' && ballState.turnCompleted;
          
          if (shouldHideBall) {
            return (
              <div key={ballNumber} className="w-16 h-16 flex items-center justify-center">
                {/* Empty space where ball used to be */}
              </div>
            );
          }
          
          return (
            <Button
              key={ballNumber}
              className={getBallStyles(ballNumber, ballState.state, isLocked, isScoredThisInning)}
              onClick={() => !isLocked && onBallTap(ballNumber)}
              variant="outline"
              disabled={isLocked}
            >
              {isLocked ? (
                <span className="text-gray-500 font-bold">{ballNumber}</span>
              ) : isScoredThisInning && (ballState.state === 'scored' || ballState.state === 'dead') ? (
                ballState.state === 'scored' ? 
                  <Check className="h-6 w-6 text-green-600" /> : 
                  <X className="h-6 w-6 text-red-500" />
              ) : (
                renderBallContent(ballNumber, ballState.state)
              )}
            </Button>
          );
        })}
      </div>


    </section>
  );
}
