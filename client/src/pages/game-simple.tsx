import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Menu, Users, History, Settings, Plus, RotateCcw, Info, X, Trash2, Clock, Minus, Shield, Printer } from "lucide-react";
import PlayerSetupModal from "@/components/player-setup-modal";
import BallRack from "@/components/ball-rack";
import PlayerScores from "@/components/player-scores";
import { getPointsToWin } from "@/lib/apa-handicaps";
import { storageManager, type MatchHistoryEntry } from "@/lib/storageManager";
import type { Match, BallInfo, MatchEvent } from "@shared/schema";

export default function Game() {
  // Main state
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);

  // Load current match on component mount
  useEffect(() => {
    loadCurrentMatch();
  }, []);

  const loadCurrentMatch = async () => {
    try {
      setLoading(true);
      const match = await storageManager.getCurrentMatch();
      
      if (match) {
        setCurrentMatch(match);
      } else {
        // No current match, show player setup
        setShowPlayerSetup(true);
      }
    } catch (error) {
      console.error('Error loading current match:', error);
      setShowPlayerSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchHistory = async () => {
    try {
      const history = await storageManager.getMatchHistory();
      setMatchHistory(history);
    } catch (error) {
      console.error('Error loading match history:', error);
      setMatchHistory([]);
    }
  };

  const handleNewMatch = async () => {
    try {
      await storageManager.clearCurrentMatch();
      await storageManager.clearCurrentMatchEvents();
      setCurrentMatch(null);
      setShowPlayerSetup(true);
      setShowMenu(false);
    } catch (error) {
      console.error('Error starting new match:', error);
    }
  };

  const handlePlayerSetup = async (player1Name: string, player1SkillLevel: number, player2Name: string, player2SkillLevel: number) => {
    const newMatch: Match = {
      id: Date.now(),
      player1Name,
      player1SkillLevel,
      player2Name,
      player2SkillLevel,
      player1Score: 0,
      player2Score: 0,
      currentPlayer: 1,
      currentGame: 1,
      isComplete: false,
      winnerId: null,
      ballStates: Array.from({ length: 9 }, (_, i) => ({
        number: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        state: 'active' as const,
        scoredBy: undefined,
        inning: undefined
      })),
      player1TimeoutsUsed: 0,
      player2TimeoutsUsed: 0,
      player1SafetiesUsed: 0,
      player2SafetiesUsed: 0,
      createdAt: new Date()
    };

    try {
      const savedMatch = await storageManager.saveCurrentMatch(newMatch);
      setCurrentMatch(savedMatch);
      setShowPlayerSetup(false);
      
      // Add match start event
      const startEvent: MatchEvent = {
        type: 'ball_scored',
        timestamp: new Date().toISOString(),
        player: 1,
        playerName: player1Name,
        details: `Match started: ${player1Name} (SL${player1SkillLevel}) vs ${player2Name} (SL${player2SkillLevel})`
      };
      
      await storageManager.addMatchEvent(startEvent);
    } catch (error) {
      console.error('Error creating new match:', error);
    }
  };

  const handleBallClick = async (ballNumber: number) => {
    if (!currentMatch) return;

    try {
      const ballStates = [...(currentMatch.ballStates as BallInfo[] || [])];
      const ballIndex = ballStates.findIndex(b => b.number === ballNumber);
      
      if (ballIndex === -1) return;

      const ball = ballStates[ballIndex];
      
      if (ball.state === 'active') {
        // Score the ball
        ball.state = 'scored';
        ball.scoredBy = currentMatch.currentPlayer as 1 | 2;
        
        // Calculate points
        const points = ballNumber === 9 ? 2 : 1;
        const newScore = currentMatch.currentPlayer === 1 
          ? currentMatch.player1Score + points
          : currentMatch.player2Score + points;

        // Update match
        const updatedMatch = {
          ...currentMatch,
          ballStates,
          ...(currentMatch.currentPlayer === 1 
            ? { player1Score: newScore }
            : { player2Score: newScore }
          )
        };

        await storageManager.saveCurrentMatch(updatedMatch);
        setCurrentMatch(updatedMatch);

        // Add scoring event
        const scoringEvent: MatchEvent = {
          type: 'ball_scored',
          timestamp: new Date().toISOString(),
          player: currentMatch.currentPlayer as 1 | 2,
          playerName: currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name,
          ballNumber: ballNumber,
          pointsAwarded: points,
          newScore: newScore,
          details: `${ballNumber}-Ball scored for ${points} point${points > 1 ? 's' : ''}`
        };
        
        await storageManager.addMatchEvent(scoringEvent);

        // Check for match win
        const targetScore = getPointsToWin(
          currentMatch.currentPlayer === 1 
            ? currentMatch.player1SkillLevel as any
            : currentMatch.player2SkillLevel as any
        );

        if (newScore >= targetScore) {
          // Match won!
          const completedMatch = {
            ...updatedMatch,
            isComplete: true,
            winnerId: currentMatch.currentPlayer as 1 | 2
          };
          
          await storageManager.saveCurrentMatch(completedMatch);
          await storageManager.addToHistory(completedMatch);
          setCurrentMatch(completedMatch);
          
          alert(`${currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name} wins the match!`);
        }

      } else if (ball.state === 'scored') {
        // Mark as dead
        ball.state = 'dead';
        
        const updatedMatch = { ...currentMatch, ballStates };
        await storageManager.saveCurrentMatch(updatedMatch);
        setCurrentMatch(updatedMatch);

      } else if (ball.state === 'dead') {
        // Reset to active
        ball.state = 'active';
        ball.scoredBy = undefined;
        
        const updatedMatch = { ...currentMatch, ballStates };
        await storageManager.saveCurrentMatch(updatedMatch);
        setCurrentMatch(updatedMatch);
      }
    } catch (error) {
      console.error('Error handling ball click:', error);
    }
  };

  const handleEndTurn = async () => {
    if (!currentMatch) return;

    try {
      const updatedMatch = {
        ...currentMatch,
        currentPlayer: (currentMatch.currentPlayer === 1 ? 2 : 1) as 1 | 2
      };

      await storageManager.saveCurrentMatch(updatedMatch);
      setCurrentMatch(updatedMatch);

      // Add turn end event
      const turnEvent: MatchEvent = {
        type: 'turn_ended',
        timestamp: new Date().toISOString(),
        player: currentMatch.currentPlayer as 1 | 2,
        playerName: currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name,
        details: 'Turn ended'
      };
      
      await storageManager.addMatchEvent(turnEvent);
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={() => setShowMenu(true)}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Menu className="w-4 h-4" />
        </Button>
        
        <h1 className="text-2xl font-bold text-white text-center">
          9-Ball Scorer
        </h1>
        
        <div className="w-10" /> {/* Spacer */}
      </div>

      {currentMatch ? (
        <>
          {/* Player Scores */}
          <PlayerScores match={currentMatch} />

          {/* Ball Rack */}
          <BallRack 
            ballStates={currentMatch.ballStates as BallInfo[]}
            onBallClick={handleBallClick}
            currentPlayer={currentMatch.currentPlayer}
          />

          {/* Game Controls */}
          <div className="flex flex-col items-center gap-4 mt-8">
            <Button
              onClick={handleEndTurn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
            >
              End Turn
            </Button>
            
            {currentMatch.isComplete && (
              <Button
                onClick={handleNewMatch}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                Start New Match
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Button
            onClick={() => setShowPlayerSetup(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-xl"
          >
            Start New Match
          </Button>
        </div>
      )}

      {/* Player Setup Modal */}
      <PlayerSetupModal
        open={showPlayerSetup}
        onClose={() => !currentMatch && setShowPlayerSetup(false)}
        onSave={handlePlayerSetup}
        currentMatch={currentMatch}
      />

      {/* Menu Modal */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="bg-green-800 border-green-600 text-white">
          <DialogTitle>Menu</DialogTitle>
          <div className="space-y-4">
            <Button
              onClick={handleNewMatch}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Match
            </Button>
            
            <Button
              onClick={() => {
                setShowMenu(false);
                setShowHistory(true);
                loadMatchHistory();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <History className="w-4 h-4 mr-2" />
              Match History
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-green-800 border-green-600 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>Match History</DialogTitle>
          <div className="space-y-4">
            {matchHistory.length === 0 ? (
              <p className="text-green-200">No match history yet.</p>
            ) : (
              matchHistory.map((match, index) => (
                <div key={match.historyId} className="bg-green-700/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">
                        {match.player1Name} vs {match.player2Name}
                      </h3>
                      <p className="text-sm text-green-200">
                        {new Date(match.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {match.player1Score} - {match.player2Score}
                      </p>
                      <p className="text-sm text-green-200">
                        Winner: {match.winnerId === 1 ? match.player1Name : match.player2Name}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}