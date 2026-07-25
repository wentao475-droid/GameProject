import { describe, expect, it } from "vitest";
import { getDefaultVocabularyProfile } from "@/features/vocabulary/lib/storage";
import { SESSION_TARGET_WORD_COUNT } from "@/features/vocabulary/lib/vocabularyGame";
import {
  buildVocabularyDailyTasks,
  buildSessionResult,
  buildReviewQuestions,
  buildTodayWordPack,
  getReviewQueueCount,
  getVocabularyDailyActivity,
  recordVocabularyQuizAnswer,
  recordVocabularySessionCompletion,
  recordVocabularyTargetResults,
  updateWordProgress,
  type VocabularyProfile,
} from "@/features/vocabulary/lib/vocabularyProgress";

function createProfile(overrides?: Partial<VocabularyProfile>): VocabularyProfile {
  const defaults = getDefaultVocabularyProfile();

  return {
    ...defaults,
    ...overrides,
    wordProgressById: {
      ...defaults.wordProgressById,
      ...overrides?.wordProgressById,
    },
    dailyActivityByDate: {
      ...defaults.dailyActivityByDate,
      ...overrides?.dailyActivityByDate,
    },
  };
}

describe("vocabularyProgress", () => {
  it("promotes word stage after repeated correct reviews", () => {
    let progress = undefined;

    progress = updateWordProgress(progress, true, "2026-07-20T08:00:00.000Z");
    expect(progress.stage).toBe("learning");
    expect(progress.correctCount).toBe(1);

    progress = updateWordProgress(progress, true, "2026-07-21T08:00:00.000Z");
    expect(progress.stage).toBe("learning");
    expect(progress.correctCount).toBe(2);

    progress = updateWordProgress(progress, true, "2026-07-22T08:00:00.000Z");
    expect(progress.stage).toBe("familiar");
    expect(progress.correctCount).toBe(3);

    progress = updateWordProgress(progress, true, "2026-07-23T08:00:00.000Z");
    expect(progress.stage).toBe("mastered");
    expect(progress.correctCount).toBe(4);
    expect(progress.seenCount).toBe(4);
  });

  it("builds a daily pack by prioritizing due review words and filling with unseen words", () => {
    const profile = createProfile({
      dailyWordTarget: 4,
      wordProgressById: {
        allocate: {
          stage: "learning",
          seenCount: 1,
          correctCount: 1,
          lastReviewedAt: "2026-07-22T08:00:00.000Z",
        },
        derive: {
          stage: "familiar",
          seenCount: 3,
          correctCount: 3,
          lastReviewedAt: "2026-07-19T08:00:00.000Z",
        },
        subtle: {
          stage: "learning",
          seenCount: 1,
          correctCount: 1,
          lastReviewedAt: "2026-07-25T08:00:00.000Z",
        },
      },
    });

    const todayPack = buildTodayWordPack(profile, {
      date: new Date("2026-07-25T09:30:00.000Z"),
    });

    expect(todayPack.pack.id).toBe("gaokao-advanced");
    expect(todayPack.reviewWords.map((word) => word.id)).toEqual(["allocate", "derive"]);
    expect(todayPack.newWords).toHaveLength(2);
    expect(todayPack.words).toHaveLength(4);
    expect(todayPack.words.every((word) => word.packId === todayPack.pack.id)).toBe(true);
    expect(todayPack.words.some((word) => word.id === "subtle")).toBe(false);
    expect(getReviewQueueCount(profile, { date: new Date("2026-07-25T09:30:00.000Z") })).toBe(2);
  });

  it("builds lightweight review questions with real meanings and unique choices", () => {
    const questions = buildReviewQuestions(["allocate", "derive", "allocate"]);

    expect(questions).toHaveLength(2);
    expect(questions[0]?.wordId).toBe("allocate");
    expect(questions[0]?.answer).toBe("分配；拨出");
    expect(questions[0]?.choices).toContain("分配；拨出");
    expect(new Set(questions[0]?.choices).size).toBe(questions[0]?.choices.length);
    expect(questions[0]?.choices.length).toBe(4);
    expect(questions[0]?.prompt).toContain("allocate");
  });

  it("builds a session result from target collection progress", () => {
    const result = buildSessionResult({
      dateKey: "2026-07-25",
      packId: "gaokao-advanced",
      score: 180,
      removedBlockCount: 14,
      quizEnabled: true,
      targetResults: [
        {
          wordId: "allocate",
          collectedCount: 3,
          targetCount: 3,
          hit: true,
          completed: true,
          wasNew: true,
          wasReview: false,
          previousStage: "new",
          nextStage: "learning",
        },
        {
          wordId: "derive",
          collectedCount: 1,
          targetCount: 3,
          hit: true,
          completed: false,
          wasNew: true,
          wasReview: false,
          previousStage: "new",
          nextStage: "learning",
        },
        {
          wordId: "subtle",
          collectedCount: 0,
          targetCount: 3,
          hit: false,
          completed: false,
          wasNew: false,
          wasReview: true,
          previousStage: "learning",
          nextStage: "learning",
        },
      ],
    });

    expect(result.score).toBe(180);
    expect(result.removedBlockCount).toBe(14);
    expect(result.hitTargetWordIds).toEqual(["allocate", "derive"]);
    expect(result.completedTargetWordIds).toEqual(["allocate"]);
    expect(result.reviewNeededWordIds).toEqual(["derive", "subtle"]);
    expect(result.questions).toHaveLength(2);
    expect(result.questions.map((question) => question.wordId)).toEqual(["derive", "subtle"]);
    expect(result.recommendedAction).toContain("继续复习 2 个未完成目标词");
  });

  it("tracks target-based daily activity and builds target-based daily task summary", () => {
    const profile = createProfile({
      dailyWordTarget: 6,
      quizEnabled: true,
    });
    const todayPack = buildTodayWordPack(profile, {
      date: new Date("2026-07-25T09:30:00.000Z"),
    });
    const dateKey = todayPack.dateKey;
    const reviewTargetIds = todayPack.reviewWords
      .slice(0, SESSION_TARGET_WORD_COUNT)
      .map((word) => word.id);
    const activity = recordVocabularySessionCompletion(
      recordVocabularyQuizAnswer(
        recordVocabularyTargetResults(
          getVocabularyDailyActivity(profile, dateKey),
          [
            {
              wordId: todayPack.newWords[0]?.id ?? "allocate",
              collectedCount: 3,
              targetCount: 3,
              hit: true,
              completed: true,
              wasNew: true,
              wasReview: false,
              previousStage: "new",
              nextStage: "learning",
            },
            {
              wordId: reviewTargetIds[0] ?? "derive",
              collectedCount: 1,
              targetCount: 3,
              hit: true,
              completed: false,
              wasNew: false,
              wasReview: true,
              previousStage: "learning",
              nextStage: "learning",
            },
          ],
          "2026-07-25T09:45:00.000Z",
        ),
        "derive-quiz",
        true,
      ),
      "2026-07-25T09:46:00.000Z",
    );
    const nextProfile = createProfile({
      dailyActivityByDate: {
        [dateKey]: activity,
      },
    });

    const tasks = buildVocabularyDailyTasks(nextProfile, todayPack);

    expect(tasks.map((task) => task.id)).toEqual(["daily-target", "review-queue", "quick-quiz"]);
    expect(tasks[0]).toMatchObject({
      progress: 1,
      target: 1,
      completed: true,
    });
    expect(tasks[1]?.progress).toBe(0);
    expect(tasks[1]?.target).toBe(reviewTargetIds.length);
    expect(tasks[2]).toMatchObject({
      progress: 1,
      target: 1,
      completed: true,
    });
    expect(activity.uncertainWordIds).toContain(reviewTargetIds[0] ?? "derive");
  });
});
