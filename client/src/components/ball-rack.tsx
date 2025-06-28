import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BallInfo } from "@shared/schema";

interface BallRackProps {
  ballStates: BallInfo[];
  onBallTap: (ballNumber: number) => void;
  lockedBalls?: Set<number>;
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

export default function BallRack({ ballStates, onBallTap, lockedBalls = new Set() }: BallRackProps) {
  const getBallState = (ballNumber: number): BallInfo => {
    return ballStates.find(b => b.number === ballNumber) || {
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
    if (state === 'scored') {
      return <Check className="h-6 w-6 text-green-600" />;
    } else if (state === 'dead') {
      return <X className="h-6 w-6 text-red-500" />;
    } else if (ballNumber === 9) {
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
              top: '28%',
              height: '44%',
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
      return (
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* Base gradient */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ background: getBallGradient(ballNumber) }}
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
          
          {/* Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold text-lg ${ballNumber === 1 ? 'text-black' : 'text-white'} drop-shadow-sm`}>
              {ballNumber}
            </span>
          </div>
        </div>
      );
    }
  };

  const getBallStyles = (ballNumber: number, state: BallInfo['state'], isLocked: boolean) => {
    const baseStyles = "w-16 h-16 rounded-full border shadow-lg flex items-center justify-center font-bold text-lg transition-all touch-target";
    
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Ball Rack</h2>
      
      {/* Balls Grid */}
      <div className="grid grid-cols-3 gap-4 justify-items-center max-w-xs mx-auto">
        {Array.from({ length: 9 }, (_, i) => {
          const ballNumber = i + 1;
          const ballState = getBallState(ballNumber);
          const isLocked = lockedBalls.has(ballNumber);
          
          return (
            <Button
              key={ballNumber}
              className={getBallStyles(ballNumber, ballState.state, isLocked)}
              onClick={() => !isLocked && onBallTap(ballNumber)}
              variant="outline"
              disabled={isLocked}
            >
              {isLocked ? (
                <span className="text-gray-500 font-bold">{ballNumber}</span>
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
