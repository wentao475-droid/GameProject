import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORD_PACK_ID,
  getWordEntry,
  getWordPack,
  getWordsByPack,
  WORD_PACKS,
  WORDS,
} from "@/features/vocabulary/lib/wordBank";

describe("wordBank", () => {
  it("provides at least two packs and enough vocabulary entries", () => {
    expect(WORD_PACKS.length).toBeGreaterThanOrEqual(2);
    expect(WORDS.length).toBeGreaterThanOrEqual(24);

    WORD_PACKS.forEach((pack) => {
      expect(pack.wordIds.length).toBeGreaterThanOrEqual(10);
    });
  });

  it("only includes gaokao-plus or cet4 bridge words with complete fields", () => {
    WORDS.forEach((entry) => {
      expect(entry.difficultyBand === "gaokao-plus" || entry.difficultyBand === "cet4").toBe(true);
      expect(entry.word.trim().length).toBeGreaterThan(0);
      expect(entry.meaning.trim().length).toBeGreaterThan(0);
      expect(entry.partOfSpeech.trim().length).toBeGreaterThan(0);
      expect(entry.example.trim().length).toBeGreaterThan(0);
    });
  });

  it("keeps word ids unique and pack references consistent", () => {
    const wordIds = WORDS.map((entry) => entry.id);
    expect(new Set(wordIds).size).toBe(wordIds.length);

    WORD_PACKS.forEach((pack) => {
      expect(new Set(pack.wordIds).size).toBe(pack.wordIds.length);

      pack.wordIds.forEach((wordId) => {
        const entry = getWordEntry(wordId);
        expect(entry).toBeDefined();
        expect(entry?.packId).toBe(pack.id);
      });
    });
  });

  it("returns ordered pack data and falls back to the default pack", () => {
    const defaultPack = getWordPack(DEFAULT_WORD_PACK_ID);
    const fallbackPack = getWordPack("missing-pack");
    const entries = getWordsByPack("cet4-bridge");

    expect(fallbackPack.id).toBe(defaultPack.id);
    expect(entries.length).toBe(getWordPack("cet4-bridge").wordIds.length);
    expect(entries[0]?.id).toBe(getWordPack("cet4-bridge").wordIds[0]);
    expect(entries.every((entry) => entry.packId === "cet4-bridge")).toBe(true);
  });
});
