import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import type { Match, BallInfo } from "@shared/schema";

interface ScoreEditModalProps {
  open: boolean;
  onClose: () => void;
  match: Match;
  playerNumber: 1 | 2;
  onUpdateScore: (newScore: number, ballChanges: BallInfo[], playerNumber: 1 | 2) => void;
}

export default function ScoreEditModal({ 
  open, 
  onClose, 
  match, 
  playerNumber, 
  onUpdateScore 
}: ScoreEditModalProps) {
  const playerName = playerNumber === 1 ? match.player1Name : match.player2Name;
  const currentScore = playerNumber === 1 ? match.player1Score : match.player2Score;
  const ballStates = match.ballStates as BallInfo[] || [];
  
  // Count current balls scored by this player
  const playerBalls = ballStates.filter(ball => 
    ball.state === 'scored' && ball.scoredBy === playerNumber
  );
  
  const [tempBallStates, setTempBallStates] = useState<BallInfo[]>([...ballStates]);
  
  // Calculate temporary score based on current ball states
  const tempScore = tempBallStates
    .filter(ball => ball.state === 'scored' && ball.scoredBy === playerNumber)
    .reduce((total, ball) => total + (ball.number === 9 ? 2 : 1), 0);

  const handleBallToggle = (ballNumber: number) => {
    setTempBallStates(prev => {
      const newStates = [...prev];
      const ballIndex = newStates.findIndex(b => b.number === ballNumber);
      
      if (ballIndex !== -1) {
        const ball = newStates[ballIndex];
        
        if (ball.state === 'scored' && ball.scoredBy === playerNumber) {
          // Remove ball from this player (set to active)
          newStates[ballIndex] = {
            ...ball,
            state: 'active',
            scoredBy: undefined
          };
        } else if (ball.state === 'active') {
          // Add ball to this player
          newStates[ballIndex] = {
            ...ball,
            state: 'scored',
            scoredBy: playerNumber
          };
        }
        // If ball is scored by other player or dead, don't change it
      }
      
      return newStates;
    });
  };

  const handleSave = () => {
    onUpdateScore(tempScore, tempBallStates, playerNumber);
    onClose();
  };

  const handleCancel = () => {
    setTempBallStates([...ballStates]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Score - {playerName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current vs New Score */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Current Score: {currentScore}</div>
            <div className="text-2xl font-bold text-green-600">New Score: {tempScore}</div>
          </div>

          {/* Ball Selection Grid */}
          <div>
            <h4 className="font-medium mb-3">Select balls scored by {playerName}:</h4>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(ballNum => {
                const ball = tempBallStates.find(b => b.number === ballNum);
                const isScoredByPlayer = ball?.state === 'scored' && ball?.scoredBy === playerNumber;
                const isScoredByOther = ball?.state === 'scored' && ball?.scoredBy !== playerNumber;
                const isDead = ball?.state === 'dead';
                
                return (
                  <Button
                    key={ballNum}
                    variant={isScoredByPlayer ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBallToggle(ballNum)}
                    disabled={isScoredByOther || isDead}
                    className={`h-12 relative ${
                      isScoredByPlayer 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : isScoredByOther 
                          ? 'opacity-50 cursor-not-allowed'
                          : isDead
                            ? 'opacity-30 cursor-not-allowed bg-red-100'
                            : ''
                    }`}
                  >
                    <span className="font-bold">{ballNum}</span>
                    {ballNum === 9 && (
                      <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1 rounded">
                        2pts
                      </span>
                    )}
                    {isScoredByOther && (
                      <span className="absolute -top-1 -right-1 text-xs bg-gray-500 text-white px-1 rounded">
                        P{ball?.scoredBy}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}