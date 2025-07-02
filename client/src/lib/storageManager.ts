import type { Match, BallInfo, MatchEvent } from "@shared/schema";
import { indexedDBStorageAPI } from "./indexedDBStorage";

interface MatchHistoryEntry extends Match {
  completedAt: string;
  events: MatchEvent[];
  historyId: string;
}

interface StorageAPI {
  getCurrentMatch(): Promise<Match | null>;
  saveCurrentMatch(match: Match): Promise<Match>;
  updateMatch(matchId: number, updates: Partial<Match>): Promise<Match | null>;
  updateBallStates(matchId: number, ballStates: BallInfo[]): Promise<Match | null>;
  clearCurrentMatch(): Promise<void>;
  getCurrentMatchEvents(): Promise<MatchEvent[]>;
  addMatchEvent(event: MatchEvent): Promise<void>;
  clearCurrentMatchEvents(): Promise<void>;
  getMatchHistory(): Promise<MatchHistoryEntry[]>;
  addToHistory(match: Match): Promise<void>;
  clearHistory(): Promise<void>;
}

class LocalStorageAPI implements StorageAPI {
  private static readonly PREFIX = 'poolscorer_';
  private static readonly KEYS = {
    CURRENT_MATCH: `${LocalStorageAPI.PREFIX}current_match`,
    CURRENT_MATCH_EVENTS: `${LocalStorageAPI.PREFIX}current_match_events`,
    MATCH_HISTORY: `${LocalStorageAPI.PREFIX}match_history`,
  };

  async getCurrentMatch(): Promise<Match | null> {
    try {
      const data = localStorage.getItem(LocalStorageAPI.KEYS.CURRENT_MATCH);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting current match from localStorage:', error);
      return null;
    }
  }

  async saveCurrentMatch(match: Match): Promise<Match> {
    try {
      localStorage.setItem(LocalStorageAPI.KEYS.CURRENT_MATCH, JSON.stringify(match));
      return match;
    } catch (error) {
      console.error('Error saving current match to localStorage:', error);
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
      console.error('Error updating match in localStorage:', error);
      return null;
    }
  }

  async updateBallStates(matchId: number, ballStates: BallInfo[]): Promise<Match | null> {
    return this.updateMatch(matchId, { ballStates });
  }

  async clearCurrentMatch(): Promise<void> {
    try {
      localStorage.removeItem(LocalStorageAPI.KEYS.CURRENT_MATCH);
    } catch (error) {
      console.error('Error clearing current match from localStorage:', error);
    }
  }

  async getCurrentMatchEvents(): Promise<MatchEvent[]> {
    try {
      const data = localStorage.getItem(LocalStorageAPI.KEYS.CURRENT_MATCH_EVENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting match events from localStorage:', error);
      return [];
    }
  }

  async addMatchEvent(event: MatchEvent): Promise<void> {
    try {
      const events = await this.getCurrentMatchEvents();
      events.push(event);
      localStorage.setItem(LocalStorageAPI.KEYS.CURRENT_MATCH_EVENTS, JSON.stringify(events));
      console.log(`Added event: ${event.type} by player ${event.player}`);
    } catch (error) {
      console.error('Error adding match event to localStorage:', error);
    }
  }

  async clearCurrentMatchEvents(): Promise<void> {
    try {
      localStorage.removeItem(LocalStorageAPI.KEYS.CURRENT_MATCH_EVENTS);
    } catch (error) {
      console.error('Error clearing match events from localStorage:', error);
    }
  }

  async getMatchHistory(): Promise<MatchHistoryEntry[]> {
    try {
      const data = localStorage.getItem(LocalStorageAPI.KEYS.MATCH_HISTORY);
      const history = data ? JSON.parse(data) : [];
      return history.sort((a: MatchHistoryEntry, b: MatchHistoryEntry) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    } catch (error) {
      console.error('Error getting match history from localStorage:', error);
      return [];
    }
  }

  async addToHistory(match: Match): Promise<void> {
    if (!match.isComplete) return;
    
    try {
      const events = await this.getCurrentMatchEvents();
      const history = await this.getMatchHistory();
      const historyId = `${Date.now()}_${match.id}_${Math.random().toString(36).substr(2, 9)}`;
      
      const historyEntry: MatchHistoryEntry = {
        ...match,
        completedAt: new Date().toISOString(),
        events: events,
        historyId: historyId
      };
      
      history.unshift(historyEntry);
      
      // Keep only last 100 matches
      const limitedHistory = history.slice(0, 100);
      localStorage.setItem(LocalStorageAPI.KEYS.MATCH_HISTORY, JSON.stringify(limitedHistory));
      
      console.log(`Match ${historyId} saved to localStorage history`);
      
      // Clear current match events after saving
      await this.clearCurrentMatchEvents();
      
    } catch (error) {
      console.error('Error adding to match history in localStorage:', error);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      localStorage.removeItem(LocalStorageAPI.KEYS.MATCH_HISTORY);
      console.log('Match history cleared from localStorage');
    } catch (error) {
      console.error('Error clearing history from localStorage:', error);
    }
  }
}

class StorageManager {
  private storageAPI: StorageAPI;
  private useIndexedDB: boolean = false;

  constructor() {
    // Initialize with localStorage as fallback
    this.storageAPI = new LocalStorageAPI();
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      // Test IndexedDB availability
      if (!window.indexedDB) {
        console.warn('IndexedDB not available, falling back to localStorage');
        this.storageAPI = new LocalStorageAPI();
        return;
      }

      // Test IndexedDB functionality
      const testDB = indexedDB.open('test-db', 1);
      testDB.onerror = () => {
        console.warn('IndexedDB test failed, falling back to localStorage');
        this.storageAPI = new LocalStorageAPI();
      };
      
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('test-db');
        
        console.log('Using IndexedDB for storage');
        this.useIndexedDB = true;
        this.storageAPI = indexedDBStorageAPI;
        
        // Migrate from localStorage if needed
        this.migrateFromLocalStorage();
      };
      
    } catch (error) {
      console.error('Error initializing storage:', error);
      console.warn('Falling back to localStorage');
      this.storageAPI = new LocalStorageAPI();
    }
  }

  private async migrateFromLocalStorage(): Promise<void> {
    try {
      // Check if there's data in localStorage to migrate
      const localMatch = localStorage.getItem('poolscorer_current_match');
      const localEvents = localStorage.getItem('poolscorer_current_match_events');
      const localHistory = localStorage.getItem('poolscorer_match_history');
      
      if (localMatch || localEvents || localHistory) {
        console.log('Migrating data from localStorage to IndexedDB...');
        await indexedDBStorageAPI.migrateFromLocalStorage();
        
        // Clear localStorage after successful migration
        localStorage.removeItem('poolscorer_current_match');
        localStorage.removeItem('poolscorer_current_match_events');
        localStorage.removeItem('poolscorer_match_history');
        
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }
  }

  // Proxy methods to the selected storage API
  async getCurrentMatch(): Promise<Match | null> {
    return this.storageAPI.getCurrentMatch();
  }

  async saveCurrentMatch(match: Match): Promise<Match> {
    return this.storageAPI.saveCurrentMatch(match);
  }

  async updateMatch(matchId: number, updates: Partial<Match>): Promise<Match | null> {
    return this.storageAPI.updateMatch(matchId, updates);
  }

  async updateBallStates(matchId: number, ballStates: BallInfo[]): Promise<Match | null> {
    return this.storageAPI.updateBallStates(matchId, ballStates);
  }

  async clearCurrentMatch(): Promise<void> {
    return this.storageAPI.clearCurrentMatch();
  }

  async getCurrentMatchEvents(): Promise<MatchEvent[]> {
    return this.storageAPI.getCurrentMatchEvents();
  }

  async addMatchEvent(event: MatchEvent): Promise<void> {
    return this.storageAPI.addMatchEvent(event);
  }

  async clearCurrentMatchEvents(): Promise<void> {
    return this.storageAPI.clearCurrentMatchEvents();
  }

  async getMatchHistory(): Promise<MatchHistoryEntry[]> {
    return this.storageAPI.getMatchHistory();
  }

  async addToHistory(match: Match): Promise<void> {
    return this.storageAPI.addToHistory(match);
  }

  async clearHistory(): Promise<void> {
    return this.storageAPI.clearHistory();
  }

  getStorageType(): string {
    return this.useIndexedDB ? 'IndexedDB' : 'localStorage';
  }
}

export const storageManager = new StorageManager();
export type { MatchHistoryEntry };