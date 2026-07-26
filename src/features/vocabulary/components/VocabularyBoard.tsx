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
  focusedWordCard,
  recentFormedWordCards,
  onHover,
  onLeave,
  onClick,
}: VocabularyBoardProps) {
  return (
    <section className={styles.stage} aria-label="偏旁爆破棋盘">
      <div className={styles.topline}>
        <strong className={styles.title}>消除同色连块，凑齐目标字部件</strong>
        <div className={styles.stats}>
          <span className={styles.stat}>预览 {previewCount}</span>
          <span className={styles.stat}>分数 {score}</span>
          <span className={styles.stat}>剩余 {remainingBlocks}</span>
        </div>
      </div>
      <div
        className={`${styles.wordSpotlight} ${focusedWordCard ? styles.wordSpotlightActive : ""}`}
        aria-live="polite"
      >
        {focusedWordCard ? (
          <>
            <div className={styles.wordSpotlightHeader}>
              <span className={styles.wordSpotlightMeta}>
                {focusedWordCard.pronunciation} · {focusedWordCard.meaning}
              </span>
              <span
                className={`${styles.wordSpotlightBadge} ${
                  focusedWordCard.isCurrentTarget ? styles.wordSpotlightBadgeActive : ""
                }`}
              >
                {focusedWordCard.isCurrentTarget ? "当前目标字" : "关联字卡"}
              </span>
            </div>
            <strong className={styles.wordSpotlightWord}>{focusedWordCard.word}</strong>
            <p className={styles.wordSpotlightNote}>{focusedWordCard.example}</p>
            <p className={styles.wordSpotlightNote}>{focusedWordCard.familyHint}</p>
          </>
        ) : (
          <>
            <div className={styles.wordSpotlightHeader}>
              <span className={styles.wordSpotlightMeta}>悬停目标部件</span>
              <span className={styles.wordSpotlightBadge}>放大查看</span>
            </div>
            <strong className={styles.wordSpotlightPlaceholder}>整字、拼音、例词和偏旁提示会显示在这里</strong>
            <p className={styles.wordSpotlightNote}>例如：妈 · ma · 例词：妈妈</p>
            <p className={styles.wordSpotlightNote}>悬停不同部件时，这里会稳定显示对应字卡，不再推动页面跳动。</p>
          </>
        )}
      </div>
      {recentFormedWordCards.length > 0 ? (
        <div className={styles.formedWords} aria-live="polite">
          <div className={styles.formedWordsHeader}>
            <strong className={styles.formedWordsTitle}>本次消除拼出了</strong>
            <span className={styles.wordSpotlightBadge}>{recentFormedWordCards.length} 个字</span>
          </div>
          <div className={styles.formedWordList}>
            {recentFormedWordCards.map((word) => (
              <article key={word.wordId} className={styles.formedWordCard}>
                <div className={styles.formedWordTop}>
                  <strong className={styles.formedWord}>{word.word}</strong>
                  <span
                    className={`${styles.wordSpotlightBadge} ${
                      word.isCurrentTarget ? styles.wordSpotlightBadgeActive : ""
                    }`}
                  >
                    {word.isCurrentTarget ? "目标字" : "额外识字"}
                  </span>
                </div>
                <p className={styles.helper}>
                  {word.pronunciation} · {word.meaning}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <GameBoard
        board={board}
        selectedGroup={selectedGroup}
        invalidCellId={invalidCellId}
        turnFeedback={turnFeedback}
        disabled={disabled}
        surface="flat"
        onHover={onHover}
        onLeave={onLeave}
        onClick={onClick}
      />
      <p className={styles.helper}>同色相邻至少 2 块可消，消后自动下落并左移，无路可走就会结算本局。</p>
    </section>
  );
}
