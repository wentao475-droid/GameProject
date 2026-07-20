import { useEffect, useRef, useState } from "react";
import styles from "@/features/star-pop/components/ObjectiveSheet.module.css";

type ObjectiveSheetProps = {
  isOpen: boolean;
  modeName: string;
  objective: string;
  bestScore: number;
  dailyChallengeGoal: string | null;
  modeHint: string;
  onClose: () => void;
};

export function ObjectiveSheet({
  isOpen,
  modeName,
  objective,
  bestScore,
  dailyChallengeGoal,
  modeHint,
  onClose,
}: ObjectiveSheetProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    const timer = window.setTimeout(() => setShouldRender(false), 220);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const frameId = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : styles.overlayClosing}`}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={`${styles.sheet} ${isOpen ? styles.sheetOpen : styles.sheetClosing}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="objective-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Round Objective</p>
            <h2 id="objective-title" className={styles.title}>
              {modeName}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <p className={styles.objective}>{objective}</p>

        <div className={styles.metrics}>
          <article className={styles.metricCard}>
            <span>模式最高分</span>
            <strong>{bestScore}</strong>
          </article>
          <article className={styles.metricCard}>
            <span>当前挑战</span>
            <strong>{dailyChallengeGoal ?? "普通对局"}</strong>
          </article>
        </div>

        <ul className={styles.rules}>
          <li>相邻至少 2 块同色星块才能消除。</li>
          <li>{modeHint}</li>
        </ul>

        <button type="button" className={styles.returnButton} onClick={onClose}>
          返回游戏
        </button>
      </section>
    </div>
  );
}
