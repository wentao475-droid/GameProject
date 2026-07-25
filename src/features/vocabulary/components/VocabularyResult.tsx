"use client";

import Link from "next/link";
import { getWordEntry } from "@/features/vocabulary/lib/wordBank";
import styles from "@/features/vocabulary/components/VocabularyResult.module.css";
import type {
  VocabularyDailyTask,
  VocabularySessionResult,
} from "@/features/vocabulary/types/words";

type VocabularyResultProps = {
  result: VocabularySessionResult;
  dailyTasks: VocabularyDailyTask[];
  homeHref: string;
  quizAnswersByQuestionId: Record<string, string>;
  quizCompletedCount: number;
  quizCorrectCount: number;
  onAnswerQuestion: (questionId: string, choice: string) => void;
  onContinueReview: () => void;
  onGoHome: () => void;
};

function renderWordList(wordIds: string[]) {
  if (wordIds.length === 0) {
    return <p className={styles.emptyText}>本轮暂无对应单词。</p>;
  }

  return (
    <div className={styles.wordList}>
      {wordIds.map((wordId) => {
        const entry = getWordEntry(wordId);

        return (
          <article key={wordId} className={styles.wordChip}>
            <strong>{entry?.word ?? wordId}</strong>
            <span>{entry?.meaning ?? "暂无释义"}</span>
          </article>
        );
      })}
    </div>
  );
}

export function VocabularyResult({
  result,
  dailyTasks,
  homeHref,
  quizAnswersByQuestionId,
  quizCompletedCount,
  quizCorrectCount,
  onAnswerQuestion,
  onContinueReview,
  onGoHome,
}: VocabularyResultProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Result</p>
          <h1 className={styles.title}>本轮复习结算</h1>
          <p className={styles.subtitle}>{result.recommendedAction}</p>
        </div>
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>新词</span>
            <strong>{result.introducedWordIds.length}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>巩固词</span>
            <strong>{result.reinforcedWordIds.length}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>待复习词</span>
            <strong>{result.reviewNeededWordIds.length}</strong>
          </article>
        </div>
      </header>

      <section className={styles.card} aria-label="今日任务进度">
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardLabel}>Daily Tasks</span>
            <strong className={styles.cardTitle}>今日任务进度</strong>
          </div>
          <span className={styles.quizBadge}>
            {dailyTasks.filter((task) => task.completed).length}/{dailyTasks.length} 完成
          </span>
        </div>
        <div className={styles.taskList}>
          {dailyTasks.map((task) => (
            <article key={task.id} className={styles.taskItem}>
              <div className={styles.taskHeader}>
                <strong>{task.title}</strong>
                <span className={styles.taskMeta}>
                  {task.target > 0 ? `${Math.min(task.progress, task.target)}/${task.target}` : "已就绪"}
                </span>
              </div>
              <p className={styles.emptyText}>{task.description}</p>
              <div className={styles.progressTrack} aria-hidden="true">
                <span
                  className={`${styles.progressFill} ${task.completed ? styles.progressFillComplete : ""}`}
                  style={{
                    width: task.target > 0 ? `${Math.min((task.progress / task.target) * 100, 100)}%` : "100%",
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.grid} aria-label="训练结果分类">
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>新词</span>
            <strong className={styles.cardTitle}>本轮新接触</strong>
          </div>
          {renderWordList(result.introducedWordIds)}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>巩固词</span>
            <strong className={styles.cardTitle}>本轮已打牢</strong>
          </div>
          {renderWordList(result.reinforcedWordIds)}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>待复习词</span>
            <strong className={styles.cardTitle}>建议下一轮优先处理</strong>
          </div>
          {renderWordList(result.reviewNeededWordIds)}
        </article>
      </section>

      <section className={styles.card} aria-label="轻量测验">
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardLabel}>Quick Quiz</span>
            <strong className={styles.cardTitle}>1-2 题轻量测验</strong>
          </div>
          <span className={styles.quizBadge}>
            {quizCompletedCount}/{result.questions.length} 已完成
          </span>
        </div>

        {result.questions.length === 0 ? (
          <p className={styles.emptyText}>当前已关闭结算测验，复习建议仍会保留。</p>
        ) : (
          <div className={styles.quizList}>
            {result.questions.map((question) => {
              const answeredChoice = quizAnswersByQuestionId[question.id];

              return (
                <article key={question.id} className={styles.quizCard}>
                  <p className={styles.quizPrompt}>{question.prompt}</p>
                  <div className={styles.choiceGrid}>
                    {question.choices.map((choice) => {
                      const answered = Boolean(answeredChoice);
                      const isSelected = answeredChoice === choice;
                      const isCorrect = question.answer === choice;
                      const choiceClassName = [
                        styles.choiceButton,
                        answered && isCorrect ? styles.choiceCorrect : "",
                        answered && isSelected && !isCorrect ? styles.choiceWrong : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <button
                          key={choice}
                          type="button"
                          className={choiceClassName}
                          onClick={() => onAnswerQuestion(question.id, choice)}
                          disabled={answered}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  {answeredChoice ? (
                    <p className={styles.quizFeedback}>
                      {answeredChoice === question.answer
                        ? "回答正确，已完成一次快速提取。"
                        : `本题正确答案：${question.answer}`}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        {result.questions.length > 0 ? (
          <p className={styles.quizScore}>测验正确率：{quizCorrectCount}/{result.questions.length}</p>
        ) : null}
      </section>

      <section className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={onContinueReview}>
          {result.reviewNeededWordIds.length > 0 ? "继续复习待掌握词" : "再来一轮今日训练"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onGoHome}>
          返回首页
        </button>
        <Link href={homeHref} className={styles.ghostButton}>
          返回原游戏
        </Link>
      </section>
    </section>
  );
}
