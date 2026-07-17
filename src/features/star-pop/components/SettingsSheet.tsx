import { useEffect, useState } from "react";
import styles from "@/features/star-pop/components/SettingsSheet.module.css";
import type { GameSettings } from "@/features/star-pop/types/profile";
import { GAME_THEMES } from "@/features/star-pop/lib/progression";
import { getThemeVariables } from "@/features/star-pop/lib/theme";
import type { GameThemeId } from "@/features/star-pop/types/progression";

type SettingsSheetProps = {
  isOpen: boolean;
  settings: GameSettings;
  currentThemeId: GameThemeId;
  unlockedThemeIds: GameThemeId[];
  totalStars: number;
  onClose: () => void;
  onChange: (patch: Partial<GameSettings>) => void;
  onThemeChange: (themeId: GameThemeId) => void;
  onReset: () => void;
};

type SettingRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
};

function SettingRow({
  label,
  description,
  checked,
  onToggle,
}: SettingRowProps) {
  return (
    <button type="button" className={styles.settingRow} onClick={onToggle}>
      <span className={styles.settingText}>
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <span className={`${styles.switch} ${checked ? styles.switchOn : ""}`} aria-hidden="true">
        <span className={styles.switchThumb} />
      </span>
    </button>
  );
}

function getThemeStatus(themeId: GameThemeId, totalStars: number, isUnlocked: boolean) {
  const definition = GAME_THEMES.find((theme) => theme.id === themeId);

  if (!definition || definition.unlockStars === 0) {
    return "默认主题";
  }

  if (isUnlocked) {
    return `已解锁 · 星路 ${definition.unlockStars} 星`;
  }

  const remaining = Math.max(definition.unlockStars - totalStars, 0);
  return `累计 ${definition.unlockStars} 星解锁 · 还差 ${remaining} 星`;
}

export function SettingsSheet({
  isOpen,
  settings,
  currentThemeId,
  unlockedThemeIds,
  totalStars,
  onClose,
  onChange,
  onThemeChange,
  onReset,
}: SettingsSheetProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    const timer = window.setTimeout(() => setShouldRender(false), 260);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

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
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Game Settings</p>
            <h2 id="settings-title" className={styles.title}>
              设置
            </h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            关闭
          </button>
        </div>

        <div className={styles.rows}>
          <section className={styles.themeSection} aria-label="主题外观">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Theme</p>
                <h3 className={styles.sectionTitle}>主题外观</h3>
              </div>
              <span className={styles.sectionMeta}>星路累计 {totalStars} 星</span>
            </div>
            <div className={styles.themeList}>
              {GAME_THEMES.map((theme) => {
                const isUnlocked = unlockedThemeIds.includes(theme.id);
                const isCurrent = currentThemeId === theme.id;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`${styles.themeCard} ${isCurrent ? styles.themeCardCurrent : ""} ${
                      !isUnlocked ? styles.themeCardLocked : ""
                    }`}
                    style={getThemeVariables(theme.id)}
                    onClick={() => onThemeChange(theme.id)}
                    disabled={!isUnlocked}
                    aria-pressed={isCurrent}
                  >
                    <div className={styles.themePreview} aria-hidden="true">
                      <span className={styles.themePreviewCore} />
                      <span className={`${styles.themePreviewChip} ${styles.themePreviewChipA}`} />
                      <span className={`${styles.themePreviewChip} ${styles.themePreviewChipB}`} />
                      <span className={`${styles.themePreviewChip} ${styles.themePreviewChipC}`} />
                    </div>
                    <div className={styles.themeContent}>
                      <div className={styles.themeHeading}>
                        <strong>{theme.name}</strong>
                        <span className={styles.themeAction}>
                          {isCurrent ? "使用中" : isUnlocked ? "切换" : "未解锁"}
                        </span>
                      </div>
                      <span className={styles.themeDescription}>{theme.description}</span>
                      <span className={styles.themeUnlock}>
                        {getThemeStatus(theme.id, totalStars, isUnlocked)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          <SettingRow
            label="音效"
            description="控制开始、消除、残局清盘与结算提示音。"
            checked={settings.soundEnabled}
            onToggle={() => onChange({ soundEnabled: !settings.soundEnabled })}
          />
          <SettingRow
            label="震动"
            description="允许成功消除和无效点击触发短震动。"
            checked={settings.vibrationEnabled}
            onToggle={() => onChange({ vibrationEnabled: !settings.vibrationEnabled })}
          />
          <SettingRow
            label="动画"
            description="关闭后用更短的消除与清盘过渡。"
            checked={settings.animationEnabled}
            onToggle={() => onChange({ animationEnabled: !settings.animationEnabled })}
          />
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.dangerButton} onClick={onReset}>
            重置本地数据
          </button>
          <p className={styles.versionText}>Version 0.2 Web Product Build</p>
        </div>
      </section>
    </div>
  );
}
