import type { Board, Position } from "@/features/star-pop/types/game";
import { cloneBoard } from "@/features/star-pop/lib/boardUtils";

export function removeGroup(board: Board, group: Position[]): Board {
  const nextBoard = cloneBoard(board);

  for (const { row, col } of group) {
    nextBoard[row][col] = null;
  }

  return nextBoard;
}
