import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPdf from "@assets/scoresheet_page_1.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

export default function ScoresheetPrint({ match }: ScoresheetPrintProps) {
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
      <div className="relative bg-white" style={{ width: '8.5in', height: '11in', pageBreakAfter: 'always' }}>
        {/* Background scoresheet image */}
        <img 
          src={scoresheetPdf} 
          alt="APA Scoresheet"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain' }}
        />
        
        {/* Overlay data on specific positions */}
        <div className="absolute inset-0" style={{ fontSize: '11px', fontFamily: 'Arial' }}>
          {/* Match Times - positioned at top right */}
          <div className="absolute" style={{ top: '33px', right: '135px', fontSize: '10px' }}>
            {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="absolute" style={{ top: '33px', right: '35px', fontSize: '10px' }}>
            {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          
          {/* Player 1 (Top row) */}
          <div className="absolute" style={{ top: '104px', left: '125px', fontSize: '12px', fontWeight: 'bold' }}>
            {lagWinner.name}
          </div>
          <div className="absolute" style={{ top: '126px', left: '125px', fontSize: '12px', fontWeight: 'bold' }}>
            {lagWinner.name}
          </div>
          
          {/* Player 1 Skill Level */}
          <div className="absolute" style={{ top: '112px', left: '290px', fontSize: '10px' }}>
            SL {lagWinner.skillLevel}
          </div>
          
          {/* Player 1 Score marks in grid */}
          {renderScoreMarks(player1RunningTotals, player1Target, 105)}
          
          {/* Player 1 Defensive Shots */}
          <div className="absolute text-center font-bold" style={{ top: '110px', right: '195px', width: '40px', fontSize: '14px' }}>
            {player1Safeties}
          </div>
          
          {/* Player 1 Total Points */}
          <div className="absolute text-center font-bold" style={{ top: '110px', right: '125px', width: '40px', fontSize: '14px' }}>
            {match.player1Score}
          </div>
          
          {/* Player 2 (Bottom row) */}
          <div className="absolute" style={{ top: '208px', left: '125px', fontSize: '12px', fontWeight: 'bold' }}>
            {otherPlayer.name}
          </div>
          <div className="absolute" style={{ top: '230px', left: '125px', fontSize: '12px', fontWeight: 'bold' }}>
            {otherPlayer.name}
          </div>
          
          {/* Player 2 Skill Level */}
          <div className="absolute" style={{ top: '216px', left: '290px', fontSize: '10px' }}>
            SL {otherPlayer.skillLevel}
          </div>
          
          {/* Player 2 Score marks in grid */}
          {renderScoreMarks(player2RunningTotals, player2Target, 209)}
          
          {/* Player 2 Defensive Shots */}
          <div className="absolute text-center font-bold" style={{ top: '214px', right: '195px', width: '40px', fontSize: '14px' }}>
            {player2Safeties}
          </div>
          
          {/* Player 2 Total Points */}
          <div className="absolute text-center font-bold" style={{ top: '214px', right: '125px', width: '40px', fontSize: '14px' }}>
            {match.player2Score}
          </div>
          
          {/* Table checkbox - 4x8 Regulation */}
          <div className="absolute" style={{ bottom: '52px', left: '580px' }}>
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
  const scorePoints = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];
  const marks: JSX.Element[] = [];
  
  // Map score points to their grid positions (approximately 25px apart)
  const gridStartX = 315;
  const gridSpacing = 25.5;
  
  // Track which scores have been marked
  const markedScores = new Set<number>();
  
  runningTotals.forEach((total, index) => {
    // Find the highest score point that doesn't exceed the total
    let scoreToMark = 0;
    for (const point of scorePoints) {
      if (point <= total && point <= targetScore && !markedScores.has(point)) {
        scoreToMark = point;
      }
    }
    
    if (scoreToMark > 0 && !markedScores.has(scoreToMark)) {
      markedScores.add(scoreToMark);
      const scoreIndex = scorePoints.indexOf(scoreToMark);
      if (scoreIndex !== -1) {
        // Alternate between forward slash and backslash
        const markType = index % 2 === 0 ? '/' : '\\';
        const xPosition = gridStartX + (scoreIndex * gridSpacing);
        
        marks.push(
          <div
            key={`mark-${scoreToMark}-${index}`}
            className="absolute text-center"
            style={{
              left: `${xPosition}px`,
              top: `${topPosition}px`,
              fontSize: '20px',
              fontWeight: 'bold',
              width: '25px',
              height: '40px',
              lineHeight: '40px'
            }}
          >
            {markType}
          </div>
        );
      }
    }
  });
  
  // Circle the target score
  const targetIndex = scorePoints.indexOf(targetScore);
  if (targetIndex !== -1) {
    const xPosition = gridStartX + (targetIndex * gridSpacing) - 2;
    marks.push(
      <div
        key="target-circle"
        className="absolute"
        style={{
          left: `${xPosition}px`,
          top: `${topPosition - 8}px`,
          width: '28px',
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