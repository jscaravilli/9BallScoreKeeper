import { matches, games, type Match, type InsertMatch, type Game, type InsertGame, type BallInfo } from "@shared/schema";

export interface IStorage {
  // Match operations
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: number): Promise<Match | undefined>;
  getCurrentMatch(): Promise<Match | undefined>;
  updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined>;
  updateBallStates(matchId: number, ballStates: BallInfo[]): Promise<Match | undefined>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGamesByMatch(matchId: number): Promise<Game[]>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
}

export class MemStorage implements IStorage {
  private matches: Map<number, Match>;
  private games: Map<number, Game>;
  private currentMatchId: number;
  private currentGameId: number;

  constructor() {
    this.matches = new Map();
    this.games = new Map();
    this.currentMatchId = 1;
    this.currentGameId = 1;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const match: Match = {
      ...insertMatch,
      id,
      createdAt: new Date(),
    };
    this.matches.set(id, match);
    return match;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getCurrentMatch(): Promise<Match | undefined> {
    // Return the most recent match that's not complete
    const matchArray = Array.from(this.matches.values());
    return matchArray
      .filter(match => !match.isComplete)
      .sort((a, b) => b.id - a.id)[0];
  }

  async updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;

    const updatedMatch = { ...match, ...updates };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async updateBallStates(matchId: number, ballStates: BallInfo[]): Promise<Match | undefined> {
    const match = this.matches.get(matchId);
    if (!match) return undefined;

    const updatedMatch = { ...match, ballStates };
    this.matches.set(matchId, updatedMatch);
    return updatedMatch;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = {
      ...insertGame,
      id,
      completedAt: null,
    };
    this.games.set(id, game);
    return game;
  }

  async getGamesByMatch(matchId: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.matchId === matchId)
      .sort((a, b) => a.gameNumber - b.gameNumber);
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;

    const updatedGame = { ...game, ...updates };
    if (updates.completedAt !== undefined || updates.winnerId !== undefined) {
      updatedGame.completedAt = new Date();
    }
    this.games.set(id, updatedGame);
    return updatedGame;
  }
}

export const storage = new MemStorage();
