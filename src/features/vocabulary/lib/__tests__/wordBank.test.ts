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
  it("provides a starter hanzi pack with enough characters", () => {
    expect(WORD_PACKS.length).toBeGreaterThanOrEqual(1);
    expect(WORDS.length).toBeGreaterThanOrEqual(10);

    WORD_PACKS.forEach((pack) => {
      expect(pack.wordIds.length).toBeGreaterThanOrEqual(10);
    });
  });

  it("keeps every character entry complete for radical learning", () => {
    WORDS.forEach((entry) => {
      expect(entry.word.trim().length).toBeGreaterThan(0);
      expect(entry.meaning.trim().length).toBeGreaterThan(0);
      expect(entry.pronunciation.trim().length).toBeGreaterThan(0);
      expect(entry.example.trim().length).toBeGreaterThan(0);
      expect(entry.parts.length).toBeGreaterThanOrEqual(2);
      expect(entry.familyHint.trim().length).toBeGreaterThan(0);
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
    const entries = getWordsByPack(DEFAULT_WORD_PACK_ID);

    expect(fallbackPack.id).toBe(defaultPack.id);
    expect(entries.length).toBe(getWordPack(DEFAULT_WORD_PACK_ID).wordIds.length);
    expect(entries[0]?.id).toBe(getWordPack(DEFAULT_WORD_PACK_ID).wordIds[0]);
    expect(entries.every((entry) => entry.packId === DEFAULT_WORD_PACK_ID)).toBe(true);
  });
});
