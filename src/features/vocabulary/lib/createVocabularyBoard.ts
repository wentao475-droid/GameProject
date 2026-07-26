import { createBlock, resetBlockIds } from "@/features/star-pop/lib/blockFactory";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { hasAvailableMove } from "@/features/star-pop/lib/hasAvailableMove";
import { positionKey } from "@/features/star-pop/lib/boardUtils";
import type { BlockColor, Board } from "@/features/star-pop/types/game";
import { BLOCK_COLORS } from "@/features/star-pop/config/gameConfig";
import type { WordEntry } from "@/features/vocabulary/types/words";

export const VOCABULARY_BOARD_ROWS = 8;
export const VOCABULARY_BOARD_COLS = 8;

function shuffle<T>(items: T[], random: () => number) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex]!, nextItems[index]!];
  }

  return nextItems;
}

function getBoardPositions(board: Board) {
  return board.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) => (cell ? [{ row: rowIndex, col: colIndex }] : [])),
  );
}

function getRemovableGroups(board: Board) {
  const visited = new Set<string>();
  const groups = [];

  for (const position of getBoardPositions(board)) {
    const key = positionKey(position);
    if (visited.has(key)) {
      continue;
    }

    const group = findConnectedGroup(board, position);
    group.forEach((member) => visited.add(positionKey(member)));

    if (group.length >= 2) {
      groups.push(group);
    }
  }

  return groups;
}

function pickRandomColor(random: () => number): BlockColor {
  const index = Math.floor(random() * BLOCK_COLORS.length);
  return BLOCK_COLORS[index]!;
}

function buildRandomBoard(random: () => number): Board {
  return Array.from({ length: VOCABULARY_BOARD_ROWS }, (_, row) =>
    Array.from({ length: VOCABULARY_BOARD_COLS }, (_, col) =>
      createBlock(row, col, pickRandomColor(random)),
    ),
  );
}

function buildPlayableBoard(random: () => number) {
  resetBlockIds();

  while (true) {
    const candidate = buildRandomBoard(random);
    if (hasAvailableMove(candidate)) {
      return candidate;
    }

    resetBlockIds();
  }
}

function getFillerParts(words: WordEntry[]) {
  return Array.from(new Set(words.flatMap((word) => word.parts)));
}

export function createVocabularyBoard(options: {
  targetWords: WordEntry[];
  fillerWords: WordEntry[];
  random?: () => number;
}) {
  const random = options.random ?? Math.random;
  const baseBoard = buildPlayableBoard(random);
  const fillerParts = getFillerParts(options.fillerWords.length > 0 ? options.fillerWords : options.targetWords);
  const targetGroups = shuffle(
    getRemovableGroups(baseBoard).filter((group) =>
      options.targetWords.some((word) => group.length >= word.parts.length),
    ),
    random,
  );
  const occupiedPositionKeys = new Set<string>();
  const targetAssignments = new Map<
    string,
    {
      label: string;
      word: WordEntry;
    }
  >();

  options.targetWords.forEach((word, targetIndex) => {
    const group = targetGroups[targetIndex];

    if (!group) {
      return;
    }

    word.parts.forEach((part, partIndex) => {
      const position = group[partIndex];
      if (!position) {
        return;
      }

      const key = positionKey(position);
      occupiedPositionKeys.add(key);
      targetAssignments.set(key, {
        label: part,
        word,
      });
    });
  });

  const fillerPositions = shuffle(getBoardPositions(baseBoard), random).filter(
    (position) => !occupiedPositionKeys.has(positionKey(position)),
  );
  const fillerAssignments = new Map<string, string>();
  fillerPositions.forEach((position, index) => {
    fillerAssignments.set(positionKey(position), fillerParts[index % fillerParts.length] ?? "口");
  });

  return baseBoard.map((row, rowIndex) =>
    row.map((block, colIndex) => {
      if (!block) {
        return null;
      }

      const key = positionKey({ row: rowIndex, col: colIndex });
      const assignedTarget = targetAssignments.get(key);
      const label = assignedTarget?.label ?? fillerAssignments.get(key) ?? "口";

      return {
        ...block,
        label,
        fullLabel: assignedTarget?.word.word,
        meaning: assignedTarget?.word.meaning,
        pronunciation: assignedTarget?.word.pronunciation,
        example: assignedTarget?.word.example,
        familyHint: assignedTarget?.word.familyHint,
        wordId: assignedTarget?.word.id,
      };
    }),
  );
}
