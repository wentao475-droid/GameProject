import { describe, expect, it } from "vitest";
import { hasAvailableMove } from "@/features/star-pop/lib/hasAvailableMove";
import { createVocabularyBoard } from "@/features/vocabulary/lib/createVocabularyBoard";
import { getWordsByPack } from "@/features/vocabulary/lib/wordBank";

function createDeterministicRandom() {
  let state = 17;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("createVocabularyBoard", () => {
  it("builds a playable board and injects target words with labels", () => {
    const words = getWordsByPack("gaokao-advanced");
    const targetWords = words.slice(0, 3);
    const board = createVocabularyBoard({
      targetWords,
      fillerWords: words,
      random: createDeterministicRandom(),
    });

    expect(board).toHaveLength(10);
    expect(board.every((row) => row.length === 10)).toBe(true);
    expect(hasAvailableMove(board)).toBe(true);

    const labels = board.flatMap((row) => row.map((cell) => cell?.label ?? null).filter(Boolean));
    const wordIds = board.flatMap((row) => row.map((cell) => cell?.wordId ?? null).filter(Boolean));

    expect(labels.length).toBe(100);
    expect(targetWords.every((word) => labels.includes(word.word))).toBe(true);
    expect(targetWords.every((word) => wordIds.filter((wordId) => wordId === word.id).length === 3)).toBe(true);
  });
});
