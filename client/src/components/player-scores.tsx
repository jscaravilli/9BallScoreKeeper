import type { Match } from "@shared/schema";
import { getPointsToWin, getProgressPercentage } from "@/lib/apa-handicaps";

interface PlayerScoresProps {
  match: Match;
}

export default function PlayerScores({ match }: PlayerScoresProps) {
  const player1Target = getPointsToWin(match.player1SkillLevel as any);
  const player2Target = getPointsToWin(match.player2SkillLevel as any);
  const player1Progress = getProgressPercentage(match.player1Score, match.player1SkillLevel as any);
  const player2Progress = getProgressPercentage(match.player2Score, match.player2SkillLevel as any);

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
            <div className="text-2xl font-bold text-green-600">{match.player1Score}</div>
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
            <div className={`text-2xl font-bold ${
              match.currentPlayer === 2 ? 'text-green-600' : 'text-gray-700'
            }`}>
              {match.player2Score}
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
    </section>
  );
}
