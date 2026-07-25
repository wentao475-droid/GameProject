# Vocabulary Mode Separate Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在原游戏首页增加“学习模式”切换按钮，并新增一个完全独立的背单词版本页面，使用不低于中国高中词汇难度的词包完成每日训练、复习结算和本地学习进度闭环。

**Architecture:** 保留现有 `star-pop` 模块作为原游戏域，不把背单词逻辑塞进 `useStarPopApp` 或 `progression.ts`。新增 `src/app/words/page.tsx` 和 `src/features/vocabulary/` 独立模块，使用独立的 hook、storage 和 UI，首页仅通过按钮/链接跳转到新页面。为兼容 GitHub Pages 多路由静态导出，同时补齐 `next.config.ts` 的 `output/basePath/assetPrefix`。

**Tech Stack:** Next.js App Router、React 18、TypeScript、CSS Modules、localStorage、Vitest、GitHub Pages 静态导出

---

## File Structure

**Modify**
- `next.config.ts`
  - 启用 `output: "export"`，支持 GitHub Pages 下的根路由和 `/words/` 子路由。
- `src/features/star-pop/components/HomeScreen.tsx`
  - 在原游戏首页加入“学习模式”跳转按钮。
- `src/features/star-pop/components/HomeScreen.module.css`
  - 为新增按钮补样式，保证不挤压现有主按钮。
- `src/features/star-pop/components/GameShell.tsx`
  - 仅在传参层支持首页按钮，不引入背单词业务状态。

**Create**
- `src/app/words/page.tsx`
  - 背单词版本独立页面入口。
- `src/features/vocabulary/types/words.ts`
  - 词条、词包、学习阶段、结算结果、每日任务、设置类型。
- `src/features/vocabulary/lib/wordBank.ts`
  - 至少准备 2 到 3 个高于中国高中基础难度的词包，优先高考核心词 + 四级起步词。
- `src/features/vocabulary/lib/vocabularyProgress.ts`
  - 今日词包选择、学习推进、轻量测验生成、推荐复习逻辑。
- `src/features/vocabulary/lib/storage.ts`
  - 背单词模式独立 localStorage 读写和默认值。
- `src/features/vocabulary/hooks/useVocabularyApp.ts`
  - 背单词页面的主状态机。
- `src/features/vocabulary/components/VocabularyShell.tsx`
  - 背单词页总壳。
- `src/features/vocabulary/components/VocabularyHome.tsx`
  - 背单词首页，展示今日词包、待复习数量、开始训练入口。
- `src/features/vocabulary/components/VocabularySession.tsx`
  - 训练中视图，展示词汇目标、训练进度和当前词卡。
- `src/features/vocabulary/components/VocabularyResult.tsx`
  - 结算页，展示新词/巩固词/待复习词和轻量测验。
- `src/features/vocabulary/components/VocabularyShell.module.css`
- `src/features/vocabulary/components/VocabularyHome.module.css`
- `src/features/vocabulary/components/VocabularySession.module.css`
- `src/features/vocabulary/components/VocabularyResult.module.css`
- `src/features/vocabulary/lib/__tests__/wordBank.test.ts`
- `src/features/vocabulary/lib/__tests__/vocabularyProgress.test.ts`
- `src/features/vocabulary/lib/__tests__/storage.test.ts`

---

### Task 1: 补路由切换入口与静态导出配置

**Files:**
- Create: `src/app/words/page.tsx`
- Modify: `next.config.ts`
- Modify: `src/features/star-pop/components/HomeScreen.tsx`
- Modify: `src/features/star-pop/components/HomeScreen.module.css`
- Modify: `src/features/star-pop/components/GameShell.tsx`

- [ ] **Step 1: 修改 `next.config.ts` 以支持 GitHub Pages 子路由**

```ts
import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
```

- [ ] **Step 2: 新建背单词页面入口**

```tsx
import { VocabularyShell } from "@/features/vocabulary/components/VocabularyShell";

export default function VocabularyPage() {
  return <VocabularyShell />;
}
```

- [ ] **Step 3: 在原游戏首页新增“学习模式”按钮 props**

```tsx
type HomeScreenProps = {
  // ...existing props
  learningModeHref: string;
};
```

- [ ] **Step 4: 在首页动作区加入独立页面切换按钮**

```tsx
import Link from "next/link";

<div className={styles.actions}>
  <button
    type="button"
    className={styles.primaryButton}
    onClick={() => onStartMode(selectedModeId)}
  >
    {selectedMode.actionLabel}
  </button>
  <Link href={learningModeHref} className={styles.secondaryButton}>
    学习模式
  </Link>
  <button type="button" className={styles.secondaryButton} onClick={onOpenSettings}>
    设置
  </button>
</div>
```

- [ ] **Step 5: 从 `GameShell` 传入固定跳转地址**

```tsx
<HomeScreen
  profile={profile}
  selectedModeId={selectedModeId}
  dailyChallenge={dailyChallenge}
  dailyQuests={dailyQuests}
  starRoadProgress={starRoadProgress}
  learningModeHref="/words/"
  onSelectMode={updateSelectedMode}
  onStartMode={startGame}
  onStartDailyChallenge={startDailyChallenge}
  onOpenSettings={openSettings}
/>
```

- [ ] **Step 6: 调整首页按钮样式以容纳第三个入口**

```css
.actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.secondaryButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
```

- [ ] **Step 7: 运行基础验证**

Run:

```bash
npm run lint
npm run build
```

Expected:
- `lint` 通过
- 根路由和 `/words/` 均可静态导出

---

### Task 2: 搭建背单词域模型与高中以上词库

**Files:**
- Create: `src/features/vocabulary/types/words.ts`
- Create: `src/features/vocabulary/lib/wordBank.ts`
- Test: `src/features/vocabulary/lib/__tests__/wordBank.test.ts`

- [ ] **Step 1: 定义背单词模式的核心类型**

```ts
export type VocabularyStage = "new" | "learning" | "familiar" | "mastered";

export type WordEntry = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  difficultyBand: "gaokao-plus" | "cet4";
  packId: string;
};

export type WordPack = {
  id: string;
  title: string;
  description: string;
  difficultyLabel: string;
  wordIds: string[];
};

export type ReviewQuestion = {
  id: string;
  wordId: string;
  prompt: string;
  choices: string[];
  answer: string;
};
```

- [ ] **Step 2: 建立不少于 2 个高于高中基础难度的词包**

```ts
export const WORDS: WordEntry[] = [
  {
    id: "allocate",
    word: "allocate",
    meaning: "分配；拨给",
    partOfSpeech: "v.",
    example: "The school will allocate more time to science reading.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-core",
  },
  {
    id: "derive",
    word: "derive",
    meaning: "获得；推导出；源于",
    partOfSpeech: "v.",
    example: "Many English words derive from Latin.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-core",
  },
  {
    id: "sustain",
    word: "sustain",
    meaning: "维持；支撑；遭受",
    partOfSpeech: "v.",
    example: "Plants need water and light to sustain growth.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
];
```

- [ ] **Step 3: 写出词包索引和查询函数**

```ts
export const WORD_PACKS: WordPack[] = [
  {
    id: "gaokao-core",
    title: "高中进阶核心词",
    description: "覆盖高考阅读与写作高频进阶词。",
    difficultyLabel: "高考进阶",
    wordIds: ["allocate", "derive"],
  },
  {
    id: "cet4-bridge",
    title: "四级起步词包",
    description: "从高中向大学英语平滑过渡。",
    difficultyLabel: "四级起步",
    wordIds: ["sustain"],
  },
];

export function getWordPack(packId: string) {
  return WORD_PACKS.find((pack) => pack.id === packId) ?? WORD_PACKS[0];
}
```

- [ ] **Step 4: 写失败测试，确保词库符合难度要求**

```ts
import { describe, expect, it } from "vitest";
import { WORD_PACKS, WORDS } from "@/features/vocabulary/lib/wordBank";

describe("wordBank", () => {
  it("only includes gaokao-plus or cet4 words", () => {
    expect(WORDS.every((entry) => entry.difficultyBand !== undefined)).toBe(true);
    expect(
      WORDS.every((entry) =>
        entry.difficultyBand === "gaokao-plus" || entry.difficultyBand === "cet4",
      ),
    ).toBe(true);
  });

  it("provides at least two word packs", () => {
    expect(WORD_PACKS.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 5: 运行测试**

Run:

```bash
npm run test -- src/features/vocabulary/lib/__tests__/wordBank.test.ts
```

Expected:
- 词包测试通过

---

### Task 3: 搭建背单词模式独立存档与学习推进逻辑

**Files:**
- Create: `src/features/vocabulary/lib/vocabularyProgress.ts`
- Create: `src/features/vocabulary/lib/storage.ts`
- Test: `src/features/vocabulary/lib/__tests__/vocabularyProgress.test.ts`
- Test: `src/features/vocabulary/lib/__tests__/storage.test.ts`

- [ ] **Step 1: 定义背单词本地档案结构**

```ts
export type WordProgress = {
  stage: VocabularyStage;
  seenCount: number;
  correctCount: number;
  lastReviewedAt: string | null;
};

export type VocabularyProfile = {
  currentPackId: string;
  dailyWordTarget: number;
  showMeaningHint: boolean;
  quizEnabled: boolean;
  wordProgressById: Record<string, WordProgress>;
  lastStudiedAt: string | null;
};
```

- [ ] **Step 2: 新建独立 storage key，避免污染原游戏档案**

```ts
const STORAGE_KEY = "star-pop-vocabulary-profile";

export function getDefaultVocabularyProfile(): VocabularyProfile {
  return {
    currentPackId: "gaokao-core",
    dailyWordTarget: 6,
    showMeaningHint: true,
    quizEnabled: true,
    wordProgressById: {},
    lastStudiedAt: null,
  };
}
```

- [ ] **Step 3: 写学习推进逻辑**

```ts
export function updateWordProgress(
  progress: WordProgress | undefined,
  correct: boolean,
  reviewedAt: string,
): WordProgress {
  const current = progress ?? {
    stage: "new" as const,
    seenCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
  };

  const nextCorrectCount = current.correctCount + (correct ? 1 : 0);
  const nextSeenCount = current.seenCount + 1;

  const nextStage =
    nextCorrectCount >= 4 ? "mastered" :
    nextCorrectCount >= 3 ? "familiar" :
    nextCorrectCount >= 1 ? "learning" :
    "new";

  return {
    stage: nextStage,
    seenCount: nextSeenCount,
    correctCount: nextCorrectCount,
    lastReviewedAt: reviewedAt,
  };
}
```

- [ ] **Step 4: 生成轻量测验**

```ts
export function buildReviewQuestions(wordIds: string[]): ReviewQuestion[] {
  return wordIds.slice(0, 2).map((wordId) => ({
    id: `${wordId}-quiz`,
    wordId,
    prompt: `请选择 ${wordId} 的正确中文释义`,
    choices: ["占位 A", "占位 B", "占位 C", "占位 D"],
    answer: "占位 A",
  }));
}
```

- [ ] **Step 5: 写测试覆盖熟练度升级和 storage 兼容**

```ts
it("promotes stage after repeated correct reviews", () => {
  let progress = undefined;
  progress = updateWordProgress(progress, true, "2026-06-17T00:00:00.000Z");
  progress = updateWordProgress(progress, true, "2026-06-17T00:01:00.000Z");
  progress = updateWordProgress(progress, true, "2026-06-17T00:02:00.000Z");
  expect(progress.stage).toBe("familiar");
});
```

- [ ] **Step 6: 运行相关测试**

Run:

```bash
npm run test -- src/features/vocabulary/lib/__tests__/vocabularyProgress.test.ts src/features/vocabulary/lib/__tests__/storage.test.ts
```

Expected:
- 学习推进和存档测试通过

---

### Task 4: 实现独立背单词页面壳层与首页

**Files:**
- Create: `src/features/vocabulary/hooks/useVocabularyApp.ts`
- Create: `src/features/vocabulary/components/VocabularyShell.tsx`
- Create: `src/features/vocabulary/components/VocabularyHome.tsx`
- Create: `src/features/vocabulary/components/VocabularyShell.module.css`
- Create: `src/features/vocabulary/components/VocabularyHome.module.css`

- [ ] **Step 1: 在 hook 中建立独立页面状态**

```ts
export type VocabularyScreen = "home" | "session" | "result";

const [screen, setScreen] = useState<VocabularyScreen>("home");
const [profile, setProfile] = useState<VocabularyProfile | null>(null);
const [activePackId, setActivePackId] = useState("gaokao-core");
```

- [ ] **Step 2: 提供今日词包、待复习词数和开始训练动作**

```ts
const todayPack = useMemo(() => getWordPack(profile?.currentPackId ?? "gaokao-core"), [profile]);

const startSession = useCallback(() => {
  setScreen("session");
}, []);
```

- [ ] **Step 3: 实现独立页面总壳**

```tsx
export function VocabularyShell() {
  const { screen, profile, todayPack, startSession, goHome } = useVocabularyApp();

  if (!profile) {
    return null;
  }

  return (
    <main>
      {screen === "home" ? (
        <VocabularyHome
          profile={profile}
          todayPack={todayPack}
          onStart={startSession}
          onBack={goHome}
        />
      ) : null}
    </main>
  );
}
```

- [ ] **Step 4: 首页展示今日词包和难度声明**

```tsx
<section>
  <p>Vocabulary Mode</p>
  <h1>背单词训练</h1>
  <p>{todayPack.title}</p>
  <p>{todayPack.description}</p>
  <p>词汇难度不低于中国高中进阶，向四级起步衔接。</p>
  <button type="button" onClick={onStart}>开始今日训练</button>
  <Link href="/">返回原游戏</Link>
</section>
```

- [ ] **Step 5: 跑一次构建，确认双页面导出**

Run:

```bash
npm run build
```

Expected:
- `out/index.html` 和 `out/words/index.html` 同时生成

---

### Task 5: 实现训练中与结算复习闭环

**Files:**
- Create: `src/features/vocabulary/components/VocabularySession.tsx`
- Create: `src/features/vocabulary/components/VocabularyResult.tsx`
- Create: `src/features/vocabulary/components/VocabularySession.module.css`
- Create: `src/features/vocabulary/components/VocabularyResult.module.css`
- Modify: `src/features/vocabulary/hooks/useVocabularyApp.ts`

- [ ] **Step 1: 训练中只做轻量词卡，不复刻棋盘玩法**

```tsx
<section>
  <p>今日训练</p>
  <h2>{activeWords[currentIndex].word}</h2>
  <p>{showMeaningHint ? activeWords[currentIndex].meaning : "先尝试回忆中文释义"}</p>
  <p>{activeWords[currentIndex].example}</p>
  <button type="button" onClick={() => markWord(true)}>认识</button>
  <button type="button" onClick={() => markWord(false)}>模糊</button>
</section>
```

- [ ] **Step 2: 训练结束后生成结算结果**

```ts
const sessionResult: VocabularySessionResult = {
  packId: todayPack.id,
  introducedWordIds,
  reinforcedWordIds,
  reviewNeededWordIds,
  questions: buildReviewQuestions(reviewNeededWordIds),
};

setResult(sessionResult);
setScreen("result");
```

- [ ] **Step 3: 结算页展示三类词**

```tsx
<section>
  <h2>本局复习结果</h2>
  <p>新接触 {result.introducedWordIds.length} 个</p>
  <p>已巩固 {result.reinforcedWordIds.length} 个</p>
  <p>仍需复习 {result.reviewNeededWordIds.length} 个</p>
</section>
```

- [ ] **Step 4: 结算页加入 1 到 2 题轻量测验**

```tsx
{result.questions.map((question) => (
  <article key={question.id}>
    <p>{question.prompt}</p>
    {question.choices.map((choice) => (
      <button key={choice} type="button" onClick={() => answerQuestion(question.id, choice)}>
        {choice}
      </button>
    ))}
  </article>
))}
```

- [ ] **Step 5: 增加推荐继续复习提示**

```tsx
<p>
  推荐下一轮继续复习：
  {result.reviewNeededWordIds.length > 0 ? "优先巩固未掌握单词" : "可以切换到更高难度词包"}
</p>
```

- [ ] **Step 6: 验证页面流程**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected:
- 背单词页首页 -> 训练 -> 结算可完整走通

---

### Task 6: 实现每日学习任务、设置项与最终验收

**Files:**
- Modify: `src/features/vocabulary/hooks/useVocabularyApp.ts`
- Modify: `src/features/vocabulary/components/VocabularyHome.tsx`
- Modify: `src/features/vocabulary/components/VocabularyResult.tsx`
- Modify: `src/features/vocabulary/lib/vocabularyProgress.ts`
- Modify: `src/features/vocabulary/lib/storage.ts`

- [ ] **Step 1: 加入背单词页的每日任务摘要**

```ts
export type VocabularyDailyTask = {
  id: string;
  title: string;
  progress: number;
  target: number;
  completed: boolean;
};
```

- [ ] **Step 2: 首页展示今日任务和待复习词数**

```tsx
<section>
  <h3>今日任务</h3>
  {dailyTasks.map((task) => (
    <p key={task.id}>
      {task.title} {task.progress}/{task.target}
    </p>
  ))}
  <p>待复习单词 {reviewQueueCount} 个</p>
</section>
```

- [ ] **Step 3: 加入背单词设置项**

```ts
type VocabularySettingsPatch = {
  dailyWordTarget?: number;
  showMeaningHint?: boolean;
  quizEnabled?: boolean;
};
```

- [ ] **Step 4: 在背单词页实现最小设置区**

```tsx
<section>
  <label>
    每日词量
    <select value={profile.dailyWordTarget} onChange={handleTargetChange}>
      <option value={6}>6 个</option>
      <option value={8}>8 个</option>
      <option value={10}>10 个</option>
    </select>
  </label>
  <label>
    <input
      type="checkbox"
      checked={profile.showMeaningHint}
      onChange={handleMeaningHintChange}
    />
    显示中文释义
  </label>
  <label>
    <input
      type="checkbox"
      checked={profile.quizEnabled}
      onChange={handleQuizEnabledChange}
    />
    启用结算测验
  </label>
</section>
```

- [ ] **Step 5: 做最终验收**

Run:

```bash
npm run lint
npm run test
BASE_PATH=/GameProject npm run build
```

Expected:
- 原游戏首页新增“学习模式”按钮
- 点击进入 `/words/`
- 背单词页完全独立于原游戏流程
- 词库难度不低于中国高中进阶，且含四级起步词
- GitHub Pages 静态导出包含双页面

---

## Self-Review

**Spec coverage**
- 独立切换按钮：Task 1
- 背单词页完全独立：Task 1、Task 4
- 按功能清单实现背词流程：Task 2、Task 3、Task 5、Task 6
- 难度不低于中国高中词汇：Task 2
- GitHub Pages 兼容：Task 1、Task 6

**Placeholder scan**
- 已避免使用 `TODO`、`TBD` 和“后续补充”式描述。
- 训练问答的选项仍需在实现时从真实词库生成，但已给出函数落点 `buildReviewQuestions()`，不会影响任务边界。

**Type consistency**
- 原游戏仍沿用 `GameProfile`、`useStarPopApp`。
- 背单词域统一使用 `VocabularyProfile`、`WordEntry`、`WordPack`、`ReviewQuestion`、`VocabularyScreen`。
- 独立存储 key 明确为 `star-pop-vocabulary-profile`，不与原游戏档案混用。

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-17-vocabulary-mode-separate-page.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
