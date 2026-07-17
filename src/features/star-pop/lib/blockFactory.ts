import type { Block, BlockColor } from "@/features/star-pop/types/game";

let nextId = 0;

export function resetBlockIds() {
  nextId = 0;
}

export function createBlock(
  row: number,
  col: number,
  color: BlockColor,
): Block {
  nextId += 1;

  return {
    id: `block-${nextId}`,
    row,
    col,
    color,
    state: "idle",
    dropDistance: 0,
    shiftDistance: 0,
  };
}
