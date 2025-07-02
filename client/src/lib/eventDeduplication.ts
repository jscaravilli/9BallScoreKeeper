import { MatchEvent } from '@shared/schema';

/**
 * Event deduplication utility to ensure events are only logged once
 * and accurately reflect the game state
 */
export class EventDeduplicator {
  private static processedEventIds = new Set<string>();
  
  /**
   * Generate a unique ID for an event based on its key properties
   */
  static generateEventId(event: MatchEvent, gameNumber: number): string {
    if (event.type === 'ball_scored' && event.ballNumber) {
      return `ball_scored-${event.player}-${event.ballNumber}-${gameNumber}`;
    }
    if (event.type === 'ball_dead' && event.ballNumber) {
      return `ball_dead-${event.player}-${event.ballNumber}-${gameNumber}`;
    }
    // For other events, use timestamp as part of the ID
    return `${event.type}-${event.player}-${event.timestamp}`;
  }
  
  /**
   * Check if an event has already been processed
   */
  static isEventProcessed(event: MatchEvent, gameNumber: number): boolean {
    const eventId = this.generateEventId(event, gameNumber);
    return this.processedEventIds.has(eventId);
  }
  
  /**
   * Mark an event as processed
   */
  static markEventAsProcessed(event: MatchEvent, gameNumber: number): void {
    const eventId = this.generateEventId(event, gameNumber);
    this.processedEventIds.add(eventId);
  }
  
  /**
   * Clear all processed events (useful when starting a new match)
   */
  static clearProcessedEvents(): void {
    this.processedEventIds.clear();
  }
  
  /**
   * Deduplicate a list of events
   */
  static deduplicateEvents(events: MatchEvent[]): MatchEvent[] {
    const uniqueEvents: MatchEvent[] = [];
    const seenEventIds = new Set<string>();
    
    // Process events in chronological order
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (const event of sortedEvents) {
      // Extract game number from event details if available
      let gameNumber = 1;
      if (event.details && event.details.includes('Game ')) {
        const gameMatch = event.details.match(/Game (\d+):/);
        if (gameMatch) {
          gameNumber = parseInt(gameMatch[1]);
        }
      }
      
      const eventId = this.generateEventId(event, gameNumber);
      
      if (!seenEventIds.has(eventId)) {
        seenEventIds.add(eventId);
        uniqueEvents.push(event);
      }
    }
    
    return uniqueEvents;
  }
  
  /**
   * Calculate accurate scores from events
   */
  static calculateScoresFromEvents(events: MatchEvent[], player1Name: string, player2Name: string): {
    player1Score: number;
    player2Score: number;
    player1Tallies: number;
    player2Tallies: number;
  } {
    let player1Score = 0;
    let player2Score = 0;
    let player1Tallies = 0;
    let player2Tallies = 0;
    
    // Track ball states per game to handle dead balls correctly
    const gameStates = new Map<number, Map<string, 'scored' | 'dead'>>();
    let currentGame = 1;
    
    for (const event of events) {
      // Extract game number from event
      if (event.details && event.details.includes('Game ')) {
        const gameMatch = event.details.match(/Game (\d+):/);
        if (gameMatch) {
          currentGame = parseInt(gameMatch[1]);
        }
      }
      
      if (!gameStates.has(currentGame)) {
        gameStates.set(currentGame, new Map());
      }
      
      const gameState = gameStates.get(currentGame)!;
      
      if (event.type === 'ball_scored' && event.ballNumber && event.player) {
        const ballKey = `${event.player}-${event.ballNumber}`;
        
        // Only count if this ball hasn't been marked dead later
        gameState.set(ballKey, 'scored');
        
        // Calculate points
        const points = event.ballNumber === 9 ? 2 : 1;
        if (event.player === 1) {
          player1Score += points;
          player1Tallies++;
        } else {
          player2Score += points;
          player2Tallies++;
        }
      } else if (event.type === 'ball_dead' && event.ballNumber && event.player) {
        const ballKey = `${event.player}-${event.ballNumber}`;
        
        // If this ball was previously scored, deduct the points
        if (gameState.get(ballKey) === 'scored') {
          gameState.set(ballKey, 'dead');
          
          const points = event.ballNumber === 9 ? 2 : 1;
          if (event.player === 1) {
            player1Score -= points;
            player1Tallies--;
          } else {
            player2Score -= points;
            player2Tallies--;
          }
        }
      }
    }
    
    // Ensure scores don't go negative
    player1Score = Math.max(0, player1Score);
    player2Score = Math.max(0, player2Score);
    player1Tallies = Math.max(0, player1Tallies);
    player2Tallies = Math.max(0, player2Tallies);
    
    return {
      player1Score,
      player2Score,
      player1Tallies,
      player2Tallies
    };
  }
}