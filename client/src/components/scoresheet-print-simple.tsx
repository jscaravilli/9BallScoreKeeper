import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import scoresheetPng from "@assets/apa_9ballscoresheet-1_1751404203390.png";

interface ScoresheetPrintProps {
  match: Match & { completedAt: string; events: MatchEvent[] };
}

// Focused pixel mapping for APA scoresheet scoring area based on user markup
const SCORING_POSITIONS = {
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
  } as { [key: number]: number },
  
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
  
  // Calculate running totals from match events
  const calculateRunningTotals = (playerId: number): number[] => {
    const totals: number[] = [0];
    let runningTotal = 0;
    
    match.events
      .filter(event => event.type === 'ball_scored' && event.player === playerId)
      .forEach(event => {
        // Add points based on ball number (balls 1-8 = 1 point, ball 9 = 2 points)
        const points = event.ballNumber === 9 ? 2 : 1;
        runningTotal += points;
        totals.push(runningTotal);
      });
    
    return totals;
  };

  const player1RunningTotals = calculateRunningTotals(1);
  const player2RunningTotals = calculateRunningTotals(2);
  
  // Count safety shots
  const player1Safeties = match.events.filter(e => e.type === 'safety_taken' && e.player === 1).length;
  const player2Safeties = match.events.filter(e => e.type === 'safety_taken' && e.player === 2).length;

  // Render score marks on the grid
  const renderScoreMarks = (runningTotals: number[], targetScore: number, playerRow: 'player1' | 'player2') => {
    const marks: JSX.Element[] = [];
    
    const yPosition = playerRow === 'player1' 
      ? SCORING_POSITIONS.player1Row 
      : SCORING_POSITIONS.player2Row;
    
    // Numbers that should get circles
    const circleNumbers = [1, 5, 10, 14, 19, 25, 31, 35, 38, 46, 50, 55, 60, 65, 70, 75];

    // Draw running tally marks for each score point
    const finalScore = runningTotals[runningTotals.length - 1] || 0;
    for (let i = 1; i <= Math.min(finalScore, 75); i++) {
      const xPosition = SCORING_POSITIONS.positions[i as keyof typeof SCORING_POSITIONS.positions];
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
      const xPosition = SCORING_POSITIONS.positions[targetScore as keyof typeof SCORING_POSITIONS.positions];
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
  };

  return (
    <div className="print-only fixed inset-0 bg-white">
      <div className="relative w-full h-full">
        {/* Base scoresheet image */}
        <img 
          src={scoresheetPng} 
          alt="APA 9-Ball Scoresheet" 
          className="w-full h-full object-contain"
        />
        
        {/* Overlay scoring data */}
        <div className="absolute inset-0">
          {/* Player 1 Score marks (lag winner - top row) */}
          {renderScoreMarks(player1RunningTotals, player1Target, 'player1')}
          
          {/* Player 2 Score marks (bottom row) */}
          {renderScoreMarks(player2RunningTotals, player2Target, 'player2')}
          
          {/* Right side data overlays */}
          
          {/* Defensive Shots */}
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORING_POSITIONS.player1Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.defensiveShots}px`, 
            fontSize: '11px' 
          }}>
            {player1Safeties}
          </div>
          
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORING_POSITIONS.player2Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.defensiveShots}px`, 
            fontSize: '11px' 
          }}>
            {player2Safeties}
          </div>
          
          {/* Total Points */}
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORING_POSITIONS.player1Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.totalPoints}px`, 
            fontSize: '11px' 
          }}>
            {match.player1Score}
          </div>
          
          <div className="absolute text-center font-bold" style={{ 
            top: `${SCORING_POSITIONS.player2Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.totalPoints}px`, 
            fontSize: '11px' 
          }}>
            {match.player2Score}
          </div>
          
          {/* Match Points Earned */}
          <div className="absolute text-center" style={{ 
            top: `${SCORING_POSITIONS.player1Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.matchPoints}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 1 ? '2' : '0'}
          </div>
          
          <div className="absolute text-center" style={{ 
            top: `${SCORING_POSITIONS.player2Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.matchPoints}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 2 ? '2' : '0'}
          </div>
          
          {/* Running Total */}
          <div className="absolute text-center" style={{ 
            top: `${SCORING_POSITIONS.player1Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.runningTotal}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 1 ? '2' : '0'}
          </div>
          
          <div className="absolute text-center" style={{ 
            top: `${SCORING_POSITIONS.player2Row}px`, 
            left: `${SCORING_POSITIONS.rightColumns.runningTotal}px`, 
            fontSize: '11px' 
          }}>
            {match.winnerId === 2 ? '2' : '0'}
          </div>
        </div>
      </div>
    </div>
  );
}