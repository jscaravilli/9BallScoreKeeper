import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMatchSchema, insertGameSchema, type BallInfo } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current active match
  app.get("/api/match/current", async (req, res) => {
    try {
      const match = await storage.getCurrentMatch();
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Failed to get current match" });
    }
  });

  // Create new match
  app.post("/api/match", async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      res.json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid match data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create match" });
      }
    }
  });

  // Update match
  app.patch("/api/match/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const match = await storage.updateMatch(id, updates);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  // Update ball states
  app.patch("/api/match/:id/balls", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { ballStates } = req.body;
      
      const match = await storage.updateBallStates(id, ballStates);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ball states" });
    }
  });

  // Get games for a match
  app.get("/api/match/:id/games", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const games = await storage.getGamesByMatch(matchId);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to get games" });
    }
  });

  // Create new game
  app.post("/api/game", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid game data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create game" });
      }
    }
  });

  // Update game
  app.patch("/api/game/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const game = await storage.updateGame(id, updates);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
