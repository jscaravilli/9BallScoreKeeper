import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BallInfo } from "@shared/schema";

interface BallRackProps {
  ballStates: BallInfo[];
  onBallTap: (ballNumber: number) => void;
  currentPlayer: 1 | 2;
  currentTurn: number;
  turnHistory?: any[];
  undoInProgress?: boolean; // Add undo state to prevent visual glitches
  forceUpdateKey?: string; // Add key to force component updates
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

export default function BallRack({ ballStates, onBallTap, currentPlayer, currentTurn, turnHistory = [], undoInProgress = false, forceUpdateKey }: BallRackProps) {
  // IMPROVED TURN-BASED APPROACH: Hide balls from completed innings
  const shouldHideBall = (ballNumber: number): boolean => {
    const ball = ballStates.find(b => b.number === ballNumber);
    
    if (!ball) return false;
    
    // Don't hide any balls during undo operations to show restored states
    if (undoInProgress) return false;
    
    // Hide balls that were scored/dead in previous completed turns
    // Only hide if the ball's turn is definitively in the past
    if ((ball.state === 'scored' || ball.state === 'dead') && 
        ball.turnScored !== undefined && 
        ball.turnScored < currentTurn) {
      return true;
    }
    
    return false;
  };
  const getBallState = (ballNumber: number): BallInfo => {
    // Create a completely fresh state lookup to prevent stale references
    const ballStatesCopy = JSON.parse(JSON.stringify(ballStates));
    const foundBall = ballStatesCopy.find((b: BallInfo) => b.number === ballNumber);
    
    if (foundBall) {
      return {
        number: foundBall.number,
        state: foundBall.state,
        scoredBy: foundBall.scoredBy,
        turnScored: foundBall.turnScored
      };
    }
    
    return {
      number: ballNumber as BallInfo['number'],
      state: 'active' as const,
    };
  };



  const getBallGradient = (ballNumber: number) => {
    const gradients = {
      1: 'radial-gradient(circle at 30% 30%, #facc15, #eab308, #a16207, #451a03)',
      2: 'radial-gradient(circle at 30% 30%, #60a5fa, #2563eb, #1d4ed8, #172554)',
      3: 'radial-gradient(circle at 30% 30%, #f87171, #dc2626, #b91c1c, #7f1d1d)',
      4: 'radial-gradient(circle at 30% 30%, #a78bfa, #7c3aed, #6d28d9, #4c1d95)',
      5: 'radial-gradient(circle at 30% 30%, #fb923c, #ea580c, #c2410c, #9a3412)',
      6: 'radial-gradient(circle at 30% 30%, #4ade80, #16a34a, #15803d, #14532d)',
      7: 'radial-gradient(circle at 30% 30%, #991b1b, #7f1d1d, #450a0a, #1c0606)',
      8: 'radial-gradient(circle at 30% 30%, #4b5563, #374151, #1f2937, #000000)',
      9: 'radial-gradient(circle at 30% 30%, #ffffff, #f9fafb, #e5e7eb, #9ca3af)'
    };
    return gradients[ballNumber as keyof typeof gradients] || '';
  };

  const renderBallContent = (ballNumber: number, state: BallInfo['state']) => {
    // FORCE CORRECT STATE: Double-check the current ball state to prevent stale visuals
    const currentBallState = getBallState(ballNumber);
    const actualState = currentBallState.state;
    
    // Debug logging for visual state tracking
    if (ballNumber <= 3) { // Only log first 3 balls to avoid spam
      console.log(`Ball ${ballNumber} render:`, {
        passedState: state,
        actualState: actualState,
        ballData: currentBallState,
        forceKey: forceUpdateKey
      });
    }
    
    // EXPLICIT STATE CHECK: Only show icons for non-active states
    if (actualState === 'scored') {
      return <Check className="h-6 w-6 text-green-600" />;
    }
    
    if (actualState === 'dead') {
      return <X className="h-6 w-6 text-red-500" />;
    }
    
    // FORCE ACTIVE STATE RENDERING: Explicitly handle active state
    if (actualState === 'active') {
      // Continue to ball design rendering below
    } else {
      // Fallback: any other state should also render as active
      console.warn(`Unexpected ball state: ${actualState} for ball ${ballNumber}`);
    }
    
    // Only render special ball designs for active balls
    if (ballNumber === 9 && actualState === 'active') {
      // CSS-based 9-ball design with gradient effect
      return (
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* Base gradient ball */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ background: getBallGradient(9) }}
          ></div>
          
          {/* Glossy highlight effect */}
          <div 
            className="absolute rounded-full"
            style={{
              top: '10%',
              left: '20%',
              width: '35%',
              height: '35%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)',
            }}
          ></div>
          
          {/* Yellow horizontal stripe spanning full width of the button */}
          <div 
            className="absolute left-0 right-0"
            style={{ 
              top: '22%',
              height: '56%',
              background: 'linear-gradient(to bottom, #eab308, #fbbf24, #eab308)'
            }}
          ></div>
          
          {/* White circle for number in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-gray-400 shadow-sm">
              <span className="font-bold text-base text-black">9</span>
            </div>
          </div>
        </div>
      );
    } else {
      // For balls 1-8, use CSS-based design with white circles and black numbers
      return (
        <div 
          className={`ball-${ballNumber} w-full h-full rounded-full overflow-hidden relative`}
          data-number={ballNumber}
        >
          {/* Glossy highlight effect */}
          <div 
            className="absolute rounded-full"
            style={{
              top: '10%',
              left: '20%',
              width: '35%',
              height: '35%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)',
            }}
          ></div>
        </div>
      );
    }
  };

  const getBallStyles = (ballNumber: number, state: BallInfo['state'], isLocked: boolean) => {
    const baseStyles = "w-16 h-16 rounded-full border-[0.5px] shadow-lg flex items-center justify-center font-bold text-lg transition-all touch-target";
    
    if (isLocked) {
      return `${baseStyles} bg-gray-300 border-gray-400 opacity-40 cursor-not-allowed`;
    } else if (state === 'scored') {
      return `${baseStyles} bg-gray-300 border-green-600 opacity-60 text-gray-600 hover:shadow-xl active:scale-95`;
    } else if (state === 'dead') {
      return `${baseStyles} bg-gray-400 border-red-500 opacity-40 text-white hover:shadow-xl active:scale-95`;
    } else {
      // All balls now use custom gradients, no background needed here
      return `${baseStyles} bg-transparent border-gray-300 text-white overflow-hidden p-0 hover:shadow-xl active:scale-95`;
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
          const hidden = shouldHideBall(ballNumber);
          
          // Hide balls scored by other player instead of showing them as locked
          if (hidden) {
            return (
              <div
                key={ballNumber}
                className="w-16 h-16 opacity-0 pointer-events-none"
              />
            );
          }
          
          // Get fresh state for accurate visual rendering
          const freshBallState = getBallState(ballNumber);
          const freshState = freshBallState.state;
          
          // Debug logging for visual state issues
          if (ballNumber <= 3) {
            console.log(`Ball ${ballNumber} full render:`, {
              freshState,
              freshBallState,
              stylesState: freshState,
              contentState: freshState
            });
          }
          
          return (
            <div
              key={`ball-${ballNumber}-${freshState}-${freshBallState.scoredBy || 'none'}-${freshBallState.turnScored || 0}-${forceUpdateKey || ''}-div`}
              className={getBallStyles(ballNumber, freshState, false)}
              onClick={() => onBallTap(ballNumber)}
              role="button"
              tabIndex={0}
            >
              {renderBallContent(ballNumber, freshState)}
            </div>
          );
        })}
      </div>


    </section>
  );
}
