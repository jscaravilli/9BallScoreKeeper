import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/9B Blank-0_1751447644974.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

// Pixel coordinate mapping for top player score grid
const TOP_PLAYER_COORDINATES = [
  [252,149], [280,149], [307,149], [338,149], [370,149], [408,149], [432,149], [463,149], [494,149], [539,149],
  [588,149], [615,149], [646,149], [695,149], [750,149], [778,149], [809,149], [837,149], [882,149], [937,149],
  [965,149], [992,149], [1020,149], [1051,149], [1099,149], [1148,149], [1179,149], [1210,149], [1238,149], [1269,149],
  [1317,149], [1369,149], [1397,149], [1428,149], [1473,149], [1511,149], [1542,149], [1591,149], [1643,149], [1674,149],
  [1701,149], [1729,149], [1760,149], [1788,149], [1819,149], [1864,149], [1916,149], [1944,149], [1975,149], [2020,149],
  [2061,149], [2092,149], [2120,149], [2148,149], [2196,149], [2244,149], [2279,149], [2307,149], [2338,149], [2383,149],
  [2424,149], [2452,149], [2483,149], [2511,149], [2559,149], [2608,149], [2639,149], [2670,149], [2698,149], [2739,149],
  [2784,149], [2815,149], [2843,149], [2874,149], [2922,149]
];

// Skill level targets that should be circled
const SL_TARGET_POSITIONS = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];

// Get slash direction based on game number
function getSlashDirection(gameNumber: number): string {
  return gameNumber % 2 === 1 ? '/' : '\\';
}

export default function ScoresheetPrint({ match }: ScoresheetPrintProps) {
  if (!match || !match.events || !match.completedAt) {
    return null;
  }

  // Calculate target points for each player
  const player1Target = getPointsToWin(match.player1SkillLevel as any);
  const player2Target = getPointsToWin(match.player2SkillLevel as any);

  // Determine lag winner and other player
  const lagWinner = { name: match.player1Name, skillLevel: match.player1SkillLevel };
  const otherPlayer = { name: match.player2Name, skillLevel: match.player2SkillLevel };

  // Calculate running totals for scoring
  const player1RunningTotals = calculateRunningTotals(match.events, 1);
  const player2RunningTotals = calculateRunningTotals(match.events, 2);

  // Get match date and times
  const matchDate = new Date(match.completedAt);
  const startTime = new Date(match.createdAt || match.completedAt);

  // Get current game number for slash direction
  const currentGameNumber = match.currentGame || 1;

  // Render score marks using exact pixel coordinates
  function renderScoreMarks(runningTotals: number[], targetScore: number, gameNumber: number, player: 'player1' | 'player2') {
    if (player !== 'player1') return []; // Only render for top player for now
    
    const marks: JSX.Element[] = [];
    const totalScore = runningTotals[runningTotals.length - 1] || 0;
    const slashDirection = getSlashDirection(gameNumber);
    
    // Draw slash marks for each scored point
    for (let score = 1; score <= Math.min(totalScore, 75); score++) {
      const coordIndex = score - 1; // Array is 0-indexed, scores are 1-indexed
      if (coordIndex < TOP_PLAYER_COORDINATES.length) {
        const [x, y] = TOP_PLAYER_COORDINATES[coordIndex];
        
        marks.push(
          <div
            key={`mark-${score}-${player}`}
            className="absolute text-center font-bold"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              fontSize: '14px',
              color: 'black',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            {slashDirection}
          </div>
        );
      }
    }
    
    // Circle the target score if it's an SL target position
    if (SL_TARGET_POSITIONS.includes(targetScore)) {
      const coordIndex = targetScore - 1;
      if (coordIndex < TOP_PLAYER_COORDINATES.length) {
        const [x, y] = TOP_PLAYER_COORDINATES[coordIndex];
        
        marks.push(
          <div
            key={`target-circle-${player}`}
            className="absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: '20px',
              height: '20px',
              border: '2px solid black',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          />
        );
      }
    }

    return marks;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white">
      <div className="relative w-full" style={{ aspectRatio: '11/8.5' }}>
        {/* Background scoresheet image */}
        <img 
          src={scoresheetPng} 
          alt="APA Scoresheet"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain' }}
        />
        
        {/* Overlay data using pixel coordinates */}
        <div className="absolute inset-0" style={{ fontSize: '11px', fontFamily: 'Arial' }}>
          {/* Player Names - positioned based on new scoresheet format */}
          <div className="absolute" style={{ top: '97px', left: '166px', fontSize: '12px', fontWeight: 'bold' }}>
            {lagWinner.name}
          </div>
          <div className="absolute" style={{ top: '124px', left: '166px', fontSize: '12px', fontWeight: 'bold' }}>
            {otherPlayer.name}
          </div>
          
          {/* Skill Levels */}
          <div className="absolute text-center" style={{ top: '97px', left: '277px', width: '20px', fontSize: '11px', fontWeight: 'bold' }}>
            {lagWinner.skillLevel}
          </div>
          <div className="absolute text-center" style={{ top: '124px', left: '277px', width: '20px', fontSize: '11px', fontWeight: 'bold' }}>
            {otherPlayer.skillLevel}
          </div>
          
          {/* Score marks with exact pixel positioning */}
          {renderScoreMarks(player1RunningTotals, player1Target, currentGameNumber, 'player1')}
          
          {/* Match information */}
          <div className="absolute" style={{ top: '22px', right: '165px', fontSize: '10px' }}>
            {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="absolute" style={{ top: '22px', right: '50px', fontSize: '10px' }}>
            {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          
          {/* Defensive shots count */}
          <div className="absolute text-center font-bold" style={{ top: '97px', right: '355px', width: '30px', fontSize: '11px' }}>
            {match.player1SafetiesUsed || 0}
          </div>
          <div className="absolute text-center font-bold" style={{ top: '124px', right: '355px', width: '30px', fontSize: '11px' }}>
            {match.player2SafetiesUsed || 0}
          </div>
          
          {/* Final scores */}
          <div className="absolute text-center font-bold" style={{ top: '97px', right: '245px', width: '30px', fontSize: '11px' }}>
            {match.player1Score}
          </div>
          <div className="absolute text-center font-bold" style={{ top: '124px', right: '245px', width: '30px', fontSize: '11px' }}>
            {match.player2Score}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate running totals
function calculateRunningTotals(events: MatchEvent[], playerId: 1 | 2): number[] {
  const totals: number[] = [];
  let runningTotal = 0;
  
  events.forEach(event => {
    if (event.type === 'ball_scored' && event.player === playerId) {
      if (event.ballNumber === 9) {
        runningTotal += 2; // 9-ball is worth 2 points
      } else {
        runningTotal += 1; // All other balls worth 1 point
      }
      totals.push(runningTotal);
    }
  });
  
  return totals;
}