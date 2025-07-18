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
  player1Color?: string;
  player2Color?: string;
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

export default function BallRack({ ballStates, onBallTap, lockedBalls = new Set(), turnHistory = [], currentInning, currentPlayer, player1Color, player2Color }: BallRackProps) {
  const getBallState = (ballNumber: number): BallInfo => {
    return ballStates.find(b => b.number === ballNumber) || {
      number: ballNumber as BallInfo['number'],
      state: 'active' as const,
    };
  };



  const getBallGradient = (ballNumber: number) => {
    const gradients = {
      1: 'radial-gradient(circle at 30% 30%, #fde047, #facc15, #eab308, #ca8a04)',
      2: 'radial-gradient(circle at 30% 30%, #60a5fa, #2563eb, #1d4ed8, #172554)',
      3: 'radial-gradient(circle at 30% 30%, #f87171, #dc2626, #b91c1c, #7f1d1d)',
      4: 'radial-gradient(circle at 30% 30%, #a78bfa, #7c3aed, #6d28d9, #4c1d95)',
      5: 'radial-gradient(circle at 30% 30%, #ff8c00, #ff7300, #e55100, #bf360c)',
      6: 'radial-gradient(circle at 30% 30%, #4ade80, #16a34a, #15803d, #14532d)',
      7: 'radial-gradient(circle at 30% 30%, #991b1b, #7f1d1d, #450a0a, #1c0606)',
      8: 'radial-gradient(circle at 30% 30%, #4b5563, #374151, #1f2937, #000000)',
      9: 'radial-gradient(circle at 30% 30%, #ffffff, #f9fafb, #e5e7eb, #9ca3af)'
    };
    return gradients[ballNumber as keyof typeof gradients] || '';
  };

  const renderBallContent = (ballNumber: number, state: BallInfo['state']) => {
    // Only render ball designs for active balls (scored/dead balls are hidden entirely)
    if (ballNumber === 9 && state === 'active') {
      // Use CSS-based 9-ball design with 3D overlays
      return (
        <div 
          className="ball-9 w-full h-full rounded-full overflow-hidden relative"
          data-number={ballNumber}
        >
          {/* White circle for number - positioned above all overlays */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
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

  const getBallStyles = (ballNumber: number, state: BallInfo['state'], isLocked: boolean, isScoredThisInning: boolean) => {
    const baseStyles = "w-16 h-16 rounded-full shadow-lg flex items-center justify-center font-bold text-lg transition-all touch-target";
    
    if (isLocked) {
      return `${baseStyles} bg-gray-300 opacity-40 cursor-not-allowed`;
    } else if (isScoredThisInning && (state === 'scored' || state === 'dead')) {
      // Balls scored during current inning show with greyed background for check marks
      return `${baseStyles} bg-gray-100 text-gray-600 hover:shadow-xl active:scale-95`;
    } else {
      // All active balls use custom gradients
      return `${baseStyles} bg-transparent text-white overflow-hidden p-0 hover:shadow-xl active:scale-95`;
    }
  };

  // Get player colors with fallbacks
  const activePlayerColor = currentPlayer === 1 
    ? (player1Color || "#0F4A3C") 
    : (player2Color || "#3B82F6");

  return (
    <section 
      className="p-4 cloth-texture player-background transition-all duration-300"
      style={{ backgroundColor: activePlayerColor }}
    >
      <h2 className="text-lg font-semibold text-white mb-4 text-center">Rack</h2>
      
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
              variant="ghost"
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
