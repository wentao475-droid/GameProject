"use client";

import { VocabularyBoard } from "@/features/vocabulary/components/VocabularyBoard";
import { SESSION_TARGET_WORD_COUNT } from "@/features/vocabulary/lib/vocabularyGame";
import styles from "@/features/vocabulary/components/VocabularySession.module.css";
import type { Board, Position } from "@/features/star-pop/types/game";

type SessionTarget = {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  parts: string[];
  familyHint: string;
  formedCount: number;
  targetCount: number;
  isActive: boolean;
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
  focusedWordCard: {
    wordId: string;
    word: string;
    meaning: string;
    pronunciation: string;
    example: string;
    familyHint: string;
    isCurrentTarget: boolean;
  } | null;
  recentFormedWordCards: Array<{
    wordId: string;
    word: string;
    meaning: string;
    pronunciation: string;
    example: string;
    familyHint: string;
    isCurrentTarget: boolean;
  }>;
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
  focusedWordCard,
  recentFormedWordCards,
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
          <h1 className={styles.title}>目标字拼字对局</h1>
          <p className={styles.subtitle}>
            每局只追踪 {SESSION_TARGET_WORD_COUNT}
            个目标字。一次消除里如果刚好凑齐某个字需要的偏旁和部件，就会立即点亮这张字卡。
          </p>
        </div>
        <div className={styles.progressBadge}>
          <span className={styles.progressLabel}>完成目标</span>
          <strong>
            {completedTargetCount}/{targets.length}
          </strong>
        </div>
      </header>

      <section className={styles.goalGrid} aria-label="当前目标字">
        {targets.map((target) => {
          const completed = target.formedCount >= target.targetCount;
          const cardClassName = [
            styles.goalCard,
            completed ? styles.goalCardComplete : "",
            target.isActive ? styles.goalCardActive : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={target.id} className={cardClassName}>
              <div className={styles.goalHeader}>
                <span className={styles.goalMeaning}>{target.pronunciation}</span>
                <span className={styles.goalProgress}>
                  {Math.min(target.formedCount, target.targetCount)}/{target.targetCount}
                </span>
              </div>
              <strong className={styles.goalWord}>{target.word}</strong>
              <p className={styles.goalState}>{target.parts.join(" + ")}</p>
              <p className={styles.goalState}>{target.meaning}</p>
              <p className={styles.goalState}>
                {completed ? "已经拼出来了" : target.isActive ? target.familyHint : "找到对应部件就能成字"}
              </p>
              <div className={styles.goalTrack} aria-hidden="true">
                <span
                  className={`${styles.goalFill} ${completed ? styles.goalFillComplete : ""}`}
                  style={{
                    width: `${Math.min((target.formedCount / target.targetCount) * 100, 100)}%`,
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
        focusedWordCard={focusedWordCard}
        recentFormedWordCards={recentFormedWordCards}
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
