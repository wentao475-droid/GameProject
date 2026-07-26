import { describe, expect, it } from "vitest";
import {
  getCurrentTargetBonus,
  getCurrentTargetWordId,
  CURRENT_TARGET_BONUS_PER_HIT,
  getFormedWords,
  getFormedTargetWordIds,
  TARGET_WORD_COLLECTION_GOAL,
} from "@/features/vocabulary/lib/vocabularyGame";
import { getWordsByPack } from "@/features/vocabulary/lib/wordBank";

describe("vocabularyGame target bonus", () => {
  const targetWords = getWordsByPack("hanzi-starter").slice(0, 3);

  it("returns the first incomplete target as current target", () => {
    expect(getCurrentTargetWordId(targetWords, {})).toBe(targetWords[0]?.id);
    expect(
      getCurrentTargetWordId(targetWords, {
        [targetWords[0]!.id]: TARGET_WORD_COLLECTION_GOAL,
      }),
    ).toBe(targetWords[1]?.id);
  });

  it("awards bonus when the current highlighted target is formed", () => {
    const bonus = getCurrentTargetBonus(targetWords[0]!.id, {
      [targetWords[0]!.id]: 1,
      [targetWords[2]!.id]: 1,
    });

    expect(bonus).toBe(CURRENT_TARGET_BONUS_PER_HIT);
  });

  it("does not award bonus when only other target words are formed", () => {
    const bonus = getCurrentTargetBonus(targetWords[0]!.id, {
      [targetWords[2]!.id]: 1,
    });

    expect(bonus).toBe(0);
  });

  it("forms a target only when all required parts are removed together", () => {
    const formedWordIds = getFormedTargetWordIds(targetWords[0]!.parts, targetWords);
    const missingPartWordIds = getFormedTargetWordIds([targetWords[0]!.parts[0]!], targetWords);

    expect(formedWordIds).toEqual([targetWords[0]!.id]);
    expect(missingPartWordIds).toEqual([]);
  });

  it("returns every character that can be formed from one removed group", () => {
    const candidateWords = getWordsByPack("hanzi-starter");
    const formedWords = getFormedWords(["女", "马", "子"], candidateWords);

    expect(formedWords.map((word) => word.id)).toEqual(["ma", "hao"]);
  });
});
