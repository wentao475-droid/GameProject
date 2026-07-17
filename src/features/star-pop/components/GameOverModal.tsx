import styles from "@/features/star-pop/components/GameOverModal.module.css";
import { RestartButton } from "@/features/star-pop/components/RestartButton";

type GameOverModalProps = {
  isOpen: boolean;
  score: number;
  remainingBlocks: number;
  autoClearedBlocks: number;
  onRestart: () => void;
};

export function GameOverModal({
  isOpen,
  score,
  remainingBlocks,
  autoClearedBlocks,
  onRestart,
}: GameOverModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation">
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        <p className={styles.badge}>本局结束</p>
        <h2 id="game-over-title" className={styles.title}>
          没有可消除的星块了
        </h2>
        <p className={styles.summary}>
          你拿到了 <strong>{score}</strong> 分，棋盘上还剩{" "}
          <strong>{remainingBlocks}</strong> 块星块。
        </p>
        {autoClearedBlocks > 0 ? (
          <p className={styles.cleanupNote}>
            残局已自动清盘 <strong>{autoClearedBlocks}</strong> 块，方便直接进入结算。
          </p>
        ) : null}
        <RestartButton onRestart={onRestart} />
      </section>
    </div>
  );
}
