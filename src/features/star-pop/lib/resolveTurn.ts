import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { applyGravity } from "@/features/star-pop/lib/applyGravity";
import { calculateScore } from "@/features/star-pop/lib/calculateScore";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { getRemainingBlockCount } from "@/features/star-pop/lib/getRemainingBlockCount";
import { hasAvailableMove } from "@/features/star-pop/lib/hasAvailableMove";
import { removeGroup } from "@/features/star-pop/lib/removeGroup";
import { shiftColumnsLeft } from "@/features/star-pop/lib/shiftColumnsLeft";
import type { Board, Position, TurnResult } from "@/features/star-pop/types/game";

export function resolveTurn(board: Board, clicked: Position): TurnResult {
  const group = findConnectedGroup(board, clicked);

  if (group.length < GAME_CONFIG.minGroupSize) {
    return {
      kind: "invalid",
      group,
      clicked,
    };
  }

  const removedBoard = removeGroup(board, group);
  const fallenBoard = applyGravity(removedBoard);
  const shiftedBoard = shiftColumnsLeft(fallenBoard);
  const remainingBlocks = getRemainingBlockCount(shiftedBoard);
  const availableMove = remainingBlocks > 0 && hasAvailableMove(shiftedBoard);

  return {
    kind: "removed",
    board: shiftedBoard,
    removedGroup: group,
    scoreDelta: calculateScore(group.length),
    remainingBlocks,
    hasAvailableMove: availableMove,
    isGameOver: remainingBlocks === 0 || !availableMove,
  };
}
