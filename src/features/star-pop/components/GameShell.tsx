"use client";

import { useCallback, useEffect, useState } from "react";
import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { getGameMode } from "@/features/star-pop/lib/gameModes";
import { calculateScore } from "@/features/star-pop/lib/calculateScore";
import { HomeScreen } from "@/features/star-pop/components/HomeScreen";
import { GameBoard } from "@/features/star-pop/components/GameBoard";
import { ObjectiveSheet } from "@/features/star-pop/components/ObjectiveSheet";
import { ResultScreen } from "@/features/star-pop/components/ResultScreen";
import { RestartButton } from "@/features/star-pop/components/RestartButton";
import { ScoreBoard } from "@/features/star-pop/components/ScoreBoard";
import { SettingsSheet } from "@/features/star-pop/components/SettingsSheet";
import { DEFAULT_THEME_ID } from "@/features/star-pop/lib/progression";
import { getThemeVariables } from "@/features/star-pop/lib/theme";
import { useStarPopApp } from "@/features/star-pop/hooks/useStarPopApp";
import styles from "@/features/star-pop/components/GameShell.module.css";

export function GameShell() {
  const [isObjectiveOpen, setIsObjectiveOpen] = useState(false);
  const openObjective = useCallback(() => setIsObjectiveOpen(true), []);
  const closeObjective = useCallback(() => setIsObjectiveOpen(false), []);
  const {
    screen,
    isSettingsOpen,
    profile,
    currentResult,
    settings,
    dailyQuests,
    starRoadProgress,
    recommendedGoal,
    game,
    openSettings,
    closeSettings,
    startGame,
    startDailyChallenge,
    startRecommendedRound,
    replayGame,
    goHome,
    selectedModeId,
    dailyChallenge,
    updateSelectedMode,
    updateSettings,
    updateTheme,
    handleResetProfile,
  } = useStarPopApp();

  const themeVariables = getThemeVariables(profile?.currentThemeId ?? DEFAULT_THEME_ID);

  useEffect(() => {
    Object.entries(themeVariables).forEach(([variable, value]) => {
      if (typeof value === "string") {
        document.documentElement.style.setProperty(variable, value);
      }
    });
  }, [themeVariables]);

  useEffect(() => {
    if (screen !== "playing") {
      setIsObjectiveOpen(false);
    }
  }, [screen]);

  if (!profile) {
    return <main className={styles.page} style={themeVariables} />;
  }

  const playingMode = getGameMode(game.modeId);
  const modeHint = game.dailyChallenge
    ? `每日挑战：${game.dailyChallenge.goal.label}`
    : playingMode.id === "clear"
      ? "没有可用步时进入结算，剩余越少，残局奖励越高。"
      : playingMode.id === "moves"
        ? "用完 20 步或没有可用步时进入结算。"
        : "没有可用步时会自动清盘后进入结算。";
  const boardCaption = game.isAutoClearing
    ? "残局自动清盘中"
    : game.previewCount === 1
      ? "单个星块不可消除"
      : game.previewCount >= GAME_CONFIG.minGroupSize
        ? `可消除 ${game.previewCount} 块 · 预计 +${calculateScore(game.previewCount)} 分`
        : "点击棋盘中的相邻同色块";
  return (
    <main
      className={`${styles.page} ${screen === "playing" ? styles.pagePlaying : ""}`}
      data-theme={profile.currentThemeId}
      style={themeVariables}
    >
      {screen === "home" ? (
        <section className={`${styles.screenStage} ${styles.screenHome}`}>
          <HomeScreen
            profile={profile}
            selectedModeId={selectedModeId}
            dailyChallenge={dailyChallenge}
            dailyQuests={dailyQuests}
            starRoadProgress={starRoadProgress}
            onSelectMode={updateSelectedMode}
            onStartMode={startGame}
            onStartDailyChallenge={startDailyChallenge}
            onOpenSettings={openSettings}
          />
        </section>
      ) : null}

      {screen === "playing" ? (
        <section className={`${styles.shell} ${styles.screenStage} ${styles.screenPlaying}`}>
          <header className={styles.topBar}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Star Pop MVP</p>
              <h1 className={styles.title}>{playingMode.name}</h1>
            </div>

            <div className={styles.hud}>
              <ScoreBoard
                modeName={playingMode.shortName}
                score={game.score}
                remainingBlocks={game.remainingBlocks}
                movesLeft={game.movesLeft}
                idleHint="至少连接 2 块"
                previewCount={game.previewCount}
                turnFeedback={game.turnFeedback}
              />
            </div>
          </header>

          <section className={styles.boardStage}>
            <div className={styles.boardFrame}>
              <p className={styles.boardCaption}>{boardCaption}</p>
              <GameBoard
                board={game.board}
                selectedGroup={game.selectedGroup}
                invalidCellId={game.invalidCellId}
                turnFeedback={game.turnFeedback}
                disabled={game.isAnimating || game.status === "game-over"}
                onHover={game.handleBlockHover}
                onLeave={game.clearPreview}
                onClick={game.handleBlockClick}
              />
            </div>
          </section>

          <section className={styles.bottomDock}>
            <div className={styles.actionRow}>
              <RestartButton onRestart={replayGame} />
              <RestartButton onRestart={goHome} label="首页" />
              <button type="button" onClick={openObjective}>
                目标
              </button>
              <RestartButton onRestart={openSettings} label="设置" />
            </div>
          </section>
        </section>
      ) : null}

      {screen === "result" && currentResult ? (
        <section className={`${styles.screenStage} ${styles.screenResult}`}>
          <ResultScreen
            result={currentResult}
            profile={profile}
            recommendedGoal={recommendedGoal}
            onRecommendedReplay={startRecommendedRound}
            onReplay={replayGame}
            onHome={goHome}
            onOpenSettings={openSettings}
          />
        </section>
      ) : null}

      <SettingsSheet
        isOpen={isSettingsOpen}
        settings={settings}
        currentThemeId={profile.currentThemeId}
        unlockedThemeIds={profile.unlockedThemeIds}
        totalStars={profile.starRoadStars}
        onThemeChange={updateTheme}
        onClose={closeSettings}
        onChange={updateSettings}
        onReset={handleResetProfile}
      />
      <ObjectiveSheet
        isOpen={screen === "playing" && isObjectiveOpen}
        modeName={playingMode.name}
        objective={playingMode.objective}
        bestScore={profile.bestScoreByMode[playingMode.id]}
        dailyChallengeGoal={game.dailyChallenge?.goal.label ?? null}
        modeHint={modeHint}
        onClose={closeObjective}
      />
    </main>
  );
}
