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
// SL1=14, SL2=19, SL3=25, SL4=31, SL5=38, SL6=46, SL7=55, SL8=65, SL9=75
const SL_TARGET_POSITIONS = [14, 19, 25, 31, 38, 46, 55, 65, 75];

// Get slash direction based on game number
function getSlashDirection(gameNumber: number): string {
  return gameNumber % 2 === 1 ? '╱' : '╲';
}

// Create a game tracking function that maps each event to its game number
function buildGameMap(events: MatchEvent[]): Map<number, number> {
  const gameMap = new Map<number, number>();
  let currentGame = 1;
  
  events.forEach((event, index) => {
    gameMap.set(index, currentGame);
    
    // Advance game when 9-ball is scored by either player
    if (event.type === 'ball_scored' && event.ballNumber === 9) {
      currentGame++;
    }
  });
  
  return gameMap;
}

export default function ScoresheetPrint({ match }: ScoresheetPrintProps) {
  if (!match || !match.events || !match.completedAt) {
    return null;
  }

  // Debug: Log the match events to see what's actually being processed
  console.log('Scoresheet Debug - Match Events:', match.events);
  console.log('Scoresheet Debug - Player 1 Events:', match.events.filter(e => e.type === 'ball_scored' && e.player === 1));
  console.log('Scoresheet Debug - Player 2 Events:', match.events.filter(e => e.type === 'ball_scored' && e.player === 2));
  console.log('Scoresheet Debug - 9-ball Events:', match.events.filter(e => e.type === 'ball_scored' && e.ballNumber === 9));
  
  // Count expected tallies for each player
  let p1TallyCount = 0, p2TallyCount = 0;
  match.events.forEach(event => {
    if (event.type === 'ball_scored') {
      const pointsWorth = event.ballNumber === 9 ? 2 : 1;
      if (event.player === 1) p1TallyCount += pointsWorth;
      if (event.player === 2) p2TallyCount += pointsWorth;
    }
  });
  console.log(`Expected tallies - Player 1: ${p1TallyCount}, Player 2: ${p2TallyCount}`);

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
    const gameMap = buildGameMap(match.events);
    let scorePosition = 0;
    
    // Draw slash marks for each scored point using your provided coordinates
    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 1) {
        const currentGame = gameMap.get(eventIndex) || 1;
        const slashDirection = getSlashDirection(currentGame);
        
        // Each ball scored gets appropriate number of tally marks
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          if (scorePosition < PLAYER1_COORDINATES.length) {
            const [x, y] = PLAYER1_COORDINATES[scorePosition];
            const xOffset = slashDirection === '╲' ? -3 : 0; // Shift backslash left by 3 pixels
            
            marks.push(
              <div
                key={`p1-tally-${scorePosition}`}
                className="absolute text-center font-bold"
                style={{
                  left: `${x + xOffset}px`,
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
            
            scorePosition++;
          }
        }
        
        // Vertical bars will be added separately after processing all events
      }
    });
    
    // Add vertical bars for game separations - track where Player 1's games end
    const player1GameEndPositions: number[] = [];
    let tempScorePosition = 0;
    
    match.events.forEach(event => {
      if (event.type === 'ball_scored' && event.player === 1) {
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        tempScorePosition += pointsWorth;
        
        // When a 9-ball is scored by this player, record the position for vertical bar
        if (event.ballNumber === 9) {
          player1GameEndPositions.push(tempScorePosition - 1); // Position of last tally in game
        }
      }
      // Also add bars when the OTHER player wins a game (Player 1 gets a bar at their current position)
      else if (event.type === 'ball_scored' && event.player === 2 && event.ballNumber === 9) {
        // Player 2 won the game, add a bar at Player 1's current position (if they have any tallies)
        if (tempScorePosition > 0) {
          player1GameEndPositions.push(tempScorePosition - 1);
        }
      }
    });
    
    // Add vertical bars at game end positions
    player1GameEndPositions.forEach((position, gameIndex) => {
      if (position >= 0 && position < PLAYER1_COORDINATES.length) {
        const [x, y] = PLAYER1_COORDINATES[position];
        marks.push(
          <div
            key={`p1-game-bar-${gameIndex}`}
            className="absolute font-bold"
            style={{
              left: `${x + 25}px`,
              top: `${y}px`,
              fontSize: '53.4px',
              color: 'black',
              fontWeight: '900',
              textShadow: '1px 0 0 black, -1px 0 0 black, 0 1px 0 black, 0 -1px 0 black',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              position: 'relative'
            }}
          >
            │
            <span style={{
              position: 'absolute',
              left: '1px',
              top: '0'
            }}>│</span>
          </div>
        );
      }
    });

    // Circle the target score if it's an SL target position
    if (SL_TARGET_POSITIONS.includes(player1Target)) {
      const coordIndex = player1Target - 1; // Convert to 0-indexed
      if (coordIndex >= 0 && coordIndex < PLAYER1_COORDINATES.length) {
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
    const gameMap = buildGameMap(match.events);
    let scorePosition = 0;
    
    // Draw slash marks for each scored point using Player 2 coordinates
    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 2) {
        const currentGame = gameMap.get(eventIndex) || 1;
        const slashDirection = getSlashDirection(currentGame);
        
        // Each ball scored gets appropriate number of tally marks
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          if (scorePosition < PLAYER2_COORDINATES.length) {
            const [x, y] = PLAYER2_COORDINATES[scorePosition];
            const xOffset = slashDirection === '╲' ? -3 : 0; // Shift backslash left by 3 pixels
            
            marks.push(
              <div
                key={`p2-tally-${scorePosition}`}
                className="absolute text-center font-bold"
                style={{
                  left: `${x + xOffset}px`,
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
            
            scorePosition++;
          }
        }
        
        // Vertical bars will be added separately after processing all events
      }
    });
    
    // Add vertical bars for game separations - track where Player 2's games end
    const player2GameEndPositions: number[] = [];
    let tempP2ScorePosition = 0;
    
    match.events.forEach(event => {
      if (event.type === 'ball_scored' && event.player === 2) {
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        tempP2ScorePosition += pointsWorth;
        
        // When a 9-ball is scored by this player, record the position for vertical bar
        if (event.ballNumber === 9) {
          player2GameEndPositions.push(tempP2ScorePosition - 1); // Position of last tally in game
        }
      }
      // Also add bars when the OTHER player wins a game (Player 2 gets a bar at their current position)
      else if (event.type === 'ball_scored' && event.player === 1 && event.ballNumber === 9) {
        // Player 1 won the game, add a bar at Player 2's current position (if they have any tallies)
        if (tempP2ScorePosition > 0) {
          player2GameEndPositions.push(tempP2ScorePosition - 1);
        }
      }
    });
    
    // Add vertical bars at game end positions
    player2GameEndPositions.forEach((position, gameIndex) => {
      if (position >= 0 && position < PLAYER2_COORDINATES.length) {
        const [x, y] = PLAYER2_COORDINATES[position];
        marks.push(
          <div
            key={`p2-game-bar-${gameIndex}`}
            className="absolute font-bold"
            style={{
              left: `${x + 25}px`,
              top: `${y}px`,
              fontSize: '53.4px',
              color: 'black',
              fontWeight: '900',
              textShadow: '1px 0 0 black, -1px 0 0 black, 0 1px 0 black, 0 -1px 0 black',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              position: 'relative'
            }}
          >
            │
            <span style={{
              position: 'absolute',
              left: '1px',
              top: '0'
            }}>│</span>
          </div>
        );
      }
    });

    // Circle the target score if it's an SL target position
    if (SL_TARGET_POSITIONS.includes(player2Target)) {
      const coordIndex = player2Target - 1; // Convert to 0-indexed
      if (coordIndex >= 0 && coordIndex < PLAYER2_COORDINATES.length) {
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

  // Coordinate-based markup system for match data display
  function renderMatchDataMarkup() {
    const markups: JSX.Element[] = [];

    // Calculate match statistics
    const totalInnings = Math.ceil(match.events.filter(e => e.type === 'ball_scored' && e.ballNumber === 9).length / 2);
    const totalDeadBalls = match.events.filter(e => e.type === 'ball_dead').length;
    const player1Safeties = match.player1SafetiesUsed || 0;  
    const player2Safeties = match.player2SafetiesUsed || 0;

    // Format timestamps
    const startTime = new Date(match.createdAt || Date.now()).toLocaleString();
    const endTime = new Date(match.completedAt).toLocaleString();

    // Coordinate definitions for precise positioning
    const coordinates = {
      // Player names
      player1Name: { x: 300, y: 50, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      player2Name: { x: 300, y: 100, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      
      // Skill levels  
      player1SkillLevel: { x: 1200, y: 50, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      player2SkillLevel: { x: 1200, y: 100, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      
      // Handicaps (targets)
      player1Target: { x: 1400, y: 50, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      player2Target: { x: 1400, y: 100, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      
      // Final scores
      player1Score: { x: 1600, y: 50, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      player2Score: { x: 1600, y: 100, fontSize: '48px', fontWeight: 'bold', color: 'blue' },
      
      // Innings
      innings: { x: 1800, y: 75, fontSize: '36px', fontWeight: 'bold', color: 'blue' },
      
      // Dead balls
      deadBalls: { x: 2000, y: 75, fontSize: '36px', fontWeight: 'bold', color: 'blue' },
      
      // Safeties
      player1Safeties: { x: 2200, y: 50, fontSize: '36px', fontWeight: 'bold', color: 'blue' },
      player2Safeties: { x: 2200, y: 100, fontSize: '36px', fontWeight: 'bold', color: 'blue' },
      
      // Timestamps
      startTime: { x: 300, y: 200, fontSize: '24px', fontWeight: 'normal', color: 'blue' },
      endTime: { x: 300, y: 250, fontSize: '24px', fontWeight: 'normal', color: 'blue' }
    };

    // Create text overlays for each data point
    const dataPoints = [
      { key: 'player1Name', value: `${match.player1Name} (LAG)`, coords: coordinates.player1Name },
      { key: 'player2Name', value: match.player2Name, coords: coordinates.player2Name },
      { key: 'player1SkillLevel', value: `SL${match.player1SkillLevel}`, coords: coordinates.player1SkillLevel },
      { key: 'player2SkillLevel', value: `SL${match.player2SkillLevel}`, coords: coordinates.player2SkillLevel },
      { key: 'player1Target', value: `${player1Target}`, coords: coordinates.player1Target },
      { key: 'player2Target', value: `${player2Target}`, coords: coordinates.player2Target },
      { key: 'player1Score', value: `${match.player1Score}`, coords: coordinates.player1Score },
      { key: 'player2Score', value: `${match.player2Score}`, coords: coordinates.player2Score },
      { key: 'innings', value: `${totalInnings}`, coords: coordinates.innings },
      { key: 'deadBalls', value: `${totalDeadBalls}`, coords: coordinates.deadBalls },
      { key: 'player1Safeties', value: `${player1Safeties}`, coords: coordinates.player1Safeties },
      { key: 'player2Safeties', value: `${player2Safeties}`, coords: coordinates.player2Safeties },
      { key: 'startTime', value: `Start: ${startTime}`, coords: coordinates.startTime },
      { key: 'endTime', value: `End: ${endTime}`, coords: coordinates.endTime }
    ];

    dataPoints.forEach(({ key, value, coords }) => {
      markups.push(
        <div
          key={key}
          className="absolute select-none pointer-events-none"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            fontSize: coords.fontSize,
            fontWeight: coords.fontWeight,
            color: coords.color,
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1',
            textShadow: '1px 1px 1px rgba(255,255,255,0.8)'
          }}
        >
          {value}
        </div>
      );
    });

    return markups;
  }

  // Handle print functionality with canvas rendering
  const handlePrint = async () => {
    // Extract data for canvas rendering
    const tallies: Array<{ x: number; y: number; symbol: string; game: number }> = [];
    const circles: Array<{ x: number; y: number }> = [];
    const verticalLines: Array<{ x: number; y: number }> = [];

    const gameMap = buildGameMap(match.events);

    // Process Player 1 events
    let player1ScorePosition = 0;

    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 1) {
        const currentGame = gameMap.get(eventIndex) || 1;
        const slashDirection = getSlashDirection(currentGame);
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          if (player1ScorePosition < PLAYER1_COORDINATES.length) {
            const [x, y] = PLAYER1_COORDINATES[player1ScorePosition];
            tallies.push({ x: x + 3, y: y, symbol: slashDirection, game: currentGame });
            player1ScorePosition++;
          }
        }
        
        // Vertical bars will be added separately after processing all events
      }
    });

    // Process Player 2 events
    let player2ScorePosition = 0;

    match.events.forEach((event, eventIndex) => {
      if (event.type === 'ball_scored' && event.player === 2) {
        const currentGame = gameMap.get(eventIndex) || 1;
        const slashDirection = getSlashDirection(currentGame);
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        for (let i = 0; i < pointsWorth; i++) {
          if (player2ScorePosition < PLAYER2_COORDINATES.length) {
            const [x, y] = PLAYER2_COORDINATES[player2ScorePosition];
            tallies.push({ x: x + 3, y: y, symbol: slashDirection, game: currentGame });
            player2ScorePosition++;
          }
        }
        
        // Vertical bars will be added separately after processing all events
      }
    });

    // Add vertical bars for both players based on game endings
    let p1Position = 0;
    let p2Position = 0;
    
    match.events.forEach(event => {
      if (event.type === 'ball_scored') {
        const pointsWorth = event.ballNumber === 9 ? 2 : 1;
        
        if (event.player === 1) {
          p1Position += pointsWorth;
          // When Player 1 wins (scores 9-ball), add bars for both players
          if (event.ballNumber === 9) {
            // Player 1 bar at their current position
            if (p1Position > 0 && p1Position - 1 < PLAYER1_COORDINATES.length) {
              const [x, y] = PLAYER1_COORDINATES[p1Position - 1];
              verticalLines.push({ x: x + 25 + 3, y: y });
            }
            // Player 2 bar at their current position (if they have any tallies)
            if (p2Position > 0 && p2Position - 1 < PLAYER2_COORDINATES.length) {
              const [x, y] = PLAYER2_COORDINATES[p2Position - 1];
              verticalLines.push({ x: x + 25 + 3, y: y });
            }
          }
        } else if (event.player === 2) {
          p2Position += pointsWorth;
          // When Player 2 wins (scores 9-ball), add bars for both players
          if (event.ballNumber === 9) {
            // Player 1 bar at their current position (if they have any tallies)
            if (p1Position > 0 && p1Position - 1 < PLAYER1_COORDINATES.length) {
              const [x, y] = PLAYER1_COORDINATES[p1Position - 1];
              verticalLines.push({ x: x + 25 + 3, y: y });
            }
            // Player 2 bar at their current position
            if (p2Position > 0 && p2Position - 1 < PLAYER2_COORDINATES.length) {
              const [x, y] = PLAYER2_COORDINATES[p2Position - 1];
              verticalLines.push({ x: x + 25 + 3, y: y });
            }
          }
        }
      }
    });

    // Add target circles for both players
    if (SL_TARGET_POSITIONS.includes(player1Target)) {
      const coordIndex = player1Target - 1; // Convert to 0-indexed
      if (coordIndex >= 0 && coordIndex < PLAYER1_COORDINATES.length) {
        const [x, y] = PLAYER1_COORDINATES[coordIndex];
        circles.push({ x: x + 3, y: y });
      }
    }

    if (SL_TARGET_POSITIONS.includes(player2Target)) {
      const coordIndex = player2Target - 1; // Convert to 0-indexed
      if (coordIndex >= 0 && coordIndex < PLAYER2_COORDINATES.length) {
        const [x, y] = PLAYER2_COORDINATES[coordIndex];
        circles.push({ x: x + 3, y: y });
      }
    }

    // Prepare match data for canvas rendering
    const matchData = {
      player1Name: match.player1Name,
      player2Name: match.player2Name,
      player1SkillLevel: match.player1SkillLevel,
      player2SkillLevel: match.player2SkillLevel,
      player1Target: getPointsToWin(match.player1SkillLevel as any),
      player2Target: getPointsToWin(match.player2SkillLevel as any),
      player1FinalScore: match.player1Score,
      player2FinalScore: match.player2Score,
      totalInnings: Math.ceil(match.events.filter(e => e.type === 'ball_scored' && e.ballNumber === 9).length / 2),
      totalDeadBalls: match.events.filter(e => e.type === 'ball_dead').length,
      player1Safeties: match.player1SafetiesUsed || 0,
      player2Safeties: match.player2SafetiesUsed || 0,
      matchStartTime: new Date(match.createdAt || Date.now()).toLocaleString(),
      matchEndTime: new Date(match.completedAt).toLocaleString()
    };

    // Call canvas-based print function
    await printScoresheetImage(tallies, circles, verticalLines, matchData);
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
          
          {/* Coordinate-based match data markup */}
          {renderMatchDataMarkup()}
        </div>
      </div>
    </div>
  );
}