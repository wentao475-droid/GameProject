import type { Board } from "@/features/star-pop/types/game";
import { cloneBoard } from "@/features/star-pop/lib/boardUtils";

export function applyGravity(board: Board): Board {
  const rowCount = board.length;
  const colCount = board[0]?.length ?? 0;
  const nextBoard: Board = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => null),
  );

  for (let col = 0; col < colCount; col += 1) {
    const columnBlocks = [];

    for (let row = rowCount - 1; row >= 0; row -= 1) {
      const block = board[row][col];
      if (block) {
        columnBlocks.push(cloneBoard([[block]])[0][0]!);
      }
    }

    columnBlocks.forEach((block, index) => {
      const nextRow = rowCount - 1 - index;
      const dropDistance = nextRow - block.row;

      nextBoard[nextRow][col] = {
        ...block,
        row: nextRow,
        col,
        state: dropDistance > 0 ? "falling" : block.state,
        dropDistance,
        shiftDistance: 0,
      };
    });
  }

  return nextBoard;
}
