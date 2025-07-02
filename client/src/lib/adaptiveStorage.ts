import { IndexedDBStorageAPI } from './indexedDBStorage';
import { cookieStorageAPI } from './cookieStorage';
import type { Match, MatchEvent, BallInfo } from '@shared/schema';

// Adaptive storage that automatically switches between IndexedDB and cookies
class AdaptiveStorageAPI {
  private indexedDBStorage: IndexedDBStorageAPI;
  private cookieStorage: typeof cookieStorageAPI;
  private useIndexedDB: boolean = false;
  private initializationPromise: Promise<void>;

  constructor() {
    this.indexedDBStorage = new IndexedDBStorageAPI();
    this.cookieStorage = cookieStorageAPI; // Use the singleton instance
    
    // Initialize and determine best storage method
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check if IndexedDB is supported and available
      if (this.indexedDBStorage.isSupported()) {
        console.log('IndexedDB is supported, initializing...');
        
        // Wait for IndexedDB to be ready (with timeout)
        const initTimeout = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('IndexedDB initialization timeout')), 5000);
        });
        
        await Promise.race([
          new Promise<void>((resolve) => {
            const checkReady = () => {
              if (this.indexedDBStorage.isReady()) {
                resolve();
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          }),
          initTimeout
        ]);

        // Migrate existing cookie data to IndexedDB
        await this.indexedDBStorage.migrateFromCookieStorage();
        
        this.useIndexedDB = true;
        console.log('✅ Using IndexedDB for storage (unlimited capacity)');
        
      } else {
        throw new Error('IndexedDB not supported');
      }
    } catch (error) {
      console.warn('IndexedDB initialization failed, falling back to cookies:', error);
      this.useIndexedDB = false;
      console.log('📊 Using cookie storage (limited capacity with compression)');
    }
  }

  // Ensure initialization is complete before any operation
  private async ensureInitialized(): Promise<void> {
    await this.initializationPromise;
  }

  private getActiveStorage() {
    return this.useIndexedDB ? this.indexedDBStorage : this.cookieStorage;
  }

  // Public interface - route to appropriate storage implementation
  getItem(key: string): string | null {
    if (this.useIndexedDB) {
      return this.indexedDBStorage.getItem(key);
    } else {
      // Map to cookieStorage's specific methods based on key
      if (key === 'poolscorer_current_match') {
        const match = this.cookieStorage.getCurrentMatch();
        return match ? JSON.stringify(match) : null;
      }
      if (key === 'poolscorer_current_match_events') {
        const events = this.cookieStorage.getCurrentMatchEvents();
        return JSON.stringify(events);
      }
      if (key === 'poolscorer_match_history') {
        const history = this.cookieStorage.getMatchHistory();
        return JSON.stringify(history);
      }
      // For other keys, try to get from cookie storage internal methods
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (this.useIndexedDB) {
      this.indexedDBStorage.setItem(key, value);
    } else {
      // Map to cookieStorage's specific methods based on key
      if (key === 'poolscorer_current_match_events') {
        const events = JSON.parse(value);
        // Clear existing events and add each one
        this.cookieStorage.clearCurrentMatchEvents();
        events.forEach((event: MatchEvent) => this.cookieStorage.addMatchEvent(event));
      }
      // For other keys, cookieStorage handles internally
    }
  }

  removeItem(key: string): void {
    if (this.useIndexedDB) {
      this.indexedDBStorage.removeItem(key);
    } else {
      if (key === 'poolscorer_current_match') {
        this.cookieStorage.clearCurrentMatch();
      }
      if (key === 'poolscorer_current_match_events') {
        this.cookieStorage.clearCurrentMatchEvents();
      }
      if (key === 'poolscorer_match_history') {
        this.cookieStorage.clearAllMatchHistory();
      }
    }
  }

  clear(): void {
    if (this.useIndexedDB) {
      this.indexedDBStorage.clear();
    } else {
      this.cookieStorage.clearCurrentMatch();
      this.cookieStorage.clearCurrentMatchEvents();
      this.cookieStorage.clearAllMatchHistory();
    }
  }

  // Match management methods
  getCurrentMatch(): Match | null {
    return this.getActiveStorage().getCurrentMatch();
  }

  createMatch(matchData: {
    player1Name: string;
    player1SkillLevel: number;
    player2Name: string;
    player2SkillLevel: number;
    ballStates?: BallInfo[];
  }): Match {
    return this.getActiveStorage().createMatch(matchData);
  }

  updateMatch(matchId: number, updates: Partial<Match>): Match | null {
    return this.getActiveStorage().updateMatch(matchId, updates);
  }

  updateBallStates(matchId: number, ballStates: BallInfo[]): Match | null {
    return this.getActiveStorage().updateBallStates(matchId, ballStates);
  }

  clearCurrentMatch(): void {
    this.getActiveStorage().clearCurrentMatch();
  }

  // Match events
  getCurrentMatchEvents(): MatchEvent[] {
    return this.getActiveStorage().getCurrentMatchEvents();
  }

  addMatchEvent(event: MatchEvent): void {
    this.getActiveStorage().addMatchEvent(event);
  }

  clearCurrentMatchEvents(): void {
    this.getActiveStorage().clearCurrentMatchEvents();
  }

  // Match history
  getMatchHistory(): (Match & { completedAt: string; events: MatchEvent[]; historyId: string })[] {
    return this.getActiveStorage().getMatchHistory();
  }

  addToHistory(match: Match): void {
    this.getActiveStorage().addToHistory(match);
  }

  clearAllMatchHistory(): void {
    this.getActiveStorage().clearAllMatchHistory();
  }

  // Additional methods needed by game.tsx
  clearHistory(): void {
    if (this.useIndexedDB) {
      this.indexedDBStorage.clearAllMatchHistory();
    } else {
      // @ts-ignore - cookieStorageAPI has clearHistory method
      this.cookieStorage.clearHistory();
    }
  }

  migrateFromLocalStorage(): void {
    if (!this.useIndexedDB) {
      // @ts-ignore - cookieStorageAPI has migrateFromLocalStorage method
      this.cookieStorage.migrateFromLocalStorage();
    }
    // IndexedDB handles migration automatically during initialization
  }

  // Storage status methods
  isUsingIndexedDB(): boolean {
    return this.useIndexedDB;
  }

  getStorageInfo(): { type: string; capacity: string; features: string[] } {
    if (this.useIndexedDB) {
      return {
        type: 'IndexedDB',
        capacity: 'Unlimited (browser quota)',
        features: [
          'No size limits for match data',
          'Persistent across browser sessions',
          'Fast synchronous access via cache',
          'Automatic data migration',
          'No HTTP header size issues'
        ]
      };
    } else {
      return {
        type: 'Enhanced Cookies',
        capacity: '~50KB total (compressed)',
        features: [
          'Advanced compression (60% reduction)',
          'Chunking for large datasets',
          'Smart event filtering',
          'Single match history limit',
          'Emergency cleanup protection'
        ]
      };
    }
  }

  // Force re-initialization (useful for testing)
  async reinitialize(): Promise<void> {
    this.useIndexedDB = false;
    this.initializationPromise = this.initialize();
    await this.ensureInitialized();
  }

  // Async initialization check for components that need to wait
  async waitForInitialization(): Promise<void> {
    await this.ensureInitialized();
  }
}

// Create singleton instance
const adaptiveStorageAPI = new AdaptiveStorageAPI();

export { adaptiveStorageAPI, AdaptiveStorageAPI };