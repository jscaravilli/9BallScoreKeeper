import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/9B Blank-0_1751447644974.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

export default function ScoresheetPrint({ match }: ScoresheetPrintProps) {
  // Ensure we have required data
  if (!match || !match.events || !match.completedAt) {
    return null;
  }

  // Calculate target points for each player
  const player1Target = getPointsToWin(match.player1SkillLevel as any);
  const player2Target = getPointsToWin(match.player2SkillLevel as any);
  
  // Determine lag winner (player 1 is always lag winner in our system)
  const lagWinner = { name: match.player1Name, skillLevel: match.player1SkillLevel, target: player1Target, playerNumber: 1 };
  const otherPlayer = { name: match.player2Name, skillLevel: match.player2SkillLevel, target: player2Target, playerNumber: 2 };
  
  // Calculate total safeties from events
  const player1Safeties = match.events.filter(e => e.type === 'safety_taken' && e.player === 1).length;
  const player2Safeties = match.events.filter(e => e.type === 'safety_taken' && e.player === 2).length;
  
  // Calculate running totals from events
  const player1RunningTotals = calculateRunningTotals(match.events, 1);
  const player2RunningTotals = calculateRunningTotals(match.events, 2);
  
  // Match date formatting
  const matchDate = new Date(match.completedAt);
  const startTime = new Date(match.createdAt || match.completedAt);
  
  return (
    <div className="print:block hidden" id="scoresheet-print">
      <div className="relative bg-white" style={{ width: '11in', height: '8.5in', pageBreakAfter: 'always' }}>
        {/* Background scoresheet image */}
        <img 
          src={scoresheetPng} 
          alt="APA Scoresheet"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain' }}
        />
        
        {/* Overlay data on specific positions */}
        <div className="absolute inset-0" style={{ fontSize: '11px', fontFamily: 'Arial' }}>
          {/* Match Times - positioned at top right */}
          <div className="absolute" style={{ top: '0.45in', right: '1.5in', fontSize: '10px' }}>
            {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="absolute" style={{ top: '0.45in', right: '0.4in', fontSize: '10px' }}>
            {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          
          {/* Player 1 Name - Top player name field in first rectangle */}
          <div className="absolute" style={{ top: '1.42in', left: '1.3in', fontSize: '11px', fontWeight: 'bold' }}>
            {lagWinner.name}
          </div>
          
          {/* Player 2 Name - Second player name field in first rectangle */}
          <div className="absolute" style={{ top: '1.77in', left: '1.3in', fontSize: '11px', fontWeight: 'bold' }}>
            {otherPlayer.name}
          </div>
          
          {/* Player 1 Skill Level - in SL box */}
          <div className="absolute text-center" style={{ top: '1.42in', left: '6.45in', width: '0.25in', fontSize: '10px', fontWeight: 'bold' }}>
            {lagWinner.skillLevel}
          </div>
          
          {/* Player 2 Skill Level - in SL box */}
          <div className="absolute text-center" style={{ top: '1.77in', left: '6.45in', width: '0.25in', fontSize: '10px', fontWeight: 'bold' }}>
            {otherPlayer.skillLevel}
          </div>
          
          {/* Combined Score marks in top grid for both players */}
          {renderScoreMarks(player1RunningTotals, player1Target, 105, 'player1')}
          {renderScoreMarks(player2RunningTotals, player2Target, 105, 'player2')}
          
          {/* Player 1 Defensive Shots - in yellow box */}
          <div className="absolute text-center font-bold" style={{ top: '1.42in', right: '2.55in', width: '0.5in', fontSize: '11px' }}>
            {player1Safeties}
          </div>
          
          {/* Player 2 Defensive Shots - in yellow box */}
          <div className="absolute text-center font-bold" style={{ top: '1.77in', right: '2.55in', width: '0.5in', fontSize: '11px' }}>
            {player2Safeties}
          </div>
          
          {/* Player 1 Total Points */}
          <div className="absolute text-center font-bold" style={{ top: '1.42in', right: '1.8in', width: '0.4in', fontSize: '11px' }}>
            {match.player1Score}
          </div>
          
          {/* Player 2 Total Points */}
          <div className="absolute text-center font-bold" style={{ top: '1.77in', right: '1.8in', width: '0.4in', fontSize: '11px' }}>
            {match.player2Score}
          </div>
          
          {/* Match Points Earned - Player 1 */}
          <div className="absolute text-center" style={{ top: '1.42in', right: '1.15in', width: '0.4in', fontSize: '11px' }}>
            {match.winnerId === 1 ? '2' : '0'}
          </div>
          
          {/* Match Points Earned - Player 2 */}
          <div className="absolute text-center" style={{ top: '1.77in', right: '1.15in', width: '0.4in', fontSize: '11px' }}>
            {match.winnerId === 2 ? '2' : '0'}
          </div>
          
          {/* Running Total - Player 1 */}
          <div className="absolute text-center" style={{ top: '1.42in', right: '0.5in', width: '0.4in', fontSize: '11px' }}>
            {match.winnerId === 1 ? '2' : '0'}
          </div>
          
          {/* Running Total - Player 2 */}
          <div className="absolute text-center" style={{ top: '1.77in', right: '0.5in', width: '0.4in', fontSize: '11px' }}>
            {match.winnerId === 2 ? '2' : '0'}
          </div>
          
          {/* Table checkbox - 4x8 Regulation */}
          <div className="absolute" style={{ bottom: '0.58in', left: '7.2in', fontSize: '16px', fontWeight: 'bold' }}>
            ✓
          </div>
        </div>
      </div>
    </div>
  );
}

// Calculate running totals from match events for score marking
function calculateRunningTotals(events: MatchEvent[], playerId: 1 | 2): number[] {
  const totals: number[] = [];
  let runningTotal = 0;
  
  events.forEach(event => {
    if (event.type === 'ball_scored' && event.player === playerId && event.pointsAwarded) {
      runningTotal += event.pointsAwarded;
      totals.push(runningTotal);
    }
  });
  
  return totals;
}

// Render score marks on the grid
function renderScoreMarks(runningTotals: number[], targetScore: number, topPosition: number, player?: 'player1' | 'player2') {
  const marks: JSX.Element[] = [];
  
  // Precise positioning based on the actual scoresheet
  // Numbers are at specific positions, dots are between them
  const baseX = 3.28; // Starting X position in inches
  const cellSpacing = 0.227; // Spacing between positions
  
  // Map scores to their grid column positions
  // Including both number positions and dot positions between them
  const getPositionForScore = (score: number): number => {
    // Define the column positions for each score value
    const positions: { [key: number]: number } = {
      1: 0,    // Column 0
      2: 0.5,  // Between 1 and 5 (dot)
      3: 0.5,
      4: 0.5,
      5: 1,    // Column 1
      6: 1.5,  // Between 5 and 10 (dot)
      7: 1.5,
      8: 1.5,
      9: 1.5,
      10: 2,   // Column 2
      11: 2.5, // Between 10 and 14 (dot)
      12: 2.5,
      13: 2.5,
      14: 3,   // Column 3
      15: 3.5, // Between 14 and 19 (dot)
      16: 3.5,
      17: 3.5,
      18: 3.5,
      19: 4,   // Column 4
      20: 4.5, // Between 19 and 25 (dot)
      21: 4.5,
      22: 4.5,
      23: 4.5,
      24: 4.5,
      25: 5,   // Column 5
      26: 5.5, // Between 25 and 31 (dot)
      27: 5.5,
      28: 5.5,
      29: 5.5,
      30: 5.5,
      31: 6,   // Column 6
      32: 6.5, // Between 31 and 35 (dot)
      33: 6.5,
      34: 6.5,
      35: 7,   // Column 7
      36: 7.5, // Between 35 and 38 (dot)
      37: 7.5,
      38: 8,   // Column 8
      39: 8.5, // Between 38 and 46 (dot)
      40: 8.5,
      41: 8.5,
      42: 8.5,
      43: 8.5,
      44: 8.5,
      45: 8.5,
      46: 9,   // Column 9
      47: 9.5, // Between 46 and 50 (dot)
      48: 9.5,
      49: 9.5,
      50: 10,  // Column 10
      51: 10.5, // Between 50 and 55 (dot)
      52: 10.5,
      53: 10.5,
      54: 10.5,
      55: 11,  // Column 11
      56: 11.5, // Between 55 and 60 (dot)
      57: 11.5,
      58: 11.5,
      59: 11.5,
      60: 12,  // Column 12
      61: 12.5, // Between 60 and 65 (dot)
      62: 12.5,
      63: 12.5,
      64: 12.5,
      65: 13,  // Column 13
      66: 13.5, // Between 65 and 70 (dot)
      67: 13.5,
      68: 13.5,
      69: 13.5,
      70: 14,  // Column 14
      71: 14.5, // Between 70 and 75 (dot)
      72: 14.5,
      73: 14.5,
      74: 14.5,
      75: 15   // Column 15
    };
    
    return positions[score] || 0;
  };
  
  // Numbers that should get circles (not dots)
  const circleNumbers = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];

  // Draw running tally marks for each score point
  let currentScore = 0;
  for (let i = 1; i <= Math.min(runningTotals[runningTotals.length - 1] || 0, 75); i++) {
    const position = getPositionForScore(i);
    const xPosition = baseX + (position * cellSpacing);
    
    marks.push(
      <div
        key={`mark-${i}-${player || 'default'}`}
        className="absolute text-center"
        style={{
          left: `${xPosition}in`,
          top: `${topPosition}px`,
          fontSize: '18px',
          fontWeight: 'bold',
          width: '20px',
          height: '20px',
          lineHeight: '20px'
        }}
      >
        /
      </div>
    );
  }
  
  // Circle the target score (only if it's one of the number positions)
  if (circleNumbers.includes(targetScore)) {
    const position = getPositionForScore(targetScore);
    const xPosition = baseX + (position * cellSpacing);
    marks.push(
      <div
        key={`target-circle-${player || 'default'}`}
        className="absolute"
        style={{
          left: `${xPosition - 0.12}in`,
          top: `${topPosition - 6}px`,
          width: '26px',
          height: '26px',
          border: '2px solid black',
          borderRadius: '50%',
          backgroundColor: 'transparent'
        }}
      />
    );
  }
  
  return marks;
}