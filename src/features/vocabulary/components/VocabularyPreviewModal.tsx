"use client";

import styles from "@/features/vocabulary/components/VocabularyPreviewModal.module.css";
import type { WordEntry } from "@/features/vocabulary/types/words";

type VocabularyPreviewModalProps = {
  isOpen: boolean;
  targets: WordEntry[];
  onClose: () => void;
  onConfirm: () => void;
};

export function VocabularyPreviewModal({
  isOpen,
  targets,
  onClose,
  onConfirm,
}: VocabularyPreviewModalProps) {
  if (!isOpen || targets.length === 0) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocabulary-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Preview</p>
            <h2 id="vocabulary-preview-title" className={styles.title}>
              先认这 2 个目标字
            </h2>
            <p className={styles.subtitle}>先看整字、拼音、解释和拆字提示，再进入棋盘里找对应部件。</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            关闭
          </button>
        </div>

        <div className={styles.wordList}>
          {targets.map((target) => (
            <article key={target.id} className={styles.wordCard}>
              <div className={styles.wordTop}>
                <span className={styles.meaning}>{target.meaning}</span>
                <span className={styles.partOfSpeech}>{target.parts.join(" + ")}</span>
              </div>
              <strong className={styles.word}>{target.word}</strong>
              <p className={styles.pronunciation}>拼音：{target.pronunciation}</p>
              <div className={styles.exampleBlock}>
                <span className={styles.exampleLabel}>例词</span>
                <p className={styles.example}>{target.example}</p>
              </div>
              <div className={styles.exampleBlock}>
                <span className={styles.exampleLabel}>偏旁提示</span>
                <p className={styles.example}>{target.familyHint}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            再看一眼
          </button>
          <button type="button" className={styles.primaryButton} onClick={onConfirm}>
            开始这一局
          </button>
        </div>
      </section>
    </div>
  );
}
