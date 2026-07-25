"use client";

import Link from "next/link";
import { getWordEntry } from "@/features/vocabulary/lib/wordBank";
import styles from "@/features/vocabulary/components/VocabularyResult.module.css";
import type {
  VocabularyDailyTask,
  VocabularySessionResult,
  VocabularyTargetResult,
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

function renderTargetList(targetResults: VocabularyTargetResult[], emptyText: string) {
  if (targetResults.length === 0) {
    return <p className={styles.emptyText}>{emptyText}</p>;
  }

  return (
    <div className={styles.targetList}>
      {targetResults.map((target) => {
        const entry = getWordEntry(target.wordId);

        return (
          <article key={target.wordId} className={styles.targetCard}>
            <div className={styles.targetHeader}>
              <strong>{entry?.word ?? target.wordId}</strong>
              <span className={styles.targetBadge}>
                {Math.min(target.collectedCount, target.targetCount)}/{target.targetCount}
              </span>
            </div>
            <span className={styles.targetMeaning}>{entry?.meaning ?? "暂无释义"}</span>
            <p className={styles.targetMeta}>
              {target.completed
                ? "已完成本局收集"
                : target.hit
                  ? "已命中，但还需继续收集"
                  : "本局未命中，建议优先复习"}
            </p>
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
  const hitTargetResults = result.targetResults.filter((target) => target.hit);
  const reviewTargetResults = result.targetResults.filter((target) => !target.completed);

  return (
    <section className={styles.screen}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Result</p>
          <h1 className={styles.title}>本局目标词结算</h1>
          <p className={styles.subtitle}>{result.recommendedAction}</p>
        </div>
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>分数</span>
            <strong>{result.score}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>命中目标词</span>
            <strong>{result.hitTargetWordIds.length}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>待复习词</span>
            <strong>{result.reviewNeededWordIds.length}</strong>
          </article>
        </div>
      </header>

      <section className={styles.card} aria-label="本局摘要">
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardLabel}>Round Summary</span>
            <strong className={styles.cardTitle}>真实棋盘对局表现</strong>
          </div>
          <span className={styles.quizBadge}>消除 {result.removedBlockCount} 块</span>
        </div>
        {renderTargetList(result.targetResults, "本局没有目标词数据。")}
      </section>

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
            <span className={styles.cardLabel}>命中目标词</span>
            <strong className={styles.cardTitle}>本局至少碰到过一次</strong>
          </div>
          {renderTargetList(hitTargetResults, "本局还没有命中任何目标词。")}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>待复习词</span>
            <strong className={styles.cardTitle}>下一局优先继续带上</strong>
          </div>
          {renderTargetList(reviewTargetResults, "本局已完成全部目标词收集。")}
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
          {result.reviewNeededWordIds.length > 0 ? "继续复习未完成目标词" : "再开一局新目标"}
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
