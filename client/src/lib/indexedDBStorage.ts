import type { Match, BallInfo, MatchEvent } from "@shared/schema";

interface MatchHistoryEntry extends Match {
  completedAt: string;
  events: MatchEvent[];
  historyId: string;
}

class IndexedDBStorageAPI {
  private dbName = 'PoolScorerDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores
        if (!db.objectStoreNames.contains('matches')) {
          db.createObjectStore('matches', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('matchHistory')) {
          const historyStore = db.createObjectStore('matchHistory', { keyPath: 'historyId' });
          historyStore.createIndex('completedAt', 'completedAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('matchEvents')) {
          db.createObjectStore('matchEvents', { keyPath: 'id' });
        }
        
        console.log('IndexedDB stores created');
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Current match operations
  async getCurrentMatch(): Promise<Match | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['matches'], 'readonly');
      const store = transaction.objectStore('matches');
      const request = store.get('current');
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting current match:', error);
      return null;
    }
  }

  async saveCurrentMatch(match: Match): Promise<Match> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['matches'], 'readwrite');
      const store = transaction.objectStore('matches');
      
      const matchToSave = { ...match, id: 'current' };
      store.put(matchToSave);
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(match);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error saving current match:', error);
      throw error;
    }
  }

  async updateMatch(matchId: number, updates: Partial<Match>): Promise<Match | null> {
    try {
      const currentMatch = await this.getCurrentMatch();
      if (!currentMatch) return null;

      const updatedMatch = { ...currentMatch, ...updates };
      return await this.saveCurrentMatch(updatedMatch);
    } catch (error) {
      console.error('Error updating match:', error);
      return null;
    }
  }

  async updateBallStates(matchId: number, ballStates: BallInfo[]): Promise<Match | null> {
    return this.updateMatch(matchId, { ballStates });
  }

  async clearCurrentMatch(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['matches'], 'readwrite');
      const store = transaction.objectStore('matches');
      store.delete('current');
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error clearing current match:', error);
    }
  }

  // Match events operations
  async getCurrentMatchEvents(): Promise<MatchEvent[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['matchEvents'], 'readonly');
      const store = transaction.objectStore('matchEvents');
      const request = store.get('current');
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          resolve(result?.events || []);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting match events:', error);
      return [];
    }
  }

  async addMatchEvent(event: MatchEvent): Promise<void> {
    try {
      const events = await this.getCurrentMatchEvents();
      events.push(event);
      
      const db = await this.ensureDB();
      const transaction = db.transaction(['matchEvents'], 'readwrite');
      const store = transaction.objectStore('matchEvents');
      
      store.put({ id: 'current', events });
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Added event: ${event.type} by player ${event.player}`);
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error adding match event:', error);
    }
  }

  async clearCurrentMatchEvents(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['matchEvents'], 'readwrite');
      const store = transaction.objectStore('matchEvents');
      store.delete('current');
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error clearing match events:', error);
    }
  }

  // Match history operations
  async getMatchHistory(): Promise<MatchHistoryEntry[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['matchHistory'], 'readonly');
      const store = transaction.objectStore('matchHistory');
      const index = store.index('completedAt');
      const request = index.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          // Sort by completion date, newest first
          const results = request.result.sort((a: MatchHistoryEntry, b: MatchHistoryEntry) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting match history:', error);
      return [];
    }
  }

  async addToHistory(match: Match): Promise<void> {
    if (!match.isComplete) return;
    
    try {
      const events = await this.getCurrentMatchEvents();
      const historyId = `${Date.now()}_${match.id}_${Math.random().toString(36).substr(2, 9)}`;
      
      const historyEntry: MatchHistoryEntry = {
        ...match,
        completedAt: new Date().toISOString(),
        events: events,
        historyId: historyId
      };
      
      const db = await this.ensureDB();
      const transaction = db.transaction(['matchHistory'], 'readwrite');
      const store = transaction.objectStore('matchHistory');
      
      store.add(historyEntry);
      
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Match ${historyId} saved to IndexedDB history`);
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
      
      // Clean up old entries (keep last 100 matches)
      await this.cleanupOldHistory();
      
      // Clear current match events after saving
      await this.clearCurrentMatchEvents();
      
    } catch (error) {
      console.error('Error adding to match history:', error);
    }
  }

  private async cleanupOldHistory(): Promise<void> {
    try {
      const history = await this.getMatchHistory();
      if (history.length > 100) {
        const db = await this.ensureDB();
        const transaction = db.transaction(['matchHistory'], 'readwrite');
        const store = transaction.objectStore('matchHistory');
        
        // Remove oldest entries
        const toRemove = history.slice(100);
        for (const entry of toRemove) {
          store.delete(entry.historyId);
        }
        
        console.log(`Cleaned up ${toRemove.length} old match history entries`);
      }
    } catch (error) {
      console.error('Error cleaning up old history:', error);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['matchHistory'], 'readwrite');
      const store = transaction.objectStore('matchHistory');
      store.clear();
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('Match history cleared');
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  // Migration from other storage systems
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate current match
      const localMatch = localStorage.getItem('poolscorer_current_match');
      if (localMatch) {
        const match = JSON.parse(localMatch);
        await this.saveCurrentMatch(match);
        console.log('Migrated current match from localStorage');
      }

      // Migrate current events
      const localEvents = localStorage.getItem('poolscorer_current_match_events');
      if (localEvents) {
        const events = JSON.parse(localEvents);
        const db = await this.ensureDB();
        const transaction = db.transaction(['matchEvents'], 'readwrite');
        const store = transaction.objectStore('matchEvents');
        store.put({ id: 'current', events });
        console.log('Migrated current events from localStorage');
      }

      // Migrate match history
      const localHistory = localStorage.getItem('poolscorer_match_history');
      if (localHistory) {
        const history = JSON.parse(localHistory);
        const db = await this.ensureDB();
        const transaction = db.transaction(['matchHistory'], 'readwrite');
        const store = transaction.objectStore('matchHistory');
        
        for (const match of history) {
          const historyEntry: MatchHistoryEntry = {
            ...match,
            historyId: match.historyId || `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          store.put(historyEntry);
        }
        
        console.log(`Migrated ${history.length} matches from localStorage`);
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
    }
  }
}

export const indexedDBStorageAPI = new IndexedDBStorageAPI();