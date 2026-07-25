import {
  DEFAULT_WORD_PACK_ID,
  getWordEntry,
  getWordPack,
  getWordsByPack,
  WORDS,
} from "@/features/vocabulary/lib/wordBank";
import type {
  VocabularyDailyTask,
  VocabularySessionCardResult,
  VocabularySessionResult,
  ReviewQuestion,
  VocabularyStage,
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

export function recordVocabularyCardResults(
  activity: VocabularyDailyActivity | undefined,
  cardResults: VocabularySessionCardResult[],
  reviewedAt: string,
): VocabularyDailyActivity {
  const current = activity ?? getDefaultVocabularyDailyActivity();

  return {
    studiedWordIds: uniqueWordIds([
      ...current.studiedWordIds,
      ...cardResults.map((result) => result.wordId),
    ]),
    reviewedWordIds: uniqueWordIds([
      ...current.reviewedWordIds,
      ...cardResults.filter((result) => result.wasReview).map((result) => result.wordId),
    ]),
    introducedWordIds: uniqueWordIds([
      ...current.introducedWordIds,
      ...cardResults.filter((result) => result.wasNew).map((result) => result.wordId),
    ]),
    uncertainWordIds: uniqueWordIds([
      ...current.uncertainWordIds,
      ...cardResults.filter((result) => result.decision === "uncertain").map((result) => result.wordId),
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
  const studiedCount = Math.min(activity.studiedWordIds.length, profile.dailyWordTarget);
  const reviewedWordIdSet = new Set(activity.reviewedWordIds);
  const reviewedDueCount = todayPack.reviewWords.filter((word) =>
    reviewedWordIdSet.has(word.id),
  ).length;
  const quizCompleted = activity.quizAnsweredQuestionIds.length > 0;

  return [
    {
      id: "daily-target",
      title: "完成今日词量",
      description: `按当前设置完成 ${profile.dailyWordTarget} 个词卡，保持每日连续学习。`,
      progress: studiedCount,
      target: profile.dailyWordTarget,
      completed: studiedCount >= profile.dailyWordTarget,
    },
    {
      id: "review-queue",
      title: "处理到期复习",
      description:
        todayPack.reviewWords.length > 0
          ? `优先清掉今天抽中的 ${todayPack.reviewWords.length} 个到期复习词。`
          : "当前没有到期复习词，今日训练会自动补充新词和巩固词。",
      progress: reviewedDueCount,
      target: todayPack.reviewWords.length,
      completed: todayPack.reviewWords.length === 0 || reviewedDueCount >= todayPack.reviewWords.length,
    },
    {
      id: "quick-quiz",
      title: "完成轻量测验",
      description: profile.quizEnabled
        ? "结果页完成至少 1 组轻量测验，强化本轮提取记忆。"
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

function getRecommendedAction(
  reviewNeededCount: number,
  introducedCount: number,
  reinforcedCount: number,
) {
  if (reviewNeededCount > 0) {
    return `推荐继续复习 ${reviewNeededCount} 个待掌握词，优先处理刚刚标记为“模糊”的词卡。`;
  }

  if (introducedCount > 0) {
    return "本轮没有新增待复习词，可以立即再来一轮，用 1 到 2 题测验强化刚接触的新词。";
  }

  if (reinforcedCount > 0) {
    return "本轮以巩固复习为主，可以明天继续处理到期词，或者切换到更高难度词包。";
  }

  return "今天的训练量较轻，建议回到首页重新开始一轮，保持连续记忆。";
}

export function buildSessionResult(options: {
  dateKey: string;
  packId: string;
  introducedWordIds: string[];
  cardResults: VocabularySessionCardResult[];
  quizEnabled: boolean;
  maxQuestions?: number;
}): VocabularySessionResult {
  const introducedWordIdSet = new Set(options.introducedWordIds);
  const reviewNeededWordIds = options.cardResults
    .filter((result) => result.decision === "uncertain")
    .map((result) => result.wordId);
  const reinforcedWordIds = options.cardResults
    .filter((result) => result.decision === "known" && !introducedWordIdSet.has(result.wordId))
    .map((result) => result.wordId);
  const quizWordIds =
    reviewNeededWordIds.length > 0
      ? reviewNeededWordIds
      : options.introducedWordIds.length > 0
        ? options.introducedWordIds
        : options.cardResults.map((result) => result.wordId);

  return {
    dateKey: options.dateKey,
    packId: options.packId,
    introducedWordIds: Array.from(introducedWordIdSet),
    reinforcedWordIds: Array.from(new Set(reinforcedWordIds)),
    reviewNeededWordIds: Array.from(new Set(reviewNeededWordIds)),
    questions: options.quizEnabled
      ? buildReviewQuestions(quizWordIds, options.maxQuestions ?? 2)
      : [],
    recommendedAction: getRecommendedAction(
      reviewNeededWordIds.length,
      introducedWordIdSet.size,
      reinforcedWordIds.length,
    ),
  };
}
