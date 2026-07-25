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
      currentPackId: "cet4-bridge",
      dailyWordTarget: 8,
      showMeaningHint: false,
      quizEnabled: true,
      wordProgressById: {
        sustain: {
          stage: "learning",
          seenCount: 2,
          correctCount: 1,
          lastReviewedAt: "2026-07-25T08:00:00.000Z",
        },
      },
      dailyActivityByDate: {
        "2026-07-25": {
          studiedWordIds: ["sustain"],
          reviewedWordIds: ["sustain"],
          introducedWordIds: [],
          uncertainWordIds: [],
          quizAnsweredQuestionIds: ["sustain-quiz"],
          quizCorrectQuestionIds: ["sustain-quiz"],
          completedSessionCount: 1,
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
      currentPackId: "cet4-bridge",
      dailyWordTarget: 10,
      showMeaningHint: false,
      quizEnabled: false,
      wordProgressById: {
        sustain: {
          stage: "familiar",
          seenCount: 4,
          correctCount: 3,
          lastReviewedAt: "2026-07-25T08:00:00.000Z",
        },
      },
      dailyActivityByDate: {
        "2026-07-25": {
          studiedWordIds: ["sustain"],
          reviewedWordIds: ["sustain"],
          introducedWordIds: [],
          uncertainWordIds: [],
          quizAnsweredQuestionIds: [],
          quizCorrectQuestionIds: [],
          completedSessionCount: 2,
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
          derive: {
            stage: "broken",
            seenCount: 2.8,
            correctCount: 3.1,
            lastReviewedAt: 100,
          },
          invalid: "value",
        },
        dailyActivityByDate: {
          "2026-07-25": {
            studiedWordIds: ["derive", 123, "derive", ""],
            reviewedWordIds: ["derive"],
            introducedWordIds: [null],
            uncertainWordIds: ["derive"],
            quizAnsweredQuestionIds: ["derive-quiz", "derive-quiz"],
            quizCorrectQuestionIds: [false, "derive-quiz"],
            completedSessionCount: -3,
            lastStudiedAt: 100,
          },
        },
        lastStudiedAt: 300,
      }),
    );

    expect(readVocabularyProfile()).toMatchObject({
      currentPackId: "gaokao-advanced",
      dailyWordTarget: 6,
      showMeaningHint: true,
      quizEnabled: true,
      wordProgressById: {
        derive: {
          stage: "familiar",
          seenCount: 2,
          correctCount: 3,
          lastReviewedAt: null,
        },
      },
      dailyActivityByDate: {
        "2026-07-25": {
          studiedWordIds: ["derive"],
          reviewedWordIds: ["derive"],
          introducedWordIds: [],
          uncertainWordIds: ["derive"],
          quizAnsweredQuestionIds: ["derive-quiz"],
          quizCorrectQuestionIds: ["derive-quiz"],
          completedSessionCount: 0,
          lastStudiedAt: null,
        },
      },
      lastStudiedAt: null,
    });
  });
});
