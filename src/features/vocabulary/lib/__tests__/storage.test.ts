import { afterEach, describe, expect, it } from "vitest";
import {
  getDefaultVocabularyProfile,
  readVocabularyProfile,
  resetVocabularyProfile,
  VOCABULARY_STORAGE_KEY,
  writeVocabularyProfile,
} from "@/features/vocabulary/lib/storage";
import type { VocabularyProfile } from "@/features/vocabulary/lib/vocabularyProgress";

function createStorage() {
  const data = new Map<string, string>();

  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe("vocabulary storage", () => {
  afterEach(() => {
    // @ts-expect-error test cleanup
    delete globalThis.window;
  });

  it("returns defaults when localStorage is unavailable", () => {
    expect(readVocabularyProfile()).toEqual(getDefaultVocabularyProfile());
  });

  it("persists and reads the vocabulary profile from localStorage", () => {
    const storage = createStorage();
    // @ts-expect-error test window mock
    globalThis.window = { localStorage: storage };

    const profile: VocabularyProfile = {
      currentPackId: "hanzi-starter",
      dailyWordTarget: 8,
      learnedCharacterIds: ["ma", "hao"],
      dailyActivityByDate: {
        "2026-07-25": {
          dateKey: "2026-07-25",
          completedSessionCount: 1,
          learnedCharacterIds: ["ma"],
          completedTargetWordIds: ["ma"],
          lastStudiedAt: "2026-07-25T09:30:00.000Z",
        },
      },
      lastStudiedAt: "2026-07-25T09:00:00.000Z",
    };

    writeVocabularyProfile(profile);

    expect(storage.getItem(VOCABULARY_STORAGE_KEY)).not.toBeNull();
    expect(readVocabularyProfile()).toEqual(profile);
  });

  it("resets vocabulary profile to defaults", () => {
    const storage = createStorage();
    // @ts-expect-error test window mock
    globalThis.window = { localStorage: storage };

    writeVocabularyProfile({
      currentPackId: "hanzi-starter",
      dailyWordTarget: 10,
      learnedCharacterIds: ["ma"],
      dailyActivityByDate: {
        "2026-07-25": {
          dateKey: "2026-07-25",
          completedSessionCount: 2,
          learnedCharacterIds: ["ma"],
          completedTargetWordIds: ["ma"],
          lastStudiedAt: "2026-07-25T09:30:00.000Z",
        },
      },
      lastStudiedAt: "2026-07-25T09:00:00.000Z",
    });

    expect(resetVocabularyProfile()).toEqual(getDefaultVocabularyProfile());
    expect(readVocabularyProfile()).toEqual(getDefaultVocabularyProfile());
  });

  it("normalizes legacy or invalid stored vocabulary fields", () => {
    const storage = createStorage();
    // @ts-expect-error test window mock
    globalThis.window = { localStorage: storage };

    storage.setItem(
      VOCABULARY_STORAGE_KEY,
      JSON.stringify({
        currentPackId: "missing-pack",
        dailyWordTarget: -2,
        wordProgressById: {
          ma: {
            stage: "broken",
            seenCount: 2.8,
            correctCount: 3.1,
            lastReviewedAt: 100,
          },
          invalid: "value",
        },
        dailyActivityByDate: {
          "2026-07-25": {
            studiedWordIds: ["ma", 123, "ma", ""],
            introducedWordIds: ["hao", null],
            completedSessionCount: -3,
            lastStudiedAt: 100,
          },
        },
        lastStudiedAt: 300,
      }),
    );

    expect(readVocabularyProfile()).toMatchObject({
      currentPackId: "hanzi-starter",
      dailyWordTarget: 6,
      learnedCharacterIds: ["ma"],
      dailyActivityByDate: {
        "2026-07-25": {
          dateKey: "2026-07-25",
          completedSessionCount: 0,
          learnedCharacterIds: ["hao"],
          completedTargetWordIds: ["ma"],
          lastStudiedAt: null,
        },
      },
      lastStudiedAt: null,
    });
  });
});
