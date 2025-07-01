import type { ApaSkillLevel } from "@shared/schema";

/**
 * Get the maximum number of timeouts allowed for a player based on their skill level
 * SL <=3 get 2 timeouts, SL >=4 get 1 timeout
 */
export function getMaxTimeouts(skillLevel: ApaSkillLevel): number {
  return skillLevel <= 3 ? 2 : 1;
}

/**
 * Get remaining timeouts for a player
 */
export function getRemainingTimeouts(skillLevel: ApaSkillLevel, timeoutsUsed: number): number {
  return Math.max(0, getMaxTimeouts(skillLevel) - timeoutsUsed);
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if timeout has exceeded the 1-minute limit
 */
export function isTimeoutOvertime(seconds: number): boolean {
  return seconds > 60;
}