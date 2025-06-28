import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BallInfo } from "@shared/schema";

interface BallRackProps {
  ballStates: BallInfo[];
  onBallTap: (ballNumber: number) => void;
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

export default function BallRack({ ballStates, onBallTap }: BallRackProps) {
  const getBallState = (ballNumber: number): BallInfo => {
    return ballStates.find(b => b.number === ballNumber) || {
      number: ballNumber as BallInfo['number'],
      state: 'active' as const,
    };
  };

  const getBallGradient = (ballNumber: number) => {
    const gradients = {
      1: 'radial-gradient(circle at 30% 30%, #fef08a, #facc15, #ca8a04, #713f12)',
      2: 'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6, #1d4ed8, #1e3a8a)',
      3: 'radial-gradient(circle at 30% 30%, #fca5a5, #ef4444, #dc2626, #991b1b)',
      4: 'radial-gradient(circle at 30% 30%, #c4b5fd, #8b5cf6, #7c3aed, #581c87)',
      5: 'radial-gradient(circle at 30% 30%, #fed7aa, #fb923c, #ea580c, #c2410c)',
      6: 'radial-gradient(circle at 30% 30%, #86efac, #22c55e, #16a34a, #166534)',
      7: 'radial-gradient(circle at 30% 30%, #b91c1c, #7f1d1d, #450a0a, #1c0606)',
      8: 'radial-gradient(circle at 30% 30%, #6b7280, #374151, #1f2937, #000000)'
    };
    return gradients[ballNumber as keyof typeof gradients] || '';
  };

  const renderBallContent = (ballNumber: number, state: BallInfo['state']) => {
    if (state === 'scored') {
      return <Check className="h-6 w-6 text-green-600" />;
    } else if (state === 'dead') {
      return <X className="h-6 w-6 text-red-500" />;
    } else if (ballNumber === 9) {
      // CSS-based 9-ball design contained within the button
      return (
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* Light gray base ball */}
          <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
          
          {/* Yellow horizontal stripe spanning full width of the button */}
          <div 
            className="absolute left-0 right-0 bg-yellow-400"
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

  const getBallStyles = (ballNumber: number, state: BallInfo['state']) => {
    const baseStyles = "w-16 h-16 rounded-full border-2 shadow-lg flex items-center justify-center font-bold text-lg hover:shadow-xl transition-all active:scale-95 touch-target";
    
    if (state === 'scored') {
      return `${baseStyles} bg-gray-300 border-green-600 opacity-60 text-gray-600`;
    } else if (state === 'dead') {
      return `${baseStyles} bg-gray-400 border-red-500 opacity-40 text-white`;
    } else {
      // All balls now use custom gradients, no background needed here
      return `${baseStyles} bg-transparent border-gray-300 text-white overflow-hidden p-0`;
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
          
          return (
            <Button
              key={ballNumber}
              className={getBallStyles(ballNumber, ballState.state)}
              onClick={() => onBallTap(ballNumber)}
              variant="outline"
            >
              {renderBallContent(ballNumber, ballState.state)}
            </Button>
          );
        })}
      </div>

      {/* Ball States Legend */}
      <div className="mt-6 bg-gray-100 rounded-lg p-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Ball Controls:</h3>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
            <span>Single tap: Award points to current player</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-400 border border-red-500 mr-2"></div>
            <span>Double tap: Mark dead (deducts points from scorer)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
            <span>Triple tap: Reset to active (deducts points if scored)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
