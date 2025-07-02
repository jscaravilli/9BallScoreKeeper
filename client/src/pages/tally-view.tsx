import { useQuery } from "@tanstack/react-query";
import { adaptiveStorageAPI } from "@/lib/adaptiveStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TallyView() {
  const { data: currentMatch, isLoading } = useQuery({
    queryKey: ["/api/match/current"],
    queryFn: () => adaptiveStorageAPI.getCurrentMatch(),
  });

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

        {/* Tally Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Player 1 Tallies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">{currentMatch.player1Name} - Tallies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Game</th>
                      <th className="text-left p-2">Ball</th>
                      <th className="text-left p-2">Points</th>
                      <th className="text-left p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player1Tallies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center p-4 text-gray-500">No valid tallies</td>
                      </tr>
                    ) : (
                      player1Tallies.map((tally, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{tally.gameNumber}</td>
                          <td className="p-2">
                            {tally.ballNumber === 9 ? (
                              <span className="font-bold text-yellow-600">9-ball</span>
                            ) : (
                              tally.ballNumber
                            )}
                          </td>
                          <td className="p-2">
                            {tally.pointsAwarded === 2 ? (
                              <span className="font-bold">2</span>
                            ) : (
                              1
                            )}
                          </td>
                          <td className="p-2">{new Date(tally.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-2 border-t font-bold">
                Total: {player1Tallies.length} tallies, {totalPlayer1Points} points
              </div>
            </CardContent>
          </Card>

          {/* Player 2 Tallies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">{currentMatch.player2Name} - Tallies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Game</th>
                      <th className="text-left p-2">Ball</th>
                      <th className="text-left p-2">Points</th>
                      <th className="text-left p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player2Tallies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center p-4 text-gray-500">No valid tallies</td>
                      </tr>
                    ) : (
                      player2Tallies.map((tally, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{tally.gameNumber}</td>
                          <td className="p-2">
                            {tally.ballNumber === 9 ? (
                              <span className="font-bold text-yellow-600">9-ball</span>
                            ) : (
                              tally.ballNumber
                            )}
                          </td>
                          <td className="p-2">
                            {tally.pointsAwarded === 2 ? (
                              <span className="font-bold">2</span>
                            ) : (
                              1
                            )}
                          </td>
                          <td className="p-2">{new Date(tally.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-2 border-t font-bold">
                Total: {player2Tallies.length} tallies, {totalPlayer2Points} points
              </div>
            </CardContent>
          </Card>
        </div>

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