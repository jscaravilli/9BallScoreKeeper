import type { Match, Game, BallInfo, MatchEvent } from "@shared/schema";

const STORAGE_KEYS = {
  CURRENT_MATCH: 'poolscorer_current_match',
  MATCH_COUNTER: 'poolscorer_match_counter',
  MATCH_HISTORY: 'poolscorer_match_history',
  CURRENT_MATCH_EVENTS: 'poolscorer_current_match_events'
} as const;

export class LocalStorageAPI {
  private getMatchCounter(): number {
    const counter = localStorage.getItem(STORAGE_KEYS.MATCH_COUNTER);
    return counter ? parseInt(counter, 10) : 1;
  }

  private incrementMatchCounter(): number {
    const counter = this.getMatchCounter() + 1;
    localStorage.setItem(STORAGE_KEYS.MATCH_COUNTER, counter.toString());
    return counter;
  }

  getCurrentMatch(): Match | null {
    try {
      // Safari private browsing mode check
      if (!this.isLocalStorageAvailable()) {
        console.warn('LocalStorage not available (Safari private browsing?)');
        return null;
      }
      
      const matchData = localStorage.getItem(STORAGE_KEYS.CURRENT_MATCH);
      return matchData ? JSON.parse(matchData) : null;
    } catch (error) {
      console.error('Error getting current match:', error);
      return null;
    }
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  createMatch(matchData: {
    player1Name: string;
    player1SkillLevel: number;
    player2Name: string;
    player2SkillLevel: number;
    ballStates?: BallInfo[];
  }): Match {
    const match: Match = {
      id: this.getMatchCounter(),
      player1Name: matchData.player1Name,
      player1SkillLevel: matchData.player1SkillLevel,
      player2Name: matchData.player2Name,
      player2SkillLevel: matchData.player2SkillLevel,
      player1Score: 0,
      player2Score: 0,
      currentPlayer: 1,
      currentGame: 1,
      ballStates: matchData.ballStates || [],
      isComplete: false,
      winnerId: null,
      createdAt: new Date()
    };

    this.incrementMatchCounter();
    localStorage.setItem(STORAGE_KEYS.CURRENT_MATCH, JSON.stringify(match));
    return match;
  }

  updateMatch(matchId: number, updates: Partial<Match>): Match | null {
    const currentMatch = this.getCurrentMatch();
    if (!currentMatch || currentMatch.id !== matchId) {
      return null;
    }

    const updatedMatch = { ...currentMatch, ...updates };
    localStorage.setItem(STORAGE_KEYS.CURRENT_MATCH, JSON.stringify(updatedMatch));
    return updatedMatch;
  }

  updateBallStates(matchId: number, ballStates: BallInfo[]): Match | null {
    return this.updateMatch(matchId, { ballStates });
  }

  clearCurrentMatch(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_MATCH);
  }

  // Match event tracking
  getCurrentMatchEvents(): MatchEvent[] {
    try {
      const events = localStorage.getItem(STORAGE_KEYS.CURRENT_MATCH_EVENTS);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('Error getting match events:', error);
      return [];
    }
  }

  addMatchEvent(event: MatchEvent): void {
    try {
      const events = this.getCurrentMatchEvents();
      events.push(event);
      localStorage.setItem(STORAGE_KEYS.CURRENT_MATCH_EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('Error adding match event:', error);
    }
  }

  clearCurrentMatchEvents(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_MATCH_EVENTS);
  }

  // History management
  getMatchHistory(): (Match & { completedAt: string; events: MatchEvent[] })[] {
    try {
      const history = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting match history:', error);
      return [];
    }
  }

  addToHistory(match: Match): void {
    if (!match.isComplete) return;
    
    try {
      const history = this.getMatchHistory();
      const events = this.getCurrentMatchEvents();
      
      const historyEntry = {
        ...match,
        completedAt: new Date().toISOString(),
        events: events
      };
      
      // Add to beginning of array (newest first)
      history.unshift(historyEntry);
      
      // Keep only last 50 matches to prevent localStorage bloat
      if (history.length > 50) {
        history.splice(50);
      }
      
      localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(history));
      
      // Clear current match events after saving to history
      this.clearCurrentMatchEvents();
    } catch (error) {
      console.error('Error adding to match history:', error);
    }
  }

  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.MATCH_HISTORY);
  }
}

export const localStorageAPI = new LocalStorageAPI();