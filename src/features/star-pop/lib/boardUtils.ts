import type { Board, Position } from "@/features/star-pop/types/game";

export function isInsideBoard(board: Board, row: number, col: number) {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length;
}

export function positionKey(position: Position) {
  return `${position.row}:${position.col}`;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) =>
      cell
        ? {
            ...cell,
          }
        : null,
    ),
  );
}

export function resetBoardAnimations(board: Board): Board {
  return board.map((row, rowIndex) =>
    row.map((cell, colIndex) =>
      cell
        ? {
            ...cell,
            row: rowIndex,
            col: colIndex,
            state: "idle",
            dropDistance: 0,
            shiftDistance: 0,
          }
        : null,
    ),
  );
}
