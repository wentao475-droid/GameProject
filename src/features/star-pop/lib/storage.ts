import type { GameProfile, GameResult, GameSettings } from "@/features/star-pop/types/profile";
import type { GameModeId } from "@/features/star-pop/types/modes";
import {
  DEFAULT_THEME_ID,
  getStarRoadProgress,
  getUnlockedThemeIds,
  isGameThemeId,
} from "@/features/star-pop/lib/progression";
import type { DailyQuestProgressState, GameThemeId } from "@/features/star-pop/types/progression";

const STORAGE_KEY = "star-pop-profile";

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  animationEnabled: true,
};

function createDefaultBestScoreByMode(): Record<GameModeId, number> {
  return {
    classic: 0,
    moves: 0,
    clear: 0,
  };
}

function normalizeQuestProgressState(
  candidate: unknown,
): DailyQuestProgressState | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const value = candidate as Record<string, unknown>;
  const progress =
    typeof value.progress === "number" && Number.isFinite(value.progress) && value.progress >= 0
      ? Math.floor(value.progress)
      : 0;

  return {
    progress,
    completed: value.completed === true,
    completedAt: typeof value.completedAt === "string" ? value.completedAt : null,
  };
}

function normalizeDailyQuestProgressByDate(candidate: unknown) {
  if (!candidate || typeof candidate !== "object") {
    return {};
  }

  return Object.entries(candidate as Record<string, unknown>).reduce<
    Record<string, Record<string, DailyQuestProgressState>>
  >((result, [dateKey, questEntries]) => {
    if (!questEntries || typeof questEntries !== "object") {
      return result;
    }

    const nextQuestEntries = Object.entries(questEntries as Record<string, unknown>).reduce<
      Record<string, DailyQuestProgressState>
    >((questResult, [questId, questValue]) => {
      const normalized = normalizeQuestProgressState(questValue);
      if (normalized) {
        questResult[questId] = normalized;
      }
      return questResult;
    }, {});

    result[dateKey] = nextQuestEntries;
    return result;
  }, {});
}

function normalizeThemeIds(candidate: unknown, totalStars: number): GameThemeId[] {
  const unlockedFromStars = getUnlockedThemeIds(totalStars);
  const safeUnlockedIds = Array.isArray(candidate)
    ? candidate.filter((themeId): themeId is GameThemeId =>
        isGameThemeId(themeId) && unlockedFromStars.includes(themeId),
      )
    : [];
  const merged = Array.from(new Set([...unlockedFromStars, ...safeUnlockedIds]));
  return merged.includes(DEFAULT_THEME_ID) ? merged : [DEFAULT_THEME_ID, ...merged];
}

function normalizeLastResult(candidate: unknown): GameResult | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const value = candidate as Record<string, unknown>;
  const score = typeof value.score === "number" ? value.score : 0;
  const modeId =
    value.modeId === "classic" || value.modeId === "moves" || value.modeId === "clear"
      ? value.modeId
      : "classic";
  const stars = value.stars === 1 || value.stars === 2 || value.stars === 3 ? value.stars : 1;
  const progressSummaryValue =
    value.progressSummary && typeof value.progressSummary === "object"
      ? (value.progressSummary as Record<string, unknown>)
      : null;
  const normalizedStarRoad = getStarRoadProgress(stars);

  return {
    modeId,
    modeName: typeof value.modeName === "string" ? value.modeName : "经典模式",
    score,
    baseScore: typeof value.baseScore === "number" ? value.baseScore : score,
    cleanupBonus: typeof value.cleanupBonus === "number" ? value.cleanupBonus : 0,
    remainingBlocks: typeof value.remainingBlocks === "number" ? value.remainingBlocks : 0,
    autoClearedBlocks:
      typeof value.autoClearedBlocks === "number" ? value.autoClearedBlocks : 0,
    stars,
    movesUsed: typeof value.movesUsed === "number" ? value.movesUsed : 0,
    movesLeft: typeof value.movesLeft === "number" ? value.movesLeft : null,
    isDailyChallenge: value.isDailyChallenge === true,
    dailyChallengeDateKey:
      typeof value.dailyChallengeDateKey === "string" ? value.dailyChallengeDateKey : null,
    dailyChallengeGoalLabel:
      typeof value.dailyChallengeGoalLabel === "string" ? value.dailyChallengeGoalLabel : null,
    dailyChallengeCompleted: value.dailyChallengeCompleted === true,
    isNewBest: value.isNewBest === true,
    finishedAt:
      typeof value.finishedAt === "string" ? value.finishedAt : new Date(0).toISOString(),
    progressSummary: {
      dailyQuestUpdates: Array.isArray(progressSummaryValue?.dailyQuestUpdates)
        ? progressSummaryValue.dailyQuestUpdates.reduce<GameResult["progressSummary"]["dailyQuestUpdates"]>(
            (updates, candidateUpdate) => {
              if (!candidateUpdate || typeof candidateUpdate !== "object") {
                return updates;
              }

              const update = candidateUpdate as Record<string, unknown>;
              updates.push({
                questId: typeof update.questId === "string" ? update.questId : "legacy",
                title: typeof update.title === "string" ? update.title : "历史委托",
                unitLabel: typeof update.unitLabel === "string" ? update.unitLabel : "次",
                previousProgress:
                  typeof update.previousProgress === "number" ? update.previousProgress : 0,
                currentProgress:
                  typeof update.currentProgress === "number" ? update.currentProgress : 0,
                target: typeof update.target === "number" ? update.target : 0,
                completed: update.completed === true,
                newlyCompleted: update.newlyCompleted === true,
              });
              return updates;
            },
            [],
          )
        : [],
      starRoad:
        progressSummaryValue?.starRoad && typeof progressSummaryValue.starRoad === "object"
          ? {
              previousStars:
                typeof (progressSummaryValue.starRoad as Record<string, unknown>).previousStars ===
                "number"
                  ? ((progressSummaryValue.starRoad as Record<string, unknown>).previousStars as number)
                  : 0,
              currentStars:
                typeof (progressSummaryValue.starRoad as Record<string, unknown>).currentStars ===
                "number"
                  ? ((progressSummaryValue.starRoad as Record<string, unknown>).currentStars as number)
                  : normalizedStarRoad.totalStars,
              gainedStars:
                typeof (progressSummaryValue.starRoad as Record<string, unknown>).gainedStars ===
                "number"
                  ? ((progressSummaryValue.starRoad as Record<string, unknown>).gainedStars as number)
                  : stars,
              previousNode: normalizedStarRoad.currentNode,
              currentNode: normalizedStarRoad.currentNode,
              nextNode: normalizedStarRoad.nextNode,
              newlyUnlockedThemeIds: [],
            }
          : {
              previousStars: 0,
              currentStars: normalizedStarRoad.totalStars,
              gainedStars: stars,
              previousNode: getStarRoadProgress(0).currentNode,
              currentNode: normalizedStarRoad.currentNode,
              nextNode: normalizedStarRoad.nextNode,
              newlyUnlockedThemeIds: normalizedStarRoad.unlockedThemeIds.filter(
                (themeId) => themeId !== DEFAULT_THEME_ID,
              ),
            },
    },
  };
}

export function getDefaultProfile(): GameProfile {
  return {
    bestScore: 0,
    bestScoreByMode: createDefaultBestScoreByMode(),
    totalRounds: 0,
    lastResult: null,
    dailyChallengeHistory: {},
    dailyQuestProgressByDate: {},
    starRoadStars: 0,
    unlockedThemeIds: [DEFAULT_THEME_ID],
    currentThemeId: DEFAULT_THEME_ID,
    lastSelectedMode: "classic",
    settings: DEFAULT_SETTINGS,
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeProfile(raw: unknown): GameProfile {
  const defaults = getDefaultProfile();

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const candidate = raw as Partial<GameProfile> & {
    settings?: Partial<GameSettings>;
  };
  const starRoadStars =
    typeof candidate.starRoadStars === "number" &&
    Number.isFinite(candidate.starRoadStars) &&
    candidate.starRoadStars >= 0
      ? Math.floor(candidate.starRoadStars)
      : defaults.starRoadStars;
  const unlockedThemeIds = normalizeThemeIds(candidate.unlockedThemeIds, starRoadStars);
  const currentThemeId =
    isGameThemeId(candidate.currentThemeId) && unlockedThemeIds.includes(candidate.currentThemeId)
      ? candidate.currentThemeId
      : DEFAULT_THEME_ID;

  return {
    bestScore:
      typeof candidate.bestScore === "number" && Number.isFinite(candidate.bestScore)
        ? candidate.bestScore
        : defaults.bestScore,
    bestScoreByMode: {
      classic:
        typeof candidate.bestScoreByMode?.classic === "number"
          ? candidate.bestScoreByMode.classic
          : defaults.bestScoreByMode.classic,
      moves:
        typeof candidate.bestScoreByMode?.moves === "number"
          ? candidate.bestScoreByMode.moves
          : defaults.bestScoreByMode.moves,
      clear:
        typeof candidate.bestScoreByMode?.clear === "number"
          ? candidate.bestScoreByMode.clear
          : defaults.bestScoreByMode.clear,
    },
    totalRounds:
      typeof candidate.totalRounds === "number" && Number.isFinite(candidate.totalRounds)
        ? candidate.totalRounds
        : defaults.totalRounds,
    lastResult: normalizeLastResult(candidate.lastResult) ?? defaults.lastResult,
    dailyChallengeHistory:
      candidate.dailyChallengeHistory && typeof candidate.dailyChallengeHistory === "object"
        ? candidate.dailyChallengeHistory
        : defaults.dailyChallengeHistory,
    dailyQuestProgressByDate: normalizeDailyQuestProgressByDate(candidate.dailyQuestProgressByDate),
    starRoadStars,
    unlockedThemeIds,
    currentThemeId,
    lastSelectedMode:
      candidate.lastSelectedMode === "classic" ||
      candidate.lastSelectedMode === "moves" ||
      candidate.lastSelectedMode === "clear"
        ? candidate.lastSelectedMode
        : defaults.lastSelectedMode,
    settings: {
      soundEnabled: candidate.settings?.soundEnabled ?? defaults.settings.soundEnabled,
      vibrationEnabled:
        candidate.settings?.vibrationEnabled ?? defaults.settings.vibrationEnabled,
      animationEnabled:
        candidate.settings?.animationEnabled ?? defaults.settings.animationEnabled,
    },
  };
}

export function readProfile(): GameProfile {
  if (!isBrowser()) {
    return getDefaultProfile();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultProfile();
    }

    return normalizeProfile(JSON.parse(stored));
  } catch {
    return getDefaultProfile();
  }
}

export function writeProfile(profile: GameProfile) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function resetProfile() {
  const defaults = getDefaultProfile();

  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }

  return defaults;
}
