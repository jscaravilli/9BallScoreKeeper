import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/apa_9ballscoresheet-1_1751404203390.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

// Comprehensive pixel mapping for APA scoresheet
const SCORESHEET_POSITIONS = {
  // Top rectangle - both players
  topRectangle: {
    player1: {
      name: { top: 136, left: 125 },
      skillLevel: { top: 136, left: 619, width: 24 },
      scoreGrid: { top: 136, left: 315 }, // Starting position for score marks
      defensiveShots: { top: 136, left: 645, width: 48 },
      totalPoints: { top: 136, left: 709, width: 38 },
      matchPointsEarned: { top: 136, left: 772, width: 38 },
      runningTotal: { top: 136, left: 834, width: 38 }
    },
    player2: {
      name: { top: 170, left: 125 },
      skillLevel: { top: 170, left: 619, width: 24 },
      scoreGrid: { top: 170, left: 315 }, // Starting position for score marks
      defensiveShots: { top: 170, left: 645, width: 48 },
      totalPoints: { top: 170, left: 709, width: 38 },
      matchPointsEarned: { top: 170, left: 772, width: 38 },
      runningTotal: { top: 170, left: 834, width: 38 }
    }
  },
  
  // Score grid positions (dots and numbers)
  scoreGrid: {
    baseX: 315,
    baseY: 136,
    cellWidth: 21.8,
    numberHeight: 20,
    // Exact pixel positions for each score value
    positions: {
      1: 0, 2: 0.5, 3: 0.5, 4: 0.5, 5: 1,
      6: 1.5, 7: 1.5, 8: 1.5, 9: 1.5, 10: 2,
      11: 2.5, 12: 2.5, 13: 2.5, 14: 3,
      15: 3.5, 16: 3.5, 17: 3.5, 18: 3.5, 19: 4,
      20: 4.5, 21: 4.5, 22: 4.5, 23: 4.5, 24: 4.5, 25: 5,
      26: 5.5, 27: 5.5, 28: 5.5, 29: 5.5, 30: 5.5, 31: 6,
      32: 6.5, 33: 6.5, 34: 6.5, 35: 7,
      36: 7.5, 37: 7.5, 38: 8,
      39: 8.5, 40: 8.5, 41: 8.5, 42: 8.5, 43: 8.5, 44: 8.5, 45: 8.5, 46: 9,
      47: 9.5, 48: 9.5, 49: 9.5, 50: 10,
      51: 10.5, 52: 10.5, 53: 10.5, 54: 10.5, 55: 11,
      56: 11.5, 57: 11.5, 58: 11.5, 59: 11.5, 60: 12,
      61: 12.5, 62: 12.5, 63: 12.5, 64: 12.5, 65: 13,
      66: 13.5, 67: 13.5, 68: 13.5, 69: 13.5, 70: 14,
      71: 14.5, 72: 14.5, 73: 14.5, 74: 14.5, 75: 15
    }
  },
  
  // Match info
  matchInfo: {
    startTime: { top: 43, right: 144 },
    endTime: { top: 43, right: 38 },
    tableType: { bottom: 56, left: 691 } // Checkbox for 4x8 Regulation
  },
  
  // Dead balls section (for future use)
  deadBalls: {
    player1: { top: 152, left: 280 },
    player2: { top: 186, left: 280 }
  },
  
  // Innings display (for future use)
  innings: {
    top: 118,
    left: 450
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
          {renderScoreMarks(player1RunningTotals, player1Target, SCORESHEET_POSITIONS.topRectangle.player1.scoreGrid.top, 'player1')}
          {renderScoreMarks(player2RunningTotals, player2Target, SCORESHEET_POSITIONS.topRectangle.player2.scoreGrid.top, 'player2')}
          
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

// Render score marks on the grid
function renderScoreMarks(runningTotals: number[], targetScore: number, topPosition: number, player?: 'player1' | 'player2') {
  const marks: JSX.Element[] = [];
  
  // Use the comprehensive mapping system
  const baseX = SCORESHEET_POSITIONS.scoreGrid.baseX;
  const cellWidth = SCORESHEET_POSITIONS.scoreGrid.cellWidth;
  const positions = SCORESHEET_POSITIONS.scoreGrid.positions;
  
  // Numbers that should get circles (not dots)
  const circleNumbers = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];

  // Draw running tally marks for each score point
  const finalScore = runningTotals[runningTotals.length - 1] || 0;
  for (let i = 1; i <= Math.min(finalScore, 75); i++) {
    const position = positions[i];
    if (position !== undefined) {
      const xPosition = baseX + (position * cellWidth);
      
      marks.push(
        <div
          key={`mark-${i}-${player || 'default'}`}
          className="absolute text-center"
          style={{
            left: `${xPosition}px`,
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
  }
  
  // Circle the target score (only if it's one of the number positions)
  if (circleNumbers.includes(targetScore)) {
    const position = positions[targetScore];
    if (position !== undefined) {
      const xPosition = baseX + (position * cellWidth);
      marks.push(
        <div
          key={`target-circle-${player || 'default'}`}
          className="absolute"
          style={{
            left: `${xPosition - 11}px`,
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
  }
  
  return marks;
}