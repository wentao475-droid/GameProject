import type {
  DailyChallengeRecord,
  GameModeId,
  StarRating,
} from "@/features/star-pop/types/modes";
import type {
  DailyQuest,
  DailyQuestProgressUpdate,
  DailyQuestProgressState,
  GameThemeId,
  RecommendedGoal,
  StarRoadProgressUpdate,
  StarRoadProgress,
} from "@/features/star-pop/types/progression";

export type AppScreen = "home" | "playing" | "result";

export type GameSettings = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  animationEnabled: boolean;
};

export type GameResult = {
  modeId: GameModeId;
  modeName: string;
  score: number;
  baseScore: number;
  cleanupBonus: number;
  remainingBlocks: number;
  autoClearedBlocks: number;
  stars: StarRating;
  movesUsed: number;
  movesLeft: number | null;
  isDailyChallenge: boolean;
  dailyChallengeDateKey: string | null;
  dailyChallengeGoalLabel: string | null;
  dailyChallengeCompleted: boolean;
  isNewBest: boolean;
  finishedAt: string;
  progressSummary: {
    dailyQuestUpdates: DailyQuestProgressUpdate[];
    starRoad: StarRoadProgressUpdate;
  };
};

export type GameProfile = {
  bestScore: number;
  bestScoreByMode: Record<GameModeId, number>;
  totalRounds: number;
  lastResult: GameResult | null;
  dailyChallengeHistory: Record<string, DailyChallengeRecord>;
  dailyQuestProgressByDate: Record<string, Record<string, DailyQuestProgressState>>;
  starRoadStars: number;
  unlockedThemeIds: GameThemeId[];
  currentThemeId: GameThemeId;
  lastSelectedMode: GameModeId;
  settings: GameSettings;
};

export type AppProgressState = {
  dailyQuests: DailyQuest[];
  recommendedGoal: RecommendedGoal;
  starRoadProgress: StarRoadProgress;
};
