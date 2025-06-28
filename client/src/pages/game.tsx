import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Menu, Users, History, Settings, Plus, RotateCcw } from "lucide-react";
import PlayerSetupModal from "@/components/player-setup-modal";
import GameWinModal from "@/components/game-win-modal";
import BallRack from "@/components/ball-rack";
import PlayerScores from "@/components/player-scores";
import { getPointsToWin } from "@/lib/apa-handicaps";
import type { Match, BallInfo } from "@shared/schema";

export default function Game() {
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [showGameWin, setShowGameWin] = useState(false);
  const [gameWinner, setGameWinner] = useState<1 | 2 | null>(null);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [matchWinner, setMatchWinner] = useState<{
    player: 1 | 2;
    name: string;
    finalScore1: number;
    finalScore2: number;
  } | null>(null);
  const [previousTurnState, setPreviousTurnState] = useState<{
    ballStates: BallInfo[];
    currentPlayer: number;
    player1Score: number;
    player2Score: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [undoInProgress, setUndoInProgress] = useState(false);

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
    onSuccess: (data) => {
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

  const handlePlayerSetupSave = (player1Name: string, player1SkillLevel: number, player2Name: string, player2SkillLevel: number) => {
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
    if (!currentMatch || isProcessing || currentMatch.isComplete || matchWinner) return;
    
    setIsProcessing(true);
    
    // Add a small delay to prevent rapid double-taps
    setTimeout(() => {
      setIsProcessing(false);
    }, 300);

    // Store current state for undo functionality BEFORE any changes
    setPreviousTurnState({
      ballStates: [...(currentMatch.ballStates as BallInfo[] || [])],
      currentPlayer: currentMatch.currentPlayer,
      player1Score: currentMatch.player1Score,
      player2Score: currentMatch.player2Score,
    });

    const ballStates = [...(currentMatch.ballStates as BallInfo[] || [])];
    const ballIndex = ballStates.findIndex(b => b.number === ballNumber);
    
    if (ballIndex === -1) return;

    const ball = ballStates[ballIndex];
    
    if (ball.state === 'active') {
      // First tap - score the ball
      ball.state = 'scored';
      ball.scoredBy = currentMatch.currentPlayer as 1 | 2;
      
      // Get handicap targets
      const player1Target = getPointsToWin(currentMatch.player1SkillLevel as any);
      const player2Target = getPointsToWin(currentMatch.player2SkillLevel as any);
      
      // Calculate points (balls 1-8 = 1 point, ball 9 = 2 points)
      const points = ballNumber === 9 ? 2 : 1;
      const newScore = currentMatch.currentPlayer === 1 
        ? currentMatch.player1Score + points
        : currentMatch.player2Score + points;

      // Check if this scoring wins the match (reaches or exceeds handicap)
      const targetForCurrentPlayer = currentMatch.currentPlayer === 1 ? player1Target : player2Target;
      
      console.log('Final point check:', {
        ballNumber,
        points,
        newScore,
        target: targetForCurrentPlayer,
        willWin: newScore >= targetForCurrentPlayer,
        currentPlayer: currentMatch.currentPlayer
      });
      
      if (newScore >= targetForCurrentPlayer) {
        // Match won - player reached or exceeded handicap target
        console.log('TRIGGERING MATCH WIN');
        
        // Set local match winner state for immediate UI feedback
        setMatchWinner({
          player: currentMatch.currentPlayer as 1 | 2,
          name: currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name,
          finalScore1: currentMatch.currentPlayer === 1 ? newScore : currentMatch.player1Score,
          finalScore2: currentMatch.currentPlayer === 2 ? newScore : currentMatch.player2Score,
        });
        
        try {
          updateMatchMutation.mutate({
            id: currentMatch.id,
            updates: {
              [currentMatch.currentPlayer === 1 ? 'player1Score' : 'player2Score']: newScore,
              isComplete: true,
              winnerId: currentMatch.currentPlayer,
            }
          });
          
          // Update ball states to reflect the winning ball
          updateBallsMutation.mutate({
            id: currentMatch.id,
            ballStates,
          });
          
          console.log('Match win mutations sent');
          return;
        } catch (error) {
          console.error('Error in match completion:', error);
        }
      }

      // Update match with new score (not winning yet)
      updateMatchMutation.mutate({
        id: currentMatch.id,
        updates: {
          [currentMatch.currentPlayer === 1 ? 'player1Score' : 'player2Score']: newScore,
        }
      });

      // Check for special 9-ball win (9-ball pocketed during game)
      if (ballNumber === 9) {
        setGameWinner(currentMatch.currentPlayer as 1 | 2);
        setShowGameWin(true);
        return;
      }

      // Update ball states
      updateBallsMutation.mutate({
        id: currentMatch.id,
        ballStates,
      });
    } else if (ball.state === 'scored') {
      // Second tap on scored ball - mark as dead and deduct points
      const currentPlayerScore = ball.scoredBy === currentMatch.currentPlayer 
        ? (ball.scoredBy === 1 ? currentMatch.player1Score : currentMatch.player2Score)
        : (ball.scoredBy === 1 ? currentMatch.player1Score : currentMatch.player2Score);

      const points = ballNumber === 9 ? 2 : 1;
      const newScore = Math.max(0, currentPlayerScore - points);

      if (ball.scoredBy) {
        updateMatchMutation.mutate({
          id: currentMatch.id,
          updates: {
            [ball.scoredBy === 1 ? 'player1Score' : 'player2Score']: newScore,
          }
        });
      }
      
      ball.state = 'dead';
      ball.scoredBy = undefined;
      
      // Update ball states
      updateBallsMutation.mutate({
        id: currentMatch.id,
        ballStates,
      });
    } else {
      // Third tap - reset to active
      ball.state = 'active';
      ball.scoredBy = undefined;
      
      // Update ball states
      updateBallsMutation.mutate({
        id: currentMatch.id,
        ballStates,
      });
    }
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

  const confirmResetGame = () => {
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
        isComplete: false,
        winnerId: null,
      }
    });

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: initialBallStates,
    });

    setPreviousTurnState(null);
    setMatchWinner(null);
    setShowResetConfirm(false);
  };

  const handleUndoTurn = () => {
    console.log('handleUndoTurn called', { 
      hasMatch: !!currentMatch, 
      hasPreviousState: !!previousTurnState, 
      undoInProgress 
    });
    
    if (!currentMatch || !previousTurnState || undoInProgress) return;
    
    console.log('Executing undo...');
    console.log('Current ball states:', currentMatch.ballStates);
    console.log('Previous ball states to restore:', previousTurnState.ballStates);
    
    setUndoInProgress(true);

    updateMatchMutation.mutate({
      id: currentMatch.id,
      updates: {
        currentPlayer: previousTurnState.currentPlayer,
        player1Score: previousTurnState.player1Score,
        player2Score: previousTurnState.player2Score,
        isComplete: false,
        winnerId: null,
      }
    });

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: previousTurnState.ballStates,
    });

    setPreviousTurnState(null);
    setMatchWinner(null);
    
    setTimeout(() => {
      setUndoInProgress(false);
    }, 500);
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
        isComplete: false,
        winnerId: null,
      }
    });

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: initialBallStates,
    });

    setPreviousTurnState(null);
    setMatchWinner(null);
    setShowNewGameConfirm(false);
  };

  const handleContinueMatch = () => {
    setShowGameWin(false);
    setGameWinner(null);
  };

  const handleRerack = () => {
    if (!currentMatch) return;

    const initialBallStates: BallInfo[] = Array.from({ length: 9 }, (_, i) => ({
      number: (i + 1) as BallInfo['number'],
      state: 'active' as const,
    }));

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: initialBallStates,
    });

    setShowGameWin(false);
    setGameWinner(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show setup modal if no current match
  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <PlayerSetupModal
          open={showPlayerSetup}
          onClose={() => setShowPlayerSetup(false)}
          onSave={handlePlayerSetupSave}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 pb-20">
      {/* Header */}
      <header className="bg-green-950/50 backdrop-blur-sm border-b border-green-700/30 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-800 p-2 rounded-lg">
              <Menu className="h-5 w-5 text-green-100" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">APA 9 Ball Scorekeeper</h1>
              <p className="text-green-200 text-sm">Game {currentMatch.currentGame}</p>
            </div>
          </div>
          <span className="bg-green-800/50 text-green-100 px-3 py-1 rounded-full text-sm font-medium">
            {currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name}'s Turn
          </span>
        </div>
      </header>

      {/* Winner Announcement */}
      {(matchWinner || (currentMatch.isComplete && currentMatch.winnerId)) && (
        <div className="mx-4 mb-4 p-4 bg-green-100 border-2 border-green-300 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            🏆 {matchWinner ? matchWinner.name : (currentMatch.winnerId === 1 ? currentMatch.player1Name : currentMatch.player2Name)} Wins!
          </h2>
          <p className="text-green-700 text-lg">
            Final Score: {matchWinner ? `${matchWinner.finalScore1} - ${matchWinner.finalScore2}` : `${currentMatch.player1Score} - ${currentMatch.player2Score}`}
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <Button
              onClick={handleUndoTurn}
              variant="outline"
              size="sm"
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
              disabled={!previousTurnState || undoInProgress}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Undo Final Point
            </Button>
            <Button
              onClick={() => setShowNewGameConfirm(true)}
              variant="outline"
              size="sm"
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              New Game
            </Button>
          </div>
        </div>
      )}

      {/* Player Scores */}
      <PlayerScores 
        match={currentMatch}
        overrideScores={matchWinner ? {
          player1Score: matchWinner.finalScore1,
          player2Score: matchWinner.finalScore2
        } : undefined}
      />

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
            variant="outline" 
            className="py-3 px-4 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            onClick={handleNewGame}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Game
          </Button>
        </div>

        {previousTurnState && (
          <Button
            variant="outline"
            className="w-full py-3 px-4 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            onClick={handleUndoTurn}
          >
            <History className="h-4 w-4 mr-2" />
            Undo Last Turn
          </Button>
        )}
      </section>

      {/* Modals */}
      <PlayerSetupModal
        open={showPlayerSetup}
        onClose={() => setShowPlayerSetup(false)}
        onSave={handlePlayerSetupSave}
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

      {/* Confirmation Dialogs */}
      <Dialog open={showNewGameConfirm} onOpenChange={setShowNewGameConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Start New Game?</h2>
            <p className="text-gray-600 mb-6">
              This will start a completely new match with reset scores. Current progress will be lost.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowNewGameConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmNewGame}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
              This will reset the current game to 0-0 and clear all ball states.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmResetGame}
                className="bg-red-600 hover:bg-red-700 text-white"
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