import { DEFAULT_WORD_PACK_ID, getWordPack, getWordsByPack } from "@/features/vocabulary/lib/wordBank";
import { SESSION_TARGET_WORD_COUNT } from "@/features/vocabulary/lib/vocabularyGame";
import type {
  VocabularyDailyTask,
  VocabularySessionResult,
  VocabularyTargetResult,
  WordEntry,
} from "@/features/vocabulary/types/words";

export type VocabularyDailyActivity = {
  dateKey: string;
  completedSessionCount: number;
  learnedCharacterIds: string[];
  completedTargetWordIds: string[];
  lastStudiedAt: string | null;
};

export type VocabularyProfile = {
  currentPackId: string;
  dailyWordTarget: number;
  learnedCharacterIds: string[];
  dailyActivityByDate: Record<string, VocabularyDailyActivity>;
  lastStudiedAt: string | null;
};

export type TodayVocabularyPack = {
  dateKey: string;
  pack: ReturnType<typeof getWordPack>;
  words: WordEntry[];
  reviewWords: WordEntry[];
  newWords: WordEntry[];
};

export function getVocabularyDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultVocabularyDailyActivity(dateKey = getVocabularyDateKey()): VocabularyDailyActivity {
  return {
    dateKey,
    completedSessionCount: 0,
    learnedCharacterIds: [],
    completedTargetWordIds: [],
    lastStudiedAt: null,
  };
}

export function createDefaultProfile(): VocabularyProfile {
  return {
    currentPackId: DEFAULT_WORD_PACK_ID,
    dailyWordTarget: 6,
    learnedCharacterIds: [],
    dailyActivityByDate: {},
    lastStudiedAt: null,
  };
}

export function getVocabularyDailyActivity(
  profile: Pick<VocabularyProfile, "dailyActivityByDate">,
  dateKey: string,
): VocabularyDailyActivity {
  return profile.dailyActivityByDate[dateKey] ?? getDefaultVocabularyDailyActivity(dateKey);
}

export function buildTodayWordPack(
  profile: VocabularyProfile,
  options?: {
    packId?: string;
    date?: Date;
    target?: number;
  },
): TodayVocabularyPack {
  const pack = getWordPack(options?.packId ?? profile.currentPackId ?? DEFAULT_WORD_PACK_ID);
  const dateKey = getVocabularyDateKey(options?.date ?? new Date());
  const allWords = getWordsByPack(pack.id);
  const learnedSet = new Set(profile.learnedCharacterIds);
  const reviewWords = allWords.filter((word) => learnedSet.has(word.id));
  const newWords = allWords.filter((word) => !learnedSet.has(word.id));
  const target = Math.max(2, options?.target ?? profile.dailyWordTarget);

  return {
    dateKey,
    pack,
    words: allWords.slice(0, target),
    reviewWords,
    newWords,
  };
}

export function getReviewQueueCount(profile: VocabularyProfile, options?: { packId?: string }) {
  const packId = options?.packId ?? profile.currentPackId;
  const learnedSet = new Set(profile.learnedCharacterIds);
  return getWordsByPack(packId).filter((word) => learnedSet.has(word.id)).length;
}

export function buildVocabularyDailyTasks(
  profile: VocabularyProfile,
  todayPack: TodayVocabularyPack,
): VocabularyDailyTask[] {
  const activity = getVocabularyDailyActivity(profile, todayPack.dateKey);

  return [
    {
      id: "daily-session",
      title: "完成一局偏旁爆破",
      description: "先看两个目标字的预习卡，再进入棋盘找偏旁和部件。",
      progress: Math.min(activity.completedSessionCount, 1),
      target: 1,
      completed: activity.completedSessionCount >= 1,
    },
    {
      id: "daily-target",
      title: "拼出今日目标字",
      description: `每局追踪 ${SESSION_TARGET_WORD_COUNT} 个目标字，把它们完整拼出来。`,
      progress: Math.min(activity.completedTargetWordIds.length, SESSION_TARGET_WORD_COUNT),
      target: SESSION_TARGET_WORD_COUNT,
      completed: activity.completedTargetWordIds.length >= SESSION_TARGET_WORD_COUNT,
    },
    {
      id: "daily-discovery",
      title: "认识新汉字",
      description:
        activity.learnedCharacterIds.length > 0
          ? `今天已经认识了 ${activity.learnedCharacterIds.length} 个字，再来一局继续巩固。`
          : "今天还没有解锁新字，先开始一局吧。",
      progress: Math.min(activity.learnedCharacterIds.length, 2),
      target: 2,
      completed: activity.learnedCharacterIds.length >= 2,
    },
  ];
}

export function recordVocabularyTargetResults(
  previousProfile: VocabularyProfile,
  sessionResult: VocabularySessionResult,
  reviewedAt: string,
) {
  const currentActivity = getVocabularyDailyActivity(previousProfile, sessionResult.dateKey);

  return {
    ...previousProfile,
    learnedCharacterIds: Array.from(
      new Set([...previousProfile.learnedCharacterIds, ...sessionResult.learnedCharacterIds]),
    ),
    lastStudiedAt: reviewedAt,
    dailyActivityByDate: {
      ...previousProfile.dailyActivityByDate,
      [sessionResult.dateKey]: {
        ...currentActivity,
        completedSessionCount: currentActivity.completedSessionCount + 1,
        learnedCharacterIds: Array.from(
          new Set([...currentActivity.learnedCharacterIds, ...sessionResult.learnedCharacterIds]),
        ),
        completedTargetWordIds: Array.from(
          new Set([...currentActivity.completedTargetWordIds, ...sessionResult.completedTargetWordIds]),
        ),
        lastStudiedAt: reviewedAt,
      },
    },
  };
}

export function buildSessionResult(options: {
  dateKey: string;
  packId: string;
  score: number;
  removedBlockCount: number;
  targetResults: VocabularyTargetResult[];
}): VocabularySessionResult {
  const hitTargetWordIds = options.targetResults
    .filter((result) => result.hit)
    .map((result) => result.wordId);
  const completedTargetWordIds = options.targetResults
    .filter((result) => result.completed)
    .map((result) => result.wordId);

  return {
    dateKey: options.dateKey,
    packId: options.packId,
    score: options.score,
    removedBlockCount: options.removedBlockCount,
    targetResults: options.targetResults,
    hitTargetWordIds: Array.from(new Set(hitTargetWordIds)),
    completedTargetWordIds: Array.from(new Set(completedTargetWordIds)),
    learnedCharacterIds: Array.from(new Set(completedTargetWordIds)),
    recommendedAction:
      completedTargetWordIds.length === options.targetResults.length
        ? "这一局两个目标字都拼出来了，可以继续下一局认识更多新字。"
        : completedTargetWordIds.length > 0
          ? "你已经拼出部分目标字了，继续下一局会更容易记住它们。"
          : "这局还没有拼出目标字，建议先看预习卡，再继续找偏旁组合。",
  };
}
