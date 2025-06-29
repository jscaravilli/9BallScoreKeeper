import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { clientQueryFunctions, clientMutation, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Menu, Users, History, Settings, Plus, RotateCcw, Info, X, Trash2 } from "lucide-react";
import PlayerSetupModal from "@/components/player-setup-modal";
import GameWinModal from "@/components/game-win-modal";
import MatchWinModal from "@/components/match-win-modal";
import BallRack from "@/components/ball-rack";
import PlayerScores from "@/components/player-scores";
import { getPointsToWin } from "@/lib/apa-handicaps";
import { localStorageAPI } from "@/lib/localStorage";
import type { Match, BallInfo, MatchEvent } from "@shared/schema";

// History Display Component
function HistoryDisplay({ 
  expandedMatch, 
  setExpandedMatch 
}: { 
  expandedMatch: number | null; 
  setExpandedMatch: (index: number | null) => void; 
}) {
  const history = localStorageAPI.getMatchHistory();
  
  if (history.length === 0) {
    return (
      <div className="overflow-y-auto max-h-96">
        <div className="text-center py-8 text-gray-500">
          <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No completed matches yet.</p>
          <p className="text-sm">Win your first match to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-96">
      <div className="space-y-3">
        {history.map((match, index) => {
          const completedDate = new Date(match.completedAt);
          const winnerName = match.winnerId === 1 ? match.player1Name : match.player2Name;
          const player1Target = getPointsToWin(match.player1SkillLevel as any);
          const player2Target = getPointsToWin(match.player2SkillLevel as any);
          
          return (
            <div key={`${match.id}-${index}`} className="bg-gray-50 rounded-lg border">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedMatch(expandedMatch === index ? null : index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-gray-800">
                    🏆 {winnerName} Wins!
                  </div>
                  <div className="text-xs text-gray-500">
                    {completedDate.toLocaleDateString()} {completedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className={`p-2 rounded ${match.winnerId === 1 ? 'bg-green-100' : 'bg-white'}`}>
                    <div className="font-medium">{match.player1Name}</div>
                    <div className="text-xs text-gray-600">Skill Level {match.player1SkillLevel}</div>
                    <div className="font-bold">{match.player1Score} / {player1Target}</div>
                  </div>
                  
                  <div className={`p-2 rounded ${match.winnerId === 2 ? 'bg-green-100' : 'bg-white'}`}>
                    <div className="font-medium">{match.player2Name}</div>
                    <div className="text-xs text-gray-600">Skill Level {match.player2SkillLevel}</div>
                    <div className="font-bold">{match.player2Score} / {player2Target}</div>
                  </div>
                </div>
                
                <div className="text-xs text-blue-600 mt-2">
                  Click to {expandedMatch === index ? 'hide' : 'show'} ball-by-ball details
                </div>
              </div>
              
              {expandedMatch === index && match.events && match.events.length > 0 && (
                <div className="border-t border-gray-200 p-4 bg-white">
                  <h4 className="font-medium text-gray-800 mb-3">Match Timeline</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {match.events.map((event, eventIndex) => {
                      const eventTime = new Date(event.timestamp);
                      const timeStr = eventTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                      
                      return (
                        <div key={eventIndex} className={`text-xs p-2 rounded flex justify-between items-center ${
                          event.type === 'ball_scored' ? 'bg-green-50 border-l-2 border-green-400' :
                          event.type === 'ball_dead' ? 'bg-red-50 border-l-2 border-red-400' :
                          event.type === 'match_completed' ? 'bg-yellow-50 border-l-2 border-yellow-400' :
                          'bg-gray-50 border-l-2 border-gray-400'
                        }`}>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{event.playerName}</div>
                            <div className="text-gray-600">{event.details}</div>
                            {event.newScore !== undefined && (
                              <div className="text-gray-500">New score: {event.newScore}</div>
                            )}
                          </div>
                          <div className="text-gray-400 ml-2">{timeStr}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Game() {
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [showGameWin, setShowGameWin] = useState(false);
  const [showMatchWin, setShowMatchWin] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [gameWinner, setGameWinner] = useState<1 | 2 | null>(null);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);


  const [currentInning, setCurrentInning] = useState<number>(1);
  const [matchWinner, setMatchWinner] = useState<{
    player: 1 | 2;
    name: string;
    finalScore1: number;
    finalScore2: number;
  } | null>(null);
  const [turnHistory, setTurnHistory] = useState<{
    ballStates: BallInfo[];
    currentPlayer: number;
    player1Score: number;
    player2Score: number;
    lockedBalls?: number[]; // Optional for backward compatibility
  }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [undoInProgress, setUndoInProgress] = useState(false);
  const [nineBallUndoInProgress, setNineBallUndoInProgress] = useState(false);
  const maxTurnHistory = 10; // Keep last 10 turns for undo

  // Get current match
  const { data: currentMatch, isLoading } = useQuery<Match | null>({
    queryKey: ["/api/match/current"],
  });



  // Create new match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      return clientMutation(() => clientQueryFunctions.createMatch(matchData));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/match/current"] });
    },
  });

  // Update match mutation
  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return clientMutation(() => clientQueryFunctions.updateMatch(id, updates));
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/match/current"] });
    },
  });

  // Update ball states mutation
  const updateBallsMutation = useMutation({
    mutationFn: async ({ id, ballStates }: { id: number; ballStates: BallInfo[] }) => {
      return clientMutation(() => clientQueryFunctions.updateBallStates(id, ballStates));
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

  // Calculate locked balls directly from ball states (single source of truth)
  const getLockedBalls = (): Set<number> => {
    if (!currentMatch) return new Set();
    
    const lockedBalls = new Set<number>();
    const ballStates = currentMatch.ballStates as BallInfo[];
    
    ballStates.forEach(ball => {
      // Lock scored balls from other players
      if (ball.state === 'scored' && ball.scoredBy && ball.scoredBy !== currentMatch.currentPlayer) {
        lockedBalls.add(ball.number);
      }
      
      // Lock dead balls that are from previous innings OR from current inning but turn completed
      if (ball.state === 'dead' && ball.inning && 
          (ball.inning < currentInning || (ball.inning === currentInning && ball.turnCompleted))) {
        lockedBalls.add(ball.number);
      }
    });
    
    return lockedBalls;
  };

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
    // Reset inning count for new match
    setCurrentInning(1);
  };

  const handleBallTap = (ballNumber: number) => {
    if (!currentMatch || isProcessing || currentMatch.isComplete || matchWinner) return;
    
    // Special handling for 9-ball undo - ONLY when 9-ball is already scored
    if (ballNumber === 9 && turnHistory.length > 0) {
      const currentNineBall = (currentMatch.ballStates as BallInfo[]).find((b: BallInfo) => b.number === 9);
      
      // Only handle undo if 9-ball is currently scored (not active)
      if (currentNineBall?.state === 'scored') {
        const lastState = turnHistory[turnHistory.length - 1];
        const lastStateNineBall = lastState.ballStates.find((b: BallInfo) => b.number === 9);
        
        // Check if this is a rerack undo (current 9-ball scored, but previous state had 9-ball scored too)
        const isRerackUndo = lastStateNineBall?.state === 'scored';
        if (isRerackUndo) {
          // For rerack undo: mark 9-ball as scored and deduct 2 points
          const ballStates = [...(currentMatch.ballStates as BallInfo[])];
          const nineBallIndex = ballStates.findIndex(b => b.number === 9);
          ballStates[nineBallIndex] = { number: 9, state: 'scored', scoredBy: lastStateNineBall.scoredBy };
          
          // Restore locked balls from before the rerack
          // Find balls that were scored/dead by non-current players in the previous state
          const newLockedBalls = new Set<number>();
          const currentPlayer = currentMatch.currentPlayer;
          
          lastState.ballStates.forEach(ball => {
            if ((ball.state === 'scored' || ball.state === 'dead') && 
                ball.scoredBy && ball.scoredBy !== currentPlayer) {
              newLockedBalls.add(ball.number);
            }
          });
          
          // Locked balls are now calculated dynamically
          
          // Deduct 2 points from the player who scored it
          const scoringPlayer = lastStateNineBall.scoredBy;
          const currentScore = scoringPlayer === 1 ? currentMatch.player1Score : currentMatch.player2Score;
          const newScore = Math.max(0, currentScore - 2);
          
          // Update match with new score and ball states
          updateMatchMutation.mutate({
            id: currentMatch.id,
            updates: {
              [scoringPlayer === 1 ? 'player1Score' : 'player2Score']: newScore,
            }
          });
          
          updateBallsMutation.mutate({
            id: currentMatch.id,
            ballStates,
          });
          
          // Remove the rerack state from history
          setTurnHistory(prev => prev.slice(0, -1));
          
        } else {
          // For regular 9-ball undo: just mark as active and deduct points
          const ballStates = [...(currentMatch.ballStates as BallInfo[])];
          const nineBallIndex = ballStates.findIndex(b => b.number === 9);
          const scoringPlayer = currentNineBall.scoredBy;
          ballStates[nineBallIndex] = { number: 9, state: 'active' };
          
          // Deduct 2 points from the player who scored it
          const currentScore = scoringPlayer === 1 ? currentMatch.player1Score : currentMatch.player2Score;
          const newScore = Math.max(0, currentScore - 2);
          
          // Update match with new score and ball states
          updateMatchMutation.mutate({
            id: currentMatch.id,
            updates: {
              [scoringPlayer === 1 ? 'player1Score' : 'player2Score']: newScore,
            }
          });
          
          updateBallsMutation.mutate({
            id: currentMatch.id,
            ballStates,
          });
          
          // Remove the last state from history
          setTurnHistory(prev => prev.slice(0, -1));
          
          // Clear any winner states
          setGameWinner(null);
          setShowGameWin(false);
          setMatchWinner(null);
          setShowMatchWin(false);
        }
        
        return; // Exit early after handling 9-ball undo
      }
    }
    
    // Check if ball is locked (pocketed/marked dead by other player)
    if (getLockedBalls().has(ballNumber)) {
      return; // Don't allow interaction with locked balls
    }
    
    setIsProcessing(true);
    
    // Add a small delay to prevent rapid double-taps
    setTimeout(() => {
      setIsProcessing(false);
    }, 300);

    const ballStates = [...(currentMatch.ballStates as BallInfo[] || [])];
    const ballIndex = ballStates.findIndex(b => b.number === ballNumber);
    
    if (ballIndex === -1) return;

    const ball = ballStates[ballIndex];
    
    if (ball.state === 'active') {
      // Store current state for undo functionality BEFORE modifying the ball
      // Deep clone the ball states to prevent any reference issues
      const currentState = {
        ballStates: JSON.parse(JSON.stringify(currentMatch.ballStates as BallInfo[] || [])),
        currentPlayer: currentMatch.currentPlayer,
        player1Score: currentMatch.player1Score,
        player2Score: currentMatch.player2Score,
      };
      

      
      // Add to turn history, keeping only the last maxTurnHistory turns
      setTurnHistory(prev => {
        const newHistory = [...prev, currentState];
        return newHistory.slice(-maxTurnHistory);
      });

      // First tap - score the ball
      ball.state = 'scored';
      ball.scoredBy = currentMatch.currentPlayer as 1 | 2;
      
      // Track the inning when this ball was scored
      ball.inning = currentInning;
      

      
      // Get handicap targets
      const player1Target = getPointsToWin(currentMatch.player1SkillLevel as any);
      const player2Target = getPointsToWin(currentMatch.player2SkillLevel as any);
      
      // Calculate points (balls 1-8 = 1 point, ball 9 = 2 points)
      const points = ballNumber === 9 ? 2 : 1;
      const newScore = currentMatch.currentPlayer === 1 
        ? currentMatch.player1Score + points
        : currentMatch.player2Score + points;

      // Track ball scoring event
      const ballScoredEvent: MatchEvent = {
        type: 'ball_scored',
        timestamp: new Date().toISOString(),
        player: currentMatch.currentPlayer as 1 | 2,
        playerName: currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name,
        ballNumber: ballNumber,
        pointsAwarded: points,
        newScore: newScore,
        details: `${ballNumber}-Ball scored for ${points} point${points > 1 ? 's' : ''}`
      };
      localStorageAPI.addMatchEvent(ballScoredEvent);

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
        
        // Show match win modal
        setShowMatchWin(true);
        
        try {
          const completedMatch = {
            ...currentMatch,
            [currentMatch.currentPlayer === 1 ? 'player1Score' : 'player2Score']: newScore,
            isComplete: true,
            winnerId: currentMatch.currentPlayer,
            ballStates: ballStates
          };
          
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
          
          // Track match completion event
          const matchCompletedEvent: MatchEvent = {
            type: 'match_completed',
            timestamp: new Date().toISOString(),
            player: currentMatch.currentPlayer as 1 | 2,
            playerName: currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name,
            details: `Match won by ${currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name} with final score ${currentMatch.currentPlayer === 1 ? newScore : currentMatch.player1Score}-${currentMatch.currentPlayer === 2 ? newScore : currentMatch.player2Score}`
          };
          localStorageAPI.addMatchEvent(matchCompletedEvent);

          // Save completed match to local history
          localStorageAPI.addToHistory(completedMatch);
          
          console.log('Match win mutations sent and saved to history');
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

      // Update ball states first
      updateBallsMutation.mutate({
        id: currentMatch.id,
        ballStates,
      });

      // Check for special 9-ball win (9-ball pocketed during game)
      if (ballNumber === 9) {
        console.log('9-ball win triggered, ball states should be:', ballStates);
        setGameWinner(currentMatch.currentPlayer as 1 | 2);
        setShowGameWin(true);
        // Don't return - let the mutation complete
      }
    } else if (ball.state === 'scored') {
      // Prevent 9-ball from being marked dead
      if (ballNumber === 9) {
        return; // 9-ball cannot be marked dead
      }
      
      // Store current state for undo functionality BEFORE marking ball as dead
      const currentState = {
        ballStates: JSON.parse(JSON.stringify(currentMatch.ballStates as BallInfo[] || [])),
        currentPlayer: currentMatch.currentPlayer,
        player1Score: currentMatch.player1Score,
        player2Score: currentMatch.player2Score,
      };
      

      
      // Add to turn history
      setTurnHistory(prev => {
        const newHistory = [...prev, currentState];
        return newHistory.slice(-maxTurnHistory);
      });
      
      // Second tap on scored ball - mark as dead and deduct points
      const currentPlayerScore = ball.scoredBy === currentMatch.currentPlayer 
        ? (ball.scoredBy === 1 ? currentMatch.player1Score : currentMatch.player2Score)
        : (ball.scoredBy === 1 ? currentMatch.player1Score : currentMatch.player2Score);

      const points = ballNumber === 9 ? 2 : 1;
      const newScore = Math.max(0, currentPlayerScore - points);

      if (ball.scoredBy) {
        // Track points deduction event
        const ballDeadEvent: MatchEvent = {
          type: 'ball_dead',
          timestamp: new Date().toISOString(),
          player: ball.scoredBy,
          playerName: ball.scoredBy === 1 ? currentMatch.player1Name : currentMatch.player2Name,
          ballNumber: ballNumber,
          pointsAwarded: -points,
          newScore: newScore,
          details: `${ballNumber}-Ball marked dead, ${points} point${points > 1 ? 's' : ''} deducted`
        };
        localStorageAPI.addMatchEvent(ballDeadEvent);

        updateMatchMutation.mutate({
          id: currentMatch.id,
          updates: {
            [ball.scoredBy === 1 ? 'player1Score' : 'player2Score']: newScore,
          }
        });
      }
      
      ball.state = 'dead';
      // Keep scoredBy to track who marked it dead for turn completion logic
      ball.inning = currentInning; // Track which inning ball was marked dead
      
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
    const currentState = {
      ballStates: JSON.parse(JSON.stringify(currentMatch.ballStates as BallInfo[] || [])),
      currentPlayer: currentMatch.currentPlayer,
      player1Score: currentMatch.player1Score,
      player2Score: currentMatch.player2Score,
    };
    
    setTurnHistory(prev => {
      const newHistory = [...prev, currentState];
      return newHistory.slice(-maxTurnHistory);
    });

    // Mark all balls scored by current player as turn completed
    const ballStates = [...(currentMatch.ballStates as BallInfo[])];
    let ballStatesChanged = false;
    
    ballStates.forEach(ball => {
      if ((ball.state === 'scored' || ball.state === 'dead') && 
          ball.scoredBy === currentMatch.currentPlayer && 
          !ball.turnCompleted) {

        ball.turnCompleted = true;
        ballStatesChanged = true;
      }
    });

    // Switch to the other player
    const nextPlayer = currentMatch.currentPlayer === 1 ? 2 : 1;
    
    // Only increment inning when player 2 finishes their turn (completing the full inning)
    if (currentMatch.currentPlayer === 2) {
      setCurrentInning(prev => prev + 1);
    }

    // Update ball states if any were marked as turn completed
    if (ballStatesChanged) {
      updateBallsMutation.mutate({
        id: currentMatch.id,
        ballStates,
      });
    }

    // Switch to the other player - locked balls will be updated automatically by useEffect
    updateMatchMutation.mutate({
      id: currentMatch.id,
      updates: {
        currentPlayer: nextPlayer,
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

    setTurnHistory([]);
    setMatchWinner(null);
    setShowMatchWin(false);
    setShowResetConfirm(false);
    // Reset innings to 1 for match reset
    setCurrentInning(1);
  };

  const handleUndoTurn = () => {
    console.log('ENHANCED handleUndoTurn called', { 
      hasMatch: !!currentMatch, 
      historyLength: turnHistory.length, 
      undoInProgress 
    });
    
    if (!currentMatch || turnHistory.length === 0 || undoInProgress) return;
    
    // Get the most recent state from history
    const previousState = turnHistory[turnHistory.length - 1];
    const currentBallStates = currentMatch.ballStates as BallInfo[] || [];
    const previousBallStates = previousState.ballStates;
    
    // Check if undoing involves a 9-ball that was scored (rack completion)
    const nineBallCurrent = currentBallStates.find(ball => ball.number === 9);
    const nineBallPrevious = previousBallStates.find(ball => ball.number === 9);
    
    console.log('Checking rack undo:', {
      nineBallCurrent: nineBallCurrent?.state,
      nineBallPrevious: nineBallPrevious?.state,
      currentBallStates,
      previousBallStates
    });
    
    // Rack undo detection is now handled via the "Continue Match" button
    // Regular undo proceeds normally
    
    executeUndo();
  };

  const executeUndo = () => {
    if (!currentMatch || turnHistory.length === 0) return;
    
    const previousState = turnHistory[turnHistory.length - 1];
    
    console.log('Executing undo...');
    console.log('Current ball states:', currentMatch.ballStates);
    console.log('Previous ball states to restore:', previousState.ballStates);
    
    // Calculate current inning from the restored state (clean slate)
    const maxInning = Math.max(...previousState.ballStates.filter((b: BallInfo) => b.inning).map((b: BallInfo) => b.inning!), 1);
    setCurrentInning(maxInning);
    
    // Log the undo event
    const undoEvent: MatchEvent = {
      type: 'turn_ended',
      timestamp: new Date().toISOString(),
      player: currentMatch.currentPlayer as 1 | 2,
      playerName: currentMatch.currentPlayer === 1 ? currentMatch.player1Name : currentMatch.player2Name,
      details: 'Turn undone - reverted to previous state'
    };
    localStorageAPI.addMatchEvent(undoEvent);
    
    setUndoInProgress(true);

    updateMatchMutation.mutate({
      id: currentMatch.id,
      updates: {
        currentPlayer: previousState.currentPlayer,
        player1Score: previousState.player1Score,
        player2Score: previousState.player2Score,
        isComplete: false,
        winnerId: null,
      }
    });

    // Ensure completely clean ball state restoration - deep clone to avoid any references
    const cleanBallStates = JSON.parse(JSON.stringify(previousState.ballStates));
    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: cleanBallStates,
    });

    // Remove the last state from history
    setTurnHistory(prev => prev.slice(0, -1));
    setMatchWinner(null);
    setShowMatchWin(false);
    
    setTimeout(() => {
      setUndoInProgress(false);
    }, 500);
  };



  const handleNewGame = () => {
    setShowNewGameConfirm(true);
  };

  const confirmNewGame = () => {
    // Clear current match state and show player setup for new match
    setTurnHistory([]);
    setMatchWinner(null);
    setShowMatchWin(false);
    setShowNewGameConfirm(false);
    setShowPlayerSetup(true);
    // Reset inning count for new match
    setCurrentInning(1);
    
    // Invalidate current match query to clear the data
    queryClient.setQueryData(["/api/match/current"], null);
  };

  const handleContinueMatch = () => {
    setShowGameWin(false);
    setGameWinner(null);
  };

  const handleRerack = () => {
    if (!currentMatch) return;

    // Save current state before rerack (with 9-ball scored)
    const currentBallStates = currentMatch.ballStates as BallInfo[];
    const stateBeforeRerack = {
      player1Score: currentMatch.player1Score,
      player2Score: currentMatch.player2Score,
      currentPlayer: currentMatch.currentPlayer,
      ballStates: JSON.parse(JSON.stringify(currentBallStates)),
      previousBallStates: turnHistory.length > 0 ? turnHistory[turnHistory.length - 1].ballStates : currentBallStates
    };

    // Add rerack state to turn history
    setTurnHistory(prev => {
      const newHistory = [...prev, stateBeforeRerack];
      return newHistory.slice(-maxTurnHistory); // Keep only last 10 states
    });

    const initialBallStates: BallInfo[] = Array.from({ length: 9 }, (_, i) => ({
      number: (i + 1) as BallInfo['number'],
      state: 'active' as const,
    }));

    updateBallsMutation.mutate({
      id: currentMatch.id,
      ballStates: initialBallStates,
    });

    // Create rerack event
    const rerackEvent: MatchEvent = {
      type: 'turn_ended',
      timestamp: new Date().toISOString(),
      player: gameWinner as 1 | 2,
      playerName: gameWinner === 1 ? currentMatch.player1Name : currentMatch.player2Name,
      details: 'Rerack - New game started after 9-ball win'
    };
    localStorageAPI.addMatchEvent(rerackEvent);

    setShowGameWin(false);
    setGameWinner(null);
    // Locked balls are now calculated dynamically
    // Note: Innings continue across games within same match
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
      <header className="bg-green-950/50 backdrop-blur-sm border-b border-green-700/30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMenu(true)}
              className="bg-green-800 p-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Menu className="h-5 w-5 text-green-100" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Joseph's Unofficial APA 9 Ball Scorekeeper</h1>
              <p className="text-green-200 text-sm">Game {currentMatch.currentGame} • Inning {currentInning}</p>
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
              disabled={turnHistory.length === 0 || undoInProgress}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Undo Last Action
            </Button>
            <Button
              onClick={() => setShowNewGameConfirm(true)}
              variant="outline"
              size="sm"
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              New Match
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
        lockedBalls={getLockedBalls()}
        turnHistory={turnHistory}
        currentInning={currentInning}
        currentPlayer={currentMatch.currentPlayer as 1 | 2}
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
            New Match
          </Button>
        </div>

        {turnHistory.length > 0 && (
          <Button
            variant="outline"
            className="w-full py-3 px-4 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            onClick={handleUndoTurn}
          >
            <History className="h-4 w-4 mr-2" />
            Undo Last Action
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

      <MatchWinModal 
        open={showMatchWin}
        onClose={() => setShowMatchWin(false)}
        currentMatch={currentMatch}
        onNewMatch={handleNewGame}
      />

      {/* Menu Modal */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Menu</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowControls(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Info className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Controls</span>
              </button>
              
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowHistory(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <History className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Match History</span>
              </button>
              
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowAbout(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Info className="h-5 w-5 text-gray-600" />
                <span className="font-medium">About</span>
              </button>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Controls Modal */}
      <Dialog open={showControls} onOpenChange={setShowControls}>
        <DialogContent className="max-w-md mx-auto">
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Ball Controls</h2>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">How to Use Ball Controls:</h3>
                <ul className="space-y-2">
                  <li><strong>First tap:</strong> Mark ball as scored by current player</li>
                  <li><strong>Second tap:</strong> Mark ball as dead (removes points)</li>
                  <li><strong>Third tap:</strong> Reset ball to active state</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Scoring:</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• Balls 1-8: 1 point each</li>
                  <li>• 9-ball: 2 points</li>
                  <li>• Pocketing the 9-ball wins the game instantly</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">APA Handicap System:</h3>
                <p className="text-green-700">Players race to their skill level target. Higher skill levels need more points to win the match.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg mx-auto max-h-[80vh] overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Match History</h2>
              <div className="mr-16">
                <button 
                  onClick={() => {
                    if (confirm('Clear all match history? This cannot be undone.')) {
                      localStorageAPI.clearHistory();
                      setShowHistory(false);
                    }
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                  title="Clear History"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <HistoryDisplay 
              expandedMatch={expandedMatch} 
              setExpandedMatch={setExpandedMatch} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <Dialog open={showNewGameConfirm} onOpenChange={setShowNewGameConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Start New Match?</h2>
            <p className="text-gray-600 mb-6">
              This will take you back to player setup to start a completely new match. Current progress will be lost.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowNewGameConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmNewGame}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                New Match
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Current Match?</h2>
            <p className="text-gray-600 mb-6">
              This will reset the current match to 0-0, clear all ball states, and reset innings to 1.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmResetGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reset Match
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Modal */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800">About</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-700">Joseph's Unofficial APA 9 Ball Scorekeeper</h3>
                <p className="text-sm text-gray-600">Version 1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Developed by Joseph<br />
                  from IL-West Suburban League
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAbout(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 9-Ball Undo Indicator */}
      {nineBallUndoInProgress && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in duration-300">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">Undoing previous action</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}