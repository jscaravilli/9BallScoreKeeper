import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/apa_9ballscoresheet-1_1751404203390.png";

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
          {renderScoreMarks(player1RunningTotals, player1Target, 107, 'player1')}
          {renderScoreMarks(player2RunningTotals, player2Target, 127, 'player2')}
          
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
  
  // Grid starts at approximately 3.3 inches from left and each cell is about 0.23 inches wide
  // Fine-tuned to align with dots and numbers on the new scoresheet
  const gridStartX = 3.3; // inches
  const gridCellWidth = 0.23; // inches
  
  // Score positions on the grid (matching the actual scoresheet numbers)
  const scorePositions: { [key: number]: number } = {
    1: 0, 5: 1, 10: 2, 14: 3, 19: 4, 25: 5, 31: 6, 35: 7, 38: 8, 46: 9, 50: 10, 55: 11, 60: 12, 65: 13, 70: 14, 75: 15
  };

  // Draw running tally marks
  let runningScore = 0;
  runningTotals.forEach((total, index) => {
    // For each running total, find which score position to mark
    for (const [scoreValue, gridPosition] of Object.entries(scorePositions)) {
      const score = parseInt(scoreValue);
      if (score <= total && score > runningScore) {
        const xPosition = gridStartX + (gridPosition * gridCellWidth);
        
        marks.push(
          <div
            key={`mark-${score}-${index}-${player || 'default'}`}
            className="absolute text-center"
            style={{
              left: `${xPosition}in`,
              top: `${topPosition}px`,
              fontSize: '16px',
              fontWeight: 'bold',
              width: `${gridCellWidth}in`,
              height: '18px',
              lineHeight: '18px',
              transform: 'translateX(-50%)',
              marginLeft: `${gridCellWidth / 2}in`
            }}
          >
            /
          </div>
        );
      }
    }
    runningScore = total;
  });
  
  // Circle the target score
  if (scorePositions[targetScore] !== undefined) {
    const gridPosition = scorePositions[targetScore];
    const xPosition = gridStartX + (gridPosition * gridCellWidth);
    marks.push(
      <div
        key={`target-circle-${player || 'default'}`}
        className="absolute"
        style={{
          left: `${xPosition}in`,
          top: `${topPosition - 4}px`,
          width: `${gridCellWidth}in`,
          height: '26px',
          border: '2px solid black',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          transform: 'translateX(-50%)',
          marginLeft: `${gridCellWidth / 2}in`
        }}
      />
    );
  }
  
  return marks;
}