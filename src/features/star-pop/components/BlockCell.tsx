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

  const labelParts = block.label?.split("-") ?? [];
  const isMultilineLabel = labelParts.length === 2;
  const longestLabelPartLength = isMultilineLabel
    ? Math.max(labelParts[0]?.length ?? 0, labelParts[1]?.length ?? 0)
    : block.label?.length ?? 0;

  const classNames = [
    styles.cell,
    block.label ? styles.wordCell : "",
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
  const labelStyle = block.label
    ? ({
        "--label-font-size":
          longestLabelPartLength <= 2
            ? "1.16rem"
            : longestLabelPartLength <= 4
              ? "1.18rem"
              : longestLabelPartLength <= 5
                ? "1.12rem"
                : longestLabelPartLength <= 6
                ? "1.08rem"
                : longestLabelPartLength <= 7
                  ? "0.98rem"
                  : "0.92rem",
      } as CSSProperties)
    : undefined;

  return (
    <button
      type="button"
      className={classNames}
      style={movementStyle}
      aria-label={
        block.fullLabel
          ? `${block.color} 星块，${block.fullLabel}${block.meaning ? `，${block.meaning}` : ""}`
          : `${block.color} 星块`
      }
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.sparkle} />
      {block.label ? (
        <span
          className={`${styles.label} ${isMultilineLabel ? styles.labelMultiline : ""}`}
          style={labelStyle}
        >
          {isMultilineLabel ? (
            <>
              <span className={styles.labelLine}>{labelParts[0]}-</span>
              <span className={styles.labelLine}>{labelParts[1]}</span>
            </>
          ) : (
            block.label
          )}
        </span>
      ) : null}
    </button>
  );
}
