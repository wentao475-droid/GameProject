"use client";

import Link from "next/link";
import { getWordEntry } from "@/features/vocabulary/lib/wordBank";
import styles from "@/features/vocabulary/components/VocabularyResult.module.css";
import type {
  VocabularyDailyTask,
  VocabularySessionResult,
  VocabularyTargetResult,
  WordEntry,
} from "@/features/vocabulary/types/words";

type VocabularyResultProps = {
  result: VocabularySessionResult;
  dailyTasks: VocabularyDailyTask[];
  homeHref: string;
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
                ? "已经成功拼出"
                : target.hit
                  ? "这局碰到了关键部件，还差一步"
                  : "这局还没拼出来，建议继续找偏旁组合"}
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
  onContinueReview,
  onGoHome,
}: VocabularyResultProps) {
  const hitTargetResults = result.targetResults.filter((target) => target.hit);
  const reviewTargetResults = result.targetResults.filter((target) => !target.completed);
  const learnedEntries = result.learnedCharacterIds
    .map((wordId) => getWordEntry(wordId))
    .filter((entry): entry is WordEntry => entry !== undefined);

  return (
    <section className={styles.screen}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Result</p>
          <h1 className={styles.title}>本局识字结算</h1>
          <p className={styles.subtitle}>{result.recommendedAction}</p>
        </div>
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>分数</span>
            <strong>{result.score}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>拼出目标字</span>
            <strong>{result.hitTargetWordIds.length}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>认识新字</span>
            <strong>{result.learnedCharacterIds.length}</strong>
          </article>
        </div>
      </header>

      <section className={styles.card} aria-label="本局摘要">
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardLabel}>Round Summary</span>
            <strong className={styles.cardTitle}>本局目标字表现</strong>
          </div>
          <span className={styles.quizBadge}>消除 {result.removedBlockCount} 块</span>
        </div>
        {renderTargetList(result.targetResults, "本局没有目标字数据。")}
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
            <span className={styles.cardLabel}>碰到关键部件</span>
            <strong className={styles.cardTitle}>这局至少推进过一次</strong>
          </div>
          {renderTargetList(hitTargetResults, "本局还没有推进任何目标字。")}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>继续复习</span>
            <strong className={styles.cardTitle}>下一局优先继续拼</strong>
          </div>
          {renderTargetList(reviewTargetResults, "本局已完成全部目标字。")}
        </article>
      </section>

      <section className={styles.card} aria-label="认识的新字">
        <div className={styles.cardHeader}>
          <div>
            <span className={styles.cardLabel}>New Characters</span>
            <strong className={styles.cardTitle}>这局认识了哪些字</strong>
          </div>
          <span className={styles.quizBadge}>{learnedEntries.length} 个</span>
        </div>

        {learnedEntries.length === 0 ? (
          <p className={styles.emptyText}>这局还没有解锁新字，继续下一局会更容易记住部件组合。</p>
        ) : (
          <div className={styles.targetList}>
            {learnedEntries.map((entry) => (
              <article key={entry.id} className={styles.targetCard}>
                <div className={styles.targetHeader}>
                  <strong>{entry.word}</strong>
                  <span className={styles.targetBadge}>{entry.parts.join(" + ")}</span>
                </div>
                <span className={styles.targetMeaning}>{entry.pronunciation}</span>
                <p className={styles.targetMeta}>{entry.example}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={onContinueReview}>
          {reviewTargetResults.length > 0 ? "继续复习未完成目标字" : "再开一局新字"}
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
