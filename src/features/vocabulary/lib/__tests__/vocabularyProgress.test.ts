import { describe, expect, it } from "vitest";
import { getDefaultVocabularyProfile } from "@/features/vocabulary/lib/storage";
import { SESSION_TARGET_WORD_COUNT } from "@/features/vocabulary/lib/vocabularyGame";
import {
  buildVocabularyDailyTasks,
  buildSessionResult,
  buildTodayWordPack,
  getReviewQueueCount,
  getVocabularyDailyActivity,
  recordVocabularyTargetResults,
  type VocabularyProfile,
} from "@/features/vocabulary/lib/vocabularyProgress";

function createProfile(overrides?: Partial<VocabularyProfile>): VocabularyProfile {
  const defaults = getDefaultVocabularyProfile();

  return {
    ...defaults,
    ...overrides,
    dailyActivityByDate: {
      ...defaults.dailyActivityByDate,
      ...overrides?.dailyActivityByDate,
    },
  };
}

describe("vocabularyProgress", () => {
  it("builds a daily pack by splitting learned and unseen characters", () => {
    const profile = createProfile({
      dailyWordTarget: 4,
      learnedCharacterIds: ["ma", "hao"],
    });

    const todayPack = buildTodayWordPack(profile, {
      date: new Date("2026-07-25T09:30:00.000Z"),
    });

    expect(todayPack.pack.id).toBe("hanzi-starter");
    expect(todayPack.reviewWords.map((word) => word.id)).toEqual(["ma", "hao"]);
    expect(todayPack.newWords).toHaveLength(10);
    expect(todayPack.words).toHaveLength(4);
    expect(todayPack.words.every((word) => word.packId === todayPack.pack.id)).toBe(true);
    expect(todayPack.words.some((word) => word.id === "ming")).toBe(true);
    expect(getReviewQueueCount(profile)).toBe(2);
  });

  it("builds a session result from formed target characters", () => {
    const result = buildSessionResult({
      dateKey: "2026-07-25",
      packId: "hanzi-starter",
      score: 180,
      removedBlockCount: 14,
      targetResults: [
        {
          wordId: "ma",
          collectedCount: 1,
          targetCount: 1,
          hit: true,
          completed: true,
        },
        {
          wordId: "hao",
          collectedCount: 1,
          targetCount: 1,
          hit: true,
          completed: true,
        },
      ],
    });

    expect(result.score).toBe(180);
    expect(result.removedBlockCount).toBe(14);
    expect(result.hitTargetWordIds).toEqual(["ma", "hao"]);
    expect(result.completedTargetWordIds).toEqual(["ma", "hao"]);
    expect(result.learnedCharacterIds).toEqual(["ma", "hao"]);
    expect(result.recommendedAction).toContain("两个目标字都拼出来了");
  });

  it("tracks daily character activity and builds the task summary", () => {
    const profile = createProfile({
      dailyWordTarget: 6,
    });
    const todayPack = buildTodayWordPack(profile, {
      date: new Date("2026-07-25T09:30:00.000Z"),
    });
    const dateKey = todayPack.dateKey;
    const sessionResult = buildSessionResult({
      dateKey,
      packId: todayPack.pack.id,
      score: 240,
      removedBlockCount: 18,
      targetResults: [
        {
          wordId: todayPack.words[0]!.id,
          collectedCount: 1,
          targetCount: 1,
          hit: true,
          completed: true,
        },
        {
          wordId: todayPack.words[1]!.id,
          collectedCount: 0,
          targetCount: 1,
          hit: false,
          completed: false,
        },
      ],
    });
    const nextProfile = recordVocabularyTargetResults(
      profile,
      sessionResult,
      "2026-07-25T09:46:00.000Z",
    );

    const tasks = buildVocabularyDailyTasks(nextProfile, todayPack);
    const activity = getVocabularyDailyActivity(nextProfile, dateKey);

    expect(tasks.map((task) => task.id)).toEqual([
      "daily-session",
      "daily-target",
      "daily-discovery",
    ]);
    expect(tasks[0]).toMatchObject({
      progress: 1,
      target: 1,
      completed: true,
    });
    expect(tasks[1]?.progress).toBeLessThanOrEqual(SESSION_TARGET_WORD_COUNT);
    expect(tasks[1]?.target).toBe(SESSION_TARGET_WORD_COUNT);
    expect(tasks[2]).toMatchObject({
      progress: 1,
      target: 2,
      completed: false,
    });
    expect(activity.completedSessionCount).toBe(1);
    expect(activity.learnedCharacterIds).toEqual([todayPack.words[0]!.id]);
    expect(activity.completedTargetWordIds).toEqual([todayPack.words[0]!.id]);
  });
});
