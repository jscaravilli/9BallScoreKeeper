import type { Match, Game, BallInfo } from "@shared/schema";

const STORAGE_KEYS = {
  CURRENT_MATCH: 'poolscorer_current_match',
  MATCH_COUNTER: 'poolscorer_match_counter'
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
      const matchData = localStorage.getItem(STORAGE_KEYS.CURRENT_MATCH);
      return matchData ? JSON.parse(matchData) : null;
    } catch (error) {
      console.error('Error getting current match:', error);
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
}

export const localStorageAPI = new LocalStorageAPI();