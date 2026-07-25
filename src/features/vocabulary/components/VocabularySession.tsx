"use client";

import { VocabularyBoard } from "@/features/vocabulary/components/VocabularyBoard";
import styles from "@/features/vocabulary/components/VocabularySession.module.css";
import type { Board, Position } from "@/features/star-pop/types/game";

type SessionTarget = {
  id: string;
  word: string;
  meaning: string;
  collectedCount: number;
  targetCount: number;
};

type VocabularySessionProps = {
  targets: SessionTarget[];
  completedTargetCount: number;
  board: Board;
  selectedGroup: Position[];
  invalidCellId: string | null;
  turnFeedback: {
    kind: "invalid" | "valid";
    label: string;
    scoreDelta: number;
    id: number;
    anchor: {
      row: number;
      col: number;
    };
  } | null;
  previewCount: number;
  score: number;
  remainingBlocks: number;
  disabled: boolean;
  onHover: (position: Position) => void;
  onLeave: () => void;
  onClick: (position: Position) => void;
  onGoHome: () => void;
};

export function VocabularySession({
  targets,
  completedTargetCount,
  board,
  selectedGroup,
  invalidCellId,
  turnFeedback,
  previewCount,
  score,
  remainingBlocks,
  disabled,
  onHover,
  onLeave,
  onClick,
  onGoHome,
}: VocabularySessionProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Session</p>
          <h1 className={styles.title}>目标词收集对局</h1>
          <p className={styles.subtitle}>
            观察棋盘里的英文标签，尽量优先消掉带有目标词的同色连块。只要一组里包含目标词，就会累计顶部进度。
          </p>
        </div>
        <div className={styles.progressBadge}>
          <span className={styles.progressLabel}>完成目标</span>
          <strong>
            {completedTargetCount}/{targets.length}
          </strong>
        </div>
      </header>

      <section className={styles.goalGrid} aria-label="当前目标词">
        {targets.map((target) => {
          const completed = target.collectedCount >= target.targetCount;

          return (
            <article
              key={target.id}
              className={`${styles.goalCard} ${completed ? styles.goalCardComplete : ""}`}
            >
              <div className={styles.goalHeader}>
                <span className={styles.goalMeaning}>{target.meaning}</span>
                <span className={styles.goalProgress}>
                  {Math.min(target.collectedCount, target.targetCount)}/{target.targetCount}
                </span>
              </div>
              <strong className={styles.goalWord}>{target.word}</strong>
              <div className={styles.goalTrack} aria-hidden="true">
                <span
                  className={`${styles.goalFill} ${completed ? styles.goalFillComplete : ""}`}
                  style={{
                    width: `${Math.min((target.collectedCount / target.targetCount) * 100, 100)}%`,
                  }}
                />
              </div>
            </article>
          );
        })}
      </section>

      <VocabularyBoard
        board={board}
        selectedGroup={selectedGroup}
        invalidCellId={invalidCellId}
        turnFeedback={turnFeedback}
        disabled={disabled}
        previewCount={previewCount}
        score={score}
        remainingBlocks={remainingBlocks}
        onHover={onHover}
        onLeave={onLeave}
        onClick={onClick}
      />

      <section className={styles.actions}>
        <button type="button" className={styles.ghostButton} onClick={onGoHome}>
          返回首页
        </button>
      </section>
    </section>
  );
}
