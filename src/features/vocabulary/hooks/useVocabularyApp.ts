"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWordEntry, getWordsByPack } from "@/features/vocabulary/lib/wordBank";
import {
  readVocabularyProfile,
  writeVocabularyProfile,
} from "@/features/vocabulary/lib/storage";
import { useVocabularyGame } from "@/features/vocabulary/hooks/useVocabularyGame";
import {
  buildSessionResult,
  buildVocabularyDailyTasks,
  buildTodayWordPack,
  getVocabularyDailyActivity,
  getWordProgress,
  getReviewQueueCount,
  recordVocabularyQuizAnswer,
  recordVocabularySessionCompletion,
  recordVocabularyTargetResults,
  updateWordProgress,
  type VocabularyProfile,
  type TodayVocabularyPack,
} from "@/features/vocabulary/lib/vocabularyProgress";
import {
  selectSessionTargetWords,
  TARGET_WORD_COLLECTION_GOAL,
} from "@/features/vocabulary/lib/vocabularyGame";
import type {
  VocabularySettingsPatch,
  VocabularySessionResult,
  VocabularyTargetResult,
  WordEntry,
} from "@/features/vocabulary/types/words";

export type VocabularyScreen = "home" | "session" | "result";

type ActiveSessionTarget = {
  entry: WordEntry;
  wasNew: boolean;
  wasReview: boolean;
  previousStage: VocabularyTargetResult["previousStage"];
};

type ActiveSession = {
  sessionId: number;
  packId: string;
  dateKey: string;
  targets: ActiveSessionTarget[];
};

function getGameHomeHref() {
  const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return appBasePath ? `${appBasePath}/` : "/";
}

export function useVocabularyApp() {
  const [screen, setScreen] = useState<VocabularyScreen>("home");
  const [profile, setProfile] = useState<VocabularyProfile | null>(null);
  const [result, setResult] = useState<VocabularySessionResult | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [quizAnswersByQuestionId, setQuizAnswersByQuestionId] = useState<Record<string, string>>({});
  const nextSessionIdRef = useRef(1);
  const game = useVocabularyGame();

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

  const quizQuestions = result?.questions ?? [];
  const quizCompletedCount = quizQuestions.reduce((count, question) => {
    return quizAnswersByQuestionId[question.id] ? count + 1 : count;
  }, 0);
  const quizCorrectCount = quizQuestions.reduce((count, question) => {
    return quizAnswersByQuestionId[question.id] === question.answer ? count + 1 : count;
  }, 0);

  const sessionTargets = useMemo(() => {
    if (!activeSession) {
      return [];
    }

    return activeSession.targets.map((target) => ({
      ...target.entry,
      collectedCount: Math.min(
        game.collectedCountsByWordId[target.entry.id] ?? 0,
        TARGET_WORD_COLLECTION_GOAL,
      ),
      targetCount: TARGET_WORD_COLLECTION_GOAL,
    }));
  }, [activeSession, game.collectedCountsByWordId]);

  const sessionCompletedTargetCount = sessionTargets.filter(
    (target) => target.collectedCount >= target.targetCount,
  ).length;

  const startSessionWithWords = useCallback(
    (
      words: WordEntry[],
      options?: {
        packId?: string;
        dateKey?: string;
        priorityWordIds?: string[];
        forcedReviewWordIds?: string[];
      },
    ) => {
      if (!profile || words.length === 0 || !todayPack) {
        return;
      }

      const targetWords = selectSessionTargetWords(words, {
        priorityWordIds: options?.priorityWordIds,
      });

      if (targetWords.length === 0) {
        return;
      }

      const startedAt = new Date().toISOString();
      const sessionId = nextSessionIdRef.current;
      nextSessionIdRef.current += 1;
      const forcedReviewWordIdSet = new Set(options?.forcedReviewWordIds ?? []);
      const todayNewWordIdSet = new Set(todayPack.newWords.map((word) => word.id));
      const targets: ActiveSessionTarget[] = targetWords.map((entry) => {
        const previousProgress = getWordProgress(profile, entry.id);
        const wasReview =
          forcedReviewWordIdSet.has(entry.id) ||
          previousProgress.seenCount > 0 ||
          previousProgress.stage !== "new";

        return {
          entry,
          wasNew: todayNewWordIdSet.has(entry.id) && !forcedReviewWordIdSet.has(entry.id),
          wasReview,
          previousStage: previousProgress.stage,
        };
      });

      setProfile((currentProfile) => {
        if (!currentProfile) {
          return currentProfile;
        }

        return {
          ...currentProfile,
          lastStudiedAt: startedAt,
        };
      });
      setResult(null);
      setQuizAnswersByQuestionId({});
      setActiveSession({
        sessionId,
        packId: options?.packId ?? todayPack.pack.id,
        dateKey: options?.dateKey ?? todayPack.dateKey,
        targets,
      });
      game.startGame({
        sessionId,
        targetWords,
        boardWords: getWordsByPack(options?.packId ?? todayPack.pack.id),
      });
      setScreen("session");
    },
    [game, profile, todayPack],
  );

  const startSession = useCallback(() => {
    if (!todayPack) {
      return;
    }

    startSessionWithWords(todayPack.words, {
      packId: todayPack.pack.id,
      dateKey: todayPack.dateKey,
      forcedReviewWordIds: todayPack.reviewWords.map((word) => word.id),
    });
  }, [startSessionWithWords, todayPack]);

  const continueReview = useCallback(() => {
    if (!todayPack || !result) {
      startSession();
      return;
    }

    const reviewWords = result.reviewNeededWordIds
      .map((wordId) => getWordEntry(wordId))
      .filter((entry): entry is WordEntry => entry !== undefined);
    const fillerWords = todayPack.words.filter((word) => !result.reviewNeededWordIds.includes(word.id));
    const nextWords = [...reviewWords, ...fillerWords];

    if (nextWords.length > 0) {
      startSessionWithWords(nextWords, {
        packId: result.packId,
        dateKey: result.dateKey,
        priorityWordIds: result.reviewNeededWordIds,
        forcedReviewWordIds: result.reviewNeededWordIds,
      });
      return;
    }

    startSession();
  }, [result, startSession, startSessionWithWords, todayPack]);

  useEffect(() => {
    if (!profile || !activeSession || !game.completion || game.completion.sessionId !== activeSession.sessionId) {
      return;
    }

    const reviewedAt = new Date().toISOString();
    const nextWordProgressById = { ...profile.wordProgressById };
    const targetResults: VocabularyTargetResult[] = activeSession.targets.map((target) => {
      const collectedCount = Math.min(
        game.completion?.collectedCountsByWordId[target.entry.id] ?? 0,
        TARGET_WORD_COLLECTION_GOAL,
      );
      const completed = collectedCount >= TARGET_WORD_COLLECTION_GOAL;
      const nextProgress = updateWordProgress(
        profile.wordProgressById[target.entry.id],
        completed,
        reviewedAt,
      );

      nextWordProgressById[target.entry.id] = nextProgress;

      return {
        wordId: target.entry.id,
        collectedCount,
        targetCount: TARGET_WORD_COLLECTION_GOAL,
        hit: collectedCount > 0,
        completed,
        wasNew: target.wasNew,
        wasReview: target.wasReview,
        previousStage: target.previousStage,
        nextStage: nextProgress.stage,
      };
    });
    const activityDateKey = activeSession.dateKey;
    const nextActivity = recordVocabularySessionCompletion(
      recordVocabularyTargetResults(
        getVocabularyDailyActivity(profile, activityDateKey),
        targetResults,
        reviewedAt,
      ),
      reviewedAt,
    );
    const nextProfile: VocabularyProfile = {
      ...profile,
      lastStudiedAt: reviewedAt,
      wordProgressById: nextWordProgressById,
      dailyActivityByDate: {
        ...profile.dailyActivityByDate,
        [activityDateKey]: nextActivity,
      },
    };
    const sessionResult = buildSessionResult({
      dateKey: activityDateKey,
      packId: activeSession.packId,
      score: game.completion.score,
      removedBlockCount: game.completion.removedBlockCount,
      targetResults,
      quizEnabled: nextProfile.quizEnabled,
    });

    setProfile(nextProfile);
    setResult(sessionResult);
    setActiveSession(null);
    setScreen("result");
    game.clearCompletion();
  }, [activeSession, game, profile]);

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

  const goHome = useCallback(() => {
    game.resetGame();
    setActiveSession(null);
    setResult(null);
    setQuizAnswersByQuestionId({});
    setScreen("home");
  }, [game]);

  return {
    screen,
    profile,
    todayPack,
    reviewQueueCount,
    dailyTasks,
    homeHref: getGameHomeHref(),
    result,
    quizQuestions,
    quizAnswersByQuestionId,
    quizCompletedCount,
    quizCorrectCount,
    sessionTargets,
    sessionCompletedTargetCount,
    game,
    startSession,
    continueReview,
    answerQuestion,
    updateSettings,
    goHome,
  };
}
