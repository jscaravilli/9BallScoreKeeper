import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/apa_9ballscoresheet-1_1751404203390.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

// Focused pixel mapping for APA scoresheet scoring area based on user markup
const SCORESHEET_POSITIONS = {
  // Score grid positioning from blue dot analysis
  scoreGrid: {
    // Player row positions (top = lag winner)
    player1Row: 35, // Top row (lag winner)
    player2Row: 80, // Bottom row
    
    // Precise X positions for each score (extrapolated from blue dots)
    positions: {
      // Number positions (get circles)
      1: 85, 5: 130, 10: 176, 14: 222, 19: 268, 25: 314,
      31: 360, 35: 406, 38: 452, 46: 498, 50: 544, 55: 590,
      60: 636, 65: 682, 70: 728, 75: 774,
      
      // Dot positions (get slash marks) - between number positions
      2: 107, 3: 107, 4: 107,
      6: 153, 7: 153, 8: 153, 9: 153,
      11: 199, 12: 199, 13: 199,
      15: 245, 16: 245, 17: 245, 18: 245,
      20: 291, 21: 291, 22: 291, 23: 291, 24: 291,
      26: 337, 27: 337, 28: 337, 29: 337, 30: 337,
      32: 383, 33: 383, 34: 383,
      36: 429, 37: 429,
      39: 475, 40: 475, 41: 475, 42: 475, 43: 475, 44: 475, 45: 475,
      47: 521, 48: 521, 49: 521,
      51: 567, 52: 567, 53: 567, 54: 567,
      56: 613, 57: 613, 58: 613, 59: 613,
      61: 659, 62: 659, 63: 659, 64: 659,
      66: 705, 67: 705, 68: 705, 69: 705,
      71: 751, 72: 751, 73: 751, 74: 751
    } as { [key: number]: number }
  },
  
  // Right side columns from blue dot analysis
  rightColumns: {
    defensiveShots: 820,
    totalPoints: 860,
    matchPoints: 900,
    runningTotal: 940
  }
};

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
          {/* Match Times - using mapped positions */}
          <div className="absolute" style={{ 
            top: `${SCORESHEET_POSITIONS.matchInfo.startTime.top}px`, 
            right: `${SCORESHEET_POSITIONS.matchInfo.startTime.right}px`, 
            fontSize: '10px' 
          }}>
            {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="absolute" style={{ 
            top: `${SCORESHEET_POSITIONS.matchInfo.endTime.top}px`, 
            right: `${SCORESHEET_POSITIONS.matchInfo.endTime.right}px`, 
            fontSize: '10px' 
          }}>
            {matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          
          {/* Player 1 Name - using mapped position */}
          <div className="absolute" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player1.name.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player1.name.left}px`, 
            fontSize: '11px', 
            fontWeight: 'bold' 
          }}>
            {lagWinner.name}
          </div>
          
          {/* Player 2 Name - using mapped position */}
          <div className="absolute" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player2.name.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player2.name.left}px`, 
            fontSize: '11px', 
            fontWeight: 'bold' 
          }}>
            {otherPlayer.name}
          </div>
          
          {/* Player 1 Skill Level - using mapped position */}
          <div className="absolute text-center" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player1.skillLevel.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player1.skillLevel.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player1.skillLevel.width}px`, 
            fontSize: '10px', 
            fontWeight: 'bold' 
          }}>
            {lagWinner.skillLevel}
          </div>
          
          {/* Player 2 Skill Level - using mapped position */}
          <div className="absolute text-center" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player2.skillLevel.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player2.skillLevel.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player2.skillLevel.width}px`, 
            fontSize: '10px', 
            fontWeight: 'bold' 
          }}>
            {otherPlayer.skillLevel}
          </div>
          
          {/* Combined Score marks in top grid for both players */}
          {renderScoreMarks(player1RunningTotals, player1Target, 'player1')}
          {renderScoreMarks(player2RunningTotals, player2Target, 'player2')}
          
          {/* Player 1 Defensive Shots - using mapped position */}
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player1.defensiveShots.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player1.defensiveShots.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player1.defensiveShots.width}px`, 
            fontSize: '11px' 
          }}>
            {player1Safeties}
          </div>
          
          {/* Player 2 Defensive Shots - using mapped position */}
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player2.defensiveShots.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player2.defensiveShots.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player2.defensiveShots.width}px`, 
            fontSize: '11px' 
          }}>
            {player2Safeties}
          </div>
          
          {/* Player 1 Total Points - using mapped position */}
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player1.totalPoints.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player1.totalPoints.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player1.totalPoints.width}px`, 
            fontSize: '11px' 
          }}>
            {match.player1Score}
          </div>
          
          {/* Player 2 Total Points - using mapped position */}
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player2.totalPoints.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player2.totalPoints.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player2.totalPoints.width}px`, 
            fontSize: '11px' 
          }}>
            {match.player2Score}
          </div>
          
          {/* Match Points Earned - Player 1 - using mapped position */}
          <div className="absolute text-center" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player1.matchPointsEarned.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player1.matchPointsEarned.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player1.matchPointsEarned.width}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 1 ? '2' : '0'}
          </div>
          
          {/* Match Points Earned - Player 2 - using mapped position */}
          <div className="absolute text-center" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player2.matchPointsEarned.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player2.matchPointsEarned.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player2.matchPointsEarned.width}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 2 ? '2' : '0'}
          </div>
          
          {/* Running Total - Player 1 - using mapped position */}
          <div className="absolute text-center" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player1.runningTotal.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player1.runningTotal.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player1.runningTotal.width}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 1 ? '2' : '0'}
          </div>
          
          {/* Running Total - Player 2 - using mapped position */}
          <div className="absolute text-center" style={{ 
            top: `${SCORESHEET_POSITIONS.topRectangle.player2.runningTotal.top}px`, 
            left: `${SCORESHEET_POSITIONS.topRectangle.player2.runningTotal.left}px`, 
            width: `${SCORESHEET_POSITIONS.topRectangle.player2.runningTotal.width}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 2 ? '2' : '0'}
          </div>
          
          {/* Table checkbox - 4x8 Regulation - using mapped position */}
          <div className="absolute" style={{ 
            bottom: `${SCORESHEET_POSITIONS.matchInfo.tableType.bottom}px`, 
            left: `${SCORESHEET_POSITIONS.matchInfo.tableType.left}px`, 
            fontSize: '16px', 
            fontWeight: 'bold' 
          }}>
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

// Render score marks on the grid using focused pixel mapping
function renderScoreMarks(runningTotals: number[], targetScore: number, playerRow: 'player1' | 'player2') {
  const marks: JSX.Element[] = [];
  
  // Use the focused mapping system
  const positions = SCORESHEET_POSITIONS.scoreGrid.positions;
  const yPosition = playerRow === 'player1' 
    ? SCORESHEET_POSITIONS.scoreGrid.player1Row 
    : SCORESHEET_POSITIONS.scoreGrid.player2Row;
  
  // Numbers that should get circles (not dots)
  const circleNumbers = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];

  // Draw running tally marks for each score point
  const finalScore = runningTotals[runningTotals.length - 1] || 0;
  for (let i = 1; i <= Math.min(finalScore, 75); i++) {
    const xPosition = positions[i as keyof typeof positions];
    if (xPosition !== undefined) {
      marks.push(
        <div
          key={`mark-${i}-${playerRow}`}
          className="absolute text-center"
          style={{
            left: `${xPosition}px`,
            top: `${yPosition}px`,
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
  }
  
  // Circle the target score (only if it's one of the number positions)
  if (circleNumbers.includes(targetScore)) {
    const xPosition = positions[targetScore as keyof typeof positions];
    if (xPosition !== undefined) {
      marks.push(
        <div
          key={`target-circle-${playerRow}`}
          className="absolute"
          style={{
            left: `${xPosition - 11}px`,
            top: `${yPosition - 6}px`,
            width: '26px',
            height: '26px',
            border: '2px solid black',
            borderRadius: '50%',
            backgroundColor: 'transparent'
          }}
        />
      );
    }
  }
  
  return marks;
}