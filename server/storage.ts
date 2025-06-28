import { matches, games, type Match, type InsertMatch, type Game, type InsertGame, type BallInfo } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
    
    // In production, initialize with better persistence
    if (process.env.NODE_ENV === 'production') {
      this.initializeProductionStorage();
    }
  }

  private initializeProductionStorage() {
    // For production deployment, ensure storage persists across requests
    console.log('Initializing production storage...');
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const match: Match = {
      id,
      player1Name: insertMatch.player1Name,
      player1SkillLevel: insertMatch.player1SkillLevel,
      player2Name: insertMatch.player2Name,
      player2SkillLevel: insertMatch.player2SkillLevel,
      player1Score: insertMatch.player1Score ?? 0,
      player2Score: insertMatch.player2Score ?? 0,
      currentPlayer: insertMatch.currentPlayer ?? 1,
      currentGame: insertMatch.currentGame ?? 1,
      ballStates: insertMatch.ballStates ?? [],
      isComplete: insertMatch.isComplete ?? false,
      winnerId: insertMatch.winnerId ?? null,
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
      id,
      winnerId: insertGame.winnerId ?? null,
      matchId: insertGame.matchId,
      gameNumber: insertGame.gameNumber,
      player1Points: insertGame.player1Points ?? 0,
      player2Points: insertGame.player2Points ?? 0,
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

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getCurrentMatch(): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).orderBy(matches.id).limit(1);
    return match || undefined;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values({
        player1Name: insertMatch.player1Name,
        player1SkillLevel: insertMatch.player1SkillLevel,
        player2Name: insertMatch.player2Name,
        player2SkillLevel: insertMatch.player2SkillLevel,
        player1Score: insertMatch.player1Score ?? 0,
        player2Score: insertMatch.player2Score ?? 0,
        currentPlayer: insertMatch.currentPlayer ?? 1,
        currentGame: insertMatch.currentGame ?? 1,
        ballStates: insertMatch.ballStates ?? [],
        isComplete: insertMatch.isComplete ?? false,
        winnerId: insertMatch.winnerId ?? null,
      })
      .returning();
    return match;
  }

  async updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set(updates)
      .where(eq(matches.id, id))
      .returning();
    return match || undefined;
  }

  async updateBallStates(matchId: number, ballStates: BallInfo[]): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set({ ballStates })
      .where(eq(matches.id, matchId))
      .returning();
    return match || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values({
        matchId: insertGame.matchId,
        gameNumber: insertGame.gameNumber,
        player1Points: insertGame.player1Points ?? 0,
        player2Points: insertGame.player2Points ?? 0,
        winnerId: insertGame.winnerId ?? null,
      })
      .returning();
    return game;
  }

  async getGamesByMatch(matchId: number): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.matchId, matchId));
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return game || undefined;
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
