import { describe, expect, it } from "vitest";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { buildBoard } from "@/features/star-pop/lib/__tests__/testUtils";

describe("findConnectedGroup", () => {
  it("returns an isolated block as a group of one", () => {
    const board = buildBoard([
      ["r", "b", "g"],
      ["y", "p", "b"],
      ["g", "y", "r"],
    ]);

    const group = findConnectedGroup(board, { row: 0, col: 0 });

    expect(group).toEqual([{ row: 0, col: 0 }]);
  });

  it("finds an orthogonally connected group from an edge position", () => {
    const board = buildBoard([
      ["r", "r", "b"],
      ["r", "b", "b"],
      ["g", "y", "p"],
    ]);

    const group = findConnectedGroup(board, { row: 0, col: 0 });

    expect(group).toEqual(
      expect.arrayContaining([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ]),
    );
    expect(group).toHaveLength(3);
  });

  it("does not cross colors or empty slots", () => {
    const board = buildBoard([
      ["r", ".", "r"],
      ["r", "b", "r"],
      ["g", "b", "r"],
    ]);

    const group = findConnectedGroup(board, { row: 0, col: 0 });

    expect(group).toEqual(
      expect.arrayContaining([
        { row: 0, col: 0 },
        { row: 1, col: 0 },
      ]),
    );
    expect(group).toHaveLength(2);
  });
});
