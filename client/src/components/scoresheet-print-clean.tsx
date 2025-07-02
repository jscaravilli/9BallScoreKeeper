import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/9B Blank-0_1751450594313.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

// Your exact pixel coordinates for player 1 (lag winner) scoring grid
// Tally 1 goes at coordinate 0, tally 2 at coordinate 1, etc.
const PLAYER1_COORDINATES = [
  [252,149], [280,149], [307,149], [338,149], [370,149], [408,149], [432,149], [463,149], [494,149], [539,149],
  [588,149], [615,149], [646,149], [695,149], [750,149], [778,149], [809,149], [837,149], [882,149], [937,149],
  [965,149], [992,149], [1020,149], [1051,149], [1099,149], [1148,149], [1179,149], [1210,149], [1238,149], [1269,149],
  [1317,149], [1369,149], [1397,149], [1428,149], [1473,149], [1511,149], [1542,149], [1591,149], [1643,149], [1674,149],
  [1701,149], [1729,149], [1760,149], [1788,149], [1819,149], [1864,149], [1916,149], [1944,149], [1975,149], [2020,149],
  [2061,149], [2092,149], [2120,149], [2148,149], [2196,149], [2244,149], [2279,149], [2307,149], [2338,149], [2383,149],
  [2424,149], [2452,149], [2483,149], [2511,149], [2559,149], [2608,149], [2639,149], [2670,149], [2698,149], [2739,149],
  [2784,149], [2815,149], [2843,149], [2874,149], [2922,149]
];

// Skill level target positions that should be circled
const SL_TARGET_POSITIONS = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];

// Get slash direction based on game number
function getSlashDirection(gameNumber: number): string {
  return gameNumber % 2 === 1 ? '/' : '\\';
}

export default function ScoresheetPrint({ match }: ScoresheetPrintProps) {
  if (!match || !match.events || !match.completedAt) {
    return null;
  }

  // Calculate target points for player 1 (lag winner)
  const player1Target = getPointsToWin(match.player1SkillLevel as any);

  // Calculate running totals for player 1
  const player1RunningTotals = calculateRunningTotals(match.events, 1);

  // Get match date and times
  const matchDate = new Date(match.completedAt);
  const startTime = new Date(match.createdAt || match.completedAt);

  // Get current game number for slash direction
  const currentGameNumber = match.currentGame || 1;

  // Render player 1 score marks using your exact coordinates
  function renderPlayer1Marks() {
    const marks: JSX.Element[] = [];
    
    // Track which game each scored ball belongs to
    let currentGame = 1;
    let ballsInCurrentGame = 0;
    
    // Draw slash marks for each scored point using your provided coordinates
    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 1) {
        ballsInCurrentGame++;
        const slashDirection = getSlashDirection(currentGame);
        const coordIndex = ballsInCurrentGame - 1;
        
        if (coordIndex < PLAYER1_COORDINATES.length) {
          const [x, y] = PLAYER1_COORDINATES[coordIndex];
          
          marks.push(
            <div
              key={`p1-mark-${eventIndex}`}
              className="absolute text-center font-bold"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                fontSize: '44.1px',
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
      
      // Check if this event signals end of game (new game started)
      if (event.type === 'match_completed' || (event.details && event.details.includes('Game'))) {
        currentGame++;
      }
    });
    
    // Circle the target score if it's an SL target position
    if (SL_TARGET_POSITIONS.includes(player1Target)) {
      const coordIndex = player1Target - 1;
      if (coordIndex < PLAYER1_COORDINATES.length) {
        const [x, y] = PLAYER1_COORDINATES[coordIndex];
        
        marks.push(
          <div
            key={`p1-target-circle`}
            className="absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: '63px',
              height: '63px',
              border: '6px solid black',
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
    <div className="w-full max-w-4xl mx-auto bg-white" style={{ 
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact'
    }}>
      <div className="relative" style={{ 
        width: '3300px', 
        height: '2550px',
        transform: 'scale(0.62)',
        transformOrigin: 'top left'
      }}>
        {/* Background scoresheet image - actual PNG dimensions 3300x2550 at 300 DPI */}
        <img 
          src={scoresheetPng} 
          alt="APA Scoresheet"
          className="absolute inset-0"
          style={{ 
            width: '3300px', 
            height: '2550px',
            objectFit: 'fill'
          }}
        />
        
        {/* Only tally marks and circles - all other markings removed */}
        <div className="absolute inset-0">
          {/* Player 1 score marks using your exact pixel coordinates */}
          {renderPlayer1Marks()}
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