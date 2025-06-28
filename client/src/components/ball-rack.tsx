import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BallInfo } from "@shared/schema";

interface BallRackProps {
  ballStates: BallInfo[];
  onBallTap: (ballNumber: number) => void;
}

const BALL_COLORS = {
  1: "bg-yellow-400", // Yellow
  2: "bg-blue-600",   // Blue
  3: "bg-red-600",    // Red
  4: "bg-purple-600", // Purple
  5: "bg-orange-500", // Orange
  6: "bg-green-600",  // Green
  7: "bg-red-900",    // Maroon
  8: "bg-gray-900",   // Black
  9: "bg-gradient-to-r from-yellow-400 via-white to-yellow-400", // Yellow with stripe
};

export default function BallRack({ ballStates, onBallTap }: BallRackProps) {
  const getBallState = (ballNumber: number): BallInfo => {
    return ballStates.find(b => b.number === ballNumber) || {
      number: ballNumber as BallInfo['number'],
      state: 'active' as const,
    };
  };

  const renderBallContent = (ballNumber: number, state: BallInfo['state']) => {
    if (state === 'scored') {
      return <Check className="h-6 w-6 text-green-600" />;
    } else if (state === 'dead') {
      return <X className="h-6 w-6 text-red-500" />;
    } else if (ballNumber === 9) {
      // Authentic 9-ball design matching the reference image exactly
      return (
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* Light gray base ball */}
          <div className="absolute inset-0 bg-gray-300 rounded-full"></div>
          
          {/* Wide yellow horizontal band - takes up about 45% of the ball */}
          <div className="absolute inset-x-0 bg-yellow-400"
               style={{ 
                 top: '27.5%',
                 height: '45%',
                 background: '#fcd34d'
               }}>
          </div>
          
          {/* White circle for the number positioned in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="font-black text-base text-black">9</span>
            </div>
          </div>
        </div>
      );
    } else {
      return <span className="font-bold text-lg">{ballNumber}</span>;
    }
  };

  const getBallStyles = (ballNumber: number, state: BallInfo['state']) => {
    const baseStyles = "w-16 h-16 rounded-full border-4 shadow-lg flex items-center justify-center font-bold text-lg hover:shadow-xl transition-all active:scale-95 touch-target";
    
    if (state === 'scored') {
      return `${baseStyles} bg-gray-300 border-green-600 opacity-60 text-gray-600`;
    } else if (state === 'dead') {
      return `${baseStyles} bg-gray-400 border-red-500 opacity-40 text-white`;
    } else if (ballNumber === 9) {
      // Special styling for 9-ball with white base and yellow stripe
      return `${baseStyles} bg-white border-amber-400 text-black overflow-hidden`;
    } else {
      const colorClass = BALL_COLORS[ballNumber as keyof typeof BALL_COLORS];
      const textColor = [1].includes(ballNumber) ? "text-black" : "text-white";
      const borderColor = "border-gray-300";
      return `${baseStyles} ${colorClass} ${borderColor} ${textColor}`;
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
