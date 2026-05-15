# Cairn Engineering Health Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a formal engineering health review report for current `develop`, then synchronize `docs/STATUS.md` and `CHANGELOG.md` with the verified project state.

**Architecture:** This is a documentation implementation plan. It turns the accepted health-review design into a stable report, keeps the report separate from the canonical status page, and updates the status page only with durable facts that future agents should trust.

**Tech Stack:** Markdown, markdownlint-cli2, Prettier, pnpm, Git.

---

## Scope Check

The accepted spec covers a broad project assessment, but the executable scope here is intentionally narrow:

- Create one formal engineering health review report.
- Update the canonical project status page with durable facts from that report.
- Update the changelog for the documentation changes.
- Do not implement runtime, orchestration, artifact, trace, Desktop, or Web code in this plan.

## File Structure

Files to create or modify:

- Create `docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md`
  - Owns the formal engineering health review report.
  - Records verification evidence, module-by-module status, risks, and recommended R1 order.
- Modify `docs/STATUS.md`
  - Remains the canonical quick status baseline.
  - Gains `apps/ui-preview`, updated UI package details, UI preview validation, Node 26 observation, and a new change-history entry.
- Modify `CHANGELOG.md`
  - Records the new engineering health review report and the status page refresh under `[Unreleased]`.

## Task 1: Create Formal Engineering Health Review Report

**Files:**

- Create: `docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md`
- Reference: `docs/superpowers/specs/2026-05-16-cairn-engineering-health-review-design.md`
- Reference: `docs/STATUS.md`

- [ ] **Step 1: Verify the accepted design exists**

Run:

```bash
test -f docs/superpowers/specs/2026-05-16-cairn-engineering-health-review-design.md
```

Expected: command exits with status `0`.

- [ ] **Step 2: Verify the report file has not already been created**

Run:

```bash
test ! -e docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md
```

Expected: command exits with status `0`. If it exits with status `1`, stop and inspect the existing file before continuing.

- [ ] **Step 3: Create the report with this exact content**

Create `docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md`:

```markdown
# Cairn 工程体检报告 / Engineering Health Review

> 状态：Accepted
> 日期：2026-05-16
> 分支：`develop`
> 代码验证基准：`cebd17e feat(ui): 添加 UI 组件预览应用 / add UI preview app`
> 设计基准：`d55464d docs(health): 梳理工程体检设计 / document engineering health review design`

---

## 1. 摘要

Cairn 当前处于 **R1 工程基线 + Workspace Core 最小闭环建设阶段**。

当前最可靠的工程事实是：共享契约、领域 schema、SQLite storage、Runtime Gateway、Application 编排基线、Workspace Core 最小服务、Code Context R1a/R1b-a、共享 UI 包和 UI preview 已经建立并通过本地验证。Desktop Shell 与 Web Shell 仍未启动，真实 Codex CLI 端到端执行、Artifact / Trace 闭环、retry / rerun / cancel 与 operator action 仍是 R1 主线的关键缺口。

结论：下一阶段应先巩固 Workspace Core 的真实执行闭环，再启动 Desktop Shell slice。UI preview 可以继续服务产品视图探索，但不应反向决定领域对象、状态机或 Workspace Core API。

## 2. 验证结果

本次体检已执行：

| 命令                                    | 结果 |
| --------------------------------------- | ---- |
| `pnpm install --frozen-lockfile`        | 通过 |
| `pnpm run check`                        | 通过 |
| `pnpm test`                             | 通过 |
| `pnpm --filter @cairn/ui-preview build` | 通过 |

环境：

| 项   | 值        |
| ---- | --------- |
| Node | `v26.0.0` |
| pnpm | `9.15.0`  |
| 分支 | `develop` |

观察项：`better-sqlite3` 在 Node 26 下安装成功，但预编译包下载超时后走本地编译，并出现 V8 deprecation warnings。当前不阻塞测试，但应持续观察 Node 26 与 native dependency 的兼容性。

## 3. 状态总览

| 链路节点                        | 状态      | 判断                                                               |
| ------------------------------- | --------- | ------------------------------------------------------------------ |
| 契约与领域模型                  | 🟢 可用   | 核心 schema、contract、WS event 与 Drizzle schema 已建立           |
| SQLite / storage                | 🟢 可用   | SQLite connection、PRAGMA、迁移 runner 与测试通过                  |
| Application orchestration       | 🟡 基线   | single-worker run 与 adapter event 状态推进已建立                  |
| Runtime Gateway / Codex adapter | 🟡 基线   | adapter 契约、mock、Codex CLI JSONL/process 基线已建立             |
| Workspace Core HTTP API         | 🟡 基线   | Fastify、health、run/task/agent-run、code context API 已建立       |
| Code Context                    | 🟡 基线   | SourceRoot、文件清单、metadata search、ContextPack manifest 已建立 |
| UI package / UI preview         | 🟡 基线   | 共享 UI 包和静态 UI preview 已建立并可构建                         |
| Desktop / Web shell             | ⚪ 未启动 | `apps/desktop` 与 `apps/web` 尚未创建                              |

## 4. 链路体检

### 4.1 契约与领域模型

状态：🟢 可用 / 🟡 基线。

已有能力：

- `packages/shared_contracts` 提供核心 Zod schemas、ts-rest contracts 与 run WebSocket events。
- `packages/domain` 提供 Drizzle SQLite-first schema 与迁移。
- 领域对象已覆盖 Workspace、Conversation、Event、Message、OrchestrationRun、Task、AgentRun、Artifact、TraceEvent、Code Context 相关表。

主要缺口：

- operator actions、retry/rerun/cancel 的 contract 仍需补齐。
- planning artifact / Goal Planner 输出模型需要进一步进入契约。
- TraceEvent 与 replay UI 的消费契约尚未形成闭环。

建议下一步：

- 优先补 `operator action`、`retry`、`rerun`、`cancel` 的 shared contracts。
- 同步 application ports 与 workspace-core routes，避免 UI 先绑定临时 API。

### 4.2 SQLite / storage

状态：🟢 可用。

已有能力：

- `packages/storage` 提供 better-sqlite3 连接封装、PRAGMA 初始化与 domain migration runner。
- Workspace Core 已使用 SQLite application repository 持久化 run/task/agent-run 状态。
- SQLite 相关测试在当前环境通过。

主要缺口：

- Artifact store 的真实文件内容写入、保留策略与导出边界尚未落地。
- PostgreSQL-ready 的接口边界仍需保持清晰，但 R1 不实现 PostgreSQL。

建议下一步：

- 在 Artifact / Trace 基线任务中定义 artifact metadata 与文件存储边界。
- 不要提前实现远程 artifact store 或 PostgreSQL 路径。

### 4.3 Application orchestration

状态：🟡 基线。

已有能力：

- `packages/application` 提供 OrchestrationRun service、repository ports、Runtime Gateway 提交端口与 CodeContext service。
- single-worker run 创建与 adapter event 状态推进有测试覆盖。

主要缺口：

- run lifecycle 仍偏最小闭环。
- retry / rerun / cancel / operator note 尚未完整进入 application service。
- 多 task DAG、planning artifact 与 recovery 流程未启动。

建议下一步：

- 先补 run lifecycle 与 operator action 的 application 语义。
- 再推进真实 Codex adapter 接入 Workspace Core。

### 4.4 Runtime Gateway / Codex adapter

状态：🟡 基线 / 🟠 风险。

已有能力：

- `RuntimeAdapter` 契约与 capability profile 已建立。
- mock adapter 可用于 application / workspace-core 测试。
- Codex CLI adapter 已覆盖 `codex exec --json` 参数构造、JSONL 输出解析、stdout/stderr、非零退出、spawn error 与取消升级 kill 的错误映射。

主要缺口：

- 真实 Codex CLI adapter 尚未进入 workspace-core 端到端执行路径。
- 取消、错误归因、流式事件到 TraceEvent / AgentRun 的映射还需收口。
- Codex CLI 版本与行为变化需要 conformance 或 smoke 保护。

建议下一步：

- 将 Codex CLI adapter 接入 Workspace Core 的实际执行路径。
- 用 mock adapter 保留 deterministic 测试，用 Codex adapter 增加最小 smoke 或 contract-style 保护。

### 4.5 Workspace Core HTTP API

状态：🟡 基线。

已有能力：

- `apps/workspace-core` 提供 Fastify 服务、`GET /health` 与 R1 run/task/agent-run HTTP 闭环。
- 服务启动可执行 domain 迁移，并用 `.cairn/workspace-core.sqlite` 持久化状态。
- Code Context API 已覆盖 SourceRoot 注册、reindex、搜索与 ContextPack manifest 创建。

主要缺口：

- retry/rerun/cancel/operator action routes 未完整。
- 真实 runtime execution path 未打通。
- TraceEvent、Artifact、planner output 的 API 与持久化闭环仍需补齐。
- sidecar loopback token 与 Desktop 嵌入模式尚未实现。

建议下一步：

- 先补 orchestration lifecycle API。
- 再接真实 Runtime Gateway。
- Desktop sidecar 相关工作应等待 core 闭环更稳定。

### 4.6 Code Context

状态：🟡 基线。

已有能力：

- SourceRoot registry。
- 本地文件清单 reindex。
- metadata-only code search。
- metadata-only ContextPack manifest。
- excerpt 行号范围与保守 token 估算。

主要缺口：

- 文本搜索尚未补齐。
- TS/JS symbol outline 尚未补齐。
- import/export dependency edge 尚未补齐。
- Planner 尚未真正消费 ContextPack。

建议下一步：

- 继续 Code Context R1b，但保持轻量自研边界。
- 不引入语义 embedding、向量搜索或许可证受限代码。

### 4.7 UI package / UI preview

状态：🟡 基线。

已有能力：

- `packages/ui` 提供 tokens、primitives、feedback 与 Cairn 业务组件基线。
- `apps/ui-preview` 提供静态 UI 组件与产品视图预览。
- UI preview 已通过 production build。

主要缺口：

- `docs/STATUS.md` 尚未反映 UI preview 最新进展。
- UI preview 仍是静态/预览层，不代表 Web Shell 或 Desktop Shell 已启动。
- 后续 UI 不应反向决定领域对象、状态机或 Workspace Core API 语义。

建议下一步：

- 更新 `docs/STATUS.md`。
- UI preview 继续做产品视图验证，但在真实 API 定型前保持静态边界。

### 4.8 Desktop / Web shell

状态：⚪ 未启动。

已有能力：

- 产品形态、共享核心原则、安全边界和 Release 目标已在文档中明确。

主要缺口：

- `apps/desktop` Electron Desktop Shell 未创建。
- `apps/web` React Web Shell 未创建。
- `packages/desktop_bridge` 未创建。
- Desktop sidecar 生命周期管理、loopback token、preload / contextBridge allowlist 未实现。
- Chat / Runs / Tasks / Run Detail / Artifact / Trace 视图未接入真实 Workspace Core。

建议下一步：

- 在 Workspace Core 与 Codex adapter 闭环稳定后启动 Desktop Shell 最小 slice。
- 不给 Desktop 写绕过 Workspace Core 的快捷流程。

## 5. 重点风险

| 风险                                                        | 等级 | 判断                                        | 建议动作                                          |
| ----------------------------------------------------------- | ---- | ------------------------------------------- | ------------------------------------------------- |
| 真实 Codex CLI 尚未打通 workspace-core 端到端执行           | P0   | 没有真实 runtime 闭环，R1 核心价值无法验证  | 优先接入真实 Codex adapter 执行路径               |
| run lifecycle / operator action / retry-rerun-cancel 未完整 | P1   | UI 与 Desktop 接入会绑定不稳定语义          | 先补 shared contracts、application、routes        |
| Artifact / Trace 未形成可回放数据闭环                       | P1   | run-driven 与 replay 价值尚不能完整落地     | 建立 artifact metadata、TraceEvent API 与存储边界 |
| Desktop Shell 未启动                                        | P1   | R1 是 Personal Desktop Edition              | core 闭环稳定后启动最小 Desktop slice             |
| UI preview 领先 STATUS 文档                                 | P2   | 容易让协作者误判 Web/Desktop 已启动         | 更新 `docs/STATUS.md`                             |
| Node 26 不是文档主验证环境                                  | P2   | 当前可跑，但 native dependency 需要持续观察 | 记录 Node 26 下 better-sqlite3 本地编译情况       |

## 6. 建议推进顺序

1. 补齐 Orchestration API 契约与 Workspace Core routes：run lifecycle、operator action、retry/rerun/cancel。
2. 接上真实 Codex CLI adapter 的 Workspace Core 端到端执行闭环。
3. 打通 Artifact / Trace 基线，让 run 可观察、可回放。
4. 继续 Code Context R1b：文本搜索、TS/JS symbol outline、import/export edges，并让 Planner 消费 ContextPack。
5. 更新 `docs/STATUS.md`，同步 UI preview、最新验证结果和环境风险。
6. 在 core 闭环稳定后启动 Desktop Shell slice：sidecar、loopback token、preload allowlist、最小视图接入。
7. UI preview 继续服务产品视图验证，但不早于 API 语义定型。

## 7. 不建议现在做

- 不启动复杂 workflow builder。
- 不扩展多 provider 或开放 marketplace。
- 不把 Desktop 做成全权限无边界自动化工具。
- 不让 UI preview 反向决定领域对象和状态机。
- 不绕过 Workspace Core 给 Desktop / Web 写单独快捷流程。
- 不在真实 runtime 闭环前投入过多 Web/Desktop 壳层复杂交互。

## 8. 后续落地建议

本报告建议拆成三条后续工作流：

1. **状态同步工作流**：更新 `docs/STATUS.md` 与 `CHANGELOG.md`，保持事实基线不滞后。
2. **Core 闭环工作流**：围绕 orchestration lifecycle、真实 Codex adapter、Artifact / Trace 打通 R1 后端闭环。
3. **Desktop slice 工作流**：在 core 闭环稳定后启动 Electron shell、sidecar 管理、安全桥接与最小 UI 接入。
```

- [ ] **Step 4: Format the report**

Run:

```bash
pnpm exec prettier --write docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md
```

Expected: Prettier rewrites or confirms the file without errors.

- [ ] **Step 5: Verify the report lint and format**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md
pnpm exec prettier --check docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 6: Commit the report**

Run:

```bash
git add docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md
git commit -m "docs(health): 新增工程体检报告 / add engineering health review report"
```

Expected: commit succeeds with one new report file.

## Task 2: Update Canonical Project Status

**Files:**

- Modify: `docs/STATUS.md`
- Reference: `docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md`

- [ ] **Step 1: Verify current STATUS does not already mention UI preview**

Run:

```bash
rg -n "apps/ui-preview|ui-preview build|Node 26" docs/STATUS.md
```

Expected before this task: no matches. If matches exist, inspect them and only apply missing changes.

- [ ] **Step 2: Apply this STATUS patch**

Run `apply_patch` with this patch:

```text
*** Begin Patch
*** Update File: docs/STATUS.md
@@
-> 最后更新：2026-05-15
+> 最后更新：2026-05-16
@@
-已经可运行的主线是共享契约、领域 schema、SQLite storage、Runtime Gateway、Application 编排基线，以及 `apps/workspace-core` 的最小 Fastify 服务。Desktop Shell 与 Web Shell 还没有创建。
+已经可运行的主线是共享契约、领域 schema、SQLite storage、Runtime Gateway、Application 编排基线、`apps/workspace-core` 的最小 Fastify 服务，以及静态 `apps/ui-preview` 预览应用。Desktop Shell 与 Web Shell 还没有创建。
@@
-| `apps/workspace-core`       | 🟢 可用   | Fastify 最小服务，包含 `/health`、run/task/agent-run 闭环与 code context API |
-| `apps/desktop`              | ⚪ 未创建 | Electron Desktop Shell 尚未启动                                              |
-| `apps/web`                  | ⚪ 未创建 | Web Shell 尚未启动                                                           |
+| `apps/workspace-core`       | 🟢 可用   | Fastify 最小服务，包含 `/health`、run/task/agent-run 闭环与 code context API |
+| `apps/ui-preview`           | 🟡 基线   | 静态 UI 组件与产品视图预览应用，可 production build                          |
+| `apps/desktop`              | ⚪ 未创建 | Electron Desktop Shell 尚未启动                                              |
+| `apps/web`                  | ⚪ 未创建 | Web Shell 尚未启动                                                           |
@@
-| `packages/ui`               | 🟡 基线   | 共享 UI 包校验基线、tokens / primitives 导出 smoke test                      |
+| `packages/ui`               | 🟡 基线   | 共享 UI tokens、primitives、feedback 与 Cairn 业务组件基线                   |
@@
 ### Runtime Gateway
@@
 - Codex CLI adapter 基线：
   - `codex exec --json` 参数构造。
   - JSONL 输出解析。
   - stdout/stderr、非零退出、spawn error、取消升级 kill 的错误映射。
+
+### UI package / UI preview
+
+- `packages/ui` 已提供共享 tokens、primitives、feedback 与 Cairn 业务组件基线。
+- `apps/ui-preview` 已提供静态产品视图预览：
+  - Home Inbox preview。
+  - Run Detail preview。
+  - Artifact Review preview。
+  - Components Gallery preview。
+- UI preview 是静态预览层，不代表 `apps/web` 或 `apps/desktop` 已启动。
@@
 | `pnpm run test`       | 全仓 Vitest 测试                            |
+| `pnpm --filter @cairn/ui-preview build` | UI preview production build 验证           |
 | `pnpm run check`      | typecheck + lint + docs lint + format check |
@@
 | `packages/ui`               | 1                | 公共导出与 token / primitive smoke test                  |
+| `apps/ui-preview`           | 0                | 当前以 typecheck / lint / production build 作为验证门禁 |
 | `apps/workspace-core`       | 3                | Fastify app、SQLite repository、local code index scanner |
@@
 - `.nvmrc` 目标 Node 为 22；当前仓库已经升级 `better-sqlite3` catalog 到可在 Node 24.14.0 本机安装 native binding 的版本。
+- Node 26.0.0 下 `pnpm install --frozen-lockfile`、`pnpm run check`、`pnpm test` 与 `pnpm --filter @cairn/ui-preview build` 可通过；`better-sqlite3` 可能因预编译包不可用而走本地编译，并出现 V8 deprecation warnings。
 - 如果 SQLite 相关测试因 native binding 缺失失败，优先重新 `pnpm install`，再跑 `pnpm --filter @cairn/storage test` 与 `pnpm --filter @cairn/workspace-core test`。
@@
 - `@cairn/workspace-core`：最小服务、SQLite 持久化、code context R1a/R1b-a API。
@@
 - `@cairn/ui`：共享 UI 包基线。
+- `apps/ui-preview`：静态 UI 组件与产品视图预览应用，可用于验证 `packages/ui` 的产品组合形态。
@@
 - `apps/web` React Web Shell。
+- UI preview 不是 Web Shell，不能假设已有远程 workspace 控制台。
@@
 | 日期       | 变更                                                         |
 | ---------- | ------------------------------------------------------------ |
+| 2026-05-16 | 补充 UI preview、Node 26 验证观察项与工程体检同步建议 |
 | 2026-05-15 | 初版：记录当前能力、测试基线、R1 完成 / 未完成能力与近期主线 |
*** End Patch
```

Expected: patch applies cleanly.

- [ ] **Step 3: Format STATUS**

Run:

```bash
pnpm exec prettier --write docs/STATUS.md
```

Expected: Prettier rewrites or confirms the file without errors.

- [ ] **Step 4: Verify STATUS contains the new facts**

Run:

```bash
rg -n "apps/ui-preview|UI preview production build|Node 26.0.0|UI preview 不是 Web Shell" docs/STATUS.md
```

Expected: at least four matches, including the apps table, validation command, environment note, and R1 unfinished clarification.

## Task 3: Update Changelog

**Files:**

- Modify: `CHANGELOG.md`

- [ ] **Step 1: Apply this changelog patch**

Run `apply_patch` with this patch:

```text
*** Begin Patch
*** Update File: CHANGELOG.md
@@
 - 新增项目状态页 `docs/STATUS.md`，记录当前可用能力、测试基线、R1 已完成 / 未完成能力与近期主线
+- 新增 Cairn 工程体检报告，按 R1 交付链路梳理当前工程状态、风险与下一步优先级
 - Orchestration / Code Context 设计补充 Goal Planner 参考：action tree、preconditions、blocked reason 与 replan reason
@@
 - **`@cairn/storage`**：升级 `better-sqlite3` catalog 至 `^12.10.0`，本机 Node 24.14.0 下可安装 native binding 并执行 SQLite 测试
+- `docs/STATUS.md` 同步 UI preview、Node 26 验证观察项与工程体检建议
*** End Patch
```

Expected: patch applies cleanly.

- [ ] **Step 2: Format changelog**

Run:

```bash
pnpm exec prettier --write CHANGELOG.md
```

Expected: Prettier rewrites or confirms the file without errors.

- [ ] **Step 3: Verify changelog entries**

Run:

```bash
rg -n "工程体检报告|Node 26 验证观察项" CHANGELOG.md
```

Expected: two matches.

## Task 4: Validate Documentation Changes

**Files:**

- Check: `docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md`
- Check: `docs/STATUS.md`
- Check: `CHANGELOG.md`

- [ ] **Step 1: Run targeted markdown validation**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md docs/STATUS.md CHANGELOG.md
pnpm exec prettier --check docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md docs/STATUS.md CHANGELOG.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 2: Run repository documentation validation**

Run:

```bash
pnpm run docs:lint
pnpm run format:check
git diff --check
```

Expected:

- `pnpm run docs:lint` reports `Summary: 0 error(s)`.
- `pnpm run format:check` reports `All matched files use Prettier code style!`.
- `git diff --check` prints no output and exits with status `0`.

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff -- docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md docs/STATUS.md CHANGELOG.md
```

Expected: diff only contains the new report, STATUS updates, and changelog entries described in this plan.

## Task 5: Commit Status and Changelog Sync

**Files:**

- Stage: `docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md`
- Stage: `docs/STATUS.md`
- Stage: `CHANGELOG.md`

- [ ] **Step 1: Confirm working tree contains only planned changes**

Run:

```bash
git status --short
```

Expected output includes only:

```text
 M CHANGELOG.md
 M docs/STATUS.md
?? docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md
```

If Task 1 already committed the report, expected output includes only:

```text
 M CHANGELOG.md
 M docs/STATUS.md
```

- [ ] **Step 2: Stage remaining planned files**

Run:

```bash
git add docs/superpowers/specs/2026-05-16-cairn-engineering-health-review.md docs/STATUS.md CHANGELOG.md
```

Expected: command exits with status `0`. If the report was already committed, Git stages only `docs/STATUS.md` and `CHANGELOG.md`.

- [ ] **Step 3: Check staged diff**

Run:

```bash
git diff --cached --check
git diff --cached --stat
```

Expected:

- `git diff --cached --check` prints no output.
- `git diff --cached --stat` lists only the planned docs.

- [ ] **Step 4: Commit the remaining docs sync**

Run:

```bash
git commit -m "docs(status): 同步工程体检状态 / sync engineering health status"
```

Expected: commit succeeds.

- [ ] **Step 5: Confirm final branch state**

Run:

```bash
git status --short --branch
git log --oneline --decorate --max-count=5
```

Expected:

- Working tree is clean.
- Recent commits include the health review report and STATUS sync commits.

## Self-Review Checklist

- Spec coverage: The plan creates the formal report, updates `docs/STATUS.md`, updates `CHANGELOG.md`, and includes validation and commit steps.
- Scope control: The plan does not implement runtime, orchestration, artifact, trace, Desktop, or Web code.
- Exact paths: Every task names exact files.
- Validation: Targeted Markdown checks, repository docs checks, format checks, and `git diff --check` are included.
- Boundary check: The plan preserves Cairn's local-first/shared-core boundaries and keeps UI preview separate from Web/Desktop shells.
