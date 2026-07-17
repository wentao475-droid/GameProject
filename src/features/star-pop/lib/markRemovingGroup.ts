import type { Board, Position } from "@/features/star-pop/types/game";
import { cloneBoard, positionKey } from "@/features/star-pop/lib/boardUtils";

export function markRemovingGroup(board: Board, group: Position[]): Board {
  const nextBoard = cloneBoard(board);
  const groupKeys = new Set(group.map(positionKey));

  return nextBoard.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (!cell || !groupKeys.has(positionKey({ row: rowIndex, col: colIndex }))) {
        return cell;
      }

      return {
        ...cell,
        state: "removing",
      };
    }),
  );
}
