# 星块爆破 MVP 实现计划

## Summary

- 目标：从空仓库搭建一个可直接运行的 `Next.js + React + TypeScript` 网页小游戏 MVP，复刻“点击相邻同色方块消除”的核心玩法，但不复用任何现有商业产品的名称、素材、文案或视觉资产。
- 实现范围：单页游戏体验，包含 `10 x 10` 棋盘、`5` 种颜色、点击检测、连通块查找、合法消除、计分、下落、空列左移、无可消除时结束、重开、当前分数与剩余方块统计、基础动画、移动端适配。
- 技术方案：使用 HTML 结构渲染棋盘，以 `CSS Grid` 布局，不使用 `Canvas`、`PixiJS`、后端、数据库或登录系统。
- 设计原则：核心算法与 UI 解耦，状态流清晰，后续易扩展为关卡、道具、排行榜等模块。

## Current State Analysis

- 仓库现状：`/Users/vea/GameProject` 当前为空目录，未发现现成的 `Next.js` 工程、页面文件、样式文件、配置文件或组件目录。
- 已确认决策：
  - 技术栈保持 `Next.js + React + TypeScript`。
  - 棋盘使用 HTML 节点配合 `CSS Grid` 渲染。
  - 计分公式采用 `n * n * 5`。
  - 初始棋盘必须保证至少存在一组可消除组合，否则重新生成。
- 约束边界：
  - 只做前端本地运行 MVP。
  - 不实现登录、排行榜、分享、广告、充值、道具、关卡地图、服务端存档、多语言、PWA、微信小游戏版本。
  - 不使用任何与现有商业产品可混淆的名称、Logo、音效、素材、文案。

## Assumptions & Decisions

- 项目命名：代码内与界面统一使用 `Star Pop MVP / 星块爆破`，避免使用受保护的现成名称。
- 路由结构：MVP 采用单页面入口，主页面放在 `src/app/page.tsx`。
- 样式方案：采用 `CSS Modules` 组织页面和组件样式，公共基础样式放在 `src/app/globals.css`。
- 棋盘数据结构：使用二维数组表达网格，元素类型为 `Block | null`，其中 `null` 表示当前格位为空，便于实现消除、下落和压缩列逻辑。
- 方块模型：每个方块至少包含 `id`、`row`、`col`、`color`、`state` 字段；`state` 用于驱动高亮、消失、下落等动画状态。
- 颜色集合：使用五种自定义颜色 token，不直接使用 `red/blue/...` 作为视觉层最终色值，以便后续换肤。
- 动画策略：优先使用 CSS transition / keyframes；逻辑层通过状态切换触发动画，不引入额外动画库。
- 移动端策略：以单列居中布局为主，桌面端展示更完整的信息面板；触控交互与鼠标点击统一复用同一事件逻辑。
- 视觉方向：默认采用“轻松糖果感”的原创休闲视觉语言，强调明快配色、柔和圆角、清晰反馈，但不模仿任何已知产品的具体视觉表达。

## Proposed Changes

### 1. 初始化项目骨架

- 创建 `package.json`
  - 作用：声明 `next`、`react`、`react-dom`、`typescript`、`eslint` 相关依赖与脚本。
  - 原因：当前仓库为空，必须先建立可运行工程。
  - 做法：提供 `dev`、`build`、`start`、`lint` 脚本。

- 创建 `tsconfig.json`
  - 作用：定义 TypeScript 编译选项与路径解析。
  - 原因：保证类型系统可用，并为后续模块拆分提供基础。
  - 做法：采用 Next.js 推荐配置，启用严格模式。

- 创建 `next.config.ts`
  - 作用：保留 Next.js 配置入口。
  - 原因：后续若增加静态导出、资源策略或实验特性，有明确落点。
  - 做法：保持最小配置，避免过早复杂化。

- 创建 `next-env.d.ts`
  - 作用：为 Next.js TypeScript 类型提供环境声明。
  - 原因：这是标准 TS + Next.js 工程必需文件。

- 创建 `.gitignore`
  - 作用：忽略 `.next`、`node_modules`、日志与系统文件。
  - 原因：避免构建产物进入版本管理。

- 创建 `src/app/layout.tsx`
  - 作用：定义根布局和页面元信息。
  - 原因：App Router 运行所需。
  - 做法：设置标题、描述、视口与基础语义结构。

- 创建 `src/app/page.tsx`
  - 作用：作为游戏主页装配顶层 UI。
  - 原因：MVP 以单页面为主，无额外路由需求。
  - 做法：渲染标题、说明、游戏容器与结束面板入口。

- 创建 `src/app/globals.css`
  - 作用：定义全局重置、主题变量和页面背景。
  - 原因：保证全站基础视觉统一。

### 2. 建立游戏领域模型与配置

- 创建 `src/features/star-pop/config/gameConfig.ts`
  - 作用：集中存放棋盘尺寸、颜色池、最小消除数、分数倍率、动画时长等常量。
  - 原因：后续扩展关卡、主题、道具时可直接复用。
  - 做法：暴露 `GAME_CONFIG` 与必要的派生常量。

- 创建 `src/features/star-pop/types/game.ts`
  - 作用：定义 `BlockColor`、`BlockState`、`Block`、`Board`、`GameStatus`、`GameSnapshot` 等类型。
  - 原因：让算法、状态管理、UI 组件共享同一套领域模型。
  - 做法：尽量让类型语义化，避免组件层自行拼接匿名对象。

- 创建 `src/features/star-pop/lib/blockFactory.ts`
  - 作用：生成带唯一 `id` 的方块数据。
  - 原因：UI key 和动画状态需要稳定标识。
  - 做法：封装单块生成逻辑，避免散落在不同算法函数里。

### 3. 实现核心算法模块

- 创建 `src/features/star-pop/lib/createBoard.ts`
  - 作用：生成随机棋盘，并保证至少存在一组合法消除块。
  - 原因：开局保底是已确认规则。
  - 做法：
    - 随机填充 `10 x 10` 棋盘。
    - 调用 `hasAvailableMove()` 检查。
    - 若无合法组合则重新生成，直到满足条件。

- 创建 `src/features/star-pop/lib/findConnectedGroup.ts`
  - 作用：从点击坐标出发，使用 BFS 或 DFS 查找上下左右连通的同色块。
  - 原因：这是点击合法性与预览高亮的核心。
  - 做法：
    - 只遍历四方向。
    - 返回坐标列表或方块列表。
    - 忽略 `null` 和越界位置。

- 创建 `src/features/star-pop/lib/calculateScore.ts`
  - 作用：根据被消除组大小计算得分。
  - 原因：将 `n * n * 5` 规则独立出来，便于未来替换。
  - 做法：函数签名保持简单，例如 `calculateScore(groupSize: number): number`。

- 创建 `src/features/star-pop/lib/removeGroup.ts`
  - 作用：根据待消除坐标将对应格位置空。
  - 原因：将“删除”与“重力/压列”拆开，职责更清晰。

- 创建 `src/features/star-pop/lib/applyGravity.ts`
  - 作用：让每一列非空方块向下坠落。
  - 原因：消除后必须先进行列内压缩。
  - 做法：逐列收集非空块，自底向上回填。

- 创建 `src/features/star-pop/lib/shiftColumnsLeft.ts`
  - 作用：将完全为空的列移除，并让右侧非空列整体左移。
  - 原因：这是该玩法的重要规则差异点。
  - 做法：按列判断是否全空，保留非空列后统一重建棋盘。

- 创建 `src/features/star-pop/lib/hasAvailableMove.ts`
  - 作用：扫描棋盘是否存在任意一组大小不少于 `2` 的连通块。
  - 原因：用于生成保底、每步结束后的游戏结束判断。
  - 做法：
    - 遍历所有未访问格子。
    - 调用连通块查找。
    - 只要发现任一合法组即提前返回。

- 创建 `src/features/star-pop/lib/getRemainingBlockCount.ts`
  - 作用：统计当前剩余方块总数。
  - 原因：用于 HUD 展示。

- 创建 `src/features/star-pop/lib/resolveTurn.ts`
  - 作用：封装一次点击后的完整状态演算。
  - 原因：将组件交互逻辑从算法细节中剥离。
  - 做法：
    - 输入当前棋盘与点击位置。
    - 查找连通块。
    - 若数量小于 `2`，返回“无效点击”结果。
    - 若合法，依次执行消除、计分、下落、列左移、剩余统计、可用步检测。
    - 输出下一帧棋盘、分数增量、被消除数量、游戏状态。

### 4. 建立游戏状态管理

- 创建 `src/features/star-pop/hooks/useStarPopGame.ts`
  - 作用：集中管理游戏状态与事件处理。
  - 原因：避免在页面组件里堆积状态与副作用。
  - 做法：
    - 维护 `board`、`score`、`remainingBlocks`、`status`、`selectedGroup`、`lastMoveSize`、`isAnimating`。
    - 提供 `handleBlockClick()`、`handleBlockHover()`、`clearPreview()`、`restartGame()`。
    - 协调“预览高亮”和“点击消除”的关系。
    - 在合法消除后串联短暂动画阶段，再提交最终棋盘。

- 状态流决策
  - 鼠标移入或触控选中时，调用 `findConnectedGroup()` 生成预览组。
  - 点击时，如果当前组大小小于 `2`，仅触发轻微反馈状态，不改分数与棋盘。
  - 如果组大小至少为 `2`，先切换块状态为 `removing`，待动画完成后再提交应用重力和左移后的新棋盘。
  - 若动作完成后 `hasAvailableMove()` 为否，则切换为 `game-over` 并展示结束面板。

### 5. 搭建 UI 组件层

- 创建 `src/features/star-pop/components/GameShell.tsx`
  - 作用：组合标题区、统计区、棋盘区、操作区和结束面板。
  - 原因：形成游戏页面主容器，便于后续拆主页与嵌入式玩法模块。

- 创建 `src/features/star-pop/components/ScoreBoard.tsx`
  - 作用：展示当前分数、剩余方块、最近一次消除数量或提示信息。
  - 原因：状态信息需要独立组件承载，减少主页面复杂度。

- 创建 `src/features/star-pop/components/GameBoard.tsx`
  - 作用：以 `CSS Grid` 渲染 `10 x 10` 棋盘容器。
  - 原因：棋盘是交互核心，需要清晰独立的布局层。
  - 做法：
    - 接收二维棋盘数据。
    - 为空位保留布局占位，确保网格稳定。
    - 负责绑定 hover / click 事件到单个格子。

- 创建 `src/features/star-pop/components/BlockCell.tsx`
  - 作用：渲染单个方块或空格位。
  - 原因：将颜色、选中、高亮、消失、无效点击反馈等视觉状态封装在单点。
  - 做法：
    - 根据 `color` 与 `state` 组合 className。
    - 支持键盘可聚焦与语义化按钮交互，提升基础可访问性。

- 创建 `src/features/star-pop/components/GameOverModal.tsx`
  - 作用：在无可用步时展示结束信息和重开入口。
  - 原因：MVP 必须具备明确的完成状态反馈。
  - 做法：
    - 展示总分、剩余方块数、重新开始按钮。
    - 移动端使用底部抽屉式或居中卡片式轻量弹层。

- 创建 `src/features/star-pop/components/RestartButton.tsx`
  - 作用：封装重开操作按钮。
  - 原因：便于后续替换为更复杂的确认流程或埋点逻辑。

### 6. 实现样式与动画

- 创建 `src/features/star-pop/components/GameShell.module.css`
  - 作用：定义页面布局、响应式断点、背景层次、信息面板样式。
  - 原因：确保桌面与移动端都能保持清晰结构。

- 创建 `src/features/star-pop/components/GameBoard.module.css`
  - 作用：定义棋盘网格、格子尺寸、间距与容器缩放规则。
  - 原因：棋盘在不同屏宽下需要稳定成比例显示。

- 创建 `src/features/star-pop/components/BlockCell.module.css`
  - 作用：定义每种颜色的视觉样式、hover 高亮、点击反馈、消失与下落动画。
  - 原因：动画和方块样式集中管理更容易调优。
  - 做法：
    - 合法预览组：增强描边、亮度或轻微抬升。
    - 非法点击：短暂抖动或压缩反馈。
    - 消除：缩放淡出。
    - 下落：通过位置变更配合 transition 呈现。

- 创建 `src/features/star-pop/components/GameOverModal.module.css`
  - 作用：定义结束面板遮罩、弹层和按钮视觉。
  - 原因：结束状态需要有独立层级和操作焦点。

- 全局视觉约束
  - 使用原创配色、字体和图形语言，不参考现有产品 UI。
  - 保持高对比度、触控尺寸和清晰焦点态，满足基本 Web 界面规范。

### 7. 补充测试与质量保障

- 创建 `src/features/star-pop/lib/__tests__/findConnectedGroup.test.ts`
  - 作用：验证四向连通查找的正确性。
  - 覆盖点：
    - 单块不连通。
    - 边界位置连通。
    - 不跨颜色、不跨空位。

- 创建 `src/features/star-pop/lib/__tests__/resolveTurn.test.ts`
  - 作用：验证一次合法消除后的完整状态演算。
  - 覆盖点：
    - 数量不足 `2` 时不消除。
    - 合法消除后分数符合 `n * n * 5`。
    - 下落与左移结果正确。
    - 无可用步时进入结束状态。

- 创建 `src/features/star-pop/lib/__tests__/createBoard.test.ts`
  - 作用：验证初始棋盘尺寸、颜色合法性与保底可消除性。

- 质量检查
  - 运行 `npm run lint`。
  - 运行测试命令，确认核心算法无回归。
  - 手动验证桌面与移动端关键路径。

## Implementation Steps

### 阶段 1：项目初始化

1. 初始化 `Next.js + React + TypeScript` 基础工程。
2. 建立 `src/app` 目录和应用入口文件。
3. 配置基础脚本、严格类型与全局样式变量。

### 阶段 2：领域模型与算法

1. 落地 `GAME_CONFIG`、基础类型与方块工厂。
2. 先实现并测试 `findConnectedGroup()`、`calculateScore()`、`applyGravity()`、`shiftColumnsLeft()`。
3. 再实现 `createBoard()`、`hasAvailableMove()`、`resolveTurn()`。

### 阶段 3：状态管理与界面

1. 实现 `useStarPopGame()`，串联初始化、预览、点击、消除、结束判断。
2. 组装 `GameShell`、`ScoreBoard`、`GameBoard`、`BlockCell`、`GameOverModal`。
3. 在 `src/app/page.tsx` 挂载游戏页面。

### 阶段 4：样式、动画与适配

1. 完成原创休闲风视觉与响应式布局。
2. 加入 hover、高亮、无效点击、消除、下落等基础动画。
3. 检查桌面端与移动端触控尺寸、留白和信息层级。

### 阶段 5：验证与收尾

1. 补齐核心算法测试。
2. 执行 lint 与测试。
3. 手动验证开局保底、计分、结束弹窗、重开与移动端体验。

## Verification Steps

- 工程可运行
  - 安装依赖后执行 `npm run dev`，主页正常渲染。

- 核心规则验证
  - 棋盘固定为 `10 x 10`。
  - 初始颜色仅来自五种配置色。
  - 初始棋盘至少存在一组大小不小于 `2` 的可消除块。
  - 点击孤立块不消除、不加分，仅出现轻反馈。
  - 点击合法连通块后正确消除，分数按 `n * n * 5` 增长。
  - 消除后方块先下落，再将空列整体左移。
  - 棋盘无可用步时展示结束弹层。
  - 点击“重新开始”后重新生成新棋盘并重置状态。

- 展示与交互验证
  - 页面展示当前分数与剩余方块数量。
  - 可预览本次点击可消除数量或高亮范围。
  - 桌面端与移动端都能完整操作且无遮挡、无溢出。
  - 按钮与可点击格子具备基本可访问性焦点态。

- 质量验证
  - `npm run lint` 通过。
  - 算法测试通过。
  - 最近编辑文件无明显 TypeScript 或样式诊断错误。

## Out of Scope

- 登录、注册、用户系统。
- 排行榜、分享、广告、充值。
- 道具、关卡地图、任务系统。
- 服务端存档与任何后端接口。
- 微信小游戏适配、多语言、PWA。
- 复杂音效系统与商业化资源管理。
