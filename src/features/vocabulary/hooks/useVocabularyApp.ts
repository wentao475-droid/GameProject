"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getWordEntry } from "@/features/vocabulary/lib/wordBank";
import {
  readVocabularyProfile,
  writeVocabularyProfile,
} from "@/features/vocabulary/lib/storage";
import {
  buildSessionResult,
  buildVocabularyDailyTasks,
  buildTodayWordPack,
  getVocabularyDailyActivity,
  getWordProgress,
  getReviewQueueCount,
  recordVocabularyCardResults,
  recordVocabularyQuizAnswer,
  recordVocabularySessionCompletion,
  updateWordProgress,
  type VocabularyProfile,
  type TodayVocabularyPack,
} from "@/features/vocabulary/lib/vocabularyProgress";
import type {
  VocabularySettingsPatch,
  VocabularySessionCardResult,
  VocabularySessionResult,
  WordEntry,
} from "@/features/vocabulary/types/words";

export type VocabularyScreen = "home" | "session" | "result";

function getGameHomeHref() {
  const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return appBasePath ? `${appBasePath}/` : "/";
}

export function useVocabularyApp() {
  const [screen, setScreen] = useState<VocabularyScreen>("home");
  const [profile, setProfile] = useState<VocabularyProfile | null>(null);
  const [activeWords, setActiveWords] = useState<WordEntry[]>([]);
  const [sessionPackId, setSessionPackId] = useState<string | null>(null);
  const [sessionDateKey, setSessionDateKey] = useState<string | null>(null);
  const [sessionIntroducedWordIds, setSessionIntroducedWordIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<VocabularySessionCardResult[]>([]);
  const [result, setResult] = useState<VocabularySessionResult | null>(null);
  const [quizAnswersByQuestionId, setQuizAnswersByQuestionId] = useState<Record<string, string>>({});
  const [revealedWordIds, setRevealedWordIds] = useState<Record<string, true>>({});

  useEffect(() => {
    setProfile(readVocabularyProfile());
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    writeVocabularyProfile(profile);
  }, [profile]);

  const todayPack = useMemo<TodayVocabularyPack | null>(() => {
    if (!profile) {
      return null;
    }

    return buildTodayWordPack(profile);
  }, [profile]);

  const reviewQueueCount = useMemo(() => {
    if (!profile) {
      return 0;
    }

    return getReviewQueueCount(profile);
  }, [profile]);
  const dailyTasks = useMemo(() => {
    if (!profile || !todayPack) {
      return [];
    }

    return buildVocabularyDailyTasks(profile, todayPack);
  }, [profile, todayPack]);

  const activeWord = activeWords[currentIndex] ?? null;
  const isMeaningVisible = activeWord
    ? profile?.showMeaningHint || Boolean(revealedWordIds[activeWord.id])
    : false;
  const progressValue = activeWords.length === 0 ? 0 : currentIndex + 1;
  const quizQuestions = result?.questions ?? [];
  const quizCompletedCount = quizQuestions.reduce((count, question) => {
    return quizAnswersByQuestionId[question.id] ? count + 1 : count;
  }, 0);
  const quizCorrectCount = quizQuestions.reduce((count, question) => {
    return quizAnswersByQuestionId[question.id] === question.answer ? count + 1 : count;
  }, 0);

  const startSessionWithWords = useCallback(
    (
      words: WordEntry[],
      options?: {
        packId?: string;
        dateKey?: string;
        introducedWordIds?: string[];
      },
    ) => {
      if (!profile || words.length === 0) {
        return;
      }

      const startedAt = new Date().toISOString();
      setProfile((currentProfile) => {
        if (!currentProfile) {
          return currentProfile;
        }

        return {
          ...currentProfile,
          lastStudiedAt: startedAt,
        };
      });
      setActiveWords(words);
      setSessionPackId(options?.packId ?? words[0]?.packId ?? null);
      setSessionDateKey(options?.dateKey ?? todayPack?.dateKey ?? null);
      setSessionIntroducedWordIds(options?.introducedWordIds ?? []);
      setCurrentIndex(0);
      setSessionResults([]);
      setResult(null);
      setQuizAnswersByQuestionId({});
      setRevealedWordIds({});
      setScreen("session");
    },
    [profile, todayPack?.dateKey],
  );

  const startSession = useCallback(() => {
    if (!todayPack) {
      return;
    }

    startSessionWithWords(todayPack.words, {
      packId: todayPack.pack.id,
      dateKey: todayPack.dateKey,
      introducedWordIds: todayPack.newWords
        .map((word) => word.id)
        .filter((wordId) => todayPack.words.some((word) => word.id === wordId)),
    });
  }, [startSessionWithWords, todayPack]);

  const continueReview = useCallback(() => {
    if (!result) {
      startSession();
      return;
    }

    const reviewWords = result.reviewNeededWordIds
      .map((wordId) => getWordEntry(wordId))
      .filter((entry): entry is WordEntry => entry !== undefined);

    if (reviewWords.length > 0) {
      startSessionWithWords(reviewWords, {
        packId: result.packId,
        dateKey: result.dateKey,
        introducedWordIds: [],
      });
      return;
    }

    startSession();
  }, [result, startSession, startSessionWithWords]);

  const revealMeaning = useCallback(() => {
    if (!activeWord) {
      return;
    }

    setRevealedWordIds((currentValue) => ({
      ...currentValue,
      [activeWord.id]: true,
    }));
  }, [activeWord]);

  const answerQuestion = useCallback((questionId: string, choice: string) => {
    const question = result?.questions.find((item) => item.id === questionId);
    let shouldRecordAnswer = false;

    setQuizAnswersByQuestionId((currentValue) => {
      if (currentValue[questionId]) {
        return currentValue;
      }

      shouldRecordAnswer = true;
      return {
        ...currentValue,
        [questionId]: choice,
      };
    });

    if (!shouldRecordAnswer || !result || !question) {
      return;
    }

    setProfile((currentProfile) => {
      if (!currentProfile) {
        return currentProfile;
      }

      const activity = getVocabularyDailyActivity(currentProfile, result.dateKey);
      return {
        ...currentProfile,
        dailyActivityByDate: {
          ...currentProfile.dailyActivityByDate,
          [result.dateKey]: recordVocabularyQuizAnswer(
            activity,
            questionId,
            choice === question.answer,
          ),
        },
      };
    });
  }, [result]);

  const updateSettings = useCallback((patch: VocabularySettingsPatch) => {
    setProfile((currentProfile) => {
      if (!currentProfile) {
        return currentProfile;
      }

      return {
        ...currentProfile,
        ...patch,
      };
    });
  }, []);

  const markWord = useCallback(
    (known: boolean) => {
      if (!profile || !todayPack || !activeWord) {
        return;
      }

      const reviewedAt = new Date().toISOString();
      const previousProgress = getWordProgress(profile, activeWord.id);
      const nextProgress = updateWordProgress(
        profile.wordProgressById[activeWord.id],
        known,
        reviewedAt,
      );
      const activityDateKey = sessionDateKey ?? todayPack.dateKey;
      const introducedWordIdSet = new Set(sessionIntroducedWordIds);
      const cardResult: VocabularySessionCardResult = {
        wordId: activeWord.id,
        decision: known ? "known" : "uncertain",
        wasNew: introducedWordIdSet.has(activeWord.id),
        wasReview: !introducedWordIdSet.has(activeWord.id),
        previousStage: previousProgress.stage,
        nextStage: nextProgress.stage,
      };
      const nextProfile: VocabularyProfile = {
        ...profile,
        lastStudiedAt: reviewedAt,
        wordProgressById: {
          ...profile.wordProgressById,
          [activeWord.id]: nextProgress,
        },
        dailyActivityByDate: {
          ...profile.dailyActivityByDate,
          [activityDateKey]: recordVocabularyCardResults(
            getVocabularyDailyActivity(profile, activityDateKey),
            [cardResult],
            reviewedAt,
          ),
        },
      };
      const nextSessionResults = [...sessionResults, cardResult];
      const isLastWord = currentIndex >= activeWords.length - 1;

      setProfile(nextProfile);
      setSessionResults(nextSessionResults);

      if (isLastWord) {
        const sessionResult = buildSessionResult({
          dateKey: activityDateKey,
          packId: sessionPackId ?? todayPack.pack.id,
          introducedWordIds: sessionIntroducedWordIds,
          cardResults: nextSessionResults,
          quizEnabled: nextProfile.quizEnabled,
        });

        setProfile((currentProfile) => {
          if (!currentProfile) {
            return currentProfile;
          }

          return {
            ...currentProfile,
            dailyActivityByDate: {
              ...currentProfile.dailyActivityByDate,
              [activityDateKey]: recordVocabularySessionCompletion(
                getVocabularyDailyActivity(currentProfile, activityDateKey),
                reviewedAt,
              ),
            },
          };
        });
        setResult(sessionResult);
        setScreen("result");
        return;
      }

      setCurrentIndex((value) => value + 1);
    },
    [
      activeWord,
      activeWords.length,
      currentIndex,
      profile,
      sessionDateKey,
      sessionIntroducedWordIds,
      sessionPackId,
      sessionResults,
      todayPack,
    ],
  );

  const goHome = useCallback(() => {
    setActiveWords([]);
    setSessionPackId(null);
    setSessionDateKey(null);
    setSessionIntroducedWordIds([]);
    setCurrentIndex(0);
    setSessionResults([]);
    setResult(null);
    setQuizAnswersByQuestionId({});
    setRevealedWordIds({});
    setScreen("home");
  }, []);

  return {
    screen,
    profile,
    todayPack,
    reviewQueueCount,
    dailyTasks,
    homeHref: getGameHomeHref(),
    activeWords,
    activeWord,
    currentIndex,
    progressValue,
    isMeaningVisible,
    result,
    quizQuestions,
    quizAnswersByQuestionId,
    quizCompletedCount,
    quizCorrectCount,
    startSession,
    continueReview,
    revealMeaning,
    markWord,
    answerQuestion,
    updateSettings,
    goHome,
  };
}
