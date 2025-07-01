import type { Match } from "@shared/schema";
import { getPointsToWin, getProgressPercentage } from "@/lib/apa-handicaps";

interface PlayerScoresProps {
  match: Match;
  overrideScores?: {
    player1Score?: number;
    player2Score?: number;
  };
}

export default function PlayerScores({ match, overrideScores }: PlayerScoresProps) {
  const player1Score = overrideScores?.player1Score ?? match.player1Score;
  const player2Score = overrideScores?.player2Score ?? match.player2Score;
  
  const player1Target = getPointsToWin(match.player1SkillLevel as any);
  const player2Target = getPointsToWin(match.player2SkillLevel as any);
  const player1Progress = getProgressPercentage(player1Score, match.player1SkillLevel as any);
  const player2Progress = getProgressPercentage(player2Score, match.player2SkillLevel as any);

  return (
    <section className="p-4 bg-gray-100">
      <div className="grid grid-cols-2 gap-3">
        {/* Player 1 Score Card */}
        <div className={`rounded-lg p-3 shadow-sm border-2 transition-all duration-200 ${
          match.currentPlayer === 1 
            ? 'border-green-600 bg-white shadow-lg' 
            : 'border-transparent bg-gray-100 opacity-70'
        }`}>
          <div className="text-center">
            <h3 className="font-semibold text-gray-800">{match.player1Name}</h3>
            <div className="text-xs text-gray-600 mb-2">
              Skill Level {match.player1SkillLevel}
            </div>
            <div className="text-2xl font-bold text-green-600">{player1Score}</div>
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
        <div className={`rounded-lg p-3 shadow-sm border-2 transition-all duration-200 ${
          match.currentPlayer === 2 
            ? 'border-green-600 bg-white shadow-lg' 
            : 'border-transparent bg-gray-100 opacity-70'
        }`}>
          <div className="text-center">
            <h3 className="font-semibold text-gray-800">{match.player2Name}</h3>
            <div className="text-xs text-gray-600 mb-2">
              Skill Level {match.player2SkillLevel}
            </div>
            <div className={`text-2xl font-bold ${
              match.currentPlayer === 2 ? 'text-green-600' : 'text-gray-700'
            }`}>
              {player2Score}
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
