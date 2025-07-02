import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/9B Blank-0_1751450594313.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

// Your exact pixel coordinates for player 1 (lag winner) scoring grid
// Tally 1 goes at coordinate 0, tally 2 at coordinate 1, etc.
// X coordinates shifted 3px to the right
const PLAYER1_COORDINATES = [
  [255,149], [283,149], [310,149], [341,149], [373,149], [411,149], [435,149], [466,149], [497,149], [542,149],
  [591,149], [618,149], [649,149], [698,149], [753,149], [781,149], [812,149], [840,149], [885,149], [940,149],
  [968,149], [995,149], [1023,149], [1054,149], [1102,149], [1151,149], [1182,149], [1213,149], [1241,149], [1272,149],
  [1320,149], [1372,149], [1400,149], [1431,149], [1476,149], [1514,149], [1545,149], [1594,149], [1646,149], [1677,149],
  [1704,149], [1732,149], [1763,149], [1791,149], [1822,149], [1867,149], [1919,149], [1947,149], [1978,149], [2023,149],
  [2064,149], [2095,149], [2123,149], [2151,149], [2199,149], [2247,149], [2282,149], [2310,149], [2341,149], [2386,149],
  [2427,149], [2455,149], [2486,149], [2514,149], [2562,149], [2611,149], [2642,149], [2673,149], [2701,149], [2742,149],
  [2787,149], [2818,149], [2846,149], [2877,149], [2925,149]
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
    
    // Track game numbers by counting 9-ball scoring events
    let currentGame = 1;
    let scorePosition = 0;
    let lastGameEndPosition = 0;
    
    // Draw slash marks for each scored point using your provided coordinates
    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 1) {
        scorePosition++;
        const slashDirection = getSlashDirection(currentGame);
        const coordIndex = scorePosition - 1;
        
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
                color: 'blue',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              {slashDirection}
            </div>
          );
        }
        
        // If this was a 9-ball, next ball scored will be in the next game
        if (event.ballNumber === 9) {
          // Add vertical line after this game ends
          if (coordIndex < PLAYER1_COORDINATES.length) {
            const [x, y] = PLAYER1_COORDINATES[coordIndex];
            marks.push(
              <div
                key={`game-separator-${currentGame}`}
                className="absolute font-bold"
                style={{
                  left: `${x + 25}px`,
                  top: `${y}px`,
                  fontSize: '44.1px',
                  color: 'black',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                |
              </div>
            );
          }
          currentGame++;
        }
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
              border: '6px solid blue',
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
    <div className="scoresheet-container w-full max-w-4xl mx-auto bg-white" style={{ 
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact'
    }}>
      <div className="scoresheet-content relative" style={{ 
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