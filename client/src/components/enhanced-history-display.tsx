import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Clock, Users, Trophy, TrendingUp, Trash2, Info, Database, BarChart3, Target, Calendar } from "lucide-react";
import { adaptiveStorageAPI } from "@/lib/adaptiveStorage";
import { usePrint } from "@/hooks/usePrint";
import { format } from "date-fns";
import type { Match, MatchEvent } from "@shared/schema";

interface EnhancedHistoryDisplayProps {
  expandedMatch: number | null;
  setExpandedMatch: (index: number | null) => void;
  refreshKey?: number;
}

type HistoryMatch = Match & { completedAt: string; events: MatchEvent[]; historyId: string };

export default function EnhancedHistoryDisplay({ 
  expandedMatch, 
  setExpandedMatch,
  refreshKey 
}: EnhancedHistoryDisplayProps) {
  const [, forceRender] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { printElement } = usePrint();

  // Get fresh data
  const history = useMemo(() => {
    return adaptiveStorageAPI.getMatchHistory();
  }, [refreshKey, forceRender]);

  const historyStats = useMemo(() => {
    return adaptiveStorageAPI.getMatchHistoryStats();
  }, [history]);

  const playerStats = useMemo(() => {
    if (!selectedPlayer) return null;
    return adaptiveStorageAPI.getPlayerStats(selectedPlayer);
  }, [selectedPlayer, history]);

  // Get unique players
  const uniquePlayers = useMemo(() => {
    const players = new Set<string>();
    history.forEach(match => {
      players.add(match.player1Name);
      players.add(match.player2Name);
    });
    return Array.from(players).sort();
  }, [history]);

  // Force re-render every time component mounts
  useEffect(() => {
    forceRender(Date.now());
  }, []);

  const handleDeleteMatch = (historyId: string) => {
    if (adaptiveStorageAPI.deleteMatchFromHistory(historyId)) {
      forceRender(Date.now());
      setDeleteConfirm(null);
    }
  };

  const getWinnerName = (match: HistoryMatch) => {
    if (match.winnerId === 1) return match.player1Name;
    if (match.winnerId === 2) return match.player2Name;
    return "Unknown";
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No Match History</h3>
        <p className="text-sm">Completed matches will appear here</p>
        {adaptiveStorageAPI.isUsingIndexedDB() && (
          <p className="text-xs mt-2 text-green-600">
            IndexedDB storage ready - unlimited match history available
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Storage Info & Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Match History ({history.length} matches)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{historyStats.totalMatches}</div>
              <div className="text-xs text-muted-foreground">Total Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{historyStats.totalGames}</div>
              <div className="text-xs text-muted-foreground">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{formatStorageSize(historyStats.storageSize)}</div>
              <div className="text-xs text-muted-foreground">Storage Used</div>
            </div>
            <div className="text-center">
              <Badge variant={adaptiveStorageAPI.isUsingIndexedDB() ? "default" : "secondary"} className="text-xs">
                {adaptiveStorageAPI.getStorageInfo().type}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Storage Type</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Player Stats
            </Button>
            {adaptiveStorageAPI.isUsingIndexedDB() && (
              <Badge variant="outline" className="text-xs">
                Up to 1,000 matches stored
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Match History List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {history.map((match, index) => (
            <Card key={match.historyId} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    {match.player1Name} vs {match.player2Name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {format(new Date(match.completedAt), 'MMM dd, yyyy')}
                    </Badge>
                    {adaptiveStorageAPI.isUsingIndexedDB() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(match.historyId)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Winner: <strong>{getWinnerName(match)}</strong></span>
                    <span className="text-muted-foreground">
                      {match.currentGame} game{match.currentGame !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Final Score: {match.player1Score} - {match.player2Score}</span>
                    <span className="text-muted-foreground">
                      Skill: {match.player1SkillLevel} vs {match.player2SkillLevel}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedMatch(expandedMatch === index ? null : index)}
                      className="flex items-center gap-1"
                    >
                      <Info className="h-3 w-3" />
                      {expandedMatch === index ? 'Hide' : 'Details'}
                    </Button>
                  </div>

                  {expandedMatch === index && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Match Timeline
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>Started: {format(new Date(match.createdAt || match.completedAt), 'PPpp')}</p>
                        <p>Completed: {format(new Date(match.completedAt), 'PPpp')}</p>
                        <p>Timeouts Used: {match.player1Name} ({match.player1TimeoutsUsed}) vs {match.player2Name} ({match.player2TimeoutsUsed})</p>
                        <p>Safeties Used: {match.player1Name} ({match.player1SafetiesUsed}) vs {match.player2Name} ({match.player2SafetiesUsed})</p>
                      </div>
                      
                      {match.events && match.events.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium mb-2">Game Events ({match.events.length})</h5>
                          <ScrollArea className="h-32">
                            <div className="space-y-1 text-xs">
                              {match.events.slice(-10).map((event, eventIndex) => (
                                <div key={eventIndex} className="flex justify-between py-1">
                                  <span>{event.type}: {event.description}</span>
                                  <span className="text-muted-foreground">
                                    Game {event.gameNumber}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Player Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Player Statistics
            </DialogTitle>
            <DialogDescription>
              Select a player to view their performance statistics
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <TabsList className="grid grid-cols-3 mb-4">
              {uniquePlayers.slice(0, 3).map(player => (
                <TabsTrigger key={player} value={player} className="text-xs">
                  {player.length > 8 ? `${player.slice(0, 8)}...` : player}
                </TabsTrigger>
              ))}
            </TabsList>

            {uniquePlayers.slice(0, 3).map(player => (
              <TabsContent key={player} value={player}>
                {selectedPlayer === player && playerStats && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{playerStats.matchesPlayed}</div>
                        <div className="text-xs text-muted-foreground">Matches Played</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{playerStats.matchesWon}</div>
                        <div className="text-xs text-muted-foreground">Matches Won</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{playerStats.winPercentage.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{playerStats.averageSkillLevel.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Avg Skill Level</div>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold">{playerStats.gamesPlayed}</div>
                      <div className="text-xs text-muted-foreground">Total Games Played</div>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {uniquePlayers.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              Showing stats for first 3 players. More players available in full history.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Match</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this match from history? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDeleteMatch(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}