import { createSeededRandom, getDailyChallengeDateKey } from "@/features/star-pop/lib/dailyChallenge";
import { getGameMode } from "@/features/star-pop/lib/gameModes";
import type { GameModeId } from "@/features/star-pop/types/modes";
import type {
  DailyQuest,
  DailyQuestDefinition,
  DailyQuestProgressUpdate,
  DailyQuestProgressState,
  GameThemeDefinition,
  GameThemeId,
  ProgressRoundResult,
  RecommendedGoal,
  StarRoadNode,
  StarRoadProgress,
  StarRoadProgressUpdate,
} from "@/features/star-pop/types/progression";

export const DEFAULT_THEME_ID: GameThemeId = "default";

export const GAME_THEMES: GameThemeDefinition[] = [
  {
    id: "default",
    name: "晨星",
    description: "默认主题，保持当前明亮星块风格。",
    unlockStars: 0,
  },
  {
    id: "sunset",
    name: "晚霞",
    description: "偏暖的落日配色，适合轻松连消节奏。",
    unlockStars: 6,
  },
  {
    id: "aurora",
    name: "极光",
    description: "更鲜明的高对比霓光配色，突出冲分状态。",
    unlockStars: 14,
  },
  {
    id: "midnight",
    name: "午夜",
    description: "深色夜空主题，作为长期星路终点奖励。",
    unlockStars: 24,
  },
];

export const STAR_ROAD_NODES: StarRoadNode[] = GAME_THEMES.map((theme) => ({
  id: `theme-${theme.id}`,
  requiredStars: theme.unlockStars,
  themeId: theme.id,
  title: theme.name,
  description:
    theme.id === "default" ? "默认主题已可用。" : `累计 ${theme.unlockStars} 星后解锁 ${theme.name} 主题。`,
}));

const MODE_ROTATION: GameModeId[] = ["classic", "moves", "clear"];
const MODE_BEST_TARGETS: Record<GameModeId, number[]> = {
  classic: [1200, 1800, 2400, 3200, 4200],
  moves: [1000, 1600, 2200, 3000, 3800],
  clear: [800, 1400, 2000, 2800, 3600],
};

function hashString(value: string) {
  return value.split("").reduce((hash, char) => hash * 31 + char.charCodeAt(0), 17);
}

function clampProgress(progress: number, target: number) {
  if (!Number.isFinite(progress) || progress <= 0) {
    return 0;
  }

  return Math.min(Math.floor(progress), target);
}

function createRoundsQuest(dateKey: string, random: () => number): DailyQuestDefinition {
  const target = 2 + Math.floor(random() * 2);

  return {
    id: "rounds",
    dateKey,
    kind: "rounds",
    title: "热身连消",
    description: `完成 ${target} 局任意模式，保持今天的连消手感。`,
    target,
    unitLabel: "局",
    modeId: null,
    action: {
      kind: "mode",
      modeId: "classic",
    },
  };
}

function createStarsQuest(dateKey: string, random: () => number): DailyQuestDefinition {
  const target = 4 + Math.floor(random() * 3);

  return {
    id: "stars",
    dateKey,
    kind: "stars",
    title: "星级冲刺",
    description: `今天累计拿到 ${target} 星，优先把每局稳定打到二星以上。`,
    target,
    unitLabel: "星",
    modeId: null,
    action: {
      kind: "mode",
      modeId: "moves",
    },
  };
}

function createFocusQuest(dateKey: string, seed: number, random: () => number): DailyQuestDefinition {
  const focusIndex = seed % 4;

  if (focusIndex === 3) {
    const modeId = MODE_ROTATION[(seed + 1) % MODE_ROTATION.length];

    return {
      id: "daily-challenge",
      dateKey,
      kind: "daily-challenge",
      title: "委托特派",
      description: "完成一次今日每日挑战，顺手拿下额外目标。",
      target: 1,
      unitLabel: "次",
      modeId,
      action: {
        kind: "daily-challenge",
        modeId,
      },
    };
  }

  const modeId = MODE_ROTATION[focusIndex];
  const target = 1 + Math.floor(random() * 2);
  const mode = getGameMode(modeId);

  return {
    id: `mode-rounds-${modeId}`,
    dateKey,
    kind: "mode-rounds",
    title: `${mode.name}委托`,
    description: `在${mode.name}完成 ${target} 局，推进该玩法的熟练度。`,
    target,
    unitLabel: "局",
    modeId,
    action: {
      kind: "mode",
      modeId,
    },
  };
}

function getDefaultQuestProgress(): DailyQuestProgressState {
  return {
    progress: 0,
    completed: false,
    completedAt: null,
  };
}

function getQuestIncrement(quest: DailyQuestDefinition, result: ProgressRoundResult) {
  switch (quest.kind) {
    case "rounds":
      return 1;
    case "stars":
      return result.stars;
    case "mode-rounds":
      return result.modeId === quest.modeId ? 1 : 0;
    case "daily-challenge":
      return result.isDailyChallenge && result.dailyChallengeCompleted ? 1 : 0;
    default:
      return 0;
  }
}

export function isGameThemeId(value: unknown): value is GameThemeId {
  return GAME_THEMES.some((theme) => theme.id === value);
}

export function getThemeDefinition(themeId: GameThemeId) {
  return GAME_THEMES.find((theme) => theme.id === themeId) ?? GAME_THEMES[0];
}

export function getUnlockedThemeIds(totalStars: number): GameThemeId[] {
  return GAME_THEMES.filter((theme) => totalStars >= theme.unlockStars).map((theme) => theme.id);
}

export function getCurrentStarRoadNode(totalStars: number) {
  let currentNode = STAR_ROAD_NODES[0];

  STAR_ROAD_NODES.forEach((node) => {
    if (node.requiredStars <= totalStars) {
      currentNode = node;
    }
  });

  return currentNode;
}

export function getNextStarRoadNode(totalStars: number) {
  return STAR_ROAD_NODES.find((node) => node.requiredStars > totalStars) ?? null;
}

export function getStarRoadProgress(totalStars: number): StarRoadProgress {
  return {
    totalStars,
    currentNode: getCurrentStarRoadNode(totalStars),
    nextNode: getNextStarRoadNode(totalStars),
    unlockedThemeIds: getUnlockedThemeIds(totalStars),
  };
}

export function getDailyQuests(date = new Date()): DailyQuestDefinition[] {
  const dateKey = getDailyChallengeDateKey(date);
  const seed = hashString(dateKey);
  const random = createSeededRandom(seed * 13 + 29);

  return [createRoundsQuest(dateKey, random), createStarsQuest(dateKey, random), createFocusQuest(dateKey, seed, random)];
}

export function resolveDailyQuestProgress(
  quests: DailyQuestDefinition[],
  questStateById: Record<string, DailyQuestProgressState> | undefined,
): DailyQuest[] {
  return quests.map((quest) => {
    const saved = questStateById?.[quest.id];
    const progress = clampProgress(saved?.progress ?? 0, quest.target);
    const completed = saved?.completed === true || progress >= quest.target;

    return {
      ...quest,
      progress,
      completed,
      completedAt: completed ? saved?.completedAt ?? null : null,
    };
  });
}

export function updateDailyQuestProgress(
  quests: DailyQuestDefinition[],
  questStateById: Record<string, DailyQuestProgressState> | undefined,
  result: ProgressRoundResult,
) {
  const nextState: Record<string, DailyQuestProgressState> = {};

  quests.forEach((quest) => {
    const current = questStateById?.[quest.id] ?? getDefaultQuestProgress();
    const previousProgress = clampProgress(current.progress, quest.target);
    const nextProgress = clampProgress(previousProgress + getQuestIncrement(quest, result), quest.target);
    const completed = current.completed || nextProgress >= quest.target;

    nextState[quest.id] = {
      progress: nextProgress,
      completed,
      completedAt: completed ? current.completedAt ?? result.finishedAt : null,
    };
  });

  return nextState;
}

export function getRemainingQuestCount(quests: DailyQuest[]) {
  return quests.filter((quest) => !quest.completed).length;
}

export function chooseRecommendedGoal(params: {
  dailyQuests: DailyQuest[];
  starRoadStars: number;
  bestScoreByMode: Record<GameModeId, number>;
  preferredModeId: GameModeId;
}): RecommendedGoal {
  const incompleteQuest = [...params.dailyQuests]
    .filter((quest) => !quest.completed)
    .sort((left, right) => {
      const leftRemaining = left.target - left.progress;
      const rightRemaining = right.target - right.progress;

      if (leftRemaining !== rightRemaining) {
        return leftRemaining - rightRemaining;
      }

      return left.target - right.target;
    })[0];

  if (incompleteQuest) {
    return {
      kind: "daily-quest",
      questId: incompleteQuest.id,
      title: incompleteQuest.title,
      description: incompleteQuest.description,
      unitLabel: incompleteQuest.unitLabel,
      current: incompleteQuest.progress,
      target: incompleteQuest.target,
      remaining: Math.max(incompleteQuest.target - incompleteQuest.progress, 0),
      action: incompleteQuest.action,
    };
  }

  const nextStarRoadNode = getNextStarRoadNode(params.starRoadStars);
  if (nextStarRoadNode) {
    return {
      kind: "star-road",
      nodeId: nextStarRoadNode.id,
      title: `解锁${getThemeDefinition(nextStarRoadNode.themeId).name}`,
      description: nextStarRoadNode.description,
      unitLabel: "星",
      current: params.starRoadStars,
      target: nextStarRoadNode.requiredStars,
      remaining: Math.max(nextStarRoadNode.requiredStars - params.starRoadStars, 0),
      action: {
        kind: "mode",
        modeId: params.preferredModeId,
      },
      themeId: nextStarRoadNode.themeId,
    };
  }

  const modeId =
    MODE_ROTATION.reduce((bestMode, candidateMode) => {
      const bestScore = params.bestScoreByMode[bestMode];
      const candidateScore = params.bestScoreByMode[candidateMode];
      return candidateScore >= bestScore ? candidateMode : bestMode;
    }, params.preferredModeId) ?? params.preferredModeId;

  const currentBest = params.bestScoreByMode[modeId];
  const target =
    MODE_BEST_TARGETS[modeId].find((candidate) => candidate > currentBest) ??
    Math.ceil((currentBest + 600) / 600) * 600;

  return {
    kind: "mode-best",
    modeId,
    title: `${getGameMode(modeId).name}冲榜`,
    description: `再拿 ${Math.max(target - currentBest, 0)} 分，就能把${getGameMode(modeId).name}最佳分推到 ${target}。`,
    unitLabel: "分",
    current: currentBest,
    target,
    remaining: Math.max(target - currentBest, 0),
    action: {
      kind: "mode",
      modeId,
    },
  };
}

export function summarizeDailyQuestUpdates(
  previousQuests: DailyQuest[],
  nextQuests: DailyQuest[],
): DailyQuestProgressUpdate[] {
  const previousQuestMap = new Map(previousQuests.map((quest) => [quest.id, quest]));

  return nextQuests
    .map((quest) => {
      const previousQuest = previousQuestMap.get(quest.id);
      const previousProgress = previousQuest?.progress ?? 0;
      const currentProgress = quest.progress;
      const newlyCompleted = !previousQuest?.completed && quest.completed;

      return {
        questId: quest.id,
        title: quest.title,
        unitLabel: quest.unitLabel,
        previousProgress,
        currentProgress,
        target: quest.target,
        completed: quest.completed,
        newlyCompleted,
      };
    })
    .filter(
      (quest) => quest.currentProgress > quest.previousProgress || quest.newlyCompleted,
    )
    .sort((left, right) => right.currentProgress - left.currentProgress);
}

export function summarizeStarRoadProgress(
  previousStars: number,
  gainedStars: number,
): StarRoadProgressUpdate {
  const currentStars = previousStars + gainedStars;
  const previousProgress = getStarRoadProgress(previousStars);
  const currentProgress = getStarRoadProgress(currentStars);

  return {
    previousStars,
    currentStars,
    gainedStars,
    previousNode: previousProgress.currentNode,
    currentNode: currentProgress.currentNode,
    nextNode: currentProgress.nextNode,
    newlyUnlockedThemeIds: currentProgress.unlockedThemeIds.filter(
      (themeId) => !previousProgress.unlockedThemeIds.includes(themeId),
    ),
  };
}
