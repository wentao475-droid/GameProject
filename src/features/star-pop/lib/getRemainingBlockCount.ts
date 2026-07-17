import type { Board } from "@/features/star-pop/types/game";

export function getRemainingBlockCount(board: Board) {
  return board.flat().filter(Boolean).length;
}
