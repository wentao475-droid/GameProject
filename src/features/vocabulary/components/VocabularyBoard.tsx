import { GameBoard } from "@/features/star-pop/components/GameBoard";
import type { Board, Position } from "@/features/star-pop/types/game";
import styles from "@/features/vocabulary/components/VocabularyBoard.module.css";

type VocabularyBoardProps = {
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
  disabled: boolean;
  previewCount: number;
  score: number;
  remainingBlocks: number;
  onHover: (position: Position) => void;
  onLeave: () => void;
  onClick: (position: Position) => void;
};

export function VocabularyBoard({
  board,
  selectedGroup,
  invalidCellId,
  turnFeedback,
  disabled,
  previewCount,
  score,
  remainingBlocks,
  onHover,
  onLeave,
  onClick,
}: VocabularyBoardProps) {
  return (
    <section className={styles.panel} aria-label="单词版星块爆破棋盘">
      <div className={styles.header}>
        <div>
          <span className={styles.label}>Board</span>
          <strong className={styles.title}>消除包含目标词的同色连块</strong>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>预览 {previewCount}</span>
          <span className={styles.badge}>分数 {score}</span>
          <span className={styles.badge}>剩余 {remainingBlocks}</span>
        </div>
      </div>
      <p className={styles.helper}>规则保持原版：同色相邻至少 2 块可消，消后自动下落并左移，无路可走即结算。</p>
      <GameBoard
        board={board}
        selectedGroup={selectedGroup}
        invalidCellId={invalidCellId}
        turnFeedback={turnFeedback}
        disabled={disabled}
        onHover={onHover}
        onLeave={onLeave}
        onClick={onClick}
      />
    </section>
  );
}
