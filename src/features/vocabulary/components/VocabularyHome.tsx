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
          <p className={styles.eyebrow}>Radical Pop</p>
          <h1 className={styles.title}>偏旁爆破</h1>
          <p className={styles.subtitle}>
            棋盘里只放偏旁和部件。每局先预习 {SESSION_TARGET_WORD_COUNT}
            个目标字，再去消除同色连块，把需要的部件拼成完整汉字。
          </p>
        </div>
      </header>

      <section className={styles.featureGrid} aria-label="今日字包概览">
        <article className={`${styles.card} ${styles.cardHighlight}`}>
          <span className={styles.cardLabel}>今日字包</span>
          <strong className={styles.cardTitle}>{todayPack.pack.title}</strong>
          <p className={styles.cardBody}>{todayPack.pack.description}</p>
          <div className={styles.statRow}>
            <span>{todayPack.pack.ageLabel}</span>
            <span>{todayPack.words.length}/{profile.dailyWordTarget} 个今日候选字</span>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.cardLabel}>已认识汉字</span>
          <strong className={styles.metricValue}>{reviewQueueCount}</strong>
          <p className={styles.cardBody}>已经拼出来的字会记入本地进度，后续对局会优先抽它们来复习巩固。</p>
        </article>
      </section>

      <section className={styles.metricsGrid} aria-label="学习拆分">
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>复习字</span>
          <strong>{todayPack.reviewWords.length}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>新字</span>
          <strong>{todayPack.newWords.length}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>每局目标</span>
          <strong>{SESSION_TARGET_WORD_COUNT}</strong>
        </article>
      </section>

      <section className={styles.infoCard} aria-label="每日学习任务">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>今日任务</span>
            <strong className={styles.cardTitle}>识字进度</strong>
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
            <strong className={styles.cardTitle}>先认字，再拼字</strong>
          </div>
          <span className={styles.infoBadge}>手机优先</span>
        </div>
        <p className={styles.infoText}>
          点击开始后会先弹出目标字预习卡，展示整字、拼音、解释、例词和拆字部件。进入棋盘后，只要一次消除里凑齐目标字需要的部件，就算成功拼出这个字。
        </p>
      </section>

      <section className={styles.infoCard} aria-label="教学重点">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>教学重点</span>
            <strong className={styles.cardTitle}>偏旁义类 + 构件合字</strong>
          </div>
          <span className={styles.infoBadge}>{todayPack.pack.ageLabel}</span>
        </div>
        <p className={styles.infoText}>
          当前字包围绕女字旁、三点水、提手旁、口字旁、草字头等高频偏旁展开，让孩子在消除时自然建立“部件组合成字”的结构感觉。
        </p>
      </section>

      <section className={styles.infoCard} aria-label="训练设置">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>训练设置</span>
            <strong className={styles.cardTitle}>每天认识几个字</strong>
          </div>
          <span className={styles.infoBadge}>本地保存</span>
        </div>
        <div className={styles.settingsGrid}>
          <label className={styles.settingField}>
            <span className={styles.settingLabel}>每日字量</span>
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
        </div>
      </section>

      <section className={styles.infoCard} aria-label="训练入口">
        <div className={styles.infoHeader}>
          <div>
            <span className={styles.cardLabel}>开始训练</span>
            <strong className={styles.cardTitle}>进入今日识字对局</strong>
          </div>
          <span className={styles.infoBadge}>独立状态</span>
        </div>
        <p className={styles.infoText}>
          点击后会进入独立的偏旁爆破页面，不影响原游戏首页和主模式。
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={onStart}>
            开始今日识字
          </button>
          <Link href={homeHref} className={styles.secondaryButton}>
            返回原游戏
          </Link>
        </div>
      </section>
    </section>
  );
}
