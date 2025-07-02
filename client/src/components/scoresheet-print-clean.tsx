import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/9B Blank-0_1751450594313.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

// Corrected coordinates for player 1 (lag winner) scoring grid - top row
// Based on the actual scoresheet layout, positioning in small score boxes
const PLAYER1_COORDINATES = [
  // Row 1: 1 • • • 5 • • • • 10 • • • 14 • • • • 19 • • • • 25 • • • • 31 • • • 35 • 38 • • • • • 46 • • 50 • • • 55 • • • 60 • • • 65 • • • 70 • • • 75
  [76,86], [88,86], [100,86], [112,86], [124,86], [136,86], [148,86], [160,86], [172,86], [184,86],   // 1-10
  [196,86], [208,86], [220,86], [232,86], [244,86], [256,86], [268,86], [280,86], [292,86], [304,86], // 11-20
  [316,86], [328,86], [340,86], [352,86], [364,86], [376,86], [388,86], [400,86], [412,86], [424,86], // 21-30
  [436,86], [448,86], [460,86], [472,86], [484,86], [496,86], [508,86], [520,86], [532,86], [544,86], // 31-40
  [556,86], [568,86], [580,86], [592,86], [604,86], [616,86], [628,86], [640,86], [652,86], [664,86], // 41-50
  [676,86], [688,86], [700,86], [712,86], [724,86], [736,86], [748,86], [760,86], [772,86], [784,86], // 51-60
  [796,86], [808,86], [820,86], [832,86], [844,86], [856,86], [868,86], [880,86], [892,86], [904,86], // 61-70
  [916,86], [928,86], [940,86], [952,86], [964,86]  // 71-75
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
    const totalScore = player1RunningTotals[player1RunningTotals.length - 1] || 0;
    const slashDirection = getSlashDirection(currentGameNumber);
    
    // Draw slash marks for each scored point using your provided coordinates
    for (let score = 1; score <= Math.min(totalScore, 75); score++) {
      const coordIndex = score - 1; // Array is 0-indexed, scores are 1-indexed
      if (coordIndex < PLAYER1_COORDINATES.length) {
        const [x, y] = PLAYER1_COORDINATES[coordIndex];
        
        marks.push(
          <div
            key={`p1-mark-${score}`}
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
        
        {/* Overlay data using only your provided coordinates */}
        <div className="absolute inset-0" style={{ fontSize: '11px', fontFamily: 'Arial' }}>
          {/* Player 1 (lag winner) name */}
          <div className="absolute" style={{ top: '97px', left: '166px', fontSize: '12px', fontWeight: 'bold' }}>
            {match.player1Name}
          </div>
          
          {/* Player 2 name */}
          <div className="absolute" style={{ top: '124px', left: '166px', fontSize: '12px', fontWeight: 'bold' }}>
            {match.player2Name}
          </div>
          
          {/* Skill Levels */}
          <div className="absolute text-center" style={{ top: '97px', left: '277px', width: '20px', fontSize: '11px', fontWeight: 'bold' }}>
            {match.player1SkillLevel}
          </div>
          <div className="absolute text-center" style={{ top: '124px', left: '277px', width: '20px', fontSize: '11px', fontWeight: 'bold' }}>
            {match.player2SkillLevel}
          </div>
          
          {/* Player 1 score marks using your exact pixel coordinates */}
          {renderPlayer1Marks()}
          
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