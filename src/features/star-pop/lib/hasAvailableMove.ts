import type { Board } from "@/features/star-pop/types/game";
import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { positionKey } from "@/features/star-pop/lib/boardUtils";

export function hasAvailableMove(board: Board) {
  const visited = new Set<string>();

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const block = board[row][col];
      if (!block) {
        continue;
      }

      const key = positionKey({ row, col });
      if (visited.has(key)) {
        continue;
      }

      const group = findConnectedGroup(board, { row, col });

      group.forEach((position) => {
        visited.add(positionKey(position));
      });

      if (group.length >= GAME_CONFIG.minGroupSize) {
        return true;
      }
    }
  }

  return false;
}
