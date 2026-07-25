import {
  DEFAULT_WORD_PACK_ID,
  getWordEntry,
  getWordPack,
  getWordsByPack,
  WORDS,
} from "@/features/vocabulary/lib/wordBank";
import { SESSION_TARGET_WORD_COUNT } from "@/features/vocabulary/lib/vocabularyGame";
import type {
  VocabularyDailyTask,
  VocabularySessionResult,
  ReviewQuestion,
  VocabularyStage,
  VocabularyTargetResult,
  WordEntry,
  WordPack,
} from "@/features/vocabulary/types/words";

export type WordProgress = {
  stage: VocabularyStage;
  seenCount: number;
  correctCount: number;
  lastReviewedAt: string | null;
};

export type VocabularyDailyActivity = {
  studiedWordIds: string[];
  reviewedWordIds: string[];
  introducedWordIds: string[];
  uncertainWordIds: string[];
  quizAnsweredQuestionIds: string[];
  quizCorrectQuestionIds: string[];
  completedSessionCount: number;
  lastStudiedAt: string | null;
};

export type VocabularyProfile = {
  currentPackId: string;
  dailyWordTarget: number;
  showMeaningHint: boolean;
  quizEnabled: boolean;
  wordProgressById: Record<string, WordProgress>;
  dailyActivityByDate: Record<string, VocabularyDailyActivity>;
  lastStudiedAt: string | null;
};

export type TodayVocabularyPack = {
  dateKey: string;
  pack: WordPack;
  words: WordEntry[];
  reviewWords: WordEntry[];
  newWords: WordEntry[];
  reinforcementWords: WordEntry[];
};

const REVIEW_INTERVAL_DAYS: Record<VocabularyStage, number> = {
  new: 1,
  learning: 1,
  familiar: 3,
  mastered: 7,
};

const STAGE_PRIORITY: Record<VocabularyStage, number> = {
  new: 0,
  learning: 1,
  familiar: 2,
  mastered: 3,
};

export function getDefaultWordProgress(): WordProgress {
  return {
    stage: "new",
    seenCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
  };
}

export function getDefaultVocabularyDailyActivity(): VocabularyDailyActivity {
  return {
    studiedWordIds: [],
    reviewedWordIds: [],
    introducedWordIds: [],
    uncertainWordIds: [],
    quizAnsweredQuestionIds: [],
    quizCorrectQuestionIds: [],
    completedSessionCount: 0,
    lastStudiedAt: null,
  };
}

export function resolveVocabularyStage(correctCount: number): VocabularyStage {
  if (correctCount >= 4) {
    return "mastered";
  }

  if (correctCount >= 3) {
    return "familiar";
  }

  if (correctCount >= 1) {
    return "learning";
  }

  return "new";
}

export function getVocabularyDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWordProgress(
  profile: Pick<VocabularyProfile, "wordProgressById">,
  wordId: string,
): WordProgress {
  return profile.wordProgressById[wordId] ?? getDefaultWordProgress();
}

function uniqueWordIds(wordIds: string[]) {
  return Array.from(new Set(wordIds));
}

export function getVocabularyDailyActivity(
  profile: Pick<VocabularyProfile, "dailyActivityByDate">,
  dateKey: string,
): VocabularyDailyActivity {
  return profile.dailyActivityByDate[dateKey] ?? getDefaultVocabularyDailyActivity();
}

export function recordVocabularyTargetResults(
  activity: VocabularyDailyActivity | undefined,
  targetResults: VocabularyTargetResult[],
  reviewedAt: string,
): VocabularyDailyActivity {
  const current = activity ?? getDefaultVocabularyDailyActivity();
  const completedTargetWordIds = targetResults
    .filter((result) => result.completed)
    .map((result) => result.wordId);

  return {
    studiedWordIds: uniqueWordIds([
      ...current.studiedWordIds,
      ...targetResults.map((result) => result.wordId),
    ]),
    reviewedWordIds: uniqueWordIds([
      ...current.reviewedWordIds,
      ...targetResults
        .filter((result) => result.wasReview && result.completed)
        .map((result) => result.wordId),
    ]),
    introducedWordIds: uniqueWordIds([
      ...current.introducedWordIds,
      ...targetResults
        .filter((result) => result.wasNew && result.completed)
        .map((result) => result.wordId),
    ]),
    uncertainWordIds: uniqueWordIds([
      ...current.uncertainWordIds.filter((wordId) => !completedTargetWordIds.includes(wordId)),
      ...targetResults.filter((result) => !result.completed).map((result) => result.wordId),
    ]),
    quizAnsweredQuestionIds: current.quizAnsweredQuestionIds,
    quizCorrectQuestionIds: current.quizCorrectQuestionIds,
    completedSessionCount: current.completedSessionCount,
    lastStudiedAt: reviewedAt,
  };
}

export function recordVocabularySessionCompletion(
  activity: VocabularyDailyActivity | undefined,
  completedAt: string,
): VocabularyDailyActivity {
  const current = activity ?? getDefaultVocabularyDailyActivity();

  return {
    ...current,
    completedSessionCount: current.completedSessionCount + 1,
    lastStudiedAt: completedAt,
  };
}

export function recordVocabularyQuizAnswer(
  activity: VocabularyDailyActivity | undefined,
  questionId: string,
  correct: boolean,
): VocabularyDailyActivity {
  const current = activity ?? getDefaultVocabularyDailyActivity();

  return {
    ...current,
    quizAnsweredQuestionIds: uniqueWordIds([...current.quizAnsweredQuestionIds, questionId]),
    quizCorrectQuestionIds: correct
      ? uniqueWordIds([...current.quizCorrectQuestionIds, questionId])
      : current.quizCorrectQuestionIds,
  };
}

export function updateWordProgress(
  progress: WordProgress | undefined,
  correct: boolean,
  reviewedAt: string,
): WordProgress {
  const current = progress ?? getDefaultWordProgress();
  const seenCount = current.seenCount + 1;
  const correctCount = current.correctCount + (correct ? 1 : 0);
  const stage = correct
    ? resolveVocabularyStage(correctCount)
    : current.stage === "new" && seenCount > 0
      ? "learning"
      : current.stage;

  return {
    stage,
    seenCount,
    correctCount,
    lastReviewedAt: reviewedAt,
  };
}

function hashString(value: string) {
  return value.split("").reduce((hash, char) => hash * 31 + char.charCodeAt(0), 17);
}

function rotateBySeed<T>(items: readonly T[], seedSource: string): T[] {
  if (items.length <= 1) {
    return [...items];
  }

  const offset = Math.abs(hashString(seedSource)) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function getDayDifference(fromIsoString: string, date: Date) {
  const fromDate = new Date(fromIsoString);

  if (Number.isNaN(fromDate.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const fromStart = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  ).getTime();
  const toStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((toStart - fromStart) / millisecondsPerDay);
}

export function isWordDueForReview(progress: WordProgress, date = new Date()) {
  if (progress.seenCount <= 0) {
    return false;
  }

  if (!progress.lastReviewedAt) {
    return true;
  }

  return getDayDifference(progress.lastReviewedAt, date) >= REVIEW_INTERVAL_DAYS[progress.stage];
}

export function getWordsDueForReview(
  profile: VocabularyProfile,
  options?: {
    packId?: string;
    date?: Date;
  },
) {
  const packId = options?.packId ?? profile.currentPackId ?? DEFAULT_WORD_PACK_ID;
  const date = options?.date ?? new Date();

  return getWordsByPack(packId)
    .filter((word) => isWordDueForReview(getWordProgress(profile, word.id), date))
    .sort((left, right) => {
      const leftProgress = getWordProgress(profile, left.id);
      const rightProgress = getWordProgress(profile, right.id);
      const stagePriority = STAGE_PRIORITY[leftProgress.stage] - STAGE_PRIORITY[rightProgress.stage];

      if (stagePriority !== 0) {
        return stagePriority;
      }

      const leftDays = leftProgress.lastReviewedAt
        ? getDayDifference(leftProgress.lastReviewedAt, date)
        : Number.POSITIVE_INFINITY;
      const rightDays = rightProgress.lastReviewedAt
        ? getDayDifference(rightProgress.lastReviewedAt, date)
        : Number.POSITIVE_INFINITY;

      if (leftDays !== rightDays) {
        return rightDays - leftDays;
      }

      return left.word.localeCompare(right.word);
    });
}

function takeDeterministicWords(words: WordEntry[], count: number, seedSource: string) {
  if (count <= 0 || words.length === 0) {
    return [];
  }

  return rotateBySeed(words, seedSource).slice(0, count);
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
  const date = options?.date ?? new Date();
  const dateKey = getVocabularyDateKey(date);
  const target = Math.max(1, options?.target ?? profile.dailyWordTarget);
  const allWords = getWordsByPack(pack.id);
  const reviewWords = getWordsDueForReview(profile, {
    packId: pack.id,
    date,
  }).slice(0, target);
  const selectedWordIds = new Set(reviewWords.map((word) => word.id));
  const unseenWords = allWords.filter((word) => {
    if (selectedWordIds.has(word.id)) {
      return false;
    }

    return getWordProgress(profile, word.id).seenCount === 0;
  });
  const newWords = takeDeterministicWords(
    unseenWords,
    Math.max(target - reviewWords.length, 0),
    `${pack.id}:${dateKey}:new`,
  );

  newWords.forEach((word) => selectedWordIds.add(word.id));

  const reinforcementCandidates = allWords.filter((word) => {
    if (selectedWordIds.has(word.id)) {
      return false;
    }

    return getWordProgress(profile, word.id).stage !== "mastered";
  });
  const reinforcementWords = takeDeterministicWords(
    reinforcementCandidates,
    Math.max(target - reviewWords.length - newWords.length, 0),
    `${pack.id}:${dateKey}:reinforcement`,
  );

  return {
    dateKey,
    pack,
    words: [...reviewWords, ...newWords, ...reinforcementWords],
    reviewWords,
    newWords,
    reinforcementWords,
  };
}

export function getReviewQueueCount(
  profile: VocabularyProfile,
  options?: {
    packId?: string;
    date?: Date;
  },
) {
  return getWordsDueForReview(profile, options).length;
}

export function buildVocabularyDailyTasks(
  profile: VocabularyProfile,
  todayPack: TodayVocabularyPack,
): VocabularyDailyTask[] {
  const activity = getVocabularyDailyActivity(profile, todayPack.dateKey);
  const reviewTargetIds = todayPack.reviewWords
    .slice(0, SESSION_TARGET_WORD_COUNT)
    .map((word) => word.id);
  const reviewedWordIdSet = new Set(activity.reviewedWordIds);
  const reviewedDueCount = reviewTargetIds.filter((wordId) => reviewedWordIdSet.has(wordId)).length;
  const quizCompleted = activity.quizAnsweredQuestionIds.length > 0;

  return [
    {
      id: "daily-target",
      title: "完成一局目标词收集",
      description: "完成 1 局真实棋盘对局，让至少 3 个目标词进入本轮学习结算。",
      progress: Math.min(activity.completedSessionCount, 1),
      target: 1,
      completed: activity.completedSessionCount >= 1,
    },
    {
      id: "review-queue",
      title: "处理待复习目标",
      description:
        reviewTargetIds.length > 0
          ? `优先完成 ${reviewTargetIds.length} 个待复习目标词的收集。`
          : "当前没有待复习目标词，系统会自动补充新词和巩固词。",
      progress: reviewedDueCount,
      target: reviewTargetIds.length,
      completed: reviewTargetIds.length === 0 || reviewedDueCount >= reviewTargetIds.length,
    },
    {
      id: "quick-quiz",
      title: "完成轻量测验",
      description: profile.quizEnabled
        ? "结果页完成至少 1 组轻量测验，强化本局目标词提取。"
        : "当前已关闭结果页测验，可在下方设置区重新开启。",
      progress: profile.quizEnabled ? (quizCompleted ? 1 : 0) : 0,
      target: profile.quizEnabled ? 1 : 0,
      completed: !profile.quizEnabled || quizCompleted,
    },
  ];
}

function uniqueByMeaning(words: WordEntry[]) {
  const seenMeanings = new Set<string>();

  return words.filter((word) => {
    if (seenMeanings.has(word.meaning)) {
      return false;
    }

    seenMeanings.add(word.meaning);
    return true;
  });
}

function buildChoicesForWord(entry: WordEntry): string[] {
  const packDistractors = WORDS.filter((candidate) => candidate.id !== entry.id && candidate.packId === entry.packId);
  const bandDistractors = WORDS.filter(
    (candidate) =>
      candidate.id !== entry.id &&
      candidate.packId !== entry.packId &&
      candidate.difficultyBand === entry.difficultyBand,
  );
  const fallbackDistractors = WORDS.filter((candidate) => candidate.id !== entry.id);
  const distractors = uniqueByMeaning([
    ...packDistractors,
    ...bandDistractors,
    ...fallbackDistractors,
  ])
    .filter((candidate) => candidate.meaning !== entry.meaning);
  const selectedDistractors = takeDeterministicWords(
    distractors,
    3,
    `${entry.id}:distractors`,
  ).map((candidate) => candidate.meaning);

  return rotateBySeed(
    [entry.meaning, ...selectedDistractors],
    `${entry.id}:choices`,
  );
}

export function buildReviewQuestions(wordIds: string[], maxQuestions = 2): ReviewQuestion[] {
  return Array.from(new Set(wordIds))
    .map((wordId) => getWordEntry(wordId))
    .filter((entry): entry is WordEntry => entry !== undefined)
    .slice(0, Math.max(0, maxQuestions))
    .map((entry) => ({
      id: `${entry.id}-quiz`,
      wordId: entry.id,
      prompt: `请选择 ${entry.word} 的正确中文释义`,
      choices: buildChoicesForWord(entry),
      answer: entry.meaning,
    }));
}

function getRecommendedAction(reviewNeededCount: number, completedCount: number, hitCount: number) {
  if (reviewNeededCount > 0) {
    return `推荐优先继续复习 ${reviewNeededCount} 个未完成目标词，下一局会优先带上它们。`;
  }

  if (completedCount > 0) {
    return "本局已完成全部目标词收集，可以再开一局新目标，并用 1 到 2 题测验巩固记忆。";
  }

  if (hitCount > 0) {
    return "本局已命中部分目标词，但收集仍不够稳定，建议马上继续复习同一组词。";
  }

  return "这一局没有命中目标词，建议直接再来一局，优先清理包含目标词的连块。";
}

export function buildSessionResult(options: {
  dateKey: string;
  packId: string;
  score: number;
  removedBlockCount: number;
  targetResults: VocabularyTargetResult[];
  quizEnabled: boolean;
  maxQuestions?: number;
}): VocabularySessionResult {
  const hitTargetWordIds = options.targetResults
    .filter((result) => result.hit)
    .map((result) => result.wordId);
  const completedTargetWordIds = options.targetResults
    .filter((result) => result.completed)
    .map((result) => result.wordId);
  const reviewNeededWordIds = options.targetResults
    .filter((result) => !result.completed)
    .map((result) => result.wordId);
  const quizWordIds =
    reviewNeededWordIds.length > 0
      ? reviewNeededWordIds
      : completedTargetWordIds.length > 0
        ? completedTargetWordIds
        : hitTargetWordIds;

  return {
    dateKey: options.dateKey,
    packId: options.packId,
    score: options.score,
    removedBlockCount: options.removedBlockCount,
    targetResults: options.targetResults,
    hitTargetWordIds: uniqueWordIds(hitTargetWordIds),
    completedTargetWordIds: uniqueWordIds(completedTargetWordIds),
    reviewNeededWordIds: uniqueWordIds(reviewNeededWordIds),
    questions: options.quizEnabled
      ? buildReviewQuestions(quizWordIds, options.maxQuestions ?? 2)
      : [],
    recommendedAction: getRecommendedAction(
      reviewNeededWordIds.length,
      completedTargetWordIds.length,
      hitTargetWordIds.length,
    ),
  };
}
