# Two-Week Strategic Positioning and R1 Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh Cairn's positioning around “personal entry, small-team control room, runtime-neutral control plane” and turn that strategy into a two-week R1 execution schedule.

**Architecture:** This is documentation-only work. Product positioning docs receive the strategy language; roadmap and status docs receive the two-week operating plan without changing code, ADRs, or release commitments.

**Tech Stack:** Markdown, Prettier, markdownlint-cli2.

---

## Scope Check

This plan implements `docs/superpowers/specs/2026-05-17-strategic-positioning-refresh-design.md` and adds a two-week operating schedule for 2026-05-18 through 2026-05-31.

In scope:

- Refresh README and product positioning language.
- Add a competitive positioning note for Codex / Claude / Cursor / Windsurf.
- Update roadmap language while preserving R1 Personal Desktop, R2 Remote Workspace, R3 Collaborative Workspace.
- Add a two-week execution schedule to `docs/STATUS.md`.
- Update `CHANGELOG.md`.

Out of scope:

- Do not change code.
- Do not create Desktop / Web apps.
- Do not add team permissions, remote deployment, or enterprise governance requirements.
- Do not modify ADRs.
- Do not change R1/R2/R3 release order.

## File Structure

Create or modify these files:

- Modify `README.md`
  - Refresh one-line description and “what this is” language.
- Modify `docs/product/positioning-and-boundaries.md`
  - Add strategy and official-agent relationship sections.
- Modify `docs/product/roadmap.md`
  - Clarify R1/R2/R3 market role without changing release scope.
- Create `docs/product/competitive-positioning.md`
  - Capture competitor framing and Cairn's differentiation.
- Modify `docs/product/README.md`
  - Add the new competitive positioning doc to the product docs index.
- Modify `docs/STATUS.md`
  - Add week-of-2026-05-18 and week-of-2026-05-25 operating schedule.
- Modify `CHANGELOG.md`
  - Record positioning refresh docs.

## Task 1: README Positioning Refresh

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Update one-line description**

Change the README subtitle from:

```md
> 一个面向个人开发者与小技术团队的、自托管且本地优先的 **多 Agent 协作工作台**。
```

to:

```md
> 一个本地优先、可自托管的 **Agent 工程控制台**：先服务重度 AI 编程个人开发者，同时为小技术团队保留可观察、可回放、可接管的协作核心。
```

- [ ] **Step 2: Refresh “这是什么” bullets**

In `README.md`, replace the four bullets under `## 这是什么` with:

```md
- **本地优先 + 自托管** 的 Agent 工程控制台
- 在 **桌面端（Windows / macOS Apple Silicon）** 与 **Web 端** 共享同一套 Workspace Core
- 支持把复杂工程任务 **规划 → 执行 → 回传 → 回放 → 沉淀**
- 将 Codex / Claude / 本地模型等 runtime 纳入统一的 run、artifact、trace、operator control 语义
- 由主 Agent（Supervisor）统筹、worker 角色分工、**人类可随时接管**
```

- [ ] **Step 3: Add official-agent relationship paragraph**

After the “适合谁” list, add:

```md
Cairn 不试图替代 Codex、Claude Code、Cursor 或 Windsurf 的代码生成能力。它更像这些 agent runtime 之上的本地塔台：记录任务为什么启动、如何规划、谁执行了什么、产物在哪里、失败如何恢复，以及人类何时介入。
```

- [ ] **Step 4: Run markdown checks**

Run:

```bash
pnpm exec prettier --write README.md
pnpm exec markdownlint-cli2 README.md
```

Expected: both commands exit `0`.

- [ ] **Step 5: Commit README refresh**

Run:

```bash
git add README.md
git commit -m "docs(readme): 刷新产品定位 / refresh product positioning"
```

Expected: commit succeeds.

## Task 2: Product Positioning and Competitive Note

**Files:**

- Modify: `docs/product/positioning-and-boundaries.md`
- Create: `docs/product/competitive-positioning.md`
- Modify: `docs/product/README.md`

- [ ] **Step 1: Update one-line positioning**

In `docs/product/positioning-and-boundaries.md`, replace the section 1 quote with:

```md
> **Cairn 是本地优先、可自托管的 Agent 工程控制台：先服务重度 AI 编程个人开发者，同时为 2–10 人小技术团队保留共享工作区、可观察、可回放与可接管的协作核心。**
```

- [ ] **Step 2: Add market entry strategy section**

In `docs/product/positioning-and-boundaries.md`, add this after section 2:

```md
## 2.1 市场切入顺序

Cairn 的市场切入顺序是：**个人本地入口 → 远程 workspace → 小团队控制台**。

- R1 先把个人本地工作台做成可信闭环，验证 Workspace Core、Runtime Gateway、Artifact、Trace、PlanningOutput 与 Operator control。
- R2 通过 remote workspace 打开团队入口，但仍坚持用户自控 server 与共享核心语义。
- R3 聚焦 2–10 人小团队的 agent 工程控制台，而不是企业级多租户治理平台。
```

- [ ] **Step 3: Add relationship to official agent tools**

In `docs/product/positioning-and-boundaries.md`, add this after “## 4. 我们不是什么”:

```md
## 4.1 与官方 Agent 工具的关系

Codex、Claude Code、Cursor、Windsurf 等工具会持续增强 worktree、并行任务、后台执行与 PR 生成能力。Cairn 不把这些基础 agent runner 能力当成护城河。

Cairn 的定位是 runtime-neutral control plane：把 Codex / Claude / 本地模型 / OpenAI-compatible endpoint 作为 Runtime Adapter 接入，并在其上提供 durable memory、replay、audit、artifact registry、planning output 与 operator cockpit。
```

- [ ] **Step 4: Create competitive positioning doc**

Create `docs/product/competitive-positioning.md` with:

```md
# 竞品与差异化定位 / Competitive Positioning

> 状态：🟡 Draft  
> 最后更新：2026-05-17  
> 关联：[`positioning-and-boundaries.md`](positioning-and-boundaries.md)、[`roadmap.md`](roadmap.md)

---

## 1. 结论

Cairn 不与 Codex、Claude Code、Cursor、Windsurf 正面竞争“谁更会写代码”。这些工具是 Cairn 应该接入和编排的 runtime。

Cairn 的差异化是：**本地优先、runtime-neutral、可观察、可回放、可接管的 Agent 工程控制台**。

## 2. 容易被官方工具商品化的能力

- worktree 创建与隔离。
- 并行 agent session。
- 基础任务分派。
- 自动运行测试。
- 生成 commit / PR。
- 单一 runtime 的代码生成质量。

这些能力可以使用，但不应作为 Cairn 的长期护城河。

## 3. Cairn 的差异化重心

| 维度    | Cairn 目标                                               |
| ------- | -------------------------------------------------------- |
| Runtime | Codex / Claude / 本地模型都通过 Runtime Adapter 接入     |
| 数据    | 默认本地或用户自控 server，不上报业务内容                |
| 记忆    | run / task / artifact / trace / planning output 长期沉淀 |
| 回放    | 从 TraceEvent 与 Artifact 重建执行过程                   |
| 接管    | 人类可暂停、取消、重试、rerun、replan、注入说明          |
| 团队    | 从个人本地工作台自然延展到小团队共享控制台               |

## 4. 产品边界

Cairn 不做：

- 企业级多租户审批治理平台。
- 开放 worker marketplace。
- 拖拽式 workflow builder。
- 单一聊天 bot。
- 单一 IDE 补全 copilot。

## 5. 市场节奏

- R1：个人本地工作台，验证可信闭环。
- R2：远程 workspace，打开小团队入口。
- R3：小团队 agent 工程控制台，增强共享观察面、operator handoff 与受保护步骤。
```

- [ ] **Step 5: Add doc to product README**

In `docs/product/README.md`, add this row to the product docs table:

```md
| `competitive-positioning.md` | 竞品关系、官方 agent 工具差异化与市场切入 | 🟡 Draft |
```

- [ ] **Step 6: Run markdown checks**

Run:

```bash
pnpm exec prettier --write docs/product/positioning-and-boundaries.md docs/product/competitive-positioning.md docs/product/README.md
pnpm exec markdownlint-cli2 docs/product/positioning-and-boundaries.md docs/product/competitive-positioning.md docs/product/README.md
```

Expected: both commands exit `0`.

- [ ] **Step 7: Commit positioning docs**

Run:

```bash
git add docs/product/positioning-and-boundaries.md docs/product/competitive-positioning.md docs/product/README.md
git commit -m "docs(product): 明确竞争定位 / clarify competitive positioning"
```

Expected: commit succeeds.

## Task 3: Roadmap and Two-Week Operating Schedule

**Files:**

- Modify: `docs/product/roadmap.md`
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Clarify R1 target language**

In `docs/product/roadmap.md`, under `Release 1 — Personal Desktop Edition`, replace the third goal bullet with:

```md
- 能完成单用户复杂工程任务的规划、执行、结果回传、回放与沉淀
```

- [ ] **Step 2: Clarify R2 bridge role**

In `docs/product/roadmap.md`, under `Release 2 — Remote Workspace Edition`, add this goal bullet:

```md
- 作为从个人本地工作台到小团队控制台的过渡形态，先提供共享观察面与用户自控 server
```

- [ ] **Step 3: Clarify R3 non-enterprise boundary**

In `docs/product/roadmap.md`, under `Release 3 — Collaborative Workspace Edition`, replace the third goal bullet with:

```md
- 为 run review、operator handoff、受保护步骤与决策沉淀提供正式入口，但不升级为企业级审批治理平台
```

- [ ] **Step 4: Add two-week schedule to STATUS**

In `docs/STATUS.md`, replace section `## 6. 近期主线` with:

```md
## 6. 近期主线

### Week of 2026-05-18

目标：完成战略定位刷新，并补齐 PlanningOutput 的读取面，让 UI preview 和后续 Desktop Shell 可以消费规划结果。

1. **战略文档刷新**：更新 README、positioning、roadmap，并新增 competitive positioning 文档。
2. **Planning Output API slice**：为 Workspace Core 增加 PlanningOutput 读取接口，只读返回现有 application/storage 数据，不实现真实 Planner。
3. **UI preview 对齐**：在 Run Detail preview 中展示 planning summary / blocked reason / action tree 的静态或 mock 数据形态。
4. **验证门禁**：保持 `pnpm run check`、`pnpm test`、`pnpm --filter @cairn/ui-preview build` 通过。

### Week of 2026-05-25

目标：推进 R1 控制台护城河，优先把 Codex runtime 真实闭环和 Artifact / Trace 基线接近可演示状态。

1. **Runtime Gateway 真实闭环**：将 Codex CLI adapter 接入 workspace-core 的实际执行路径，形成可观测 AgentRun 流。
2. **Artifact / Trace 基线**：明确 artifact store 的文件边界、payload 引用、TraceEvent replay 输入格式。
3. **Operator control polish**：补齐取消、runtime kill、失败映射与重试路径的最小真实行为。
4. **Desktop Shell 启动准备**：在 Workspace Core、Codex adapter、Artifact / Trace 基线稳定后，再启动 Electron shell slice。

### 暂不插队

- 不启动企业级团队权限。
- 不做 marketplace。
- 不做 workflow builder。
- 不创建 `apps/web` 或 `apps/desktop`，除非 Workspace Core + Runtime Gateway 闭环已满足启动条件。
```

- [ ] **Step 5: Run markdown checks**

Run:

```bash
pnpm exec prettier --write docs/product/roadmap.md docs/STATUS.md
pnpm exec markdownlint-cli2 docs/product/roadmap.md docs/STATUS.md
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit roadmap and schedule**

Run:

```bash
git add docs/product/roadmap.md docs/STATUS.md
git commit -m "docs(roadmap): 安排两周主线 / schedule two-week priorities"
```

Expected: commit succeeds.

## Task 4: Changelog and Final Verification

**Files:**

- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update changelog**

Under `[Unreleased]` → `### Added`, add:

```md
- 新增战略定位刷新说明，明确 Cairn 以个人本地工作台切入，长期聚焦小团队 Agent 工程控制台，并通过 runtime-neutral control plane 接入 Codex / Claude 等官方 agent 工具。
```

- [ ] **Step 2: Run focused verification**

Run:

```bash
pnpm exec markdownlint-cli2 README.md docs/product/positioning-and-boundaries.md docs/product/competitive-positioning.md docs/product/README.md docs/product/roadmap.md docs/STATUS.md CHANGELOG.md docs/superpowers/specs/2026-05-17-strategic-positioning-refresh-design.md docs/superpowers/plans/2026-05-17-two-week-strategic-positioning-and-r1-plan.md
pnpm exec prettier --check README.md docs/product/positioning-and-boundaries.md docs/product/competitive-positioning.md docs/product/README.md docs/product/roadmap.md docs/STATUS.md CHANGELOG.md docs/superpowers/specs/2026-05-17-strategic-positioning-refresh-design.md docs/superpowers/plans/2026-05-17-two-week-strategic-positioning-and-r1-plan.md
git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 3: Run broad documentation gate**

Run:

```bash
pnpm run docs:lint
pnpm run format:check
```

Expected: both commands exit `0`.

- [ ] **Step 4: Commit changelog and plan**

Run:

```bash
git add CHANGELOG.md docs/superpowers/plans/2026-05-17-two-week-strategic-positioning-and-r1-plan.md
git commit -m "docs(strategy): 记录两周执行计划 / record two-week execution plan"
```

Expected: commit succeeds.

## Two-Week Summary

### 本周：2026-05-18 到 2026-05-24

1. 战略定位文档刷新。
2. PlanningOutput Workspace Core 读取 API。
3. Run Detail / UI preview 展示 planning output 形态。
4. 保持 docs/check/test/build 门禁通过。

### 下周：2026-05-25 到 2026-05-31

1. Codex CLI adapter 接入 workspace-core 真实执行路径。
2. Artifact / Trace store 与 replay 输入边界。
3. Operator control 的真实取消 / kill / retry polish。
4. Desktop Shell 启动前置条件复核。
