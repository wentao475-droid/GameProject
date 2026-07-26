import type { WordEntry } from "@/features/vocabulary/types/words";

export const SESSION_TARGET_WORD_COUNT = 2;
export const TARGET_WORD_COLLECTION_GOAL = 1;
export const CURRENT_TARGET_BONUS_PER_HIT = 180;

function uniqueWords(words: WordEntry[]) {
  const seenWordIds = new Set<string>();

  return words.filter((word) => {
    if (seenWordIds.has(word.id)) {
      return false;
    }

    seenWordIds.add(word.id);
    return true;
  });
}

export function selectSessionTargetWords(
  words: WordEntry[],
  options?: {
    priorityWordIds?: string[];
    targetCount?: number;
  },
) {
  const targetCount = Math.max(1, options?.targetCount ?? SESSION_TARGET_WORD_COUNT);
  const wordsById = new Map(words.map((word) => [word.id, word]));
  const priorityWords = (options?.priorityWordIds ?? [])
    .map((wordId) => wordsById.get(wordId))
    .filter((word): word is WordEntry => word !== undefined);
  const orderedWords = uniqueWords([...priorityWords, ...words]);

  return orderedWords.slice(0, targetCount);
}

export function getCurrentTargetWordId(
  targetWords: WordEntry[],
  formedCountsByWordId: Record<string, number>,
  targetGoal = TARGET_WORD_COLLECTION_GOAL,
) {
  return (
    targetWords.find((word) => (formedCountsByWordId[word.id] ?? 0) < targetGoal)?.id ?? null
  );
}

export function getCurrentTargetBonus(
  currentTargetWordId: string | null,
  formedCountsByWordId: Record<string, number>,
  bonusPerHit = CURRENT_TARGET_BONUS_PER_HIT,
) {
  if (!currentTargetWordId) {
    return 0;
  }

  return (formedCountsByWordId[currentTargetWordId] ?? 0) * bonusPerHit;
}

export function getFormedTargetWordIds(
  removedLabels: string[],
  targetWords: WordEntry[],
) {
  const removedLabelSet = new Set(removedLabels);

  return targetWords
    .filter((word) => word.parts.every((part) => removedLabelSet.has(part)))
    .map((word) => word.id);
}

export function getFormedWords(
  removedLabels: string[],
  candidateWords: WordEntry[],
) {
  const removedLabelSet = new Set(removedLabels);

  return candidateWords.filter((word) => word.parts.every((part) => removedLabelSet.has(part)));
}
