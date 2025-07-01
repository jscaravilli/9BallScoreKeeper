import type { Match, BallInfo, MatchEvent } from '@shared/schema';

const COOKIE_KEYS = {
  CURRENT_MATCH: 'poolscorer_current_match',
  MATCH_COUNTER: 'poolscorer_match_counter',
  MATCH_HISTORY: 'poolscorer_match_history',
  CURRENT_MATCH_EVENTS: 'poolscorer_current_match_events'
} as const;

// Cookie options for long-term persistence
const COOKIE_OPTIONS = {
  expires: 365, // 1 year
  path: '/',
  sameSite: 'strict' as const,
  secure: window.location.protocol === 'https:'
};

class CookieStorageAPI {
  private setCookie(name: string, value: string, options = COOKIE_OPTIONS): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (options.expires * 24 * 60 * 60 * 1000));
    
    const cookieString = [
      `${name}=${encodeURIComponent(value)}`,
      `expires=${expires.toUTCString()}`,
      `path=${options.path}`,
      `SameSite=${options.sameSite}`,
      options.secure ? 'Secure' : ''
    ].filter(Boolean).join('; ');
    
    document.cookie = cookieString;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  private getMatchCounter(): number {
    const counter = this.getCookie(COOKIE_KEYS.MATCH_COUNTER);
    return counter ? parseInt(counter, 10) : 1;
  }

  private incrementMatchCounter(): number {
    const counter = this.getMatchCounter() + 1;
    this.setCookie(COOKIE_KEYS.MATCH_COUNTER, counter.toString());
    return counter;
  }

  getCurrentMatch(): Match | null {
    try {
      const matchData = this.getCookie(COOKIE_KEYS.CURRENT_MATCH);
      if (!matchData) return null;
      
      const match = JSON.parse(matchData);
      // Convert string dates back to Date objects
      if (match.createdAt) {
        match.createdAt = new Date(match.createdAt);
      }
      return match;
    } catch (error) {
      console.error('Error getting current match from cookies:', error);
      return null;
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
      player1TimeoutsUsed: 0, // Initialize timeout counters
      player2TimeoutsUsed: 0, // Initialize timeout counters
      createdAt: new Date()
    };

    this.incrementMatchCounter();
    this.setCookie(COOKIE_KEYS.CURRENT_MATCH, JSON.stringify(match));
    return match;
  }

  updateMatch(matchId: number, updates: Partial<Match>): Match | null {
    const currentMatch = this.getCurrentMatch();
    if (!currentMatch || currentMatch.id !== matchId) {
      return null;
    }

    const updatedMatch = { ...currentMatch, ...updates };
    this.setCookie(COOKIE_KEYS.CURRENT_MATCH, JSON.stringify(updatedMatch));
    return updatedMatch;
  }

  updateBallStates(matchId: number, ballStates: BallInfo[]): Match | null {
    return this.updateMatch(matchId, { ballStates });
  }

  clearCurrentMatch(): void {
    this.deleteCookie(COOKIE_KEYS.CURRENT_MATCH);
  }

  // Match event tracking
  getCurrentMatchEvents(): MatchEvent[] {
    try {
      const events = this.getCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('Error getting match events from cookies:', error);
      return [];
    }
  }

  addMatchEvent(event: MatchEvent): void {
    try {
      const events = this.getCurrentMatchEvents();
      events.push(event);
      this.setCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('Error adding match event to cookies:', error);
    }
  }

  clearCurrentMatchEvents(): void {
    this.deleteCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS);
  }

  // History management
  getMatchHistory(): (Match & { completedAt: string; events: MatchEvent[] })[] {
    try {
      const history = this.getCookie(COOKIE_KEYS.MATCH_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting match history from cookies:', error);
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
      
      // Keep only last 50 matches to prevent cookie bloat
      if (history.length > 50) {
        history.splice(50);
      }
      
      this.setCookie(COOKIE_KEYS.MATCH_HISTORY, JSON.stringify(history));
      
      // Clear current match events after saving to history
      this.clearCurrentMatchEvents();
    } catch (error) {
      console.error('Error adding to match history in cookies:', error);
    }
  }

  clearHistory(): void {
    this.deleteCookie(COOKIE_KEYS.MATCH_HISTORY);
  }

  // Migration helper: copy data from localStorage to cookies
  migrateFromLocalStorage(): void {
    try {
      // Only migrate if cookies are empty and localStorage has data
      if (this.getCurrentMatch()) return; // Already have cookie data
      
      const localMatch = localStorage.getItem('poolscorer_current_match');
      if (localMatch) {
        const match = JSON.parse(localMatch);
        this.setCookie(COOKIE_KEYS.CURRENT_MATCH, localMatch);
        console.log('Migrated current match from localStorage to cookies');
      }

      const localCounter = localStorage.getItem('poolscorer_match_counter');
      if (localCounter) {
        this.setCookie(COOKIE_KEYS.MATCH_COUNTER, localCounter);
        console.log('Migrated match counter from localStorage to cookies');
      }

      const localHistory = localStorage.getItem('poolscorer_match_history');
      if (localHistory) {
        this.setCookie(COOKIE_KEYS.MATCH_HISTORY, localHistory);
        console.log('Migrated match history from localStorage to cookies');
      }

      const localEvents = localStorage.getItem('poolscorer_current_match_events');
      if (localEvents) {
        this.setCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS, localEvents);
        console.log('Migrated match events from localStorage to cookies');
      }
    } catch (error) {
      console.error('Error migrating from localStorage to cookies:', error);
    }
  }
}

export const cookieStorageAPI = new CookieStorageAPI();

// Auto-migrate on first load
cookieStorageAPI.migrateFromLocalStorage();