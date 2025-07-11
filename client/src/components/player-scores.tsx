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

  // Get player colors with fallbacks
  const player1Color = match.player1Color || "#0F4A3C";
  const player2Color = match.player2Color || "#3B82F6";

  return (
    <section 
      className="p-4 cloth-texture player-background transition-all duration-300" 
      style={{ 
        backgroundColor: match.currentPlayer === 1 ? player1Color : player2Color 
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {/* Player 1 Score Card */}
        <div className={`rounded-lg p-3 shadow-sm transition-all duration-200 ${
          match.currentPlayer === 1 
            ? 'border-4 border-white bg-white/95 shadow-lg ring-2 ring-white/60' 
            : 'border-2 border-white/50 bg-white/80'
        }`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{match.player1Name}</h3>
              <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                LAG
              </span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Skill Level {match.player1SkillLevel}
            </div>
            <div className={`text-2xl font-bold ${
              match.currentPlayer === 1 ? 'text-green-600' : 'text-gray-700'
            }`}>
              {player1Score}
            </div>
            <div className="text-xs text-gray-500">
              of {player1Target} points
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  match.currentPlayer === 1 ? 'bg-green-600' : 'bg-gray-400'
                }`}
                style={{ width: `${player1Progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player 2 Score Card */}
        <div className={`rounded-lg p-3 shadow-sm transition-all duration-200 ${
          match.currentPlayer === 2 
            ? 'border-4 border-white bg-white/95 shadow-lg ring-2 ring-white/60' 
            : 'border-2 border-white/50 bg-white/80'
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
