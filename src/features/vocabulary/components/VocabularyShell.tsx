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
    activeWord,
    activeWords,
    currentIndex,
    isMeaningVisible,
    result,
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
        ) : screen === "session" && activeWord ? (
          <VocabularySession
            activeWord={activeWord}
            currentIndex={currentIndex + 1}
            total={activeWords.length}
            isMeaningVisible={isMeaningVisible}
            onRevealMeaning={revealMeaning}
            onMarkKnown={() => markWord(true)}
            onMarkUncertain={() => markWord(false)}
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
