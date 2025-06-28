import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { getPointsToWin } from "@/lib/apa-handicaps";
import type { Match } from "@shared/schema";

interface MatchWinModalProps {
  open: boolean;
  onClose: () => void;
  currentMatch: Match | null;
  onNewMatch: () => void;
}

export default function MatchWinModal({ 
  open, 
  onClose, 
  currentMatch, 
  onNewMatch 
}: MatchWinModalProps) {
  if (!currentMatch) return null;

  // Determine match winner based on who reached their handicap
  const player1Target = getPointsToWin(currentMatch.player1SkillLevel as any);
  const player2Target = getPointsToWin(currentMatch.player2SkillLevel as any);
  
  let matchWinner: { name: string; target: number; score: number } | null = null;
  
  if (currentMatch.player1Score >= player1Target) {
    matchWinner = {
      name: currentMatch.player1Name,
      target: player1Target,
      score: currentMatch.player1Score,
    };
  } else if (currentMatch.player2Score >= player2Target) {
    matchWinner = {
      name: currentMatch.player2Name,
      target: player2Target,
      score: currentMatch.player2Score,
    };
  }

  if (!matchWinner) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <div className="text-center">
          <Crown className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Match Winner!</h2>
          <p className="text-lg text-gray-700 mb-2">
            {matchWinner.name}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Reached {matchWinner.target} points
          </p>
          <div className="bg-gray-100 rounded-lg p-3 mb-6">
            <div className="text-sm text-gray-600">
              <div>Game {currentMatch.currentGame}</div>
              <div>Total points: {matchWinner.score}</div>
            </div>
          </div>
          <Button 
            onClick={onNewMatch}
            className="w-full pool-green text-white py-3 px-4 hover:pool-felt"
          >
            Start New Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
