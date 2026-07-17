import type {
  DailyChallenge,
  GameModeDefinition,
  GameModeId,
  StarRating,
} from "@/features/star-pop/types/modes";

export const GAME_MODES: Record<GameModeId, GameModeDefinition> = {
  classic: {
    id: "classic",
    name: "经典模式",
    shortName: "经典",
    description: "无限步数，尽量打出更高分数。",
    objective: "自由爆破冲高分",
    actionLabel: "开始经典模式",
    moveLimit: null,
  },
  moves: {
    id: "moves",
    name: "限步挑战",
    shortName: "限步",
    description: "只有 20 步，每一步都要更值钱。",
    objective: "20 步内冲最高分",
    actionLabel: "开始限步挑战",
    moveLimit: 20,
  },
  clear: {
    id: "clear",
    name: "清盘模式",
    shortName: "清盘",
    description: "目标是残局尽量少，越接近清盘越好。",
    objective: "尽量把剩余块数压到最低",
    actionLabel: "开始清盘模式",
    moveLimit: null,
  },
};

export function getGameMode(modeId: GameModeId) {
  return GAME_MODES[modeId];
}

export function calculateCleanupBonus(remainingBlocks: number) {
  if (remainingBlocks === 0) {
    return 1200;
  }

  if (remainingBlocks <= 5) {
    return 800;
  }

  if (remainingBlocks <= 10) {
    return 480;
  }

  if (remainingBlocks <= 20) {
    return 180;
  }

  return 0;
}

export function calculateStars(modeId: GameModeId, score: number, remainingBlocks: number): StarRating {
  if (modeId === "clear") {
    if (remainingBlocks === 0) {
      return 3;
    }

    if (remainingBlocks <= 8) {
      return 2;
    }

    return 1;
  }

  if (score >= 3200) {
    return 3;
  }

  if (score >= 1800) {
    return 2;
  }

  return 1;
}

export function getStarLabel(stars: StarRating) {
  if (stars === 3) {
    return "三星通关";
  }

  if (stars === 2) {
    return "双星成绩";
  }

  return "一星完成";
}

export function isDailyChallengeCompleted(challenge: DailyChallenge, score: number, remainingBlocks: number) {
  if (challenge.goal.kind === "score") {
    return score >= challenge.goal.value;
  }

  return remainingBlocks <= challenge.goal.value;
}
