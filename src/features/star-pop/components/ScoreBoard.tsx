import { useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { calculateScore } from "@/features/star-pop/lib/calculateScore";
import styles from "@/features/star-pop/components/GameShell.module.css";

type ScoreBoardProps = {
  modeName: string;
  score: number;
  remainingBlocks: number;
  movesLeft: number | null;
  idleHint: string;
  previewCount: number;
  turnFeedback: {
    kind: "invalid" | "valid" | "auto-clear";
    label: string;
    scoreDelta: number;
    id: number;
    anchor: {
      row: number;
      col: number;
    };
  } | null;
};

export function ScoreBoard({
  modeName,
  score,
  remainingBlocks,
  movesLeft,
  idleHint,
  previewCount,
  turnFeedback,
}: ScoreBoardProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [visibleFeedback, setVisibleFeedback] = useState(turnFeedback);
  const previousScoreRef = useRef(score);

  useEffect(() => {
    const start = previousScoreRef.current;
    const delta = score - start;

    if (delta === 0) {
      setDisplayScore(score);
      previousScoreRef.current = score;
      return;
    }

    const duration = 340;
    const startedAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + delta * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      previousScoreRef.current = score;
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [score]);

  useEffect(() => {
    if (!turnFeedback) {
      setVisibleFeedback(null);
      return;
    }

    setVisibleFeedback(turnFeedback);
    const timer = window.setTimeout(() => {
      setVisibleFeedback((current) => (current?.id === turnFeedback.id ? null : current));
    }, GAME_CONFIG.turnFeedbackMs);

    return () => window.clearTimeout(timer);
  }, [turnFeedback]);

  const previewLabel =
    previewCount === 1
      ? "单个星块不可消除"
      : previewCount >= GAME_CONFIG.minGroupSize
        ? `可连消 ${previewCount} · 预计 +${calculateScore(previewCount)}`
        : idleHint;

  return (
    <section className={styles.scoreBoard} aria-label="游戏信息">
      <div className={styles.metricCard}>
        <span className={styles.metricLabel}>{modeName}</span>
        <strong className={styles.metricValue}>{displayScore}</strong>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricLabel}>
          {movesLeft === null ? "剩余方块" : "剩余步数"}
        </span>
        <strong className={styles.metricValue}>
          {movesLeft === null ? remainingBlocks : movesLeft}
        </strong>
      </div>
      <div className={styles.hudFooter}>
        <span className={styles.previewPill}>{previewLabel}</span>
        {visibleFeedback ? (
          <span
            key={visibleFeedback.id}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`${styles.feedbackPill} ${
              visibleFeedback.kind === "invalid"
                ? styles.feedbackInvalid
                : visibleFeedback.kind === "auto-clear"
                  ? styles.feedbackAutoClear
                  : styles.feedbackValid
            }`}
          >
            {visibleFeedback.scoreDelta > 0 ? `+${visibleFeedback.scoreDelta} ` : ""}
            {visibleFeedback.label}
          </span>
        ) : null}
      </div>
    </section>
  );
}
