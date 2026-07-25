import { DEFAULT_WORD_PACK_ID, getWordPack } from "@/features/vocabulary/lib/wordBank";
import {
  getDefaultWordProgress,
  resolveVocabularyStage,
  type VocabularyDailyActivity,
  type VocabularyProfile,
  type WordProgress,
} from "@/features/vocabulary/lib/vocabularyProgress";

export const VOCABULARY_STORAGE_KEY = "star-pop-vocabulary-profile";

function clampPositiveInteger(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

function isVocabularyStage(value: unknown): value is WordProgress["stage"] {
  return value === "new" || value === "learning" || value === "familiar" || value === "mastered";
}

function normalizeWordProgress(candidate: unknown): WordProgress | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const value = candidate as Record<string, unknown>;
  const seenCount = clampPositiveInteger(value.seenCount, 0);
  const correctCount = clampPositiveInteger(value.correctCount, 0);
  const derivedStage = resolveVocabularyStage(correctCount);
  const stage = isVocabularyStage(value.stage)
    ? value.stage === "new" && seenCount > 0
      ? derivedStage === "new"
        ? "learning"
        : derivedStage
      : value.stage
    : derivedStage === "new" && seenCount > 0
      ? "learning"
      : derivedStage;

  return {
    stage,
    seenCount,
    correctCount,
    lastReviewedAt: typeof value.lastReviewedAt === "string" ? value.lastReviewedAt : null,
  };
}

function normalizeWordProgressById(candidate: unknown) {
  if (!candidate || typeof candidate !== "object") {
    return {};
  }

  return Object.entries(candidate as Record<string, unknown>).reduce<Record<string, WordProgress>>(
    (result, [wordId, value]) => {
      const normalized = normalizeWordProgress(value);

      if (normalized) {
        result[wordId] = normalized;
      }

      return result;
    },
    {},
  );
}

function normalizeStringArray(candidate: unknown) {
  if (!Array.isArray(candidate)) {
    return [];
  }

  return Array.from(
    new Set(
      candidate.filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );
}

function normalizeDailyActivity(candidate: unknown): VocabularyDailyActivity | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const value = candidate as Record<string, unknown>;

  return {
    studiedWordIds: normalizeStringArray(value.studiedWordIds),
    reviewedWordIds: normalizeStringArray(value.reviewedWordIds),
    introducedWordIds: normalizeStringArray(value.introducedWordIds),
    uncertainWordIds: normalizeStringArray(value.uncertainWordIds),
    quizAnsweredQuestionIds: normalizeStringArray(value.quizAnsweredQuestionIds),
    quizCorrectQuestionIds: normalizeStringArray(value.quizCorrectQuestionIds),
    completedSessionCount: clampPositiveInteger(value.completedSessionCount, 0),
    lastStudiedAt: typeof value.lastStudiedAt === "string" ? value.lastStudiedAt : null,
  };
}

function normalizeDailyActivityByDate(candidate: unknown) {
  if (!candidate || typeof candidate !== "object") {
    return {};
  }

  return Object.entries(candidate as Record<string, unknown>).reduce<
    Record<string, VocabularyDailyActivity>
  >((result, [dateKey, value]) => {
    const normalized = normalizeDailyActivity(value);

    if (normalized) {
      result[dateKey] = normalized;
    }

    return result;
  }, {});
}

export function getDefaultVocabularyProfile(): VocabularyProfile {
  return {
    currentPackId: DEFAULT_WORD_PACK_ID,
    dailyWordTarget: 6,
    showMeaningHint: true,
    quizEnabled: true,
    wordProgressById: {},
    dailyActivityByDate: {},
    lastStudiedAt: null,
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeVocabularyProfile(raw: unknown): VocabularyProfile {
  const defaults = getDefaultVocabularyProfile();

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const value = raw as Partial<VocabularyProfile>;

  return {
    currentPackId:
      typeof value.currentPackId === "string"
        ? getWordPack(value.currentPackId).id
        : defaults.currentPackId,
    dailyWordTarget: clampPositiveInteger(value.dailyWordTarget, defaults.dailyWordTarget),
    showMeaningHint:
      typeof value.showMeaningHint === "boolean"
        ? value.showMeaningHint
        : defaults.showMeaningHint,
    quizEnabled:
      typeof value.quizEnabled === "boolean" ? value.quizEnabled : defaults.quizEnabled,
    wordProgressById: normalizeWordProgressById(value.wordProgressById),
    dailyActivityByDate: normalizeDailyActivityByDate(value.dailyActivityByDate),
    lastStudiedAt: typeof value.lastStudiedAt === "string" ? value.lastStudiedAt : null,
  };
}

export function readVocabularyProfile(): VocabularyProfile {
  if (!isBrowser()) {
    return getDefaultVocabularyProfile();
  }

  try {
    const stored = window.localStorage.getItem(VOCABULARY_STORAGE_KEY);

    if (!stored) {
      return getDefaultVocabularyProfile();
    }

    return normalizeVocabularyProfile(JSON.parse(stored));
  } catch {
    return getDefaultVocabularyProfile();
  }
}

export function writeVocabularyProfile(profile: VocabularyProfile) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(profile));
}

export function resetVocabularyProfile() {
  const defaults = getDefaultVocabularyProfile();

  if (isBrowser()) {
    window.localStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(defaults));
  }

  return defaults;
}

export { getDefaultWordProgress };
