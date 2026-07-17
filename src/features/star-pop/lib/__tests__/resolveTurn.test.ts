import { describe, expect, it } from "vitest";
import { resolveTurn } from "@/features/star-pop/lib/resolveTurn";
import { buildBoard } from "@/features/star-pop/lib/__tests__/testUtils";

describe("resolveTurn", () => {
  it("returns invalid when the selected block is alone", () => {
    const board = buildBoard([
      ["r", "b", "g"],
      ["y", "p", "b"],
      ["g", "y", "r"],
    ]);

    const result = resolveTurn(board, { row: 1, col: 1 });

    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") {
      expect(result.group).toEqual([{ row: 1, col: 1 }]);
    }
  });

  it("removes a group, scores n*n*5, applies gravity, and shifts empty columns left", () => {
    const board = buildBoard([
      ["r", "b", "."],
      ["r", "b", "."],
      ["r", "g", "g"],
    ]);

    const result = resolveTurn(board, { row: 0, col: 0 });

    expect(result.kind).toBe("removed");
    if (result.kind === "removed") {
      expect(result.scoreDelta).toBe(45);
      expect(result.remainingBlocks).toBe(4);
      expect(result.board.map((row) => row.map((cell) => cell?.color ?? null))).toEqual([
        ["sky", null, null],
        ["sky", null, null],
        ["mint", "mint", null],
      ]);
      expect(result.board[0][0]?.shiftDistance).toBe(1);
      expect(result.board[1][0]?.shiftDistance).toBe(1);
      expect(result.board[2][0]?.shiftDistance).toBe(1);
      expect(result.board[2][1]?.shiftDistance).toBe(1);
      expect(result.board[0][0]?.dropDistance).toBe(0);
      expect(result.board[1][0]?.dropDistance).toBe(0);
      expect(result.board[2][0]?.dropDistance).toBe(0);
      expect(result.board[2][1]?.dropDistance).toBe(0);
      expect(result.board[2][2]).toBeNull();
      expect(result.board.map((row) => row.filter(Boolean).length)).toEqual([1, 1, 2]);
    }
  });
  it("marks the game as over when no more moves remain", () => {
    const board = buildBoard([
      ["r", "r", "."],
      ["b", "g", "y"],
      ["p", "b", "g"],
    ]);

    const result = resolveTurn(board, { row: 0, col: 0 });

    expect(result.kind).toBe("removed");
    if (result.kind === "removed") {
      expect(result.isGameOver).toBe(true);
      expect(result.hasAvailableMove).toBe(false);
    }
  });
});
