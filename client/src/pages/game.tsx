import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Menu, Users, History, Settings, Plus, RotateCcw } from "lucide-react";
import PlayerSetupModal from "@/components/player-setup-modal";
import GameWinModal from "@/components/game-win-modal";
import MatchWinModal from "@/components/match-win-modal";
import BallRack from "@/components/ball-rack";
import PlayerScores from "@/components/player-scores";
import { getPointsToWin } from "@/lib/apa-handicaps";
import type { Match, BallInfo } from "@shared/schema";

export default function Game() {
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [showGameWin, setShowGameWin] = useState(false);
  const [showMatchWin, setShowMatchWin] = useState(false);
  const [gameWinner, setGameWinner] = useState<1 | 2 | null>(null);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previousTurnState, setPreviousTurnState] = useState<{
    ballStates: BallInfo[];
    currentPlayer: number;
    player1Score: number;
    player2Score: number;
  } | null>(null);

  // Get current match
  const { data: currentMatch, isLoading } = useQuery<Match | null>({
    queryKey: ["/api/match/current"],
  });

  // Create new match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      const response = await apiRequest("POST", "/api/match", matchData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/match/current"] });
    },
  });

  // Update match mutation
  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/match/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/match/current"] });
    },
  });

  // Update ball states mutation
  const updateBallsMutation = useMutation({
    mutationFn: async ({ id, ballStates }: { id: number; ballStates: BallInfo[] }) => {
      const response = await apiRequest("PATCH", `/api/match/${id}/balls`, { ballStates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/match/current"] });
    },
  });

  // Always show player setup modal when there's no current match
  useEffect(() => {
    if (!isLoading && !currentMatch) {
      setShowPlayerSetup(true);
    }
  }, [isLoading, currentMatch]);

  const handleNewMatch = () => {
    setShowPlayerSetup(true);
  };

  const handlePlayerSetup = (player1Name: string, player1SkillLevel: number, player2Name: string, player2SkillLevel: number) => {
    const initialBallStates: BallInfo[] = Array.from({ length: 9 }, (_, i) => ({
      number: (i + 1) as BallInfo['number'],
      state: 'active' as const,
    }));

    createMatchMutation.mutate({
      player1Name,
      player1SkillLevel,
      player1Score: 0,
      player2Name,
      player2SkillLevel,
      player2Score: 0,
      currentPlayer: 1,
      currentGame: 1,
      ballStates: initialBallStates,
      isComplete: false,
      winnerId: null,
    });
    setShowPlayerSetup(false);
  };

  const handleBallTap = (ballNumber: number) => {
    if (!currentMatch) return;

    const ballStates = [...(currentMatch.ballStates as BallInfo[] || [])];
    const ballIndex = ballStates.findIndex(b => b.number === ballNumber);
    
    if (ballIndex === -1) return;

    const ball = ballStates[ballIndex];
    
    if (ball.state === 'active') {
      // First tap - score the ball
      ball.state = 'scored';
      ball.scoredBy = currentMatch.currentPlayer as 1 | 2;
      
      // Calculate points (balls 1-8 = 1 point, ball 9 = 2 points)
      const points = ballNumber === 9 ? 2 : 1;
      const currentPlayerScore = currentMatch.currentPlayer === 1 
        ? currentMatch.player1Score + points
        : currentMatch.player2Score + points;

      // Update match with new score
      updateMatchMutation.mutate({
        id: currentMatch.id,
        updates: {
          [currentMatch.currentPlayer === 1 ? 'player1Score' : 'player2Score']: currentPlayerScore,
        }
      });

      // Check if ball 9 was scored (game over)
      if (ballNumber === 9) {
        setGameWinner(currentMatch.currentPlayer as 1 | 2);
        
        // Check if match is won (player reached their handicap target)
        const player1Target = getPointsToWin(currentMatch.player1SkillLevel as any);
        const player2Target = getPointsToWin(currentMatch.player2SkillLevel as any);
        
        const finalPlayer1Score = currentMatch.currentPlayer === 1 ? currentPlayerScore : currentMatch.player1Score;
        const finalPlayer2Score = currentMatch.currentPlayer === 2 ? currentPlayerScore : currentMatch.player2Score;
        
        if (finalPlayer1Score >= player1Target || finalPlayer2Score >= player2Target) {
          // Match is won - complete the match
          updateMatchMutation.mutate({
            id: currentMatch.id,
            updates: {
              isComplete: true,
              winnerId: currentMatch.currentPlayer,
            }
          });
          setShowMatchWin(true);
        } else {
          // Game won but match not over - show game win modal with rerack option
          setShowGameWin(true);
        }
        return;
      }

      // Player continues shooting after making a ball - no turn switch
      
    } else if (ball.state === 'scored') {
      // Second tap - mark as dead (deduct points from the player who scored it)
      if (ball.scoredBy) {
        const points = ballNumber === 9 ? 2 : 1;
        const currentPlayerScore = ball.scoredBy === 1 
          ? currentMatch.player1Score - points
          : currentMatch.player2Score - points;

        // Update match with deducted score
        updateMatchMutation.mutate({
          id: currentMatch.id,
          updates: {
            [ball.scoredBy === 1 ? 'player1Score' : 'player2Score']: Math.max(0, currentPlayerScore),
          }
        });
      }
      
      ball.state = 'dead';
      ball.scoredBy = undefined;
    } else {
      // Third tap - reset to active (also deduct points if it was previously scored)
      ball.state = 'active';
      ball.scoredBy = undefined;
    }

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates,
    });
  };

  const handleEndTurn = () => {
    if (!currentMatch) return;

    // Save current state before switching turns
    setPreviousTurnState({
      ballStates: currentMatch.ballStates as BallInfo[] || [],
      currentPlayer: currentMatch.currentPlayer,
      player1Score: currentMatch.player1Score,
      player2Score: currentMatch.player2Score,
    });

    // Switch to the other player
    updateMatchMutation.mutate({
      id: currentMatch.id,
      updates: {
        currentPlayer: currentMatch.currentPlayer === 1 ? 2 : 1,
      }
    });
  };

  const handleResetGame = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    if (!currentMatch) return;

    const initialBallStates: BallInfo[] = Array.from({ length: 9 }, (_, i) => ({
      number: (i + 1) as BallInfo['number'],
      state: 'active' as const,
    }));

    updateMatchMutation.mutate({
      id: currentMatch.id,
      updates: {
        currentPlayer: 1,
        player1Score: 0,
        player2Score: 0,
      }
    });

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: initialBallStates,
    });

    setPreviousTurnState(null);
    setShowResetConfirm(false);
  };

  const handleUndoTurn = () => {
    if (!currentMatch || !previousTurnState) return;

    updateMatchMutation.mutate({
      id: currentMatch.id,
      updates: {
        currentPlayer: previousTurnState.currentPlayer,
        player1Score: previousTurnState.player1Score,
        player2Score: previousTurnState.player2Score,
      }
    });

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: previousTurnState.ballStates,
    });

    setPreviousTurnState(null);
  };

  const handleNewGame = () => {
    setShowNewGameConfirm(true);
  };

  const confirmNewGame = () => {
    if (!currentMatch) return;

    const initialBallStates: BallInfo[] = Array.from({ length: 9 }, (_, i) => ({
      number: (i + 1) as BallInfo['number'],
      state: 'active' as const,
    }));

    updateMatchMutation.mutate({
      id: currentMatch.id,
      updates: {
        currentGame: currentMatch.currentGame + 1,
        currentPlayer: 1,
        player1Score: 0,
        player2Score: 0,
      }
    });

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: initialBallStates,
    });

    setPreviousTurnState(null);
    setShowNewGameConfirm(false);
  };

  const handleContinueMatch = () => {
    setShowGameWin(false);
    handleNewGame();
  };

  const handleRerack = () => {
    if (!currentMatch) return;

    const initialBallStates: BallInfo[] = Array.from({ length: 9 }, (_, i) => ({
      number: (i + 1) as BallInfo['number'],
      state: 'active' as const,
    }));

    // Reset ball states but keep current player
    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: initialBallStates,
    });

    setShowGameWin(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">APA 9-Ball Scorer</h1>
          <p className="text-gray-600">Setting up your match...</p>
        </div>
        
        {/* Player Setup Modal - always show when no match */}
        <PlayerSetupModal 
          open={showPlayerSetup}
          onClose={() => {}} // Don't allow closing when no match exists
          onSave={handlePlayerSetup}
          currentMatch={null}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen relative">
      {/* Header */}
      <header className="pool-green text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold">APA 9-Ball</h1>
          <Button variant="ghost" size="sm" className="text-white hover:text-yellow-400">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="text-sm opacity-90 mb-2">
          <span>Match: Game {currentMatch.currentGame}</span>
          <span className="float-right">Race to Handicap</span>
        </div>
        
        <div className="pool-felt rounded-lg p-2 text-center">
          <span className="text-yellow-400 font-medium">
            Current Player: {currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name}
          </span>
        </div>
      </header>

      {/* Player Scores */}
      <PlayerScores match={currentMatch} />

      {/* Ball Rack */}
      <BallRack 
        ballStates={currentMatch.ballStates as BallInfo[] || []}
        onBallTap={handleBallTap}
      />

      {/* Game Actions */}
      <section className="p-4 pb-20">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Button 
            variant="outline" 
            className="py-3 px-4 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            onClick={handleEndTurn}
          >
            End Turn
          </Button>
          <Button 
            variant="secondary" 
            className="py-3 px-4"
            onClick={handleResetGame}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            className="pool-green text-white py-3 px-4 hover:pool-felt"
            onClick={handleNewGame}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Game
          </Button>
        </div>
        
        {/* Undo Turn Button */}
        {previousTurnState && (
          <div className="mb-3">
            <Button 
              variant="outline"
              className="w-full py-3 px-4 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
              onClick={handleUndoTurn}
            >
              <History className="h-4 w-4 mr-2" />
              Undo Last Turn
            </Button>
          </div>
        )}
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2 text-gray-600 hover:text-green-600"
            onClick={() => setShowPlayerSetup(true)}
          >
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs">Players</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2 text-gray-600 hover:text-green-600"
          >
            <History className="h-5 w-5 mb-1" />
            <span className="text-xs">History</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col items-center py-2 text-gray-600 hover:text-green-600"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </nav>

      {/* Modals */}
      <PlayerSetupModal 
        open={showPlayerSetup}
        onClose={() => setShowPlayerSetup(false)}
        onSave={handlePlayerSetup}
        currentMatch={currentMatch}
      />
      
      <GameWinModal 
        open={showGameWin}
        onClose={() => setShowGameWin(false)}
        winner={gameWinner}
        currentMatch={currentMatch}
        onContinueMatch={handleContinueMatch}
        onNewMatch={handleNewGame}
        onRerack={handleRerack}
      />
      
      <MatchWinModal 
        open={showMatchWin}
        onClose={() => setShowMatchWin(false)}
        currentMatch={currentMatch}
        onNewMatch={handleNewGame}
      />

      {/* Confirmation Dialogs */}
      <Dialog open={showNewGameConfirm} onOpenChange={setShowNewGameConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Start New Game?</h2>
            <p className="text-gray-600 mb-6">
              This will reset all ball states and scores. Current progress will be lost.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowNewGameConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmNewGame}
                className="pool-green text-white hover:pool-felt"
              >
                Start New Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Current Game?</h2>
            <p className="text-gray-600 mb-6">
              This will reset all ball states and scores to start fresh. Current progress will be lost.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmReset}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Reset Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
