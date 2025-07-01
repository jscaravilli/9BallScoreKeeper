import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

export default function ScoresheetPrint({ match }: ScoresheetPrintProps) {
  // Calculate target points for each player
  const player1Target = getPointsToWin(match.player1SkillLevel as any);
  const player2Target = getPointsToWin(match.player2SkillLevel as any);
  
  // Determine lag winner (player 1 is always lag winner in our system)
  const lagWinner = { name: match.player1Name, skillLevel: match.player1SkillLevel, target: player1Target };
  const otherPlayer = { name: match.player2Name, skillLevel: match.player2SkillLevel, target: player2Target };
  
  // Extract game data from events
  const gameEvents = match.events.filter(event => 
    event.type === 'ball_scored' || event.type === 'turn_ended'
  );
  
  // Group events by games to create scoring marks
  const games = extractGamesFromEvents(gameEvents, match);
  
  // Calculate total safeties from events
  const player1Safeties = match.events.filter(e => e.type === 'safety_taken' && e.player === 1).length;
  const player2Safeties = match.events.filter(e => e.type === 'safety_taken' && e.player === 2).length;
  
  // Calculate innings from turn_ended events
  const totalInnings = Math.ceil(match.events.filter(e => e.type === 'turn_ended').length / 2);
  
  // Match date formatting
  const matchDate = new Date(match.completedAt);
  const startTime = new Date(match.createdAt || match.completedAt);
  
  return (
    <div className="print:block hidden">
      <div className="bg-white p-8 text-black" style={{ width: '8.5in', minHeight: '11in' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold">APA</div>
            <div className="text-xl font-bold">9 BALL SCORES</div>
          </div>
          <div className="text-sm">
            <div>Match: Start Time: {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} End Time: {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
        
        {/* Point Scale Headers */}
        <div className="mb-2">
          <PointScale target={lagWinner.target} />
        </div>
        
        {/* Lag Winner (Top Player) */}
        <PlayerRow 
          player={lagWinner}
          score={match.player1Score}
          games={games.filter(g => g.winner === 1)}
          safeties={player1Safeties}
          target={lagWinner.target}
          position="top"
        />
        
        {/* Point Scale for Bottom Player */}
        <div className="my-2">
          <PointScale target={otherPlayer.target} />
        </div>
        
        {/* Other Player (Bottom) */}
        <PlayerRow 
          player={otherPlayer}
          score={match.player2Score}
          games={games.filter(g => g.winner === 2)}
          safeties={player2Safeties}
          target={otherPlayer.target}
          position="bottom"
        />
        
        {/* Bottom Point Scale */}
        <div className="mt-2 mb-4">
          <PointScale target={otherPlayer.target} />
        </div>
        
        {/* Match Summary */}
        <div className="grid grid-cols-4 gap-4 mt-8 text-sm">
          <div className="border border-black p-2">
            <div className="font-bold mb-1">Total Innings</div>
            <div className="text-center text-xl">{totalInnings}</div>
          </div>
          <div className="border border-black p-2">
            <div className="font-bold mb-1">Defensive Shots</div>
            <div className="text-center">
              <div>{match.player1Name}: {player1Safeties}</div>
              <div>{match.player2Name}: {player2Safeties}</div>
            </div>
          </div>
          <div className="border border-black p-2">
            <div className="font-bold mb-1">Total Points</div>
            <div className="text-center">
              <div>{match.player1Name}: {match.player1Score}</div>
              <div>{match.player2Name}: {match.player2Score}</div>
            </div>
          </div>
          <div className="border border-black p-2">
            <div className="font-bold mb-1">Match Points Earned</div>
            <div className="text-center">
              <div>{match.winnerId === 1 ? match.player1Name : match.player2Name}: Winner</div>
            </div>
          </div>
        </div>
        
        {/* Table Size Section */}
        <div className="mt-6 text-sm">
          <div className="font-bold mb-2">This week's match took place on:</div>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              4-1/2 x 9' Regulation
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Point scale component with circled target
function PointScale({ target }: { target: number }) {
  const points = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];
  
  return (
    <div className="flex border border-black">
      {points.map(point => (
        <div 
          key={point}
          className={`flex-1 text-center py-1 border-r border-black text-sm ${
            point === target ? 'bg-black text-white rounded-full mx-1 my-0.5' : ''
          }`}
        >
          {point}
        </div>
      ))}
    </div>
  );
}

// Player row component
function PlayerRow({ 
  player, 
  score, 
  games, 
  safeties, 
  target, 
  position 
}: {
  player: { name: string; skillLevel: number; target: number };
  score: number;
  games: Array<{ winner: number; points: number; gameNumber: number }>;
  safeties: number;
  target: number;
  position: 'top' | 'bottom';
}) {
  return (
    <div className="border border-black">
      <div className="grid grid-cols-12 min-h-[60px]">
        {/* Player Info */}
        <div className="col-span-3 border-r border-black p-2">
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>Team No:</div>
            <div>Player No:</div>
            <div className="col-span-2 font-bold">{player.name}</div>
            <div>SL: {player.skillLevel}</div>
            <div>Score: {score}</div>
          </div>
        </div>
        
        {/* Scoring Grid */}
        <div className="col-span-6 border-r border-black p-1">
          <ScoringGrid games={games} target={target} />
        </div>
        
        {/* Stats */}
        <div className="col-span-3 p-2 bg-yellow-100">
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="text-center">
              <div>Defensive</div>
              <div>Shots</div>
              <div className="font-bold text-lg">{safeties}</div>
            </div>
            <div className="text-center">
              <div>Total</div>
              <div>Points</div>
              <div className="font-bold text-lg">{score}</div>
            </div>
            <div className="text-center">
              <div>Match</div>
              <div>Points</div>
              <div>Earned</div>
              <div className="font-bold text-lg">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Scoring grid with marks
function ScoringGrid({ games, target }: { games: Array<{ points: number; gameNumber: number }>; target: number }) {
  const points = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];
  
  // Create scoring marks based on games
  const marks: { [key: number]: string[] } = {};
  
  games.forEach((game, gameIndex) => {
    // Add marks up to the points scored in this game
    let currentPoints = 0;
    for (const point of points) {
      if (currentPoints < game.points && point <= target) {
        if (!marks[point]) marks[point] = [];
        // Alternate between / and \ for each game
        const markType = gameIndex % 2 === 0 ? '/' : '\\';
        marks[point].push(markType);
        currentPoints = point;
      }
      if (currentPoints >= game.points) break;
    }
  });
  
  return (
    <div className="grid grid-cols-16 gap-0.5 h-full">
      {points.map(point => (
        <div key={point} className="text-center text-xs border-r border-gray-300 last:border-r-0">
          <div className="h-8 flex flex-col justify-center">
            {marks[point]?.map((mark, i) => (
              <span key={i} className="text-lg font-bold">{mark}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Extract game data from events
function extractGamesFromEvents(events: MatchEvent[], match: Match) {
  // For now, create simple game data based on final scores
  // This is a simplified version - you may want to enhance this based on your event structure
  const games = [];
  
  if (match.winnerId === 1) {
    games.push({ winner: 1, points: match.player1Score, gameNumber: 1 });
  } else if (match.winnerId === 2) {
    games.push({ winner: 2, points: match.player2Score, gameNumber: 1 });
  }
  
  return games;
}