import { useEffect, useMemo, useState } from "react";
import { getGameMode, getStarLabel } from "@/features/star-pop/lib/gameModes";
import { getThemeDefinition } from "@/features/star-pop/lib/progression";
import styles from "@/features/star-pop/components/ResultScreen.module.css";
import type { GameProfile, GameResult } from "@/features/star-pop/types/profile";
import type { RecommendedGoal } from "@/features/star-pop/types/progression";

const CELEBRATION_PARTICLES = Array.from({ length: 10 }, (_, index) => index);

type ResultScreenProps = {
  result: GameResult;
  profile: GameProfile;
  recommendedGoal: RecommendedGoal | null;
  onRecommendedReplay: () => void;
  onReplay: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
};

function formatFinishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "刚刚完成";
  }

  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMedal(score: number) {
  if (score >= 3200) {
    return {
      tier: "S",
      label: "闪耀战绩",
      detail: "这局已经接近完美清盘节奏。",
    };
  }

  if (score >= 2200) {
    return {
      tier: "A",
      label: "高能爆破",
      detail: "连消节奏很稳，已经打出优秀成绩。",
    };
  }

  if (score >= 1200) {
    return {
      tier: "B",
      label: "顺手一局",
      detail: "局势掌控不错，再冲一把就能破纪录。",
    };
  }

  return {
    tier: "C",
    label: "继续热身",
    detail: "已经顺利完赛，再来一局找更大的连块。",
  };
}

function getRecommendedActionLabel(goal: RecommendedGoal | null) {
  if (!goal) {
    return "再来一局";
  }

  if (goal.action.kind === "daily-challenge") {
    return "重开今日挑战";
  }

  if (goal.kind === "star-road") {
    return `去冲${getGameMode(goal.action.modeId).name}`;
  }

  return `继续玩${getGameMode(goal.action.modeId).name}`;
}

function getRecommendedActionMeta(goal: RecommendedGoal | null) {
  if (!goal) {
    return "原模式继续开局";
  }

  if (goal.action.kind === "daily-challenge") {
    return "推荐入口：今日每日挑战";
  }

  return `推荐模式：${getGameMode(goal.action.modeId).name}`;
}

function getProgressPercent(current: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min((current / target) * 100, 100);
}

export function ResultScreen({
  result,
  profile,
  recommendedGoal,
  onRecommendedReplay,
  onReplay,
  onHome,
  onOpenSettings,
}: ResultScreenProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const duration = 900;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(result.score * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    setDisplayScore(0);
    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [result.score]);

  const medal = useMemo(() => getMedal(result.score), [result.score]);
  const recommendedActionLabel = useMemo(
    () => getRecommendedActionLabel(recommendedGoal),
    [recommendedGoal],
  );
  const recommendedActionMeta = useMemo(
    () => getRecommendedActionMeta(recommendedGoal),
    [recommendedGoal],
  );
  const newlyUnlockedThemes = result.progressSummary.starRoad.newlyUnlockedThemeIds.map((themeId) =>
    getThemeDefinition(themeId).name,
  );

  return (
    <section className={styles.screen}>
      <div className={styles.celebrationLayer} aria-hidden="true">
        {CELEBRATION_PARTICLES.map((particle) => (
          <span key={particle} className={styles.celebrationParticle} />
        ))}
      </div>

      <div className={styles.hero}>
        <p className={styles.badge}>{result.modeName}</p>
        <h1 className={styles.title}>本局结束</h1>
        <p className={styles.subtitle}>
          {formatFinishedAt(result.finishedAt)}
          {result.isDailyChallenge ? " · 每日挑战" : ""}
        </p>
      </div>

      <article className={styles.scoreCard}>
        <div className={styles.medalRow}>
          <div className={styles.medalBadge} aria-label={`评级 ${medal.tier}`}>
            <span className={styles.medalRing} />
            <strong>{medal.tier}</strong>
          </div>

          <div className={styles.medalCopy}>
            <span className={styles.medalLabel}>{medal.label}</span>
            <p className={styles.medalDetail}>{medal.detail}</p>
          </div>
        </div>

        <span className={styles.cardLabel}>本局得分</span>
        <strong className={styles.scoreValue}>{displayScore}</strong>
        <div className={styles.scoreBreakdown}>
          <span>基础分 {result.baseScore}</span>
          <span>残局奖励 +{result.cleanupBonus}</span>
        </div>
        <p className={styles.starSummary}>{getStarLabel(result.stars)}</p>
        {result.isNewBest ? (
          <p className={styles.newBest}>刷新最佳分</p>
        ) : (
          <p className={styles.bestText}>
            模式最高分 {profile.bestScoreByMode[result.modeId]}
          </p>
        )}
      </article>

      <section className={styles.metrics}>
        <article className={styles.metricItem}>
          <span>残局剩余</span>
          <strong>{result.remainingBlocks}</strong>
        </article>
        <article className={styles.metricItem}>
          <span>星级评价</span>
          <strong>{result.stars} 星</strong>
        </article>
        <article className={styles.metricItem}>
          <span>操作步数</span>
          <strong>
            {result.movesLeft === null
              ? `${result.movesUsed} 步`
              : `${result.movesUsed} / ${result.movesUsed + result.movesLeft}`}
          </strong>
        </article>
        <article className={styles.metricItem}>
          <span>自动清盘</span>
          <strong>{result.autoClearedBlocks}</strong>
        </article>
        <article className={styles.metricItem}>
          <span>累计局数</span>
          <strong>{profile.totalRounds}</strong>
        </article>
        {result.isDailyChallenge ? (
          <article className={styles.metricItem}>
            <span>挑战结果</span>
            <strong>
              {result.dailyChallengeCompleted ? "已达成" : result.dailyChallengeGoalLabel}
            </strong>
          </article>
        ) : null}
      </section>

      <section className={styles.progressSection} aria-label="本局推进">
        <article className={styles.progressCard}>
          <div className={styles.sectionHeading}>
            <span className={styles.cardLabel}>任务推进</span>
            <strong>本局推动的每日委托</strong>
          </div>

          {result.progressSummary.dailyQuestUpdates.length > 0 ? (
            <div className={styles.updateList}>
              {result.progressSummary.dailyQuestUpdates.map((questUpdate) => (
                <article key={questUpdate.questId} className={styles.updateItem}>
                  <div className={styles.updateHeader}>
                    <strong>{questUpdate.title}</strong>
                    <span>
                      +{questUpdate.currentProgress - questUpdate.previousProgress}
                      {questUpdate.unitLabel}
                    </span>
                  </div>
                  <div className={styles.updateMeta}>
                    <span>
                      {questUpdate.currentProgress}/{questUpdate.target}
                      {questUpdate.unitLabel}
                    </span>
                    <span>{questUpdate.newlyCompleted ? "已完成" : "继续推进"}</span>
                  </div>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <span
                      className={`${styles.progressFill} ${
                        questUpdate.completed ? styles.progressFillComplete : ""
                      }`}
                      style={{
                        width: `${getProgressPercent(
                          questUpdate.currentProgress,
                          questUpdate.target,
                        )}%`,
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>
              今日委托已完成或本局未命中新委托，下一局优先冲星路或模式纪录。
            </p>
          )}
        </article>

        <article className={`${styles.progressCard} ${styles.progressCardAccent}`}>
          <div className={styles.sectionHeading}>
            <span className={styles.cardLabel}>星路进度</span>
            <strong>累计 +{result.progressSummary.starRoad.gainedStars} 星</strong>
          </div>

          <div className={styles.starRoadStats}>
            <span>
              {result.progressSummary.starRoad.currentStars} 星累计
              {result.progressSummary.starRoad.nextNode
                ? ` · 距离 ${result.progressSummary.starRoad.nextNode.title} 还差 ${Math.max(
                    result.progressSummary.starRoad.nextNode.requiredStars -
                      result.progressSummary.starRoad.currentStars,
                    0,
                  )} 星`
                : " · 已解锁全部主题"}
            </span>
            <span>
              {newlyUnlockedThemes.length > 0
                ? `新解锁 ${newlyUnlockedThemes.join("、")}`
                : `当前节点 ${result.progressSummary.starRoad.currentNode.title}`}
            </span>
          </div>

          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} style={{ width: "100%" }} />
          </div>
        </article>
      </section>

      {recommendedGoal ? (
        <article className={styles.nearMissCard} aria-label="差一点反馈">
          <span className={styles.cardLabel}>差一点</span>
          <strong className={styles.nearMissTitle}>
            还差 {recommendedGoal.remaining}
            {recommendedGoal.unitLabel} 即可达成 {recommendedGoal.title}
          </strong>
          <p className={styles.nearMissDetail}>{recommendedGoal.description}</p>
          <p className={styles.nearMissMeta}>{recommendedActionMeta}</p>
        </article>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={onRecommendedReplay}>
          {recommendedActionLabel}
        </button>
        <p className={styles.primaryHint}>{recommendedActionMeta}</p>
        <button type="button" className={styles.secondaryButton} onClick={onReplay}>
          原模式再来一局
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onHome}>
          返回首页
        </button>
        <button type="button" className={styles.ghostButton} onClick={onOpenSettings}>
          设置
        </button>
      </div>
    </section>
  );
}
