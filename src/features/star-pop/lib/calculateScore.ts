import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";

export function calculateScore(groupSize: number) {
  return groupSize * groupSize * GAME_CONFIG.scoreMultiplier;
}
