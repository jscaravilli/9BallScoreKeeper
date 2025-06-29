import { useState } from "react";
import type { Match, BallInfo } from "@shared/schema";
import { getPointsToWin, getProgressPercentage } from "@/lib/apa-handicaps";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import ScoreEditModal from "./score-edit-modal";

interface PlayerScoresProps {
  match: Match;
  overrideScores?: {
    player1Score?: number;
    player2Score?: number;
  };
  onScoreUpdate?: (newScore: number, ballChanges: BallInfo[], playerNumber: 1 | 2) => void;
}

export default function PlayerScores({ match, overrideScores, onScoreUpdate }: PlayerScoresProps) {
  const [editingPlayer, setEditingPlayer] = useState<1 | 2 | null>(null);
  
  const player1Score = overrideScores?.player1Score ?? match.player1Score;
  const player2Score = overrideScores?.player2Score ?? match.player2Score;
  
  const player1Target = getPointsToWin(match.player1SkillLevel as any);
  const player2Target = getPointsToWin(match.player2SkillLevel as any);
  const player1Progress = getProgressPercentage(player1Score, match.player1SkillLevel as any);
  const player2Progress = getProgressPercentage(player2Score, match.player2SkillLevel as any);

  const handleScoreUpdate = (newScore: number, ballChanges: BallInfo[], playerNumber: 1 | 2) => {
    if (onScoreUpdate) {
      onScoreUpdate(newScore, ballChanges, playerNumber);
    }
    setEditingPlayer(null);
  };

  return (
    <section className="p-4 bg-gray-100">
      <div className="grid grid-cols-2 gap-3">
        {/* Player 1 Score Card */}
        <div className={`bg-white rounded-lg p-3 shadow-sm border-2 ${
          match.currentPlayer === 1 ? 'border-green-600' : 'border-transparent'
        }`}>
          <div className="text-center">
            <h3 className="font-semibold text-gray-800">{match.player1Name}</h3>
            <div className="text-xs text-gray-600 mb-2">
              Skill Level {match.player1SkillLevel}
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-2xl font-bold text-green-600">{player1Score}</div>
              {onScoreUpdate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPlayer(1)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              of {player1Target} points
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${player1Progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player 2 Score Card */}
        <div className={`bg-white rounded-lg p-3 shadow-sm border-2 ${
          match.currentPlayer === 2 ? 'border-green-600' : 'border-transparent'
        }`}>
          <div className="text-center">
            <h3 className="font-semibold text-gray-800">{match.player2Name}</h3>
            <div className="text-xs text-gray-600 mb-2">
              Skill Level {match.player2SkillLevel}
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className={`text-2xl font-bold ${
                match.currentPlayer === 2 ? 'text-green-600' : 'text-gray-700'
              }`}>
                {player2Score}
              </div>
              {onScoreUpdate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPlayer(2)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              of {player2Target} points
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  match.currentPlayer === 2 ? 'bg-green-600' : 'bg-gray-400'
                }`}
                style={{ width: `${player2Progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Score Edit Modals */}
      {editingPlayer && (
        <ScoreEditModal
          open={editingPlayer !== null}
          onClose={() => setEditingPlayer(null)}
          match={match}
          playerNumber={editingPlayer}
          onUpdateScore={handleScoreUpdate}
        />
      )}
    </section>
  );
}
