import type { BlockColor } from "@/features/star-pop/types/game";

export const BOARD_ROWS = 10;
export const BOARD_COLS = 10;

export const BLOCK_COLORS = [
  "coral",
  "sky",
  "mint",
  "sun",
  "violet",
] as const satisfies readonly BlockColor[];

export const GAME_CONFIG = {
  rows: BOARD_ROWS,
  cols: BOARD_COLS,
  colors: BLOCK_COLORS,
  minGroupSize: 2,
  scoreMultiplier: 5,
  removeAnimationMs: 190,
  settleAnimationMs: 300,
  finalClearAnimationMs: 220,
  invalidPulseMs: 260,
  turnFeedbackMs: 1400,
} as const;
