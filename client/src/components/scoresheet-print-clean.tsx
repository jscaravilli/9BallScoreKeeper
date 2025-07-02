import React from "react";
import { Match, MatchEvent } from "@shared/schema";
import { getPointsToWin } from "@/lib/apa-handicaps";
import { printScoresheetImage } from "@/lib/pdfGenerator";
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

// Player 2 coordinates (same X positions, different Y position)
const PLAYER2_COORDINATES = [
  [255,511], [283,511], [310,511], [341,511], [373,511], [411,511], [435,511], [466,511], [497,511], [542,511],
  [591,511], [618,511], [649,511], [698,511], [753,511], [781,511], [812,511], [840,511], [885,511], [940,511],
  [968,511], [995,511], [1023,511], [1054,511], [1102,511], [1151,511], [1182,511], [1213,511], [1241,511], [1272,511],
  [1320,511], [1372,511], [1400,511], [1431,511], [1476,511], [1514,511], [1545,511], [1594,511], [1646,511], [1677,511],
  [1704,511], [1732,511], [1763,511], [1791,511], [1822,511], [1867,511], [1919,511], [1947,511], [1978,511], [2023,511],
  [2064,511], [2095,511], [2123,511], [2151,511], [2199,511], [2247,511], [2282,511], [2310,511], [2341,511], [2386,511],
  [2427,511], [2455,511], [2486,511], [2514,511], [2562,511], [2611,511], [2642,511], [2673,511], [2701,511], [2742,511],
  [2787,511], [2818,511], [2846,511], [2877,511], [2925,511]
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

  // Calculate target points for both players
  const player1Target = getPointsToWin(match.player1SkillLevel as any);
  const player2Target = getPointsToWin(match.player2SkillLevel as any);

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
    
    // Draw slash marks for each scored point using your provided coordinates
    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 1) {
        const slashDirection = getSlashDirection(currentGame);
        
        // 9-ball is worth 2 points, so it gets 2 tally marks
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          const coordIndex = scorePosition;
          scorePosition++;
          
          if (coordIndex < PLAYER1_COORDINATES.length) {
            const [x, y] = PLAYER1_COORDINATES[coordIndex];
            
            marks.push(
              <div
                key={`p1-mark-${eventIndex}-${i}`}
                className="absolute text-center font-bold"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  fontSize: '48.5px',
                  color: 'blue',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                {slashDirection}
              </div>
            );
          }
        }
        
        // If this was a 9-ball, add vertical line after this game ends
        if (event.ballNumber === 9) {
          // Place vertical bar after the last tally mark of this game
          const lastCoordIndex = scorePosition - 1;
          if (lastCoordIndex < PLAYER1_COORDINATES.length) {
            const [x, y] = PLAYER1_COORDINATES[lastCoordIndex];
            marks.push(
              <div
                key={`game-separator-${currentGame}`}
                className="absolute font-bold"
                style={{
                  left: `${x + 25}px`,
                  top: `${y}px`,
                  fontSize: '53.4px',
                  color: 'black',
                  fontWeight: '900',
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
              width: '69px',
              height: '69px',
              border: '7px solid blue',
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

  // Render player 2 score marks using exact coordinates
  function renderPlayer2Marks() {
    const marks: JSX.Element[] = [];
    
    // Track game numbers by counting 9-ball scoring events
    let currentGame = 1;
    let scorePosition = 0;
    
    // Draw slash marks for each scored point using Player 2 coordinates
    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 2) {
        const slashDirection = getSlashDirection(currentGame);
        
        // 9-ball is worth 2 points, so it gets 2 tally marks
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          const coordIndex = scorePosition;
          scorePosition++;
          
          if (coordIndex < PLAYER2_COORDINATES.length) {
            const [x, y] = PLAYER2_COORDINATES[coordIndex];
            
            marks.push(
              <div
                key={`p2-mark-${eventIndex}-${i}`}
                className="absolute text-center font-bold"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  fontSize: '48.5px',
                  color: 'blue',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                {slashDirection}
              </div>
            );
          }
        }
        
        // If this was a 9-ball, add vertical line after this game ends
        if (event.ballNumber === 9) {
          // Place vertical bar after the last tally mark of this game
          const lastCoordIndex = scorePosition - 1;
          if (lastCoordIndex < PLAYER2_COORDINATES.length) {
            const [x, y] = PLAYER2_COORDINATES[lastCoordIndex];
            marks.push(
              <div
                key={`p2-game-separator-${currentGame}`}
                className="absolute font-bold"
                style={{
                  left: `${x + 25}px`,
                  top: `${y}px`,
                  fontSize: '53.4px',
                  color: 'black',
                  fontWeight: '900',
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
    if (SL_TARGET_POSITIONS.includes(player2Target)) {
      const coordIndex = player2Target - 1;
      if (coordIndex < PLAYER2_COORDINATES.length) {
        const [x, y] = PLAYER2_COORDINATES[coordIndex];
        
        marks.push(
          <div
            key={`p2-target-circle`}
            className="absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: '69px',
              height: '69px',
              border: '7px solid blue',
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

  // Handle print functionality with canvas rendering
  const handlePrint = async () => {
    // Extract data for canvas rendering
    const tallies: Array<{ x: number; y: number; symbol: string; game: number }> = [];
    const circles: Array<{ x: number; y: number }> = [];
    const verticalLines: Array<{ x: number; y: number }> = [];

    // Process Player 1 events
    let currentGame = 1;
    let scorePosition = 0;

    match.events.forEach(event => {
      if (event.type === 'ball_scored' && event.player === 1) {
        const slashDirection = getSlashDirection(currentGame);
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          const coordIndex = scorePosition;
          scorePosition++;
          
          if (coordIndex < PLAYER1_COORDINATES.length) {
            const [x, y] = PLAYER1_COORDINATES[coordIndex];
            tallies.push({ x: x + 3, y: y, symbol: slashDirection, game: currentGame });
          }
        }
        
        // Add vertical separator after 9-ball
        if (event.ballNumber === 9) {
          const lastCoordIndex = scorePosition - 1;
          if (lastCoordIndex < PLAYER1_COORDINATES.length) {
            const [x, y] = PLAYER1_COORDINATES[lastCoordIndex];
            verticalLines.push({ x: x + 25 + 3, y: y });
          }
          currentGame++;
        }
      }
    });

    // Process Player 2 events
    currentGame = 1;
    scorePosition = 0;

    match.events.forEach(event => {
      if (event.type === 'ball_scored' && event.player === 2) {
        const slashDirection = getSlashDirection(currentGame);
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          const coordIndex = scorePosition;
          scorePosition++;
          
          if (coordIndex < PLAYER2_COORDINATES.length) {
            const [x, y] = PLAYER2_COORDINATES[coordIndex];
            tallies.push({ x: x + 3, y: y, symbol: slashDirection, game: currentGame });
          }
        }
        
        // Add vertical separator after 9-ball
        if (event.ballNumber === 9) {
          const lastCoordIndex = scorePosition - 1;
          if (lastCoordIndex < PLAYER2_COORDINATES.length) {
            const [x, y] = PLAYER2_COORDINATES[lastCoordIndex];
            verticalLines.push({ x: x + 25 + 3, y: y });
          }
          currentGame++;
        }
      }
    });

    // Add target circles for both players
    if (SL_TARGET_POSITIONS.includes(player1Target)) {
      const coordIndex = player1Target - 1;
      if (coordIndex < PLAYER1_COORDINATES.length) {
        const [x, y] = PLAYER1_COORDINATES[coordIndex];
        circles.push({ x: x + 3, y: y });
      }
    }

    if (SL_TARGET_POSITIONS.includes(player2Target)) {
      const coordIndex = player2Target - 1;
      if (coordIndex < PLAYER2_COORDINATES.length) {
        const [x, y] = PLAYER2_COORDINATES[coordIndex];
        circles.push({ x: x + 3, y: y });
      }
    }

    // Call canvas-based print function
    await printScoresheetImage(tallies, circles, verticalLines);
  };

  // Add print event listener
  React.useEffect(() => {
    const handlePrintEvent = (e: Event) => {
      e.preventDefault();
      handlePrint();
    };

    window.addEventListener('beforeprint', handlePrintEvent);
    return () => window.removeEventListener('beforeprint', handlePrintEvent);
  }, [match.events]);

  return (
    <div className="scoresheet-container w-full max-w-4xl mx-auto bg-white" style={{ 
      printColorAdjust: 'exact',
      WebkitPrintColorAdjust: 'exact'
    }}>
      <div className="scoresheet-content relative" style={{ 
        width: '3300px', 
        height: '2550px',
        transform: 'scale(0.62)',
        transformOrigin: 'top left',
        overflow: 'hidden'
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
          {/* Player 1 score marks using exact pixel coordinates */}
          {renderPlayer1Marks()}
          {/* Player 2 score marks using exact pixel coordinates */}
          {renderPlayer2Marks()}
        </div>
      </div>
    </div>
  );
}