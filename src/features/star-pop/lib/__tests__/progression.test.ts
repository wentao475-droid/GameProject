import { describe, expect, it } from "vitest";
import {
  chooseRecommendedGoal,
  getDailyQuests,
  getStarRoadProgress,
  getUnlockedThemeIds,
  resolveDailyQuestProgress,
  summarizeDailyQuestUpdates,
  summarizeStarRoadProgress,
  updateDailyQuestProgress,
} from "@/features/star-pop/lib/progression";

describe("progression", () => {
  it("creates stable daily quests for the same date", () => {
    const date = new Date("2026-07-16T09:00:00");
    const questsA = getDailyQuests(date);
    const questsB = getDailyQuests(date);

    expect(questsA).toEqual(questsB);
    expect(questsA).toHaveLength(3);
    expect(new Set(questsA.map((quest) => quest.id)).size).toBe(3);
  });

  it("updates quest progress after a round and keeps completed quests stable", () => {
    const quests = getDailyQuests(new Date("2026-07-16T09:00:00"));
    const focusQuest = quests[2];
    const firstUpdate = updateDailyQuestProgress(quests, undefined, {
      modeId: focusQuest.modeId ?? "classic",
      score: 2100,
      stars: 2,
      isDailyChallenge: focusQuest.kind === "daily-challenge",
      dailyChallengeCompleted: focusQuest.kind === "daily-challenge",
      finishedAt: "2026-07-16T10:00:00.000Z",
    });

    expect(firstUpdate.rounds.progress).toBe(1);
    expect(firstUpdate.stars.progress).toBe(2);
    expect(firstUpdate[focusQuest.id].progress).toBe(1);

    const completedQuests = resolveDailyQuestProgress(quests, {
      rounds: {
        progress: quests[0].target,
        completed: true,
        completedAt: "2026-07-16T10:00:00.000Z",
      },
    });
    const completedUpdate = updateDailyQuestProgress(
      quests,
      {
        rounds: {
          progress: quests[0].target,
          completed: true,
          completedAt: "2026-07-16T10:00:00.000Z",
        },
      },
      {
        modeId: "moves",
        score: 1500,
        stars: 1,
        isDailyChallenge: false,
        dailyChallengeCompleted: false,
        finishedAt: "2026-07-16T11:00:00.000Z",
      },
    );

    expect(completedQuests[0].completed).toBe(true);
    expect(completedUpdate.rounds).toEqual({
      progress: quests[0].target,
      completed: true,
      completedAt: "2026-07-16T10:00:00.000Z",
    });
  });

  it("computes star road unlocks and next node", () => {
    expect(getUnlockedThemeIds(0)).toEqual(["default"]);
    expect(getUnlockedThemeIds(14)).toEqual(["default", "sunset", "aurora"]);

    expect(getStarRoadProgress(5).nextNode?.themeId).toBe("sunset");
    expect(getStarRoadProgress(24).nextNode).toBeNull();
  });

  it("prefers daily quests, then star road, then mode best for recommendations", () => {
    const quests = resolveDailyQuestProgress(getDailyQuests(new Date("2026-07-16T09:00:00")), {
      rounds: {
        progress: 1,
        completed: false,
        completedAt: null,
      },
      stars: {
        progress: 5,
        completed: true,
        completedAt: "2026-07-16T10:00:00.000Z",
      },
    });

    expect(
      chooseRecommendedGoal({
        dailyQuests: quests,
        starRoadStars: 3,
        bestScoreByMode: {
          classic: 900,
          moves: 1200,
          clear: 600,
        },
        preferredModeId: "moves",
      }).kind,
    ).toBe("daily-quest");
    expect(
      chooseRecommendedGoal({
        dailyQuests: quests,
        starRoadStars: 3,
        bestScoreByMode: {
          classic: 900,
          moves: 1200,
          clear: 600,
        },
        preferredModeId: "moves",
      }).unitLabel,
    ).toBe("局");

    const finishedQuests = quests.map((quest) => ({
      ...quest,
      progress: quest.target,
      completed: true,
      completedAt: "2026-07-16T10:00:00.000Z",
    }));

    expect(
      chooseRecommendedGoal({
        dailyQuests: finishedQuests,
        starRoadStars: 8,
        bestScoreByMode: {
          classic: 900,
          moves: 1200,
          clear: 600,
        },
        preferredModeId: "moves",
      }).kind,
    ).toBe("star-road");
    expect(
      chooseRecommendedGoal({
        dailyQuests: finishedQuests,
        starRoadStars: 8,
        bestScoreByMode: {
          classic: 900,
          moves: 1200,
          clear: 600,
        },
        preferredModeId: "moves",
      }).unitLabel,
    ).toBe("星");

    expect(
      chooseRecommendedGoal({
        dailyQuests: finishedQuests,
        starRoadStars: 30,
        bestScoreByMode: {
          classic: 4200,
          moves: 3000,
          clear: 2500,
        },
        preferredModeId: "moves",
      }).kind,
    ).toBe("mode-best");
    expect(
      chooseRecommendedGoal({
        dailyQuests: finishedQuests,
        starRoadStars: 30,
        bestScoreByMode: {
          classic: 4200,
          moves: 3000,
          clear: 2500,
        },
        preferredModeId: "moves",
      }).unitLabel,
    ).toBe("分");
  });

  it("summarizes changed daily quest progress after a round", () => {
    const quests = getDailyQuests(new Date("2026-07-16T09:00:00"));
    const previousQuests = resolveDailyQuestProgress(quests, undefined);
    const nextQuestState = updateDailyQuestProgress(quests, undefined, {
      modeId: "classic",
      score: 1800,
      stars: 2,
      isDailyChallenge: false,
      dailyChallengeCompleted: false,
      finishedAt: "2026-07-16T10:00:00.000Z",
    });
    const nextQuests = resolveDailyQuestProgress(quests, nextQuestState);
    const updates = summarizeDailyQuestUpdates(previousQuests, nextQuests);

    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0]?.currentProgress).toBeGreaterThanOrEqual(updates[0]?.previousProgress ?? 0);
    expect(updates.some((update) => update.questId === "rounds")).toBe(true);
  });

  it("summarizes star road gains and newly unlocked themes", () => {
    const summary = summarizeStarRoadProgress(5, 2);

    expect(summary.previousStars).toBe(5);
    expect(summary.currentStars).toBe(7);
    expect(summary.gainedStars).toBe(2);
    expect(summary.newlyUnlockedThemeIds).toEqual(["sunset"]);
  });
});
