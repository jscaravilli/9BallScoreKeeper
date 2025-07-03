import { useQuery } from "@tanstack/react-query";
import { adaptiveStorageAPI } from "@/lib/adaptiveStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { EventDeduplicator } from "@/lib/eventDeduplication";

export default function TallyView() {
  const { toast } = useToast();
  const { data: currentMatch, isLoading } = useQuery({
    queryKey: ["/api/match/current"],
    queryFn: () => adaptiveStorageAPI.getCurrentMatch(),
  });

  const copyTableData = (validTallies: any[], currentMatch: any, scores: any) => {
    // Create tab-separated table data for copying
    const headers = "Player\tGame\tBall\tTally\tTime";
    const rows = validTallies
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(tally => {
        const ballDisplay = tally.ballNumber === 9 ? "9-ball" : tally.ballNumber.toString();
        const timeDisplay = new Date(tally.timestamp).toLocaleTimeString();
        return `${tally.playerName}\t${tally.gameNumber}\t${ballDisplay}\t1\t${timeDisplay}`;
      });
    
    const tableData = [headers, ...rows].join('\n');
    
    // Use the accurate scores from EventDeduplicator
    const player1Tallies = validTallies.filter(t => t.player === 1).length;
    const player2Tallies = validTallies.filter(t => t.player === 2).length;
    
    const summary = `\n\nSUMMARY:\n${currentMatch.player1Name}: ${scores.player1Score} points (${player1Tallies} tallies)\n${currentMatch.player2Name}: ${scores.player2Score} points (${player2Tallies} tallies)`;
    
    const fullData = tableData + summary;
    
    navigator.clipboard.writeText(fullData).then(() => {
      toast({
        title: "Copied!",
        description: "Table data copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Please manually select and copy the table",
        variant: "destructive",
      });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl">No current match found</div>
      </div>
    );
  }

  // Get match events and deduplicate them
  const rawEvents = adaptiveStorageAPI.getCurrentMatchEvents() || [];
  const events = EventDeduplicator.deduplicateEvents(rawEvents);
  
  console.log(`Raw events: ${rawEvents.length}, Deduplicated: ${events.length}`);
  
  // Calculate accurate scores from events
  const scores = EventDeduplicator.calculateScoresFromEvents(
    events,
    currentMatch.player1Name,
    currentMatch.player2Name
  );
  
  // Build tally data from deduplicated events using same logic as PDF generator
  const tallyData: Array<{
    playerName: string;
    player: number;
    gameNumber: number;
    ballNumber: number;
    pointsAwarded: number;
    timestamp: string;
    isValid: boolean;
  }> = [];

  // Use the same ball state tracking as PDF generator to ensure consistency
  const ballStates = new Map();
  
  events.forEach((event: any) => {
    if (event.type === 'ball_scored' || event.type === 'ball_dead') {
      const key = `${event.ballNumber}-${event.player}`;
      if (!ballStates.has(key)) {
        ballStates.set(key, []);
      }
      ballStates.get(key).push(event);
    }
  });
  
  // Only include ball_scored events where the ball's final state is scored (not dead)
  const validScoredEvents = events.filter((event: any) => {
    if (event.type !== 'ball_scored') return false; // Only process scoring events for tallies
    
    const key = `${event.ballNumber}-${event.player}`;
    const ballEvents = ballStates.get(key) || [];
    
    // Get the most recent event for this ball/player combination
    const lastEvent = ballEvents[ballEvents.length - 1];
    const isValidScore = lastEvent && lastEvent.type === 'ball_scored';
    
    console.log(`Ball ${event.ballNumber} by player ${event.player}: ${isValidScore ? 'VALID TALLY' : 'DEAD - NO TALLY'}`);
    return isValidScore;
  });

  console.log(`Filtered tally events: ${events.length} total -> ${validScoredEvents.length} valid events`);
  
  // Get handicap targets for both players
  const getPointsToWin = (skillLevel: number): number => {
    const targets = [14, 19, 25, 31, 38, 46, 55, 65, 75];
    return targets[skillLevel - 1] || 75;
  };
  
  const player1Target = getPointsToWin(currentMatch.player1SkillLevel);
  const player2Target = getPointsToWin(currentMatch.player2SkillLevel);
  
  // Build tally data from valid scored events with handicap limits
  let currentGame = 1;
  let player1RunningScore = 0;
  let player2RunningScore = 0;
  
  validScoredEvents.forEach((event: any) => {
    // Track game number changes from event details
    if (event.details && event.details.includes('Game ')) {
      const gameMatch = event.details.match(/Game (\d+):/);
      if (gameMatch) {
        currentGame = parseInt(gameMatch[1]);
      }
    }
    
    const pointsAwarded = event.ballNumber === 9 ? 2 : 1;
    const playerName = event.player === 1 ? currentMatch.player1Name : currentMatch.player2Name;
    const playerTarget = event.player === 1 ? player1Target : player2Target;
    const currentPlayerScore = event.player === 1 ? player1RunningScore : player2RunningScore;
    
    // Check if adding these points would exceed the handicap
    if (currentPlayerScore >= playerTarget) {
      console.log(`Skipping tally - Player ${event.player} already at handicap limit (${currentPlayerScore}/${playerTarget})`);
      return;
    }
    
    // For 9-ball, add 2 separate tally marks (but respect handicap limit)
    if (event.ballNumber === 9) {
      // First tally mark for 9-ball
      if (currentPlayerScore < playerTarget) {
        tallyData.push({
          playerName,
          player: event.player,
          gameNumber: currentGame,
          ballNumber: event.ballNumber,
          pointsAwarded: 1, // Each tally is worth 1, but we'll have 2 of them
          timestamp: event.timestamp,
          isValid: true
        });
        
        // Update running score
        if (event.player === 1) {
          player1RunningScore += 1;
        } else {
          player2RunningScore += 1;
        }
      }
      
      // Second tally mark for 9-ball (check limit again)
      if ((event.player === 1 ? player1RunningScore : player2RunningScore) < playerTarget) {
        tallyData.push({
          playerName,
          player: event.player,
          gameNumber: currentGame,
          ballNumber: event.ballNumber,
          pointsAwarded: 1, // Each tally is worth 1, but we'll have 2 of them
          timestamp: event.timestamp,
          isValid: true
        });
        
        // Update running score
        if (event.player === 1) {
          player1RunningScore += 1;
        } else {
          player2RunningScore += 1;
        }
      }
      
      console.log(`9-ball tallies for Player ${event.player}: added up to handicap limit (${event.player === 1 ? player1RunningScore : player2RunningScore}/${playerTarget})`);
    } else {
      // Regular balls get 1 tally mark
      tallyData.push({
        playerName,
        player: event.player,
        gameNumber: currentGame,
        ballNumber: event.ballNumber,
        pointsAwarded: 1,
        timestamp: event.timestamp,
        isValid: true
      });
      
      // Update running score
      if (event.player === 1) {
        player1RunningScore += 1;
      } else {
        player2RunningScore += 1;
      }
      
      console.log(`Valid tally: ${playerName} (Player ${event.player}), Ball ${event.ballNumber}, Game ${currentGame}, Score: ${event.player === 1 ? player1RunningScore : player2RunningScore}/${playerTarget}`);
    }
  });

  // Use the scores calculated by the deduplicator for accuracy, but cap at handicap
  const validTallies = tallyData;
  const player1Tallies = validTallies.filter(t => t.player === 1);
  const player2Tallies = validTallies.filter(t => t.player === 2);
  
  // Cap final scores at handicap limits
  const totalPlayer1Points = Math.min(scores.player1Score, player1Target);
  const totalPlayer2Points = Math.min(scores.player2Score, player2Target);
  
  console.log(`Final scores - P1: ${totalPlayer1Points} (${player1Tallies.length} tallies), P2: ${totalPlayer2Points} (${player2Tallies.length} tallies)`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-green-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Game
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Scoresheet Tally Preview</h1>
        </div>

        {/* Match Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Match Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>{currentMatch.player1Name}</strong> (SL {currentMatch.player1SkillLevel})</p>
                <p>Tallies: {player1Tallies.length} ({totalPlayer1Points} points)</p>
              </div>
              <div>
                <p><strong>{currentMatch.player2Name}</strong> (SL {currentMatch.player2SkillLevel})</p>
                <p>Tallies: {player2Tallies.length} ({totalPlayer2Points} points)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combined Tally Table for Easy Copy/Paste */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Match Tally Data - Copy & Paste Ready</CardTitle>
            <Button 
              onClick={() => copyTableData(validTallies, currentMatch, scores)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Table
            </Button>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="overflow-x-auto" style={{ userSelect: 'text' }}>
              <table 
                id="tally-table"
                style={{ 
                  borderCollapse: 'collapse', 
                  width: '100%', 
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  userSelect: 'text',
                  cursor: 'text'
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', userSelect: 'text' }}>Player</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', userSelect: 'text' }}>Game</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', userSelect: 'text' }}>Ball</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', userSelect: 'text' }}>Tally</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', userSelect: 'text' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {validTallies.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'center', color: '#6b7280', userSelect: 'text' }}>
                        No valid tallies
                      </td>
                    </tr>
                  ) : (
                    validTallies
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((tally, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                          <td style={{ border: '1px solid #d1d5db', padding: '8px', userSelect: 'text' }}>{tally.playerName}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '8px', userSelect: 'text' }}>{tally.gameNumber}</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '8px', userSelect: 'text' }}>
                            {tally.ballNumber === 9 ? '9-ball' : tally.ballNumber.toString()}
                          </td>
                          <td style={{ border: '1px solid #d1d5db', padding: '8px', userSelect: 'text', fontStyle: 'italic', fontSize: '18px' }}>╱</td>
                          <td style={{ border: '1px solid #d1d5db', padding: '8px', userSelect: 'text' }}>
                            {new Date(tally.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Summary */}
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px', userSelect: 'text' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontFamily: 'monospace' }}>
                <div>
                  <strong>{currentMatch.player1Name} Total:</strong> {totalPlayer1Points} points ({player1Tallies.length} tallies)
                </div>
                <div>
                  <strong>{currentMatch.player2Name} Total:</strong> {totalPlayer2Points} points ({player2Tallies.length} tallies)
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div style={{ marginTop: '12px', padding: '8px', fontSize: '12px', color: '#6b7280', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
              💡 <strong>Options:</strong> Click "Copy Table" button above, or manually select the table text and copy (Ctrl+C / Cmd+C)
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Scoresheet Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>This shows exactly what will appear on the APA scoresheet when printed.</p>
              <p>Dead balls are filtered out and do not generate tally marks.</p>
              <p>9-balls generate 2 tally marks each (2 points).</p>
              <p>Regular balls generate 1 tally mark each (1 point).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}