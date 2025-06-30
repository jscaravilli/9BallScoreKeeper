import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { getPointsToWin } from "@/lib/apa-handicaps";
import type { Match } from "@shared/schema";

interface GameWinModalProps {
  open: boolean;
  onClose: () => void;
  winner: 1 | 2 | null;
  currentMatch: Match | null;
  onContinueMatch: () => void;
  onNewMatch: () => void;
  onRerack: () => void;
}

export default function GameWinModal({ 
  open, 
  onClose, 
  winner, 
  currentMatch, 
  onContinueMatch, 
  onNewMatch,
  onRerack
}: GameWinModalProps) {
  if (!winner || !currentMatch) return null;

  const winnerName = winner === 1 ? currentMatch.player1Name : currentMatch.player2Name;

  // Check if match points are reached
  const player1Target = getPointsToWin(currentMatch.player1SkillLevel as any);
  const player2Target = getPointsToWin(currentMatch.player2SkillLevel as any);
  
  const matchIsComplete = currentMatch.player1Score >= player1Target || 
                         currentMatch.player2Score >= player2Target;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="sr-only">Game Over</DialogTitle>
        <DialogDescription className="sr-only">
          {winnerName} wins this game by pocketing the 9-ball for 2 points
        </DialogDescription>
        <div className="text-center">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Game Over!</h2>
          <p className="text-gray-600 mb-4">
            {winnerName} wins this game!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Ball 9 pocketed for <strong>2 points</strong>
          </p>
          
          {/* Game won - only show rerack option */}
          <div className="flex justify-center">
            <Button 
              onClick={onRerack}
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3"
            >
              Rerack
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
