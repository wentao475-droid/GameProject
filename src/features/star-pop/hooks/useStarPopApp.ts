"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDailyChallenge } from "@/features/star-pop/lib/dailyChallenge";
import {
  calculateCleanupBonus,
  calculateStars,
  getGameMode,
  isDailyChallengeCompleted,
} from "@/features/star-pop/lib/gameModes";
import {
  DEFAULT_THEME_ID,
  chooseRecommendedGoal,
  getDailyQuests,
  getStarRoadProgress,
  getUnlockedThemeIds,
  resolveDailyQuestProgress,
  summarizeDailyQuestUpdates,
  summarizeStarRoadProgress,
  updateDailyQuestProgress,
} from "@/features/star-pop/lib/progression";
import { useGameAudio } from "@/features/star-pop/hooks/useGameAudio";
import { readProfile, resetProfile, writeProfile } from "@/features/star-pop/lib/storage";
import { useStarPopGame } from "@/features/star-pop/hooks/useStarPopGame";
import type { AppScreen, GameProfile, GameResult, GameSettings } from "@/features/star-pop/types/profile";
import type { DailyChallenge, GameModeId } from "@/features/star-pop/types/modes";

export function useStarPopApp() {
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [screen, setScreen] = useState<AppScreen>("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<GameResult | null>(null);
  const [selectedModeId, setSelectedModeId] = useState<GameModeId>("classic");
  const [activeDailyChallenge, setActiveDailyChallenge] = useState<DailyChallenge | null>(null);
  const hasCapturedCurrentGame = useRef(false);
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);
  const dailyQuestsForToday = useMemo(() => getDailyQuests(), []);
  const activeDailyQuestDateKey = dailyQuestsForToday[0]?.dateKey ?? dailyChallenge.dateKey;

  useEffect(() => {
    const nextProfile = readProfile();
    setProfile(nextProfile);
    setSelectedModeId(nextProfile.lastSelectedMode);
  }, []);

  const settings = useMemo(
    () =>
      profile?.settings ?? {
        soundEnabled: true,
        vibrationEnabled: true,
        animationEnabled: true,
      },
    [profile],
  );
  const dailyQuests = useMemo(
    () =>
      resolveDailyQuestProgress(
        dailyQuestsForToday,
        profile?.dailyQuestProgressByDate[activeDailyQuestDateKey],
      ),
    [activeDailyQuestDateKey, dailyQuestsForToday, profile],
  );
  const starRoadProgress = useMemo(
    () => getStarRoadProgress(profile?.starRoadStars ?? 0),
    [profile?.starRoadStars],
  );
  const recommendedGoal = useMemo(
    () =>
      profile
        ? chooseRecommendedGoal({
            dailyQuests,
            starRoadStars: profile.starRoadStars,
            bestScoreByMode: profile.bestScoreByMode,
            preferredModeId: selectedModeId,
          })
        : null,
    [dailyQuests, profile, selectedModeId],
  );

  const audio = useGameAudio({
    enabled: settings.soundEnabled,
  });

  const game = useStarPopGame({
    animationEnabled: settings.animationEnabled,
    vibrationEnabled: settings.vibrationEnabled,
    onInvalidMove: audio.playInvalid,
    onValidMove: audio.playPop,
    onAutoClear: audio.playAutoClear,
  });

  const persistProfile = useCallback((nextProfile: GameProfile) => {
    setProfile(nextProfile);
    writeProfile(nextProfile);
  }, []);

  const updateSelectedMode = useCallback(
    (modeId: GameModeId) => {
      setSelectedModeId(modeId);

      if (!profile) {
        return;
      }

      const nextProfile: GameProfile = {
        ...profile,
        lastSelectedMode: modeId,
      };

      persistProfile(nextProfile);
    },
    [persistProfile, profile],
  );

  const updateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      if (!profile) {
        return;
      }

      const nextProfile: GameProfile = {
        ...profile,
        settings: {
          ...profile.settings,
          ...patch,
        },
      };

      persistProfile(nextProfile);
    },
    [persistProfile, profile],
  );

  const updateTheme = useCallback(
    (themeId: GameProfile["currentThemeId"]) => {
      if (!profile || !profile.unlockedThemeIds.includes(themeId) || profile.currentThemeId === themeId) {
        return;
      }

      persistProfile({
        ...profile,
        currentThemeId: themeId,
      });
    },
    [persistProfile, profile],
  );

  const handleResetProfile = useCallback(() => {
    if (typeof window !== "undefined") {
      const shouldReset = window.confirm("确认清除最高分、最近一局和全部设置吗？");
      if (!shouldReset) {
        return;
      }
    }

    const defaults = resetProfile();
    setProfile(defaults);
    setCurrentResult(null);
    hasCapturedCurrentGame.current = false;
    setIsSettingsOpen(false);
    setSelectedModeId(defaults.lastSelectedMode);
    setActiveDailyChallenge(null);
    setScreen("home");
    game.restartGame();
  }, [game]);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const startGame = useCallback(
    (modeId: GameModeId = selectedModeId, challenge: DailyChallenge | null = null) => {
      audio.playStart();
      updateSelectedMode(modeId);
      setActiveDailyChallenge(challenge);
      game.restartGame({
        modeId,
        boardSeed: challenge?.seed ?? null,
        dailyChallenge: challenge,
      });
      setCurrentResult(null);
      hasCapturedCurrentGame.current = false;
      setScreen("playing");
    },
    [audio, game, selectedModeId, updateSelectedMode],
  );

  const startDailyChallenge = useCallback(() => {
    startGame(dailyChallenge.modeId, dailyChallenge);
  }, [dailyChallenge, startGame]);

  const goHome = useCallback(() => {
    setScreen("home");
    setCurrentResult(null);
    hasCapturedCurrentGame.current = false;
    setActiveDailyChallenge(null);
    game.restartGame({
      modeId: selectedModeId,
      boardSeed: null,
      dailyChallenge: null,
    });
  }, [game, selectedModeId]);

  const replayGame = useCallback(() => {
    startGame(selectedModeId, activeDailyChallenge);
  }, [activeDailyChallenge, selectedModeId, startGame]);

  const startRecommendedRound = useCallback(() => {
    if (!recommendedGoal) {
      replayGame();
      return;
    }

    if (recommendedGoal.action.kind === "daily-challenge") {
      startDailyChallenge();
      return;
    }

    startGame(recommendedGoal.action.modeId);
  }, [recommendedGoal, replayGame, startDailyChallenge, startGame]);

  useEffect(() => {
    if (!profile || game.status !== "game-over" || hasCapturedCurrentGame.current) {
      return;
    }

    const cleanupBonus = calculateCleanupBonus(game.finalRemainingBlocks);
    const finalScore = game.score + cleanupBonus;
    const stars = calculateStars(game.modeId, finalScore, game.finalRemainingBlocks);
    const mode = getGameMode(game.modeId);
    const nextBestScore = Math.max(profile.bestScore, finalScore);
    const nextModeBest = Math.max(profile.bestScoreByMode[game.modeId], finalScore);
    const isChallengeCompleted =
      game.dailyChallenge === null
        ? false
        : isDailyChallengeCompleted(game.dailyChallenge, finalScore, game.finalRemainingBlocks);
    const finishedAt = new Date().toISOString();
    const previousDailyQuests = resolveDailyQuestProgress(
      dailyQuestsForToday,
      profile.dailyQuestProgressByDate[activeDailyQuestDateKey],
    );
    const nextDailyQuestProgressForToday = updateDailyQuestProgress(
      dailyQuestsForToday,
      profile.dailyQuestProgressByDate[activeDailyQuestDateKey],
      {
        modeId: game.modeId,
        score: finalScore,
        stars,
        isDailyChallenge: game.dailyChallenge !== null,
        dailyChallengeCompleted: isChallengeCompleted,
        finishedAt,
      },
    );
    const nextDailyQuests = resolveDailyQuestProgress(
      dailyQuestsForToday,
      nextDailyQuestProgressForToday,
    );
    const starRoadSummary = summarizeStarRoadProgress(profile.starRoadStars, stars);
    const nextStarRoadStars = starRoadSummary.currentStars;
    const unlockedThemeIds = getUnlockedThemeIds(nextStarRoadStars);
    const result: GameResult = {
      modeId: game.modeId,
      modeName: mode.name,
      score: finalScore,
      baseScore: game.score,
      cleanupBonus,
      remainingBlocks: game.finalRemainingBlocks,
      autoClearedBlocks: game.autoClearedBlocks,
      stars,
      movesUsed: game.movesUsed,
      movesLeft: game.movesLeft,
      isDailyChallenge: game.dailyChallenge !== null,
      dailyChallengeDateKey: game.dailyChallenge?.dateKey ?? null,
      dailyChallengeGoalLabel: game.dailyChallenge?.goal.label ?? null,
      dailyChallengeCompleted: isChallengeCompleted,
      isNewBest: finalScore > profile.bestScoreByMode[game.modeId],
      finishedAt,
      progressSummary: {
        dailyQuestUpdates: summarizeDailyQuestUpdates(previousDailyQuests, nextDailyQuests),
        starRoad: starRoadSummary,
      },
    };

    const nextProfile: GameProfile = {
      ...profile,
      bestScore: nextBestScore,
      bestScoreByMode: {
        ...profile.bestScoreByMode,
        [game.modeId]: nextModeBest,
      },
      totalRounds: profile.totalRounds + 1,
      lastResult: result,
      dailyChallengeHistory:
        game.dailyChallenge === null
          ? profile.dailyChallengeHistory
          : {
              ...profile.dailyChallengeHistory,
              [game.dailyChallenge.dateKey]: {
                modeId: game.dailyChallenge.modeId,
                playedAt: result.finishedAt,
                score: result.score,
                stars: result.stars,
                completed: result.dailyChallengeCompleted,
              },
            },
      dailyQuestProgressByDate: {
        ...profile.dailyQuestProgressByDate,
        [activeDailyQuestDateKey]: nextDailyQuestProgressForToday,
      },
      starRoadStars: nextStarRoadStars,
      unlockedThemeIds,
      currentThemeId: unlockedThemeIds.includes(profile.currentThemeId)
        ? profile.currentThemeId
        : DEFAULT_THEME_ID,
    };

    persistProfile(nextProfile);
    setCurrentResult(result);
    hasCapturedCurrentGame.current = true;
    setScreen("result");
    audio.playResult(result.isNewBest);
  }, [
    audio,
    activeDailyQuestDateKey,
    dailyQuestsForToday,
    game.autoClearedBlocks,
    game.dailyChallenge,
    game.finalRemainingBlocks,
    game.modeId,
    game.movesLeft,
    game.movesUsed,
    game.score,
    game.status,
    persistProfile,
    profile,
  ]);

  const appState = useMemo(
    () => ({
      screen,
      isSettingsOpen,
      profile,
      currentResult,
      dailyChallenge,
      dailyQuests,
      starRoadProgress,
      recommendedGoal,
      settings,
      selectedModeId,
      activeDailyChallenge,
      game,
      openSettings,
      closeSettings,
      startGame,
      startDailyChallenge,
      startRecommendedRound,
      replayGame,
      goHome,
      updateSelectedMode,
      updateSettings,
      updateTheme,
      handleResetProfile,
    }),
    [
      activeDailyChallenge,
      closeSettings,
      currentResult,
      dailyChallenge,
      dailyQuests,
      game,
      goHome,
      handleResetProfile,
      isSettingsOpen,
      openSettings,
      profile,
      recommendedGoal,
      replayGame,
      screen,
      selectedModeId,
      settings,
      startGame,
      startDailyChallenge,
      startRecommendedRound,
      starRoadProgress,
      updateSelectedMode,
      updateSettings,
      updateTheme,
    ],
  );

  return appState;
}
