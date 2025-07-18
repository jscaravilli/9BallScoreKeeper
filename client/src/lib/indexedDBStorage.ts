import type { Match, MatchEvent, BallInfo } from '@shared/schema';
import { nanoid } from 'nanoid';

// IndexedDB wrapper that maintains cookie storage interface
class IndexedDBStorageAPI {
  private dbName = 'poolscorer_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private cache: Map<string, any> = new Map(); // In-memory cache for synchronous access
  private initialized = false;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        this.loadCacheFromDB().then(() => {
          this.initialized = true;
          resolve();
        });
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('matches')) {
          const matchStore = db.createObjectStore('matches', { keyPath: 'key' });
          matchStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'key' });
          eventStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'key' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Load all data into cache for synchronous access
  private async loadCacheFromDB(): Promise<void> {
    if (!this.db) return;

    const stores = ['matches', 'events', 'history'];
    
    for (const storeName of stores) {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        await new Promise<void>((resolve, reject) => {
          request.onsuccess = () => {
            request.result.forEach((item: any) => {
              this.cache.set(item.key, item.value);
            });
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn(`Failed to load ${storeName} from IndexedDB:`, error);
      }
    }

    console.log(`Loaded ${this.cache.size} items into cache from IndexedDB`);
  }

  // Synchronous interface methods (use cache)
  getItem(key: string): string | null {
    const value = this.cache.get(key);
    return value ? JSON.stringify(value) : null;
  }

  setItem(key: string, value: string): void {
    try {
      const parsedValue = JSON.parse(value);
      this.cache.set(key, parsedValue);
      
      // Async write to IndexedDB (fire and forget for performance)
      this.writeToDBAsync(key, parsedValue);
    } catch (error) {
      console.error('Error setting item in IndexedDB storage:', error);
    }
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    this.deleteFromDBAsync(key);
  }

  clear(): void {
    this.cache.clear();
    this.clearDBAsync();
  }

  // Async methods for database operations
  private async writeToDBAsync(key: string, value: any): Promise<void> {
    if (!this.db) return;

    try {
      const storeName = this.getStoreName(key);
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key,
          value,
          timestamp: Date.now()
        });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error writing to IndexedDB:', error);
    }
  }

  private async deleteFromDBAsync(key: string): Promise<void> {
    if (!this.db) return;

    try {
      const storeName = this.getStoreName(key);
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting from IndexedDB:', error);
    }
  }

  private async clearDBAsync(): Promise<void> {
    if (!this.db) return;

    const stores = ['matches', 'events', 'history'];
    
    for (const storeName of stores) {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Error clearing ${storeName}:`, error);
      }
    }
  }

  private getStoreName(key: string): string {
    if (key.includes('history')) return 'history';
    if (key.includes('events')) return 'events';
    return 'matches';
  }

  // Cookie storage compatibility methods
  getCurrentMatch(): Match | null {
    const matchJson = this.getItem('poolscorer_current_match');
    return matchJson ? JSON.parse(matchJson) : null;
  }

  createMatch(matchData: {
    player1Name: string;
    player1SkillLevel: number;
    player2Name: string;
    player2SkillLevel: number;
    player1Color?: string;
    player2Color?: string;
    ballStates?: BallInfo[];
  }): Match {
    const match: Match = {
      id: nanoid(),
      player1Name: matchData.player1Name,
      player1SkillLevel: matchData.player1SkillLevel,
      player1Color: matchData.player1Color || "#0F4A3C",
      player2Name: matchData.player2Name,
      player2SkillLevel: matchData.player2SkillLevel,
      player2Color: matchData.player2Color || "#3B82F6",
      player1Score: 0,
      player2Score: 0,
      currentPlayer: 1,
      currentGame: 1,
      ballStates: matchData.ballStates || [],
      isComplete: false,
      winnerId: null,
      player1TimeoutsUsed: 0,
      player2TimeoutsUsed: 0,
      player1SafetiesUsed: 0,
      player2SafetiesUsed: 0,
      createdAt: new Date()
    };

    this.setItem('poolscorer_current_match', JSON.stringify(match));
    console.log('Created new match with GUID:', match.id);
    return match;
  }

  updateMatch(matchId: string, updates: Partial<Match>): Match | null {
    const currentMatch = this.getCurrentMatch();
    console.log('=== STORAGE UPDATE MATCH DEBUG ===');
    console.log('Requested matchId:', matchId, typeof matchId);
    console.log('Current stored match:', currentMatch);
    console.log('Current match ID:', currentMatch?.id, typeof currentMatch?.id);
    console.log('IDs match?:', currentMatch?.id === matchId);
    console.log('Raw stored match JSON:', this.getItem('poolscorer_current_match'));
    console.log('=== END STORAGE DEBUG ===');
    
    if (!currentMatch || currentMatch.id !== matchId) {
      console.error('STORAGE ERROR: Match ID mismatch or no current match!');
      return null;
    }

    const updatedMatch = { ...currentMatch, ...updates };
    this.setItem('poolscorer_current_match', JSON.stringify(updatedMatch));
    console.log('Updated match saved:', updatedMatch);
    return updatedMatch;
  }

  updateBallStates(matchId: string, ballStates: BallInfo[]): Match | null {
    return this.updateMatch(matchId, { ballStates });
  }

  clearCurrentMatch(): void {
    this.removeItem('poolscorer_current_match');
  }

  // Match counter methods
  private getMatchCounter(): number {
    const counter = this.getItem('poolscorer_match_counter');
    return counter ? parseInt(counter) : 1;
  }

  private incrementMatchCounter(): void {
    const current = this.getMatchCounter();
    this.setItem('poolscorer_match_counter', (current + 1).toString());
  }

  // Match events
  getCurrentMatchEvents(): MatchEvent[] {
    const eventsJson = this.getItem('poolscorer_current_match_events');
    return eventsJson ? JSON.parse(eventsJson) : [];
  }

  addMatchEvent(event: MatchEvent): void {
    const events = this.getCurrentMatchEvents();
    events.push(event);
    this.setItem('poolscorer_current_match_events', JSON.stringify(events));
  }

  clearCurrentMatchEvents(): void {
    this.removeItem('poolscorer_current_match_events');
  }

  // Match history
  getMatchHistory(): (Match & { completedAt: string; events: MatchEvent[]; historyId: string })[] {
    const historyJson = this.getItem('poolscorer_match_history');
    const history = historyJson ? JSON.parse(historyJson) : [];
    
    // Sort by completion date (most recent first)
    return history.sort((a: any, b: any) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }

  addToHistory(match: Match): void {
    if (!match.isComplete) return;

    const events = this.getCurrentMatchEvents();
    const historyEntry = {
      ...match,
      completedAt: new Date().toISOString(),
      events,
      historyId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Get existing history and add new match
    const existingHistory = this.getMatchHistory();
    existingHistory.unshift(historyEntry); // Add to beginning (most recent first)
    
    // Limit history to 20 matches for optimal performance
    const maxHistoryEntries = 20;
    if (existingHistory.length > maxHistoryEntries) {
      existingHistory.splice(maxHistoryEntries);
    }
    
    this.setItem('poolscorer_match_history', JSON.stringify(existingHistory));
    console.log(`Added match to history. Total matches: ${existingHistory.length}`);
  }

  // Enhanced history management methods
  deleteMatchFromHistory(historyId: string): boolean {
    const history = this.getMatchHistory();
    const initialLength = history.length;
    const filteredHistory = history.filter(match => match.historyId !== historyId);
    
    if (filteredHistory.length < initialLength) {
      this.setItem('poolscorer_match_history', JSON.stringify(filteredHistory));
      console.log(`Deleted match ${historyId}. Remaining matches: ${filteredHistory.length}`);
      return true;
    }
    return false;
  }

  getMatchHistoryStats(): {
    totalMatches: number;
    totalGames: number;
    oldestMatch: string | null;
    newestMatch: string | null;
    storageSize: number;
  } {
    const history = this.getMatchHistory();
    
    const totalGames = history.reduce((sum, match) => sum + match.currentGame, 0);
    const storageSize = JSON.stringify(history).length;
    
    return {
      totalMatches: history.length,
      totalGames,
      oldestMatch: history.length > 0 ? history[history.length - 1].completedAt : null,
      newestMatch: history.length > 0 ? history[0].completedAt : null,
      storageSize
    };
  }

  getPlayerStats(playerName: string): {
    matchesPlayed: number;
    matchesWon: number;
    gamesPlayed: number;
    winPercentage: number;
    averageSkillLevel: number;
  } {
    const history = this.getMatchHistory();
    const playerMatches = history.filter(match => 
      match.player1Name === playerName || match.player2Name === playerName
    );

    const matchesWon = playerMatches.filter(match => {
      const isPlayer1 = match.player1Name === playerName;
      return (isPlayer1 && match.winnerId === 1) || (!isPlayer1 && match.winnerId === 2);
    }).length;

    const gamesPlayed = playerMatches.reduce((sum, match) => sum + match.currentGame, 0);
    
    const skillLevels = playerMatches.map(match => 
      match.player1Name === playerName ? match.player1SkillLevel : match.player2SkillLevel
    );
    const averageSkillLevel = skillLevels.length > 0 
      ? skillLevels.reduce((sum, level) => sum + level, 0) / skillLevels.length 
      : 0;

    return {
      matchesPlayed: playerMatches.length,
      matchesWon,
      gamesPlayed,
      winPercentage: playerMatches.length > 0 ? (matchesWon / playerMatches.length) * 100 : 0,
      averageSkillLevel
    };
  }

  clearAllMatchHistory(): void {
    this.removeItem('poolscorer_match_history');
  }

  // Migration from cookie storage
  async migrateFromCookieStorage(): Promise<void> {
    console.log('Migrating data from cookie storage to IndexedDB...');
    
    // Get all relevant cookies
    const cookies = document.cookie.split(';');
    let migrated = 0;

    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name && name.startsWith('poolscorer_') && value) {
        try {
          const decodedValue = decodeURIComponent(value);
          this.setItem(name, decodedValue);
          migrated++;
          
          // Clear the cookie after migration
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        } catch (error) {
          console.warn(`Failed to migrate cookie ${name}:`, error);
        }
      }
    }

    console.log(`Migrated ${migrated} items from cookies to IndexedDB`);
  }

  // Check if IndexedDB is available and initialized
  isReady(): boolean {
    return this.initialized && !!this.db;
  }

  // Fallback check
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }
}

export { IndexedDBStorageAPI };