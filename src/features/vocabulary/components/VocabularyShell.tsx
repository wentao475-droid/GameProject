"use client";

import { VocabularyHome } from "@/features/vocabulary/components/VocabularyHome";
import { VocabularyResult } from "@/features/vocabulary/components/VocabularyResult";
import { VocabularySession } from "@/features/vocabulary/components/VocabularySession";
import { useVocabularyApp } from "@/features/vocabulary/hooks/useVocabularyApp";
import styles from "@/features/vocabulary/components/VocabularyShell.module.css";

export function VocabularyShell() {
  const {
    screen,
    profile,
    todayPack,
    reviewQueueCount,
    dailyTasks,
    homeHref,
    result,
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
  } = useVocabularyApp();

  if (!profile || !todayPack) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <section className={styles.screen}>
        {screen === "home" ? (
          <VocabularyHome
            profile={profile}
            todayPack={todayPack}
            reviewQueueCount={reviewQueueCount}
            dailyTasks={dailyTasks}
            homeHref={homeHref}
            onUpdateSettings={updateSettings}
            onStart={startSession}
          />
        ) : screen === "session" && sessionTargets.length > 0 ? (
          <VocabularySession
            targets={sessionTargets}
            completedTargetCount={sessionCompletedTargetCount}
            board={game.board}
            selectedGroup={game.selectedGroup}
            invalidCellId={game.invalidCellId}
            turnFeedback={game.turnFeedback}
            previewCount={game.previewCount}
            score={game.score}
            remainingBlocks={game.remainingBlocks}
            disabled={game.isAnimating}
            onHover={game.handleBlockHover}
            onLeave={game.clearPreview}
            onClick={game.handleBlockClick}
            onGoHome={goHome}
          />
        ) : screen === "result" && result ? (
          <VocabularyResult
            result={result}
            dailyTasks={dailyTasks}
            homeHref={homeHref}
            quizAnswersByQuestionId={quizAnswersByQuestionId}
            quizCompletedCount={quizCompletedCount}
            quizCorrectCount={quizCorrectCount}
            onAnswerQuestion={answerQuestion}
            onContinueReview={continueReview}
            onGoHome={goHome}
          />
        ) : (
          <section className={styles.fallback}>
            <button type="button" className={styles.primaryButton} onClick={goHome}>
              返回首页
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
