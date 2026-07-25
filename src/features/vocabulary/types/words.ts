export type WordDifficultyBand = "gaokao-plus" | "cet4";

export type VocabularyStage = "new" | "learning" | "familiar" | "mastered";

export type WordEntry = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  difficultyBand: WordDifficultyBand;
  packId: string;
};

export type WordPack = {
  id: string;
  title: string;
  description: string;
  difficultyLabel: string;
  wordIds: string[];
};

export type ReviewQuestion = {
  id: string;
  wordId: string;
  prompt: string;
  choices: string[];
  answer: string;
};

export type VocabularyDailyTask = {
  id: "daily-target" | "review-queue" | "quick-quiz";
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
};

export type VocabularySettingsPatch = {
  dailyWordTarget?: number;
  showMeaningHint?: boolean;
  quizEnabled?: boolean;
};

export type VocabularyCardDecision = "known" | "uncertain";

export type VocabularySessionCardResult = {
  wordId: string;
  decision: VocabularyCardDecision;
  wasNew: boolean;
  wasReview: boolean;
  previousStage: VocabularyStage;
  nextStage: VocabularyStage;
};

export type VocabularySessionResult = {
  dateKey: string;
  packId: string;
  introducedWordIds: string[];
  reinforcedWordIds: string[];
  reviewNeededWordIds: string[];
  questions: ReviewQuestion[];
  recommendedAction: string;
};
