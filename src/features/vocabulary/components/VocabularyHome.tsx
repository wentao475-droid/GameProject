"use client";

import Link from "next/link";
import type {
  TodayVocabularyPack,
  VocabularyProfile,
} from "@/features/vocabulary/lib/vocabularyProgress";
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
          <h1 className={styles.title}>背单词训练首页</h1>
          <p className={styles.subtitle}>
            用独立词汇存档驱动今日学习，先处理待复习词，再补充新词，和原消除玩法完全分离。
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
            <span>{todayPack.words.length}/{profile.dailyWordTarget} 个</span>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.cardLabel}>待复习数量</span>
          <strong className={styles.metricValue}>{reviewQueueCount}</strong>
          <p className={styles.cardBody}>根据现有学习进度自动计算，优先抽取到期单词进入今日训练。</p>
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
            <strong className={styles.cardTitle}>每日学习任务摘要</strong>
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

      <section className={styles.infoCard} aria-label="难度说明">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>难度说明</span>
            <strong className={styles.cardTitle}>高中进阶起步，衔接 CET4</strong>
          </div>
          <span className={styles.infoBadge}>{todayPack.pack.difficultyLabel}</span>
        </div>
        <p className={styles.infoText}>
          当前词包覆盖中国高中进阶词汇与四级衔接词，不会退回到基础启蒙词表；复习队列依据 `seenCount`
          、`correctCount` 和 `lastReviewedAt` 自动排序。
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
              <strong>显示释义</strong>
              <span>训练中默认展示中文释义，可随时切回先回忆再揭示。</span>
            </span>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={profile.showMeaningHint}
              onChange={(event) => onUpdateSettings({ showMeaningHint: event.target.checked })}
            />
          </label>

          <label className={styles.toggleRow}>
            <span className={styles.toggleCopy}>
              <strong>启用测验</strong>
              <span>结果页保留 1 组轻量测验，强化本轮提取记忆。</span>
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
            <strong className={styles.cardTitle}>准备进入今日训练流程</strong>
          </div>
          <span className={styles.infoBadge}>独立状态</span>
        </div>
        <p className={styles.infoText}>
          点击后会切换到独立 vocabulary 页面状态，不影响原游戏的首页、对局和结算状态。
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={onStart}>
            开始今日训练
          </button>
          <Link href={homeHref} className={styles.secondaryButton}>
            返回原游戏
          </Link>
        </div>
      </section>
    </section>
  );
}
