import { getGameMode } from "@/features/star-pop/lib/gameModes";
import type { DailyChallenge, DailyChallengeGoal, GameModeId } from "@/features/star-pop/types/modes";

const DAILY_MODE_ORDER: GameModeId[] = ["classic", "moves", "clear"];

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function getDailyChallengeDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashString(value: string) {
  return value.split("").reduce((hash, char) => hash * 31 + char.charCodeAt(0), 7);
}

function createChallengeGoal(modeId: GameModeId, seed: number): DailyChallengeGoal {
  if (modeId === "clear") {
    const target = 6 + (seed % 5);
    return {
      kind: "remaining",
      value: target,
      label: `把剩余方块压到 ${target} 块以内`,
    };
  }

  const baseTarget = modeId === "moves" ? 1800 : 2200;
  const extra = (seed % 4) * 120;
  const target = baseTarget + extra;

  return {
    kind: "score",
    value: target,
    label: `挑战 ${target} 分`,
  };
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const dateKey = getDailyChallengeDateKey(date);
  const hash = hashString(dateKey);
  const modeId = DAILY_MODE_ORDER[hash % DAILY_MODE_ORDER.length];
  const seed = hash * 17 + 97;
  const mode = getGameMode(modeId);

  return {
    dateKey,
    modeId,
    title: "每日挑战",
    description: `固定棋盘 · ${mode.name}`,
    seed,
    goal: createChallengeGoal(modeId, seed),
  };
}
