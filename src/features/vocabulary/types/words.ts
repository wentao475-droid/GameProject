export type WordEntry = {
  id: string;
  word: string; // 完整汉字
  meaning: string; // 儿童化解释
  pronunciation: string; // 拼音
  example: string; // 例词或例句
  parts: string[]; // 偏旁/部件
  familyHint: string; // 偏旁义类提示
  packId: string;
};

export type WordPack = {
  id: string;
  title: string;
  description: string;
  ageLabel: string;
  wordIds: string[];
};

export type VocabularyDailyTask = {
  id: "daily-session" | "daily-target" | "daily-discovery";
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
};

export type VocabularySettingsPatch = {
  dailyWordTarget?: number;
};

export type VocabularyTargetResult = {
  wordId: string;
  collectedCount: number;
  targetCount: number;
  hit: boolean;
  completed: boolean;
};

export type VocabularySessionResult = {
  dateKey: string;
  packId: string;
  score: number;
  removedBlockCount: number;
  targetResults: VocabularyTargetResult[];
  hitTargetWordIds: string[];
  completedTargetWordIds: string[];
  learnedCharacterIds: string[];
  recommendedAction: string;
};
