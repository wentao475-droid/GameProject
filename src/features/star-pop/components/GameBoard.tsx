import { BlockCell } from "@/features/star-pop/components/BlockCell";
import styles from "@/features/star-pop/components/GameBoard.module.css";
import { positionKey } from "@/features/star-pop/lib/boardUtils";
import type { CSSProperties } from "react";
import type { Board, Position } from "@/features/star-pop/types/game";

type GameBoardProps = {
  board: Board;
  selectedGroup: Position[];
  invalidCellId: string | null;
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
  disabled: boolean;
  surface?: "panel" | "flat";
  onHover: (position: Position) => void;
  onLeave: () => void;
  onClick: (position: Position) => void;
};

export function GameBoard({
  board,
  selectedGroup,
  invalidCellId,
  turnFeedback,
  disabled,
  surface = "panel",
  onHover,
  onLeave,
  onClick,
}: GameBoardProps) {
  const selectedKeys = new Set(selectedGroup.map(positionKey));
  const rowCount = board.length || 1;
  const colCount = board[0]?.length || 1;
  const feedbackStyle = turnFeedback
    ? ({
        "--feedback-left": `${((turnFeedback.anchor.col + 0.5) / colCount) * 100}%`,
        "--feedback-top": `${((turnFeedback.anchor.row + 0.5) / rowCount) * 100}%`,
      } as CSSProperties)
    : undefined;

  return (
    <section
      className={`${styles.boardPanel} ${surface === "flat" ? styles.boardPanelFlat : ""}`}
    >
      <div
        className={`${styles.board} ${surface === "flat" ? styles.boardFlat : ""}`}
        role="grid"
        aria-label={`${rowCount} x ${colCount} 星块棋盘`}
        style={{ "--board-cols": String(colCount) } as CSSProperties}
        onMouseLeave={onLeave}
      >
        {board.flatMap((row, rowIndex) =>
          row.map((block, colIndex) => {
            const position = { row: rowIndex, col: colIndex };

            return (
              <BlockCell
                key={block?.id ?? `empty-${rowIndex}-${colIndex}`}
                block={block}
                isSelected={selectedKeys.has(positionKey(position))}
                isInvalid={invalidCellId === block?.id}
                disabled={disabled}
                onHover={() => onHover(position)}
                onClick={() => onClick(position)}
              />
            );
          }),
        )}

        {turnFeedback ? (
          <div className={styles.feedbackLayer} style={feedbackStyle} aria-hidden="true">
            <span
              key={turnFeedback.id}
              className={`${styles.feedbackBubble} ${
                turnFeedback.kind === "invalid"
                  ? styles.feedbackInvalid
                  : turnFeedback.kind === "auto-clear"
                    ? styles.feedbackAutoClear
                    : styles.feedbackValid
              }`}
            >
              {turnFeedback.scoreDelta > 0 ? `+${turnFeedback.scoreDelta}` : turnFeedback.label}
            </span>
            <span className={styles.feedbackPulse} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
