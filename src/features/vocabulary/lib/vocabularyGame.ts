import type { WordEntry } from "@/features/vocabulary/types/words";

export const SESSION_TARGET_WORD_COUNT = 3;
export const TARGET_WORD_COLLECTION_GOAL = 3;

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
