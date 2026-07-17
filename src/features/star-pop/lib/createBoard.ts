import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { createBlock, resetBlockIds } from "@/features/star-pop/lib/blockFactory";
import { hasAvailableMove } from "@/features/star-pop/lib/hasAvailableMove";
import type { BlockColor, Board } from "@/features/star-pop/types/game";

function pickRandomColor(random: () => number): BlockColor {
  const index = Math.floor(random() * GAME_CONFIG.colors.length);
  return GAME_CONFIG.colors[index];
}

function buildRandomBoard(random: () => number): Board {
  return Array.from({ length: GAME_CONFIG.rows }, (_, row) =>
    Array.from({ length: GAME_CONFIG.cols }, (_, col) =>
      createBlock(row, col, pickRandomColor(random)),
    ),
  );
}

export function createBoard(random: () => number = Math.random): Board {
  resetBlockIds();

  while (true) {
    const candidate = buildRandomBoard(random);
    if (hasAvailableMove(candidate)) {
      return candidate;
    }

    resetBlockIds();
  }
}
