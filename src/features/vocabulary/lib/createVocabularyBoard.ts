import { createBoard } from "@/features/star-pop/lib/createBoard";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { positionKey } from "@/features/star-pop/lib/boardUtils";
import type { Board } from "@/features/star-pop/types/game";
import { TARGET_WORD_COLLECTION_GOAL } from "@/features/vocabulary/lib/vocabularyGame";
import type { WordEntry } from "@/features/vocabulary/types/words";

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

function buildTargetAssignments(targetWords: WordEntry[], random: () => number) {
  const repeatedTargets = targetWords.flatMap((word) =>
    Array.from({ length: TARGET_WORD_COLLECTION_GOAL }, () => word),
  );

  return shuffle(repeatedTargets, random);
}

export function createVocabularyBoard(options: {
  targetWords: WordEntry[];
  fillerWords: WordEntry[];
  random?: () => number;
}) {
  const random = options.random ?? Math.random;
  const baseBoard = createBoard(random);
  const targetWordIdSet = new Set(options.targetWords.map((word) => word.id));
  const nonTargetFillerWords = options.fillerWords.filter((word) => !targetWordIdSet.has(word.id));
  const fillerWords = nonTargetFillerWords.length > 0 ? nonTargetFillerWords : options.targetWords;
  const removablePositions = shuffle(
    getBoardPositions(baseBoard).filter((position) => findConnectedGroup(baseBoard, position).length >= 2),
    random,
  );
  const removablePositionKeySet = new Set(removablePositions.map((position) => positionKey(position)));
  const allPositions = shuffle(getBoardPositions(baseBoard), random).filter(
    (position) => !removablePositionKeySet.has(positionKey(position)),
  );
  const assignmentPositions = [...removablePositions, ...allPositions];
  const assignments = new Map<string, WordEntry>();

  buildTargetAssignments(options.targetWords, random).forEach((word, index) => {
    const position = assignmentPositions[index];

    if (position) {
      assignments.set(positionKey(position), word);
    }
  });

  let fillerIndex = 0;

  return baseBoard.map((row, rowIndex) =>
    row.map((block, colIndex) => {
      if (!block) {
        return null;
      }

      const assignedWord =
        assignments.get(positionKey({ row: rowIndex, col: colIndex })) ??
        fillerWords[fillerIndex++ % fillerWords.length]!;

      return {
        ...block,
        label: assignedWord.word,
        wordId: assignedWord.id,
      };
    }),
  );
}
