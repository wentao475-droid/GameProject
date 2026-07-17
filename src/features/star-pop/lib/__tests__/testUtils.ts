import { createBlock, resetBlockIds } from "@/features/star-pop/lib/blockFactory";
import type { BlockColor, Board } from "@/features/star-pop/types/game";

const colorMap: Record<string, BlockColor> = {
  r: "coral",
  b: "sky",
  g: "mint",
  y: "sun",
  p: "violet",
};

export function buildBoard(layout: string[][]): Board {
  resetBlockIds();

  return layout.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (cell === ".") {
        return null;
      }

      const color = colorMap[cell];
      if (!color) {
        throw new Error(`Unknown color token: ${cell}`);
      }

      return createBlock(rowIndex, colIndex, color);
    }),
  );
}
