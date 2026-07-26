import { describe, expect, it } from "vitest";
import { hasAvailableMove } from "@/features/star-pop/lib/hasAvailableMove";
import { createVocabularyBoard } from "@/features/vocabulary/lib/createVocabularyBoard";
import { SESSION_TARGET_WORD_COUNT } from "@/features/vocabulary/lib/vocabularyGame";
import { getWordsByPack } from "@/features/vocabulary/lib/wordBank";

function createDeterministicRandom() {
  let state = 17;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("createVocabularyBoard", () => {
  it("builds a playable board and injects target radicals", () => {
    const words = getWordsByPack("hanzi-starter");
    const targetWords = words.slice(0, SESSION_TARGET_WORD_COUNT);
    const board = createVocabularyBoard({
      targetWords,
      fillerWords: words,
      random: createDeterministicRandom(),
    });

    expect(board).toHaveLength(8);
    expect(board.every((row) => row.length === 8)).toBe(true);
    expect(hasAvailableMove(board)).toBe(true);

    const labels = board.flatMap((row) => row.map((cell) => cell?.label ?? null).filter(Boolean));
    const fullLabels = board.flatMap((row) =>
      row.map((cell) => cell?.fullLabel ?? null).filter(Boolean),
    );
    const wordIds = board.flatMap((row) => row.map((cell) => cell?.wordId ?? null).filter(Boolean));

    expect(labels.length).toBe(64);
    expect(fullLabels.length).toBeGreaterThanOrEqual(targetWords.length * 2);
    expect(targetWords.every((word) => fullLabels.includes(word.word))).toBe(true);
    expect(labels.every((label) => label.length <= 2)).toBe(true);
    expect(targetWords.every((word) => word.parts.every((part) => labels.includes(part)))).toBe(true);
    expect(
      targetWords.every((word) => wordIds.filter((wordId) => wordId === word.id).length === word.parts.length),
    ).toBe(true);
  });
});
