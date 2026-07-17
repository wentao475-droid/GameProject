import { describe, expect, it } from "vitest";
import {
  calculateCleanupBonus,
  calculateStars,
  getGameMode,
  isDailyChallengeCompleted,
} from "@/features/star-pop/lib/gameModes";
import type { DailyChallenge } from "@/features/star-pop/types/modes";

describe("gameModes", () => {
  it("returns mode metadata", () => {
    expect(getGameMode("moves").moveLimit).toBe(20);
    expect(getGameMode("clear").name).toBe("清盘模式");
  });

  it("calculates cleanup bonus by remaining blocks", () => {
    expect(calculateCleanupBonus(0)).toBe(1200);
    expect(calculateCleanupBonus(4)).toBe(800);
    expect(calculateCleanupBonus(12)).toBe(180);
    expect(calculateCleanupBonus(24)).toBe(0);
  });

  it("calculates stars per mode", () => {
    expect(calculateStars("classic", 3400, 10)).toBe(3);
    expect(calculateStars("moves", 1900, 6)).toBe(2);
    expect(calculateStars("clear", 900, 0)).toBe(3);
    expect(calculateStars("clear", 900, 9)).toBe(1);
  });

  it("checks daily challenge completion by goal type", () => {
    const scoreChallenge: DailyChallenge = {
      dateKey: "2026-06-15",
      modeId: "classic",
      title: "每日挑战",
      description: "固定棋盘",
      seed: 10,
      goal: {
        kind: "score",
        value: 2000,
        label: "挑战 2000 分",
      },
    };

    const remainingChallenge: DailyChallenge = {
      ...scoreChallenge,
      modeId: "clear",
      goal: {
        kind: "remaining",
        value: 6,
        label: "剩余 6 块以内",
      },
    };

    expect(isDailyChallengeCompleted(scoreChallenge, 2300, 18)).toBe(true);
    expect(isDailyChallengeCompleted(scoreChallenge, 1800, 0)).toBe(false);
    expect(isDailyChallengeCompleted(remainingChallenge, 600, 5)).toBe(true);
    expect(isDailyChallengeCompleted(remainingChallenge, 600, 9)).toBe(false);
  });
});
