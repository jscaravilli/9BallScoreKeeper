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
  private static readonly MAX_COOKIE_SIZE = 3800; // Stay well under 4KB browser limit
  private static readonly MAX_TOTAL_COOKIE_SIZE = 8000; // Reduced to prevent 431 errors
  
  private performEmergencyCleanup(): void {
    try {
      // Calculate total cookie size
      const totalCookieSize = document.cookie.length;
      console.log(`Total cookie size: ${totalCookieSize} characters`);
      
      if (totalCookieSize > CookieStorageAPI.MAX_TOTAL_COOKIE_SIZE) {
        console.warn('Cookie size exceeds safe limit, performing emergency cleanup');
        
        // Clear old match history cookies first
        const cookies = document.cookie.split(';');
        const matchHistoryCookies = cookies
          .map(c => c.trim().split('=')[0])
          .filter(name => name.startsWith('match_history_') && name !== 'match_history_index');
        
        // Keep only the 3 most recent matches
        const indexCookie = this.getCookie('match_history_index');
        if (indexCookie) {
          try {
            const matchIds = JSON.parse(indexCookie);
            const keepIds = matchIds.slice(0, 3);
            const removeIds = matchIds.slice(3);
            
            // Delete old match cookies
            removeIds.forEach((id: string) => {
              this.deleteCookie(`match_history_${id}`);
            });
            
            // Update index
            this.setCookie('match_history_index', JSON.stringify(keepIds));
            console.log(`Emergency cleanup: Kept ${keepIds.length} matches, removed ${removeIds.length}`);
          } catch (error) {
            console.error('Error parsing match history index during cleanup:', error);
          }
        }
        
        // If still too large, clear current match events (keeping essential data only)
        const newTotalSize = document.cookie.length;
        if (newTotalSize > CookieStorageAPI.MAX_TOTAL_COOKIE_SIZE) {
          console.warn('Still too large after history cleanup, clearing current match events');
          this.deleteCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS);
        }
      }
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  constructor() {
    // Perform emergency cleanup on initialization to prevent 431 errors
    this.performEmergencyCleanup();
  }

  private setCookie(name: string, value: string, options = COOKIE_OPTIONS): void {
    // Pre-check: Prevent 431 errors by checking total cookie size
    const currentCookieSize = document.cookie.length;
    const estimatedNewSize = currentCookieSize + name.length + encodeURIComponent(value).length + 100; // +100 for cookie overhead
    
    if (estimatedNewSize > CookieStorageAPI.MAX_TOTAL_COOKIE_SIZE) {
      console.warn(`Cookie operation would exceed safe limit (${estimatedNewSize}), performing cleanup first`);
      this.performEmergencyCleanup();
    }
    
    // Smart cookie management to prevent 431 errors
    let processedValue = value;
    let encodedValue = encodeURIComponent(value);
    
    // For large data, compress and split into multiple cookies if needed
    if (encodedValue.length > 3000) {
      console.log(`Large cookie ${name} (${encodedValue.length} chars), implementing compression strategy`);
      
      // Try to compress the data by storing only essential match info
      if (name.includes('history')) {
        try {
          const data = JSON.parse(value);
          // Keep only essential fields for match history
          const compressed = Array.isArray(data) ? data.map(match => ({
            id: match.id,
            player1Name: match.player1Name,
            player1SkillLevel: match.player1SkillLevel,
            player2Name: match.player2Name,
            player2SkillLevel: match.player2SkillLevel,
            player1Score: match.player1Score,
            player2Score: match.player2Score,
            winnerId: match.winnerId,
            completedAt: match.completedAt,
            historyId: match.historyId,
            // Store only key scoring events, not every ball state
            events: match.events ? match.events.filter((e: any) => 
              e.type === 'ball_scored' || e.type === 'match_completed'
            ).slice(-20) : [] // Keep last 20 events only
          })) : data;
          
          let finalData = compressed;
          let finalValue = JSON.stringify(finalData);
          let finalEncoded = encodeURIComponent(finalValue);
          
          if (finalEncoded.length <= 3000) {
            console.log(`Compressed ${name} from ${encodedValue.length} to ${finalEncoded.length} chars`);
            processedValue = finalValue;
            encodedValue = finalEncoded;
          } else {
            // If still too large, keep only last 3 matches
            const recentMatches = Array.isArray(finalData) ? finalData.slice(0, 3) : finalData;
            finalValue = JSON.stringify(recentMatches);
            finalEncoded = encodeURIComponent(finalValue);
            processedValue = finalValue;
            encodedValue = finalEncoded;
            console.log(`Further compressed ${name} to last 3 matches: ${finalEncoded.length} chars`);
          }
        } catch (error) {
          console.error('Error compressing match history:', error);
          // Fallback: truncate the original data
          const truncated = value.substring(0, 2000);
          processedValue = truncated;
          encodedValue = encodeURIComponent(truncated);
        }
      }
    }

    // For small essential data, use cookies normally
    const expires = new Date();
    expires.setTime(expires.getTime() + (options.expires * 24 * 60 * 60 * 1000));
    
    const cookieString = [
      `${name}=${encodedValue}`,
      `expires=${expires.toUTCString()}`,
      `path=${options.path}`,
      `SameSite=${options.sameSite}`,
      options.secure ? 'Secure' : ''
    ].filter(Boolean).join('; ');
    
    document.cookie = cookieString;
  }

  private useLocalStorageFallback(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
      console.log(`Successfully stored ${name} in localStorage fallback`);
    } catch (error) {
      console.error(`Failed to store ${name} in localStorage:`, error);
    }
  }

  private getTotalCookieSize(): number {
    return document.cookie.length;
  }

  private cleanupOldCookies(): void {
    // Remove old match history cookies
    const cookies = document.cookie.split(';');
    const historyIndex = this.getCookie('match_history_index');
    
    if (historyIndex) {
      try {
        const matchIds = JSON.parse(historyIndex);
        // Keep only last 5 matches to reduce cookie load
        const toKeep = matchIds.slice(0, 5);
        const toDelete = matchIds.slice(5);
        
        toDelete.forEach((matchId: string) => {
          this.deleteCookie(`match_history_${matchId}`);
        });
        
        if (toDelete.length > 0) {
          this.setCookie('match_history_index', JSON.stringify(toKeep));
          console.log(`Cleaned up ${toDelete.length} old match history cookies`);
        }
      } catch (error) {
        console.error('Error cleaning up old cookies:', error);
      }
    }
  }

  private getCookie(name: string): string | null {
    // Direct cookie retrieval only
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

  // Set match history cookie with 48-hour expiration
  private setMatchHistoryCookie(name: string, value: string): void {
    console.log(`Attempting to set cookie with:`, {
      name,
      dataLength: value.length,
      secure: window.location.protocol === 'https:',
      protocol: window.location.protocol,
      hostname: window.location.hostname
    });
    
    // Try a simpler cookie setting approach for debugging
    const expires = new Date();
    expires.setTime(expires.getTime() + (2 * 24 * 60 * 60 * 1000)); // 48 hours
    
    const cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    console.log(`Setting cookie string length: ${cookieString.length}`);
    
    document.cookie = cookieString;
    
    // Immediate verification
    const testRead = this.getCookie(name);
    console.log(`Immediate cookie test: ${testRead ? 'SUCCESS' : 'FAILED'}`);
    
    // If failed, try without URL encoding (sometimes helps with large data)
    if (!testRead) {
      console.log(`Retrying without URL encoding...`);
      const simpleString = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
      document.cookie = simpleString;
      
      const testRead2 = this.getCookie(name);
      console.log(`Second attempt: ${testRead2 ? 'SUCCESS' : 'FAILED'}`);
      
      // If still failed, try localStorage as fallback
      if (!testRead2) {
        console.log(`Cookie failed, attempting localStorage fallback...`);
        try {
          localStorage.setItem(name, value);
          console.log(`localStorage fallback: SUCCESS`);
        } catch (error) {
          console.error(`localStorage fallback failed:`, error);
        }
      }
    }
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
      player1SafetiesUsed: 0, // Initialize safety counters
      player2SafetiesUsed: 0, // Initialize safety counters
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
      const cookieEvents = events ? JSON.parse(events) : [];
      
      // Check if localStorage backup has more complete data
      try {
        const backupEvents = localStorage.getItem('poolscorer_current_match_events_backup');
        if (backupEvents) {
          const parsedBackup = JSON.parse(backupEvents);
          // Use backup if it has more events than cookie
          if (parsedBackup.length > cookieEvents.length) {
            console.log(`Using localStorage backup: ${parsedBackup.length} events vs ${cookieEvents.length} in cookie`);
            return parsedBackup;
          }
        }
      } catch (backupError) {
        console.warn('Error reading localStorage backup:', backupError);
      }
      
      return cookieEvents;
    } catch (error) {
      console.error('Error getting match events from cookies:', error);
      return [];
    }
  }

  addMatchEvent(event: MatchEvent): void {
    try {
      const events = this.getCurrentMatchEvents();
      events.push(event);
      const eventsJson = JSON.stringify(events);
      
      console.log(`Adding event: ${event.type} by player ${event.player}, ball ${event.ballNumber}`);
      console.log(`Total events: ${events.length}, JSON size: ${eventsJson.length} chars`);
      
      // Use localStorage as backup when cookie gets too large
      if (eventsJson.length > 3000) {
        console.warn(`Events cookie too large (${eventsJson.length} chars), using localStorage backup`);
        
        // Store in localStorage as backup
        try {
          localStorage.setItem('poolscorer_current_match_events_backup', eventsJson);
          console.log('Events stored in localStorage backup');
        } catch (lsError) {
          console.error('localStorage backup also failed:', lsError);
        }
        
        // Keep only essential ball_scored events in cookies for scoresheet
        const essentialEvents = events.filter(e => e.type === 'ball_scored');
        const essentialJson = JSON.stringify(essentialEvents);
        
        if (essentialJson.length <= 3000) {
          this.setCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS, essentialJson);
          console.log(`Stored ${essentialEvents.length} essential events in cookie (${essentialJson.length} chars)`);
        } else {
          console.error('Even essential events too large for cookie storage');
        }
      } else {
        this.setCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS, eventsJson);
      }
      
      // Verify the event was stored
      const verifyEvents = this.getCurrentMatchEvents();
      if (verifyEvents.length !== events.length && eventsJson.length <= 3000) {
        console.error(`Event storage verification failed! Expected ${events.length}, got ${verifyEvents.length}`);
      }
    } catch (error) {
      console.error('Error adding match event to cookies:', error);
    }
  }

  clearCurrentMatchEvents(): void {
    this.deleteCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS);
    // Also clear localStorage backup
    try {
      localStorage.removeItem('poolscorer_current_match_events_backup');
    } catch (error) {
      console.warn('Error clearing localStorage backup:', error);
    }
  }

  // Multi-cookie history management - one cookie per match
  getMatchHistory(): (Match & { completedAt: string; events: MatchEvent[]; historyId: string })[] {
    try {
      const history: (Match & { completedAt: string; events: MatchEvent[]; historyId: string })[] = [];
      
      // Get the index of stored matches
      const indexCookie = this.getCookie('match_history_index');
      console.log(`Raw index cookie value: ${indexCookie}`);
      
      if (!indexCookie) {
        console.log('DEBUG: No match history index found.');
        
        // Check if there are any match history cookies without an index
        const allCookies = document.cookie.split(';');
        const matchCookies = allCookies.filter(cookie => cookie.trim().startsWith('match_history_') && !cookie.trim().startsWith('match_history_index'));
        console.log(`Found ${matchCookies.length} orphaned match history cookies:`, matchCookies.map(c => c.split('=')[0].trim()));
        
        // If we have orphaned cookies, let's rebuild the index
        if (matchCookies.length > 0) {
          console.log('Attempting to rebuild index from orphaned cookies...');
          const orphanedIds = matchCookies.map(c => c.split('=')[0].trim().replace('match_history_', ''));
          this.setMatchHistoryCookie('match_history_index', JSON.stringify(orphanedIds));
          console.log(`Rebuilt index with ${orphanedIds.length} matches: ${JSON.stringify(orphanedIds)}`);
          
          // Continue with rebuilt index instead of returning empty
          const matchIds = orphanedIds;
          console.log(`Using rebuilt match IDs: ${JSON.stringify(matchIds)}`);
          
          // Process the rebuilt matches
          for (const matchId of matchIds) {
            const matchCookie = this.getCookie(`match_history_${matchId}`);
            if (matchCookie) {
              try {
                const match = JSON.parse(matchCookie);
                if (!match.historyId) {
                  match.historyId = matchId;
                }
                history.push(match);
                console.log(`Successfully loaded rebuilt match: ${match.player1Name} vs ${match.player2Name}`);
              } catch (parseError) {
                console.warn(`Error parsing rebuilt match ${matchId}`);
              }
            }
          }
          
          return history.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        } else {
          return [];
        }
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
      console.log('DEBUG: Events retrieved for history:', events.length, 'events');
      console.log('DEBUG: Ball scored events by player:', {
        player1: events.filter(e => e.type === 'ball_scored' && e.player === 1).length,
        player2: events.filter(e => e.type === 'ball_scored' && e.player === 2).length
      });
      
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
      
      // Check if cookie already exists (overwrite detection)
      const existingCookie = this.getCookie(cookieKey);
      if (existingCookie) {
        console.warn(`WARNING: Cookie ${cookieKey} already exists! This could be an overwrite.`);
        console.warn(`Existing data length: ${existingCookie.length} characters`);
      }
      
      this.setMatchHistoryCookie(cookieKey, historyData);
      
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
        
        // Double-check that the stored data matches what we sent
        if (verification.length !== historyData.length) {
          console.error(`DATA MISMATCH: Sent ${historyData.length} chars, got back ${verification.length} chars`);
          console.error(`This indicates cookie truncation or corruption!`);
        }
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
      
      this.setMatchHistoryCookie('match_history_index', JSON.stringify(matchIds));
      
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
      // Check if match history was lost and recover from localStorage
      const indexCookie = this.getCookie('match_history_index');
      const localHistory = localStorage.getItem('poolscorer_match_history');
      
      if (!indexCookie && localHistory) {
        console.log('RECOVERY: Match history index missing but localStorage has data - recovering...');
        try {
          const parsedHistory = JSON.parse(localHistory);
          if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
            console.log(`RECOVERY: Restoring ${parsedHistory.length} matches from localStorage to cookies`);
            
            // Store each match in the proper cookie format
            parsedHistory.forEach((match: any) => {
              this.addToHistory(match);
            });
            
            console.log(`RECOVERY: Successfully restored match history to cookies`);
          }
        } catch (parseError) {
          console.error('RECOVERY: Error parsing localStorage history:', parseError);
        }
      }
      
      // Standard migration for other data
      if (!this.getCurrentMatch()) {
        const localMatch = localStorage.getItem('poolscorer_current_match');
        if (localMatch) {
          this.setCookie(COOKIE_KEYS.CURRENT_MATCH, localMatch);
          console.log('Migrated current match from localStorage to cookies');
        }
      }

      const localCounter = localStorage.getItem('poolscorer_match_counter');
      if (localCounter && !this.getCookie(COOKIE_KEYS.MATCH_COUNTER)) {
        this.setCookie(COOKIE_KEYS.MATCH_COUNTER, localCounter);
        console.log('Migrated match counter from localStorage to cookies');
      }

      const localEvents = localStorage.getItem('poolscorer_current_match_events');
      if (localEvents && !this.getCookie(COOKIE_KEYS.CURRENT_MATCH_EVENTS)) {
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