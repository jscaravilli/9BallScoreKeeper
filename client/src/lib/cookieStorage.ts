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

  // Multi-cookie history management - one cookie per match
  getMatchHistory(): (Match & { completedAt: string; events: MatchEvent[]; historyId: string })[] {
    try {
      const history: (Match & { completedAt: string; events: MatchEvent[]; historyId: string })[] = [];
      
      // Get the index of stored matches
      const indexCookie = this.getCookie('match_history_index');
      console.log(`Raw index cookie value: ${indexCookie}`);
      
      if (!indexCookie) {
        console.log('DEBUG: No match history index found. Checking for orphaned match cookies...');
        // Check if there are any match history cookies without an index
        const allCookies = document.cookie.split(';');
        const matchCookies = allCookies.filter(cookie => cookie.trim().startsWith('match_history_') && !cookie.trim().startsWith('match_history_index'));
        console.log(`Found ${matchCookies.length} orphaned match history cookies:`, matchCookies.map(c => c.split('=')[0].trim()));
        
        // If we have orphaned cookies, let's rebuild the index
        if (matchCookies.length > 0) {
          console.log('Attempting to rebuild index from orphaned cookies...');
          const orphanedIds = matchCookies.map(c => c.split('=')[0].trim().replace('match_history_', ''));
          this.setCookie('match_history_index', JSON.stringify(orphanedIds));
          console.log(`Rebuilt index with ${orphanedIds.length} matches: ${JSON.stringify(orphanedIds)}`);
          
          // Now try to load them
          const matchIds = orphanedIds;
          console.log(`Using rebuilt match IDs: ${JSON.stringify(matchIds)}`);
        } else {
          return [];
        }
        return [];
      }
      
      const matchIds = indexCookie ? JSON.parse(indexCookie) : [];
      console.log(`Getting match history. Index contains: ${matchIds.length} matches`);
      console.log(`Match IDs: ${JSON.stringify(matchIds)}`);
      
      // Load each match from its individual cookie
      for (const matchId of matchIds) {
        const matchCookie = this.getCookie(`match_history_${matchId}`);
        console.log(`Loading match ${matchId}: ${matchCookie ? 'found' : 'missing'}`);
        if (matchCookie) {
          try {
            const match = JSON.parse(matchCookie);
            // Ensure historyId exists for older entries
            if (!match.historyId) {
              match.historyId = matchId;
            }
            history.push(match);
            console.log(`Successfully loaded match: ${match.player1Name} vs ${match.player2Name}`);
          } catch (parseError) {
            console.warn(`Error parsing match ${matchId}, removing from index`);
            // Remove corrupted match from index
            this.removeMatchFromIndex(matchId);
          }
        } else {
          // Cookie missing, remove from index
          console.warn(`Match cookie ${matchId} missing, removing from index`);
          console.warn(`DEBUG: Looking for cookie with key: match_history_${matchId}`);
          
          // List all cookies that start with match_history_ to see what we actually have
          const allCookies = document.cookie.split(';');
          const allMatchCookies = allCookies.filter(cookie => cookie.trim().startsWith('match_history_'));
          console.warn(`All available match history cookies:`, allMatchCookies.map(c => c.split('=')[0].trim()));
          
          this.removeMatchFromIndex(matchId);
        }
      }
      
      console.log(`Final history array contains ${history.length} matches`);
      
      // Remove duplicates based on historyId (in case of corruption or double-saves)
      const uniqueHistory = history.filter((match, index, self) => 
        index === self.findIndex(m => m.historyId === match.historyId)
      );
      
      console.log(`After duplicate removal: ${uniqueHistory.length} matches`);
      
      // Sort by completion date (newest first)
      return uniqueHistory.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    } catch (error) {
      console.error('Error getting match history from cookies:', error);
      return [];
    }
  }

  private removeMatchFromIndex(matchId: string): void {
    try {
      const indexCookie = this.getCookie('match_history_index');
      const matchIds = indexCookie ? JSON.parse(indexCookie) : [];
      const updatedIds = matchIds.filter((id: string) => id !== matchId);
      this.setCookie('match_history_index', JSON.stringify(updatedIds));
      // Also delete the match cookie if it exists
      this.deleteCookie(`match_history_${matchId}`);
    } catch (error) {
      console.error('Error removing match from index:', error);
    }
  }

  addToHistory(match: Match): void {
    if (!match.isComplete) return;
    
    try {
      const events = this.getCurrentMatchEvents();
      
      // Create unique history ID (timestamp + match ID + random)
      const uniqueHistoryId = `${Date.now()}_${match.id}_${Math.random().toString(36).substr(2, 9)}`;
      
      const historyEntry = {
        ...match,
        completedAt: new Date().toISOString(),
        events: events,
        historyId: uniqueHistoryId  // Add unique ID to prevent duplicates
      };
      
      // Create unique cookie key
      const matchKey = uniqueHistoryId;
      
      // Store the match in its own cookie
      const historyData = JSON.stringify(historyEntry);
      const cookieKey = `match_history_${matchKey}`;
      console.log(`Storing match cookie: ${cookieKey}`);
      console.log(`Cookie size: ${historyData.length} bytes`);
      
      // Check if cookie size is too large (browser limit is usually 4KB)
      if (historyData.length > 4000) {
        console.warn(`Cookie size ${historyData.length} bytes may exceed browser limits!`);
      }
      
      this.setCookie(cookieKey, historyData);
      
      // Verify the cookie was stored
      const verification = this.getCookie(cookieKey);
      console.log(`Cookie verification: ${verification ? 'SUCCESS' : 'FAILED'}`);
      
      if (!verification) {
        console.error(`CRITICAL: Cookie ${cookieKey} was not saved!`);
        console.error(`Data length: ${historyData.length} characters`);
        console.error(`First 200 chars of data: ${historyData.substring(0, 200)}...`);
      } else {
        console.log(`Successfully stored cookie ${cookieKey}`);
        console.log(`Verified data length: ${verification.length} characters`);
      }
      
      // Update the index
      const indexCookie = this.getCookie('match_history_index');
      console.log(`Current index cookie: ${indexCookie}`);
      const matchIds = indexCookie ? JSON.parse(indexCookie) : [];
      console.log(`Current match IDs in index: ${JSON.stringify(matchIds)}`);
      matchIds.unshift(matchKey); // Add to beginning (newest first)
      console.log(`New match IDs after adding ${matchKey}: ${JSON.stringify(matchIds)}`);
      
      // Keep only last 20 matches to prevent too many cookies
      if (matchIds.length > 20) {
        // Remove oldest matches
        const removedIds = matchIds.splice(20);
        removedIds.forEach((id: string) => {
          this.deleteCookie(`match_history_${id}`);
        });
      }
      
      this.setCookie('match_history_index', JSON.stringify(matchIds));
      
      // Verify index cookie was saved
      const verifyIndex = this.getCookie('match_history_index');
      console.log(`Index cookie verification: ${verifyIndex ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Verified index content: ${verifyIndex}`);
      
      // Clear current match events after saving to history
      this.clearCurrentMatchEvents();
      
      console.log(`Match ${matchKey} saved to history cookies`);
      console.log(`Index now contains: ${matchIds.length} matches`);
      console.log(`Match data size: ${JSON.stringify(historyEntry).length} characters`);
    } catch (error) {
      console.error('Error adding to match history in cookies:', error);
    }
  }

  clearHistory(): void {
    try {
      // Get all match IDs and delete their cookies
      const indexCookie = this.getCookie('match_history_index');
      const matchIds = indexCookie ? JSON.parse(indexCookie) : [];
      
      matchIds.forEach((id: string) => {
        this.deleteCookie(`match_history_${id}`);
      });
      
      // Delete the index
      this.deleteCookie('match_history_index');
      
      console.log('All match history cookies cleared');
    } catch (error) {
      console.error('Error clearing match history:', error);
    }
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