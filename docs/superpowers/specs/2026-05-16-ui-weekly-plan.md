# Cairn UI 本周任务计划 / Weekly UI Plan

> 日期：2026-05-16  
> 周期：2026-05-18 ~ 2026-05-24  
> 范围：Desktop UI v0 / UI preview / Desktop Shell 设计落地  
> 状态：Draft for owner review

## 1. 当前判断

UI 现在不应该继续只做抽象组件，也不应该立刻把完整 Electron 桌面应用铺开。

本周最有价值的方向是：

1. 先把 `apps/ui-preview` 里的 Desktop Shell 原型做扎实。
2. 用 Desktop Shell 反压 Home / Run Detail / Artifact Review 的信息架构。
3. 明确哪些是 shell-level primitives，哪些仍属于页面原型。
4. 在可审阅、可截图、可验证之后，再决定是否启动 `apps/desktop` 工程骨架。

换句话说：本周目标不是“做完桌面端”，而是做出一版可以指导桌面端工程启动的 UI v0 骨架。

## 2. 本周目标

### Goal A — Desktop Shell v0 可审阅

做出一版明确的桌面壳：

- 左侧主导航
- 顶部 / 主工作区状态
- 中央 Home / Mission Control 区
- 右侧 Runtime / Workspace / 快捷动作侧栏
- 响应式降级规则
- 第一屏能回答：现在有哪些 run？哪里需要我接管？本地 runtime 是否健康？

### Goal B — Home / Inbox 与 Shell 关系收口

现在 Home / Inbox 已有页面，但它更像单页 preview。需要明确：

- Home / Inbox 放进 Desktop Shell 后，哪些信息留在 Home，哪些上移到 Shell。
- Handoff / Approval / Diagnostic 的优先级规则。
- Run card 在 Home 与 Run Detail 的导航语义。

### Goal C — 页面级信息架构冻结一版

冻结 Desktop UI v0 的四个核心页面：

1. Desktop Shell / Mission Control
2. Home / Inbox
3. Run Detail
4. Artifact Review

每页写清楚：

- 页面目的
- 第一屏关键判断
- 主要组件
- 空态 / loading / error / blocked 态
- 与 Workspace Core 的未来数据边界

### Goal D — 决定是否启动 `apps/desktop`

本周末做一个明确判断：

- 如果 Shell preview 已经稳定：下周启动 `apps/desktop` 最小 Electron 骨架。
- 如果 Shell 信息架构仍不稳：继续在 `apps/ui-preview` 收敛，不急着开工程。

## 3. 不做什么

本周刻意不做：

- 不接真实 backend / `workspace-core`。
- 不做复杂 workflow builder。
- 不做企业审批治理。
- 不做完整设置页。
- 不做完整 Electron 安装、更新、托盘、签名。
- 不把 preview 静态数据包装成假 API。

## 4. 任务拆分

### Day 1 — Desktop Shell preview 修整

目标：把当前 Desktop Shell 原型从“页面草图”修到“可审阅骨架”。

任务：

- [x] 修整 `DesktopShellPreviewPage` 的文件结构：如有必要拆成 `preview-sections/desktop-shell-sections.tsx`。
- [x] 抽出 `desktop-shell-view-model.ts` / `desktop-shell-data.ts`，避免页面硬编码大量 demo 数据。
- [x] 调整样式，保证不破坏既有 Home / Run / Artifact 页面。
- [x] 跑 `@cairn/ui-preview` typecheck / lint / build。

验收：

- Desktop Shell 出现在预览导航第一项。
- 页面代码仍只负责 state / layout wiring。
- 静态数据与 sections 分层清楚。

### Day 2 — Shell 信息架构细化

目标：把桌面壳从“三栏布局”推进到产品语义清楚的主工作台。

任务：

- [x] 明确左侧导航分组：Mission Control / Inbox / Runs / Artifacts / Source Roots / Settings。
- [x] 明确右侧栏职责：runtime health、workspace summary、quick actions、risk warnings。
- [x] 加入 shell-level 状态：local / remote、runtime ready / degraded / offline、sync / backup placeholder。
- [x] 写一段 design note，说明 Desktop Shell 和 Home / Inbox 的边界。

验收：

- 第一屏不用读文档也能看出产品是 local-first multi-agent workspace。
- 接管入口、运行状态、runtime 健康度都在第一屏可见。

### Day 3 — Home / Inbox 嵌入 Shell 的关系整理

目标：避免 Home 页面和 Shell 重复表达同一批信息。

任务：

- [x] 对比 Home / Inbox 与 Desktop Shell 的重复区块。
- [x] 决定 Home 保留哪些内容：handoff queue、active runs、operator focus。
- [x] 决定 Shell 上移哪些内容：workspace identity、global nav、runtime summary。
- [x] 更新 preview 文案和 demo data，使页面关系更清楚。

验收：

- Home / Inbox 不再像独立产品首页，而是 Desktop Shell 里的核心工作区。
- Handoff priority 规则更清楚。

### Day 4 — Run Detail / Artifact Review 导航闭环

目标：让四个核心页面之间形成一条完整 review path。

任务：

- [x] 明确从 Shell / Home 打开 Run Detail 的入口语义。
- [x] 明确从 Run Detail 打开 Artifact Review 的入口语义。
- [x] 检查 Artifact Review 的 sensitive path / export warning 是否仍符合安全默认。
- [x] 增加页面间“返回 / 上下文”文案或 breadcrumb 预留。

验收：

- 用户路径清楚：Shell → Home/Inbox → Run Detail → Artifact Review → approve / reject / export。
- 不需要真实路由也能通过预览理解 flow。

### Day 5 — UI v0 spec / PR notes 收口

目标：把本周产物整理成可以审阅的设计结论。

任务：

- [x] 写 `Desktop UI v0 information architecture` spec。
- [x] 写 PR notes：变更范围、验证命令、截图位置、未做事项。
- [x] 跑完整 UI gate：
  - `pnpm --filter @cairn/ui-preview typecheck`
  - `pnpm --filter @cairn/ui-preview lint`
  - `pnpm --filter @cairn/ui-preview build`
  - 如涉及 `packages/ui`，再跑 `@cairn/ui` typecheck / lint。
- [x] 截图或准备本地预览说明。

验收：

- PR 可被审阅。
- 下周是否启动 `apps/desktop` 有明确依据。

### Weekend buffer — 修整 / 截图 / 决策

目标：留缓冲，不把计划排满。

任务：

- [ ] 根据 owner review 修 UI 密度和文案。
- [ ] 如果 Shell 已稳定，起草 `apps/desktop` 最小骨架 plan。
- [ ] 如果 Shell 不稳定，记录下一轮需要继续 preview 的问题。

## 5. 优先级

### P0

- Desktop Shell preview 结构化。
- Shell / Home 信息边界。
- 四页核心 review path。

### P1

- Desktop UI v0 spec。
- 截图 / PR notes。
- 状态空态、降级态、blocked 态补齐。

### P2

- 视觉 polish。
- 更细的 settings/source root 页面。
- Electron 工程骨架 plan。

## 6. 建议执行顺序

推荐顺序：

1. 修正当前 Desktop Shell preview 的结构债。
2. 抽 data / view-model / sections。
3. 做 Shell 信息架构。
4. 整理 Home / Run / Artifact 的页面关系。
5. 写 spec 和 PR notes。
6. 再决定是否开 `apps/desktop`。

不要反过来先开 Electron 工程。现在最重要的是把产品壳确认，而不是把技术壳先搭出来。

## 7. 本周完成定义

本周结束时，至少应该具备：

- [x] `apps/ui-preview` 有一版可审阅 Desktop Shell 页面。
- [x] Desktop Shell / Home / Run Detail / Artifact Review 四页关系清楚。
- [x] 静态 preview 数据、sections、page wiring 分层清楚。
- [x] 本地 UI preview gate 通过。
- [x] 有一份 Desktop UI v0 信息架构 spec。
- [x] 能明确回答：下周是否启动 `apps/desktop`，以及启动范围是什么。
