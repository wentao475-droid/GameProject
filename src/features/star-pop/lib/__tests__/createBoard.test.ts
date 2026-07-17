import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { createBoard } from "@/features/star-pop/lib/createBoard";
import { hasAvailableMove } from "@/features/star-pop/lib/hasAvailableMove";

describe("createBoard", () => {
  it("creates a board with the configured dimensions and valid colors", () => {
    const board = createBoard(() => 0.1);

    expect(board).toHaveLength(GAME_CONFIG.rows);
    expect(board.every((row) => row.length === GAME_CONFIG.cols)).toBe(true);
    expect(board[0]).toHaveLength(GAME_CONFIG.cols);
    expect(
      board.flat().every((cell) => cell && GAME_CONFIG.colors.includes(cell.color)),
    ).toBe(true);
  });

  it("guarantees at least one available move", () => {
    const sequence = [
      0.0, 0.2, 0.4, 0.6, 0.8,
      0.8, 0.6, 0.4, 0.2, 0.0,
    ];
    let index = 0;

    const board = createBoard(() => {
      const value = sequence[index % sequence.length];
      index += 1;
      return value;
    });

    expect(hasAvailableMove(board)).toBe(true);
  });
});
