import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/apa_scoresheet.png";

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
          
          {/* Player 1 (Top row) - Name in both Team Player boxes */}
          <div className="absolute" style={{ top: '1.35in', left: '1.45in', fontSize: '12px', fontWeight: 'bold' }}>
            {lagWinner.name}
          </div>
          <div className="absolute" style={{ top: '1.65in', left: '1.45in', fontSize: '12px', fontWeight: 'bold' }}>
            {lagWinner.name}
          </div>
          
          {/* Player 1 Skill Level - in the SL box */}
          <div className="absolute text-center" style={{ top: '1.48in', left: '3.8in', width: '0.3in', fontSize: '12px', fontWeight: 'bold' }}>
            {lagWinner.skillLevel}
          </div>
          
          {/* Player 1 Score marks in grid */}
          {renderScoreMarks(player1RunningTotals, player1Target, 104)}
          
          {/* Player 1 Defensive Shots */}
          <div className="absolute text-center font-bold" style={{ top: '1.45in', right: '2.15in', width: '0.5in', fontSize: '14px' }}>
            {player1Safeties}
          </div>
          
          {/* Player 1 Total Points */}
          <div className="absolute text-center font-bold" style={{ top: '1.45in', right: '1.45in', width: '0.5in', fontSize: '14px' }}>
            {match.player1Score}
          </div>
          
          {/* Player 2 (Bottom row) - Name in both Team Player boxes */}
          <div className="absolute" style={{ top: '2.72in', left: '1.45in', fontSize: '12px', fontWeight: 'bold' }}>
            {otherPlayer.name}
          </div>
          <div className="absolute" style={{ top: '3.02in', left: '1.45in', fontSize: '12px', fontWeight: 'bold' }}>
            {otherPlayer.name}
          </div>
          
          {/* Player 2 Skill Level - in the SL box */}
          <div className="absolute text-center" style={{ top: '2.85in', left: '3.8in', width: '0.3in', fontSize: '12px', fontWeight: 'bold' }}>
            {otherPlayer.skillLevel}
          </div>
          
          {/* Player 2 Score marks in grid */}
          {renderScoreMarks(player2RunningTotals, player2Target, 208)}
          
          {/* Player 2 Defensive Shots */}
          <div className="absolute text-center font-bold" style={{ top: '2.82in', right: '2.15in', width: '0.5in', fontSize: '14px' }}>
            {player2Safeties}
          </div>
          
          {/* Player 2 Total Points */}
          <div className="absolute text-center font-bold" style={{ top: '2.82in', right: '1.45in', width: '0.5in', fontSize: '14px' }}>
            {match.player2Score}
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
function renderScoreMarks(runningTotals: number[], targetScore: number, topPosition: number) {
  const marks: JSX.Element[] = [];
  
  // Grid starts at approximately 4.15 inches from left and each cell is about 0.25 inches wide
  // Adjusted to match the actual APA scoresheet grid
  const gridStartX = 4.15; // inches
  const gridCellWidth = 0.25; // inches
  
  // Draw running tally marks for each score
  let runningScore = 0;
  runningTotals.forEach((total, index) => {
    const pointsScored = total - runningScore;
    runningScore = total;
    
    // For each point in the running total, mark a cell
    for (let i = runningScore - pointsScored + 1; i <= runningScore && i <= 75; i++) {
      // Calculate position - cells are numbered 1-75
      const cellIndex = i - 1;
      const xPosition = gridStartX + (cellIndex * gridCellWidth);
      
      marks.push(
        <div
          key={`mark-${i}-${index}`}
          className="absolute text-center"
          style={{
            left: `${xPosition}in`,
            top: `${topPosition}px`,
            fontSize: '16px',
            fontWeight: 'bold',
            width: `${gridCellWidth}in`,
            height: '22px',
            lineHeight: '22px'
          }}
        >
          /
        </div>
      );
    }
  });
  
  // Circle the target score
  if (targetScore <= 75) {
    const targetCellIndex = targetScore - 1;
    const xPosition = gridStartX + (targetCellIndex * gridCellWidth);
    marks.push(
      <div
        key="target-circle"
        className="absolute"
        style={{
          left: `${xPosition - 0.02}in`,
          top: `${topPosition - 4}px`,
          width: `${gridCellWidth + 0.04}in`,
          height: '28px',
          border: '2px solid black',
          borderRadius: '50%',
          backgroundColor: 'transparent'
        }}
      />
    );
  }
  
  return marks;
}