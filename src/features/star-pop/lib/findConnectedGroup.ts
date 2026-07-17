import type { Board, Position } from "@/features/star-pop/types/game";
import { isInsideBoard, positionKey } from "@/features/star-pop/lib/boardUtils";

const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function findConnectedGroup(
  board: Board,
  start: Position,
): Position[] {
  if (!isInsideBoard(board, start.row, start.col)) {
    return [];
  }

  const origin = board[start.row][start.col];
  if (!origin) {
    return [];
  }

  const queue: Position[] = [start];
  const visited = new Set<string>([positionKey(start)]);
  const group: Position[] = [];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    const block = board[current.row][current.col];
    if (!block || block.color !== origin.color) {
      continue;
    }

    group.push(current);

    for (const [rowOffset, colOffset] of DIRECTIONS) {
      const nextRow = current.row + rowOffset;
      const nextCol = current.col + colOffset;

      if (!isInsideBoard(board, nextRow, nextCol)) {
        continue;
      }

      const nextPosition = { row: nextRow, col: nextCol };
      const nextKey = positionKey(nextPosition);
      const nextBlock = board[nextRow][nextCol];

      if (!nextBlock || nextBlock.color !== origin.color || visited.has(nextKey)) {
        continue;
      }

      visited.add(nextKey);
      queue.push(nextPosition);
    }
  }

  return group;
}
