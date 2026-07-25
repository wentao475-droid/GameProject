"use client";

import Link from "next/link";
import type {
  TodayVocabularyPack,
  VocabularyProfile,
} from "@/features/vocabulary/lib/vocabularyProgress";
import { SESSION_TARGET_WORD_COUNT } from "@/features/vocabulary/lib/vocabularyGame";
import type {
  VocabularyDailyTask,
  VocabularySettingsPatch,
} from "@/features/vocabulary/types/words";
import styles from "@/features/vocabulary/components/VocabularyHome.module.css";

type VocabularyHomeProps = {
  profile: VocabularyProfile;
  todayPack: TodayVocabularyPack;
  reviewQueueCount: number;
  dailyTasks: VocabularyDailyTask[];
  homeHref: string;
  onUpdateSettings: (patch: VocabularySettingsPatch) => void;
  onStart: () => void;
};

const DAILY_TARGET_OPTIONS = [6, 8, 10];

export function VocabularyHome({
  profile,
  todayPack,
  reviewQueueCount,
  dailyTasks,
  homeHref,
  onUpdateSettings,
  onStart,
}: VocabularyHomeProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.hero}>
        <div className={styles.heroBadge} aria-hidden="true">
          <span className={styles.heroRing} />
          <span className={styles.heroDot} />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Vocabulary Mode</p>
          <h1 className={styles.title}>单词版星块爆破</h1>
          <p className={styles.subtitle}>
            保留独立词汇页，但局内改成真实棋盘对局。每局抽取 {SESSION_TARGET_WORD_COUNT}
            个目标词，消除包含这些词的同色连块来推进收集进度。
          </p>
        </div>
      </header>

      <section className={styles.featureGrid} aria-label="今日词包概览">
        <article className={`${styles.card} ${styles.cardHighlight}`}>
          <span className={styles.cardLabel}>今日词包</span>
          <strong className={styles.cardTitle}>{todayPack.pack.title}</strong>
          <p className={styles.cardBody}>{todayPack.pack.description}</p>
          <div className={styles.statRow}>
            <span>{todayPack.pack.difficultyLabel}</span>
            <span>{todayPack.words.length}/{profile.dailyWordTarget} 个候选词</span>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.cardLabel}>待复习数量</span>
          <strong className={styles.metricValue}>{reviewQueueCount}</strong>
          <p className={styles.cardBody}>系统会优先把到期词放进本局目标位，继续复习会优先带上未完成目标。</p>
        </article>
      </section>

      <section className={styles.metricsGrid} aria-label="学习拆分">
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>复习词</span>
          <strong>{todayPack.reviewWords.length}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>新词</span>
          <strong>{todayPack.newWords.length}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>巩固词</span>
          <strong>{todayPack.reinforcementWords.length}</strong>
        </article>
      </section>

      <section className={styles.infoCard} aria-label="每日学习任务">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>今日任务</span>
            <strong className={styles.cardTitle}>目标词学习进度</strong>
          </div>
          <span className={styles.infoBadge}>
            {dailyTasks.filter((task) => task.completed).length}/{dailyTasks.length} 完成
          </span>
        </div>
        <div className={styles.taskList}>
          {dailyTasks.map((task) => {
            const progressText =
              task.target > 0 ? `${Math.min(task.progress, task.target)}/${task.target}` : "已就绪";

            return (
              <article key={task.id} className={styles.taskItem}>
                <div className={styles.taskHeader}>
                  <strong>{task.title}</strong>
                  <span className={styles.taskMeta}>
                    {task.completed ? "已完成" : progressText}
                  </span>
                </div>
                <p className={styles.taskDescription}>{task.description}</p>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span
                    className={`${styles.progressFill} ${task.completed ? styles.progressFillComplete : ""}`}
                    style={{
                      width: task.target > 0 ? `${Math.min((task.progress / task.target) * 100, 100)}%` : "100%",
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.infoCard} aria-label="玩法说明">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>玩法说明</span>
            <strong className={styles.cardTitle}>同色消除，顺手收词</strong>
          </div>
          <span className={styles.infoBadge}>真实棋盘</span>
        </div>
        <p className={styles.infoText}>
          顶部会固定展示 3 个目标词，每个目标需要在一局里收集满 3 次。只要你消掉的连块里带有目标词标签，就会累计对应进度。
        </p>
      </section>

      <section className={styles.infoCard} aria-label="难度说明">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>难度说明</span>
            <strong className={styles.cardTitle}>高中进阶起步，衔接 CET4</strong>
          </div>
          <span className={styles.infoBadge}>{todayPack.pack.difficultyLabel}</span>
        </div>
        <p className={styles.infoText}>
          当前词库固定使用高考进阶与 CET4 衔接词，不回退到基础词表；复习优先级仍依据 `seenCount`
          、`correctCount` 和 `lastReviewedAt` 自动计算。
        </p>
      </section>

      <section className={styles.infoCard} aria-label="训练设置">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>训练设置</span>
            <strong className={styles.cardTitle}>最小设置项</strong>
          </div>
          <span className={styles.infoBadge}>本地保存</span>
        </div>
        <div className={styles.settingsGrid}>
          <label className={styles.settingField}>
            <span className={styles.settingLabel}>每日词量</span>
            <select
              className={styles.select}
              value={profile.dailyWordTarget}
              onChange={(event) => onUpdateSettings({ dailyWordTarget: Number(event.target.value) })}
            >
              {DAILY_TARGET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} 个
                </option>
              ))}
            </select>
          </label>

          <label className={styles.toggleRow}>
            <span className={styles.toggleCopy}>
              <strong>启用测验</strong>
              <span>结果页保留 1 到 2 题轻量测验，强化本局目标词提取。</span>
            </span>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={profile.quizEnabled}
              onChange={(event) => onUpdateSettings({ quizEnabled: event.target.checked })}
            />
          </label>
        </div>
      </section>

      <section className={styles.infoCard} aria-label="训练入口">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>开始训练</span>
            <strong className={styles.cardTitle}>进入今日目标词对局</strong>
          </div>
          <span className={styles.infoBadge}>独立状态</span>
        </div>
        <p className={styles.infoText}>
          点击后会进入独立的 vocabulary 对局，不影响原游戏首页、主模式和结算状态。
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={onStart}>
            开始今日对局
          </button>
          <Link href={homeHref} className={styles.secondaryButton}>
            返回原游戏
          </Link>
        </div>
      </section>
    </section>
  );
}
