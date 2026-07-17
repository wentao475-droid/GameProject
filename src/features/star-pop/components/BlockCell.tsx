import type { CSSProperties } from "react";
import type { Block } from "@/features/star-pop/types/game";
import styles from "@/features/star-pop/components/BlockCell.module.css";

type BlockCellProps = {
  block: Block | null;
  isSelected: boolean;
  isInvalid: boolean;
  disabled: boolean;
  onHover: () => void;
  onClick: () => void;
};

export function BlockCell({
  block,
  isSelected,
  isInvalid,
  disabled,
  onHover,
  onClick,
}: BlockCellProps) {
  if (!block) {
    return <div className={styles.emptyCell} aria-hidden="true" />;
  }

  const classNames = [
    styles.cell,
    styles[`color_${block.color}`],
    isSelected ? styles.selected : "",
    isInvalid ? styles.invalid : "",
    block.state === "removing" ? styles.removing : "",
    block.state === "falling" ? styles.falling : "",
  ]
    .filter(Boolean)
    .join(" ");

  const movementStyle = {
    "--drop-distance": String(block.dropDistance),
    "--shift-distance": String(block.shiftDistance),
  } as CSSProperties;

  return (
    <button
      type="button"
      className={classNames}
      style={movementStyle}
      aria-label={`${block.color} 星块`}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.sparkle} />
    </button>
  );
}
