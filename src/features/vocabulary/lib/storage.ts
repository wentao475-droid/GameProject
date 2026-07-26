import { getWordPack } from "@/features/vocabulary/lib/wordBank";
import {
  createDefaultProfile,
  getDefaultVocabularyDailyActivity,
  type VocabularyDailyActivity,
  type VocabularyProfile,
} from "@/features/vocabulary/lib/vocabularyProgress";

export const VOCABULARY_STORAGE_KEY = "star-pop-vocabulary-profile";

function clampPositiveInteger(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
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
  const dateKey = typeof value.dateKey === "string" ? value.dateKey : null;

  return {
    dateKey: dateKey ?? "",
    completedSessionCount: clampPositiveInteger(value.completedSessionCount, 0),
    learnedCharacterIds: normalizeStringArray(
      Array.isArray(value.learnedCharacterIds) ? value.learnedCharacterIds : value.introducedWordIds,
    ),
    completedTargetWordIds: normalizeStringArray(
      Array.isArray(value.completedTargetWordIds) ? value.completedTargetWordIds : value.studiedWordIds,
    ),
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
      result[dateKey] = {
        ...getDefaultVocabularyDailyActivity(dateKey),
        ...normalized,
        dateKey,
      };
    }

    return result;
  }, {});
}

export function getDefaultVocabularyProfile(): VocabularyProfile {
  return createDefaultProfile();
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
    learnedCharacterIds: normalizeStringArray(
      Array.isArray(value.learnedCharacterIds)
        ? value.learnedCharacterIds
        : Object.entries((value as Record<string, unknown>).wordProgressById ?? {})
            .filter(([, progress]) => {
              if (!progress || typeof progress !== "object") {
                return false;
              }

              const candidate = progress as Record<string, unknown>;
              return candidate.stage === "mastered" || clampPositiveInteger(candidate.correctCount, 0) >= 3;
            })
            .map(([wordId]) => wordId),
    ),
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
