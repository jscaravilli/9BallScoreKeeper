import type { ApaSkillLevel } from "@shared/schema";

export const APA_HANDICAPS: Record<ApaSkillLevel, number> = {
  1: 14,
  2: 19,
  3: 25,
  4: 31,
  5: 38,
  6: 46,
  7: 55,
  8: 65,
  9: 75,
};

export function getPointsToWin(skillLevel: ApaSkillLevel): number {
  return APA_HANDICAPS[skillLevel];
}

export function getProgressPercentage(currentPoints: number, skillLevel: ApaSkillLevel): number {
  const target = getPointsToWin(skillLevel);
  return Math.min((currentPoints / target) * 100, 100);
}
