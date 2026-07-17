# Star Pop Game Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为星块爆破加入三种主模式、残局奖励、三星结算和每日挑战，提升可玩性与重复游玩价值。

**Architecture:** 在现有 `useStarPopGame` 与 `useStarPopApp` 上增加模式配置层，把局内规则、结算统计和首页模式入口拆开。每日挑战走纯前端确定性生成方案，避免新增后端依赖。

**Tech Stack:** Next.js App Router、React、TypeScript、CSS Modules、Vitest、localStorage

---

### Task 1: 模式与结算类型

**Files:**
- Modify: `src/features/star-pop/types/profile.ts`
- Create: `src/features/star-pop/types/modes.ts`
- Create: `src/features/star-pop/lib/gameModes.ts`

- [ ] 定义 `classic | moves | clear` 三种模式及首页展示所需文案
- [ ] 扩展 `GameResult`、`GameProfile`，加入模式、星级、残局奖励、每日挑战记录
- [ ] 提供模式配置和星级/奖励计算函数，供局内与结算共用

### Task 2: 局内规则接入

**Files:**
- Modify: `src/features/star-pop/hooks/useStarPopGame.ts`
- Modify: `src/features/star-pop/hooks/useStarPopApp.ts`

- [ ] 为 `useStarPopGame` 增加模式配置输入，支持剩余步数、清盘目标与残局奖励统计
- [ ] 为 `useStarPopApp` 增加当前模式状态与开始新局参数
- [ ] 在游戏结束时生成带模式信息、星级与奖励拆分的结果对象

### Task 3: 首页与每日挑战

**Files:**
- Modify: `src/features/star-pop/components/HomeScreen.tsx`
- Modify: `src/features/star-pop/components/HomeScreen.module.css`
- Create: `src/features/star-pop/lib/dailyChallenge.ts`

- [ ] 在首页加入模式卡片，支持开始经典、限步、清盘三种模式
- [ ] 生成每日挑战卡，展示当天模式与目标
- [ ] 允许用户从首页直接进入每日挑战

### Task 4: 结算与 HUD

**Files:**
- Modify: `src/features/star-pop/components/ResultScreen.tsx`
- Modify: `src/features/star-pop/components/ResultScreen.module.css`
- Modify: `src/features/star-pop/components/ScoreBoard.tsx`
- Modify: `src/features/star-pop/components/GameShell.tsx`
- Modify: `src/features/star-pop/components/GameShell.module.css`

- [ ] 在 HUD 展示当前模式核心目标，如剩余步数或清盘目标
- [ ] 在结算页展示残局奖励、星级与模式完成情况
- [ ] 为每日挑战结算增加专属标识

### Task 5: 存档与测试

**Files:**
- Modify: `src/features/star-pop/lib/storage.ts`
- Modify: `src/features/star-pop/lib/__tests__/storage.test.ts`
- Modify: `src/features/star-pop/lib/__tests__/resolveTurn.test.ts`
- Create: `src/features/star-pop/lib/__tests__/gameModes.test.ts`
- Create: `src/features/star-pop/lib/__tests__/dailyChallenge.test.ts`

- [ ] 兼容旧存档并补默认值
- [ ] 为模式奖励、每日挑战生成和新存档结构补测试
- [ ] 运行 `npm run lint`、`npm run test`、`npm run build`
