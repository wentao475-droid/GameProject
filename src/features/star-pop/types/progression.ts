import type { GameModeId } from "@/features/star-pop/types/modes";

export type GameThemeId = "default" | "sunset" | "aurora" | "midnight";

export type DailyQuestKind = "rounds" | "stars" | "mode-rounds" | "daily-challenge";

export type DailyQuestAction =
  | {
      kind: "mode";
      modeId: GameModeId;
    }
  | {
      kind: "daily-challenge";
      modeId: GameModeId;
    };

export type DailyQuestDefinition = {
  id: string;
  dateKey: string;
  kind: DailyQuestKind;
  title: string;
  description: string;
  target: number;
  unitLabel: string;
  modeId: GameModeId | null;
  action: DailyQuestAction;
};

export type DailyQuestProgressState = {
  progress: number;
  completed: boolean;
  completedAt: string | null;
};

export type DailyQuest = DailyQuestDefinition & DailyQuestProgressState;

export type StarRoadNode = {
  id: string;
  requiredStars: number;
  themeId: GameThemeId;
  title: string;
  description: string;
};

export type GameThemeDefinition = {
  id: GameThemeId;
  name: string;
  description: string;
  unlockStars: number;
};

export type RecommendedGoal =
  | {
      kind: "daily-quest";
      questId: string;
      title: string;
      description: string;
      unitLabel: string;
      current: number;
      target: number;
      remaining: number;
      action: DailyQuestAction;
    }
  | {
      kind: "star-road";
      nodeId: string;
      title: string;
      description: string;
      unitLabel: string;
      current: number;
      target: number;
      remaining: number;
      action: DailyQuestAction;
      themeId: GameThemeId;
    }
  | {
      kind: "mode-best";
      modeId: GameModeId;
      title: string;
      description: string;
      unitLabel: string;
      current: number;
      target: number;
      remaining: number;
      action: DailyQuestAction;
    };

export type StarRoadProgress = {
  totalStars: number;
  currentNode: StarRoadNode;
  nextNode: StarRoadNode | null;
  unlockedThemeIds: GameThemeId[];
};

export type ProgressRoundResult = {
  modeId: GameModeId;
  score: number;
  stars: 1 | 2 | 3;
  isDailyChallenge: boolean;
  dailyChallengeCompleted: boolean;
  finishedAt: string;
};

export type DailyQuestProgressUpdate = {
  questId: string;
  title: string;
  unitLabel: string;
  previousProgress: number;
  currentProgress: number;
  target: number;
  completed: boolean;
  newlyCompleted: boolean;
};

export type StarRoadProgressUpdate = {
  previousStars: number;
  currentStars: number;
  gainedStars: number;
  previousNode: StarRoadNode;
  currentNode: StarRoadNode;
  nextNode: StarRoadNode | null;
  newlyUnlockedThemeIds: GameThemeId[];
};
