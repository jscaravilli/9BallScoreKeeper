import { useQuery } from "@tanstack/react-query";
import { adaptiveStorageAPI } from "@/lib/adaptiveStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function TallyView() {
  const { toast } = useToast();
  const { data: currentMatch, isLoading } = useQuery({
    queryKey: ["/api/match/current"],
    queryFn: () => adaptiveStorageAPI.getCurrentMatch(),
  });

  const copyTableData = (validTallies: any[], currentMatch: any) => {
    // Create tab-separated table data for copying
    const headers = "Player\tGame\tBall\tPoints\tTime";
    const rows = validTallies
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(tally => {
        const ballDisplay = tally.ballNumber === 9 ? "9-ball" : tally.ballNumber.toString();
        const timeDisplay = new Date(tally.timestamp).toLocaleTimeString();
        return `${tally.playerName}\t${tally.gameNumber}\t${ballDisplay}\t${tally.pointsAwarded}\t${timeDisplay}`;
      });
    
    const tableData = [headers, ...rows].join('\n');
    
    // Add summary data
    const player1Points = validTallies.filter(t => t.player === 1).reduce((sum, t) => sum + t.pointsAwarded, 0);
    const player2Points = validTallies.filter(t => t.player === 2).reduce((sum, t) => sum + t.pointsAwarded, 0);
    const player1Tallies = validTallies.filter(t => t.player === 1).length;
    const player2Tallies = validTallies.filter(t => t.player === 2).length;
    
    const summary = `\n\nSUMMARY:\n${currentMatch.player1Name}: ${player1Points} points (${player1Tallies} tallies)\n${currentMatch.player2Name}: ${player2Points} points (${player2Tallies} tallies)`;
    
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

  // Get match events and filter for scoring events
  const events = adaptiveStorageAPI.getCurrentMatchEvents() || [];
  
  // Track final state of each ball to determine valid tallies
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

  // Build tally data - only include balls that end up scored (not dead)
  const tallyData: Array<{
    playerName: string;
    player: number;
    gameNumber: number;
    ballNumber: number;
    pointsAwarded: number;
    timestamp: string;
    isValid: boolean;
  }> = [];

  let currentGame = 1;
  
  events.forEach((event: any) => {
    if (event.type === 'ball_scored') {
      const key = `${event.ballNumber}-${event.player}`;
      const ballEvents = ballStates.get(key) || [];
      const lastEvent = ballEvents[ballEvents.length - 1];
      const isValid = lastEvent && lastEvent.type === 'ball_scored';
      
      const pointsAwarded = event.ballNumber === 9 ? 2 : 1;
      const playerName = event.player === 1 ? currentMatch.player1Name : currentMatch.player2Name;
      
      tallyData.push({
        playerName,
        player: event.player,
        gameNumber: currentGame,
        ballNumber: event.ballNumber,
        pointsAwarded,
        timestamp: event.timestamp,
        isValid
      });
    } else if (event.type === 'turn_ended' && event.details?.includes('won')) {
      currentGame++;
    }
  });

  // Filter to only valid tallies and group by player
  const validTallies = tallyData.filter(t => t.isValid);
  const player1Tallies = validTallies.filter(t => t.player === 1);
  const player2Tallies = validTallies.filter(t => t.player === 2);

  const totalPlayer1Points = player1Tallies.reduce((sum, t) => sum + t.pointsAwarded, 0);
  const totalPlayer2Points = player2Tallies.reduce((sum, t) => sum + t.pointsAwarded, 0);

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
                <p>Current Score: {currentMatch.player1Score}</p>
                <p>Tallies: {player1Tallies.length} ({totalPlayer1Points} points)</p>
              </div>
              <div>
                <p><strong>{currentMatch.player2Name}</strong> (SL {currentMatch.player2SkillLevel})</p>
                <p>Current Score: {currentMatch.player2Score}</p>
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
              onClick={() => copyTableData(validTallies, currentMatch)}
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
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left', userSelect: 'text' }}>Points</th>
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
                          <td style={{ border: '1px solid #d1d5db', padding: '8px', userSelect: 'text' }}>{tally.pointsAwarded}</td>
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