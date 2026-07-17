import { afterEach, describe, expect, it } from "vitest";
import { getDefaultProfile, readProfile, resetProfile, writeProfile } from "@/features/star-pop/lib/storage";
import type { GameProfile } from "@/features/star-pop/types/profile";

const STORAGE_KEY = "star-pop-profile";

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

describe("storage", () => {
  afterEach(() => {
    // @ts-expect-error test cleanup
    delete globalThis.window;
  });

  it("returns defaults when storage is unavailable", () => {
    expect(readProfile()).toEqual(getDefaultProfile());
  });

  it("persists and reads the profile from localStorage", () => {
    const storage = createStorage();
    // @ts-expect-error test window mock
    globalThis.window = { localStorage: storage };

    const profile: GameProfile = {
      bestScore: 320,
      bestScoreByMode: {
        classic: 320,
        moves: 180,
        clear: 90,
      },
      totalRounds: 7,
      lastResult: {
        modeId: "classic",
        modeName: "经典模式",
        score: 320,
        baseScore: 180,
        cleanupBonus: 140,
        remainingBlocks: 0,
        autoClearedBlocks: 4,
        stars: 2,
        movesUsed: 9,
        movesLeft: null,
        isDailyChallenge: false,
        dailyChallengeDateKey: null,
        dailyChallengeGoalLabel: null,
        dailyChallengeCompleted: false,
        isNewBest: true,
        finishedAt: "2026-06-15T00:00:00.000Z",
        progressSummary: {
          dailyQuestUpdates: [],
          starRoad: {
            previousStars: 0,
            currentStars: 2,
            gainedStars: 2,
            previousNode: {
              id: "theme-default",
              requiredStars: 0,
              themeId: "default",
              title: "晨星",
              description: "默认主题已可用。",
            },
            currentNode: {
              id: "theme-default",
              requiredStars: 0,
              themeId: "default",
              title: "晨星",
              description: "默认主题已可用。",
            },
            nextNode: {
              id: "theme-sunset",
              requiredStars: 6,
              themeId: "sunset",
              title: "晚霞",
              description: "累计 6 星后解锁 晚霞 主题。",
            },
            newlyUnlockedThemeIds: [],
          },
        },
      },
      dailyChallengeHistory: {},
      dailyQuestProgressByDate: {
        "2026-07-16": {
          rounds: {
            progress: 1,
            completed: false,
            completedAt: null,
          },
        },
      },
      starRoadStars: 9,
      unlockedThemeIds: ["default", "sunset"],
      currentThemeId: "sunset",
      lastSelectedMode: "classic",
      settings: {
        soundEnabled: false,
        vibrationEnabled: true,
        animationEnabled: false,
      },
    };

    writeProfile(profile);

    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(readProfile()).toEqual(profile);
  });

  it("resets profile to defaults", () => {
    const storage = createStorage();
    // @ts-expect-error test window mock
    globalThis.window = { localStorage: storage };

    writeProfile({
      bestScore: 520,
      bestScoreByMode: {
        classic: 520,
        moves: 220,
        clear: 120,
      },
      totalRounds: 12,
      lastResult: null,
      dailyChallengeHistory: {},
      dailyQuestProgressByDate: {},
      starRoadStars: 0,
      unlockedThemeIds: ["default"],
      currentThemeId: "default",
      lastSelectedMode: "moves",
      settings: {
        soundEnabled: false,
        vibrationEnabled: false,
        animationEnabled: false,
      },
    });

    expect(resetProfile()).toEqual(getDefaultProfile());
    expect(readProfile()).toEqual(getDefaultProfile());
  });

  it("fills safe defaults for legacy profiles without progression fields", () => {
    const storage = createStorage();
    // @ts-expect-error test window mock
    globalThis.window = { localStorage: storage };

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bestScore: 520,
        bestScoreByMode: {
          classic: 520,
          moves: 220,
          clear: 120,
        },
        totalRounds: 12,
        lastResult: null,
        dailyChallengeHistory: {},
        lastSelectedMode: "moves",
        settings: {
          soundEnabled: false,
          vibrationEnabled: false,
          animationEnabled: false,
        },
      }),
    );

    expect(readProfile()).toMatchObject({
      dailyQuestProgressByDate: {},
      starRoadStars: 0,
      unlockedThemeIds: ["default"],
      currentThemeId: "default",
    });
  });

  it("normalizes invalid progression fields without unlocking unsafe themes", () => {
    const storage = createStorage();
    // @ts-expect-error test window mock
    globalThis.window = { localStorage: storage };

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...getDefaultProfile(),
        starRoadStars: 6,
        dailyQuestProgressByDate: {
          "2026-07-16": {
            rounds: {
              progress: -3,
              completed: false,
              completedAt: 10,
            },
          },
        },
        unlockedThemeIds: ["default", "midnight"],
        currentThemeId: "midnight",
      }),
    );

    expect(readProfile()).toMatchObject({
      dailyQuestProgressByDate: {
        "2026-07-16": {
          rounds: {
            progress: 0,
            completed: false,
            completedAt: null,
          },
        },
      },
      unlockedThemeIds: ["default", "sunset"],
      currentThemeId: "default",
    });
  });
});
