import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const matches = pgTable("matches", {
  id: text("id").primaryKey(),
  player1Name: text("player1_name").notNull(),
  player1SkillLevel: integer("player1_skill_level").notNull(),
  player1Score: integer("player1_score").notNull().default(0),
  player1Color: text("player1_color").notNull().default("#0F4A3C"), // Championship Green
  player2Name: text("player2_name").notNull(),
  player2SkillLevel: integer("player2_skill_level").notNull(),
  player2Score: integer("player2_score").notNull().default(0),
  player2Color: text("player2_color").notNull().default("#3B82F6"), // Electric Blue
  player1TimeoutsUsed: integer("player1_timeouts_used").notNull().default(0),
  player2TimeoutsUsed: integer("player2_timeouts_used").notNull().default(0),
  player1SafetiesUsed: integer("player1_safeties_used").notNull().default(0),
  player2SafetiesUsed: integer("player2_safeties_used").notNull().default(0),
  currentPlayer: integer("current_player").notNull().default(1), // 1 or 2
  currentGame: integer("current_game").notNull().default(1),
  ballStates: jsonb("ball_states").notNull().default([]), // Array of ball state objects
  isComplete: boolean("is_complete").notNull().default(false),
  winnerId: integer("winner_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  gameNumber: integer("game_number").notNull(),
  winnerId: integer("winner_id"),
  player1Points: integer("player1_points").notNull().default(0),
  player2Points: integer("player2_points").notNull().default(0),
  completedAt: timestamp("completed_at"),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  completedAt: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

// Ball state types
export type BallState = 'active' | 'scored' | 'dead';

export interface BallInfo {
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  state: BallState;
  scoredBy?: 1 | 2; // player who scored it
  inning?: number; // which inning this ball was scored in
  turnCompleted?: boolean; // whether the scoring player's turn has ended
}

// APA Skill Level type
export type ApaSkillLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Match event tracking for detailed history
export interface MatchEvent {
  type: 'ball_scored' | 'ball_dead' | 'turn_ended' | 'match_completed' | 'timeout_taken' | 'safety_taken';
  timestamp: string;
  player: 1 | 2;
  playerName: string;
  ballNumber?: number;
  pointsAwarded?: number;
  newScore?: number;
  timeoutDuration?: string; // for timeout events, e.g., "1:23"
  details?: string;
}
