// Temporary fix for dead ball functionality after IndexedDB change
import { adaptiveStorageAPI } from './adaptiveStorage';
import type { Match, BallInfo } from '@shared/schema';

export function updateBallStateDirect(matchId: string, ballStates: BallInfo[], scoreUpdates?: { [key: string]: number }): Match | null {
  try {
    const updates: Partial<Match> = {
      ballStates,
      ...scoreUpdates
    };
    
    const updatedMatch = adaptiveStorageAPI.updateMatch(matchId, updates);
    console.log('Dead ball fix - direct update result:', updatedMatch?.id);
    return updatedMatch;
  } catch (error) {
    console.error('Dead ball fix error:', error);
    return null;
  }
}