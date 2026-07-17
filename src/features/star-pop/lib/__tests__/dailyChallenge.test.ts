import { describe, expect, it } from "vitest";
import {
  createSeededRandom,
  getDailyChallenge,
  getDailyChallengeDateKey,
} from "@/features/star-pop/lib/dailyChallenge";

describe("dailyChallenge", () => {
  it("creates a stable date key", () => {
    expect(getDailyChallengeDateKey(new Date("2026-06-15T12:00:00"))).toBe("2026-06-15");
  });

  it("creates deterministic seeded random values", () => {
    const randomA = createSeededRandom(42);
    const randomB = createSeededRandom(42);

    expect(randomA()).toBe(randomB());
    expect(randomA()).toBe(randomB());
  });

  it("returns the same daily challenge for the same date", () => {
    const date = new Date("2026-06-15T09:00:00");
    const challengeA = getDailyChallenge(date);
    const challengeB = getDailyChallenge(date);

    expect(challengeA).toEqual(challengeB);
    expect(["classic", "moves", "clear"]).toContain(challengeA.modeId);
    expect(challengeA.goal.label.length).toBeGreaterThan(0);
  });
});
