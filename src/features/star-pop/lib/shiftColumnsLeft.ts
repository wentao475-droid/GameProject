import type { Board } from "@/features/star-pop/types/game";

export function shiftColumnsLeft(board: Board): Board {
  const rowCount = board.length;
  const colCount = board[0]?.length ?? 0;
  const nextBoard: Board = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => null),
  );

  const nonEmptyColumns = Array.from({ length: colCount }, (_, colIndex) => colIndex).filter(
    (colIndex) => board.some((row) => row[colIndex] !== null),
  );

  nonEmptyColumns.forEach((sourceColumn, targetColumn) => {
    for (let row = 0; row < rowCount; row += 1) {
      const block = board[row][sourceColumn];

      if (!block) {
        continue;
      }

      const shiftDistance = sourceColumn - targetColumn;

      nextBoard[row][targetColumn] = {
        ...block,
        row,
        col: targetColumn,
        state:
          block.state === "falling" || shiftDistance > 0 ? "falling" : block.state,
        shiftDistance,
      };
    }
  });

  return nextBoard;
}
