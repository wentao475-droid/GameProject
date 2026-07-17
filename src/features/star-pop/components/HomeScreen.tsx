import { getGameMode, GAME_MODES } from "@/features/star-pop/lib/gameModes";
import type { GameProfile } from "@/features/star-pop/types/profile";
import type { DailyChallenge, GameModeId } from "@/features/star-pop/types/modes";
import type { DailyQuest, StarRoadProgress } from "@/features/star-pop/types/progression";
import styles from "@/features/star-pop/components/HomeScreen.module.css";

type HomeScreenProps = {
  profile: GameProfile;
  selectedModeId: GameModeId;
  dailyChallenge: DailyChallenge;
  dailyQuests: DailyQuest[];
  starRoadProgress: StarRoadProgress;
  onSelectMode: (modeId: GameModeId) => void;
  onStartMode: (modeId: GameModeId) => void;
  onStartDailyChallenge: () => void;
  onOpenSettings: () => void;
};

function formatResultDate(value: string | null) {
  if (!value) {
    return "还没有开始过";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "最近完成";
  }

  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

function getQuestProgressPercent(progress: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min((progress / target) * 100, 100);
}

export function HomeScreen({
  profile,
  selectedModeId,
  dailyChallenge,
  dailyQuests,
  starRoadProgress,
  onSelectMode,
  onStartMode,
  onStartDailyChallenge,
  onOpenSettings,
}: HomeScreenProps) {
  const selectedMode = getGameMode(selectedModeId);
  const dailyHistory = profile.dailyChallengeHistory[dailyChallenge.dateKey];
  const completedQuestCount = dailyQuests.filter((quest) => quest.completed).length;
  const nextNode = starRoadProgress.nextNode;
  const currentNode = starRoadProgress.currentNode;
  const previousThreshold = currentNode.requiredStars;
  const nextThreshold = nextNode?.requiredStars ?? currentNode.requiredStars;
  const starRoadSegmentTotal = Math.max(nextThreshold - previousThreshold, 1);
  const starRoadSegmentValue = nextNode
    ? starRoadProgress.totalStars - previousThreshold
    : starRoadSegmentTotal;
  const starRoadPercent = Math.min((starRoadSegmentValue / starRoadSegmentTotal) * 100, 100);

  return (
    <section className={styles.screen}>
      <div className={styles.hero}>
        <div className={styles.heroStage} aria-hidden="true">
          <div className={styles.orbitLarge} />
          <div className={styles.orbitMedium} />
          <div className={styles.orbitSmall} />
          <span className={`${styles.stageChip} ${styles.stageChipCoral}`}>连消</span>
          <span className={`${styles.stageChip} ${styles.stageChipSun}`}>高分</span>
          <span className={`${styles.stageChip} ${styles.stageChipMint}`}>清盘</span>
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Star Pop</p>
          <h1 className={styles.title}>星块爆破</h1>
          <p className={styles.subtitle}>轻点成片同色块，打出更高分数。</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onStartMode(selectedModeId)}
        >
          {selectedMode.actionLabel}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onOpenSettings}>
          设置
        </button>
      </div>

      <section className={styles.modeSection} aria-label="玩法模式">
        {Object.values(GAME_MODES).map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`${styles.modeCard} ${
              selectedModeId === mode.id ? styles.modeCardActive : ""
            }`}
            onClick={() => onSelectMode(mode.id)}
          >
            <div className={styles.modeHeader}>
              <strong>{mode.name}</strong>
              <span className={styles.modeBadge}>{mode.shortName}</span>
            </div>
            <p className={styles.modeDescription}>{mode.description}</p>
            <div className={styles.modeMeta}>
              <span>{mode.objective}</span>
              <span>模式最高分 {profile.bestScoreByMode[mode.id]}</span>
            </div>
          </button>
        ))}
      </section>

      <section className={styles.challengeCard} aria-label="每日挑战">
        <div className={styles.challengeCopy}>
          <span className={styles.cardLabel}>{dailyChallenge.title}</span>
          <strong className={styles.challengeTitle}>
            {getGameMode(dailyChallenge.modeId).name}
          </strong>
          <p className={styles.challengeDescription}>
            {dailyChallenge.description} · {dailyChallenge.goal.label}
          </p>
          <div className={styles.challengeMeta}>
            <span>{dailyChallenge.dateKey}</span>
            <span>
              {dailyHistory
                ? dailyHistory.completed
                  ? `已完成 · ${dailyHistory.score} 分`
                  : `已挑战 · ${dailyHistory.score} 分`
                : "今日还没开始"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className={styles.challengeButton}
          onClick={onStartDailyChallenge}
        >
          开始每日挑战
        </button>
      </section>

      <section className={styles.summarySection} aria-label="重复游玩目标">
        <article className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <span className={styles.cardLabel}>每日委托</span>
              <strong className={styles.summaryTitle}>
                已完成 {completedQuestCount}/{dailyQuests.length}
              </strong>
            </div>
            <span className={styles.summaryBadge}>
              {completedQuestCount === dailyQuests.length ? "今日已清" : "进行中"}
            </span>
          </div>

          <div className={styles.questList}>
            {dailyQuests.map((quest) => (
              <article key={quest.id} className={styles.questItem}>
                <div className={styles.questRow}>
                  <strong>{quest.title}</strong>
                  <span>
                    {quest.progress}/{quest.target}
                    {quest.unitLabel}
                  </span>
                </div>
                <p className={styles.questDescription}>{quest.description}</p>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span
                    className={`${styles.progressFill} ${
                      quest.completed ? styles.progressFillComplete : ""
                    }`}
                    style={{ width: `${getQuestProgressPercent(quest.progress, quest.target)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className={`${styles.summaryCard} ${styles.summaryCardAccent}`}>
          <div className={styles.summaryHeader}>
            <div>
              <span className={styles.cardLabel}>星路进度</span>
              <strong className={styles.summaryTitle}>{starRoadProgress.totalStars} 星累计</strong>
            </div>
            <span className={styles.summaryBadge}>
              已解锁 {starRoadProgress.unlockedThemeIds.length} 款
            </span>
          </div>

          <div className={styles.starRoadMeta}>
            <span>当前主题 {currentNode.title}</span>
            <span>
              {nextNode
                ? `下一站 ${nextNode.title} · 还差 ${Math.max(nextNode.requiredStars - starRoadProgress.totalStars, 0)} 星`
                : "已到达最终节点"}
            </span>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} style={{ width: `${starRoadPercent}%` }} />
          </div>
          <p className={styles.starRoadDescription}>
            {nextNode
              ? nextNode.description
              : "全部主题节点已解锁，接下来继续冲击更高模式纪录。"}
          </p>
        </article>
      </section>

      <section className={styles.brandKit} aria-label="品牌资源预览">
        <div className={styles.iconCard}>
          <div className={styles.appIcon} aria-hidden="true">
            <span className={styles.appIconDot} />
            <span className={styles.appIconRing} />
          </div>
          <div className={styles.iconCopy}>
            <span className={styles.cardLabel}>App Icon</span>
            <strong className={styles.brandTitle}>星块爆破</strong>
            <span className={styles.brandCaption}>原生化包装基础版</span>
          </div>
        </div>

        <div className={styles.paletteCard}>
          <span className={styles.cardLabel}>Brand Colors</span>
          <div className={styles.paletteRow} aria-hidden="true">
            <span className={`${styles.paletteChip} ${styles.paletteCoral}`} />
            <span className={`${styles.paletteChip} ${styles.paletteSky}`} />
            <span className={`${styles.paletteChip} ${styles.paletteMint}`} />
            <span className={`${styles.paletteChip} ${styles.paletteSun}`} />
            <span className={`${styles.paletteChip} ${styles.paletteViolet}`} />
          </div>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="局外信息">
        <article className={styles.card}>
          <span className={styles.cardLabel}>最佳分数</span>
          <strong className={styles.cardValue}>{profile.bestScore}</strong>
        </article>

        <article className={styles.card}>
          <span className={styles.cardLabel}>累计局数</span>
          <strong className={styles.cardValue}>{profile.totalRounds}</strong>
        </article>

        <article className={styles.wideCard}>
          <div>
            <span className={styles.cardLabel}>最近一局</span>
            <strong className={styles.resultValue}>
              {profile.lastResult ? `${profile.lastResult.score} 分` : "暂无记录"}
            </strong>
          </div>
          <div className={styles.resultMeta}>
            <span>{formatResultDate(profile.lastResult?.finishedAt ?? null)}</span>
            <span>
              {profile.lastResult
                ? `${profile.lastResult.modeName} · ${profile.lastResult.stars} 星`
                : "等待首局成绩"}
            </span>
          </div>
        </article>
      </section>
    </section>
  );
}
