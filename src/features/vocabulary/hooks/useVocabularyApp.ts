"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWordsByPack } from "@/features/vocabulary/lib/wordBank";
import {
  readVocabularyProfile,
  writeVocabularyProfile,
} from "@/features/vocabulary/lib/storage";
import { useVocabularyGame } from "@/features/vocabulary/hooks/useVocabularyGame";
import {
  buildSessionResult,
  buildVocabularyDailyTasks,
  buildTodayWordPack,
  getReviewQueueCount,
  recordVocabularyTargetResults,
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
  WordEntry,
} from "@/features/vocabulary/types/words";

export type VocabularyScreen = "home" | "session" | "result";

type ActiveSession = {
  sessionId: number;
  packId: string;
  dateKey: string;
  targets: WordEntry[];
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
  const [pendingSession, setPendingSession] = useState<ActiveSession | null>(null);
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

  const sessionTargets = useMemo(() => {
    if (!activeSession) {
      return [];
    }

    return activeSession.targets.map((target) => ({
      ...target,
      formedCount: Math.min(
        game.formedCountsByWordId[target.id] ?? 0,
        TARGET_WORD_COLLECTION_GOAL,
      ),
      targetCount: TARGET_WORD_COLLECTION_GOAL,
      isActive: game.currentTargetWordId === target.id,
    }));
  }, [activeSession, game.currentTargetWordId, game.formedCountsByWordId]);

  const sessionCompletedTargetCount = sessionTargets.filter(
    (target) => target.formedCount >= target.targetCount,
  ).length;

  const launchPreparedSession = useCallback(
    (session: ActiveSession) => {
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
      setResult(null);
      setActiveSession(session);
      setPendingSession(null);
      game.startGame({
        sessionId: session.sessionId,
        targetWords: session.targets,
        boardWords: getWordsByPack(session.packId),
      });
      setScreen("session");
    },
    [game],
  );

  const startSessionWithWords = useCallback(
    (
      words: WordEntry[],
      options?: {
        packId?: string;
        dateKey?: string;
        priorityWordIds?: string[];
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

      const sessionId = nextSessionIdRef.current;
      nextSessionIdRef.current += 1;

      setPendingSession({
        sessionId,
        packId: options?.packId ?? todayPack.pack.id,
        dateKey: options?.dateKey ?? todayPack.dateKey,
        targets: targetWords,
      });
    },
    [profile, todayPack],
  );

  const startSession = useCallback(() => {
    if (!todayPack) {
      return;
    }

    const candidateWords = [...todayPack.reviewWords, ...todayPack.newWords];
    startSessionWithWords(candidateWords.length > 0 ? candidateWords : todayPack.words, {
      packId: todayPack.pack.id,
      dateKey: todayPack.dateKey,
      priorityWordIds: todayPack.reviewWords.map((word) => word.id),
    });
  }, [startSessionWithWords, todayPack]);

  const continueReview = useCallback(() => {
    if (!result) {
      startSession();
      return;
    }

    const priorityWordIds = result.targetResults
      .filter((target) => !target.completed)
      .map((target) => target.wordId);
    const nextWords = getWordsByPack(result.packId);

    if (nextWords.length > 0) {
      startSessionWithWords(nextWords, {
        packId: result.packId,
        dateKey: todayPack?.dateKey ?? result.dateKey,
        priorityWordIds,
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
    const targetResults = activeSession.targets.map((target) => {
      const formedCount = Math.min(
        game.completion.formedCountsByWordId[target.id] ?? 0,
        TARGET_WORD_COLLECTION_GOAL,
      );
      const completed = formedCount >= TARGET_WORD_COLLECTION_GOAL;

      return {
        wordId: target.id,
        collectedCount: formedCount,
        targetCount: TARGET_WORD_COLLECTION_GOAL,
        hit: formedCount > 0,
        completed,
      };
    });
    const sessionResult = buildSessionResult({
      dateKey: activeSession.dateKey,
      packId: activeSession.packId,
      score: game.completion.score,
      removedBlockCount: game.completion.removedBlockCount,
      targetResults,
    });
    const nextProfile = recordVocabularyTargetResults(profile, sessionResult, reviewedAt);

    setProfile(nextProfile);
    setResult(sessionResult);
    setActiveSession(null);
    setScreen("result");
    game.clearCompletion();
  }, [activeSession, game, profile]);

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
    setPendingSession(null);
    setResult(null);
    setScreen("home");
  }, [game]);

  const cancelSessionPreview = useCallback(() => {
    setPendingSession(null);
  }, []);

  const confirmSessionPreview = useCallback(() => {
    if (!pendingSession) {
      return;
    }

    launchPreparedSession(pendingSession);
  }, [launchPreparedSession, pendingSession]);

  return {
    screen,
    profile,
    todayPack,
    reviewQueueCount,
    dailyTasks,
    homeHref: getGameHomeHref(),
    result,
    sessionPreviewTargets: pendingSession?.targets ?? [],
    sessionTargets,
    sessionCompletedTargetCount,
    game,
    startSession,
    continueReview,
    cancelSessionPreview,
    confirmSessionPreview,
    updateSettings,
    goHome,
  };
}
