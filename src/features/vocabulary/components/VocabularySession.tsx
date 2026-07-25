"use client";

import styles from "@/features/vocabulary/components/VocabularySession.module.css";
import type { WordEntry } from "@/features/vocabulary/types/words";

type VocabularySessionProps = {
  activeWord: WordEntry;
  currentIndex: number;
  total: number;
  isMeaningVisible: boolean;
  onRevealMeaning: () => void;
  onMarkKnown: () => void;
  onMarkUncertain: () => void;
  onGoHome: () => void;
};

export function VocabularySession({
  activeWord,
  currentIndex,
  total,
  isMeaningVisible,
  onRevealMeaning,
  onMarkKnown,
  onMarkUncertain,
  onGoHome,
}: VocabularySessionProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Session</p>
          <h1 className={styles.title}>今日词卡训练</h1>
          <p className={styles.subtitle}>
            先尝试回忆释义，再标记自己是“认识”还是“模糊”，让系统生成本轮复习结算。
          </p>
        </div>
        <div className={styles.progressBadge}>
          <span className={styles.progressLabel}>进度</span>
          <strong>
            {currentIndex}/{total}
          </strong>
        </div>
      </header>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.partOfSpeech}>{activeWord.partOfSpeech}</span>
          <span className={styles.packTag}>{activeWord.packId}</span>
        </div>

        <div className={styles.wordBlock}>
          <h2 className={styles.word}>{activeWord.word}</h2>
          <p className={styles.meaning}>
            {isMeaningVisible ? activeWord.meaning : "先回忆中文释义，再决定是否显示提示。"}
          </p>
        </div>

        <div className={styles.exampleBlock}>
          <span className={styles.exampleLabel}>Example</span>
          <p className={styles.example}>{activeWord.example}</p>
        </div>

        {!isMeaningVisible ? (
          <button type="button" className={styles.revealButton} onClick={onRevealMeaning}>
            显示释义提示
          </button>
        ) : null}
      </article>

      <section className={styles.actions} aria-label="词卡标记操作">
        <button type="button" className={styles.primaryButton} onClick={onMarkKnown}>
          认识
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onMarkUncertain}>
          模糊
        </button>
        <button type="button" className={styles.ghostButton} onClick={onGoHome}>
          返回首页
        </button>
      </section>
    </section>
  );
}
