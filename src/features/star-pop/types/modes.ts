export type GameModeId = "classic" | "moves" | "clear";

export type StarRating = 1 | 2 | 3;

export type GameModeDefinition = {
  id: GameModeId;
  name: string;
  shortName: string;
  description: string;
  objective: string;
  actionLabel: string;
  moveLimit: number | null;
};

export type DailyChallengeGoal =
  | {
      kind: "score";
      value: number;
      label: string;
    }
  | {
      kind: "remaining";
      value: number;
      label: string;
    };

export type DailyChallenge = {
  dateKey: string;
  modeId: GameModeId;
  title: string;
  description: string;
  seed: number;
  goal: DailyChallengeGoal;
};

export type DailyChallengeRecord = {
  modeId: GameModeId;
  playedAt: string;
  score: number;
  stars: StarRating;
  completed: boolean;
};

export type GameSessionConfig = {
  modeId: GameModeId;
  boardSeed: number | null;
  dailyChallenge: DailyChallenge | null;
};
