# Engineering Standards Reinforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Cairn's engineering standards documentation with the current toolchain, add naming/module/review/automation authority pages, and prepare a later `standards:check` implementation.

**Architecture:** This plan implements Phase 1 of the accepted standards reinforcement design as documentation-only changes. It keeps code and tooling unchanged, splits authority across focused docs, and records machine-checkable rules separately so Phase 2 can add automation without re-litigating policy.

**Tech Stack:** Markdown, markdownlint-cli2, Prettier, Git.

---

## Scope Check

This plan covers Phase 1 documentation alignment and prepares a follow-up plan for Phase 2 automation. It does not create scripts, change ESLint, change TypeScript config, alter package structure, or add CI checks.

## File Structure

Create or modify these files:

- Modify `docs/engineering/coding-standards.md`
  - Aligns code standards with actual `tsconfig.base.json`, `eslint.config.js`, commit hooks, and current missing packages.
- Create `docs/reference/naming-conventions.md`
  - Owns naming rules for files, symbols, DB, routes, events, artifacts, runtime capabilities, and package names.
- Create `docs/engineering/module-boundaries.md`
  - Owns package responsibility matrix, allowed dependencies, forbidden dependencies, import rules, and public/internal API rules.
- Create `docs/engineering/review-gates.md`
  - Owns risk levels, changed surfaces, required verification, docs update conditions, and review output template.
- Create `docs/engineering/standards-automation.md`
  - Owns automated/manual/future standards checks and the staged `standards:check` route.
- Modify `docs/engineering/agent-collaboration.md`
  - Keeps AI collaboration guidance, routes detailed review gates to `review-gates.md`, and avoids duplicating all gate details.
- Modify `docs/engineering/README.md`
  - Adds the new engineering docs to the index and reading order.
- Modify `docs/reference/README.md`
  - Adds `naming-conventions.md` to the reference index.
- Modify `CHANGELOG.md`
  - Records the standards reinforcement docs under `[Unreleased]`.

## Task 1: Align Coding Standards With Current Tooling

**Files:**

- Modify: `docs/engineering/coding-standards.md`
- Reference: `tsconfig.base.json`
- Reference: `eslint.config.js`
- Reference: `package.json`

- [ ] **Step 1: Inspect current tooling facts**

Run:

```bash
sed -n '1,220p' tsconfig.base.json
sed -n '1,260p' eslint.config.js
sed -n '1,180p' package.json
```

Expected: output confirms strict TypeScript flags, ESLint flat config, `no-console`, `process.env` restrictions, `unicorn/filename-case`, commit hooks, and root scripts.

- [ ] **Step 2: Replace `coding-standards.md` with this content**

Use `apply_patch` to replace the full file with:

````markdown
# 代码规范 / Coding Standards

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 关联：ADR-0002、[`repo-layout.md`](./repo-layout.md)、[`module-boundaries.md`](./module-boundaries.md)、[`../reference/naming-conventions.md`](../reference/naming-conventions.md)

---

## 1. 定位

本文规定 Cairn 单文件、单包内的代码书写规则。跨包依赖看 [`module-boundaries.md`](./module-boundaries.md)，命名细则看 [`../reference/naming-conventions.md`](../reference/naming-conventions.md)，提交与分支看 [`commit-convention.md`](./commit-convention.md) 与 [`git-workflow.md`](./git-workflow.md)。

规则分三类：

| 类别       | 含义                                                                            | 例子                                                               |
| ---------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 已机器强制 | 当前 `tsconfig.base.json`、`eslint.config.js`、commitlint 或 lint-staged 已检查 | strict TS、no explicit any、no console、import order、commit title |
| 人工 gate  | 目前由 review 检查，不能只靠工具判断                                            | 错误码语义、日志脱敏、公开 API 是否需要 TSDoc                      |
| 待自动化   | 后续进入 `standards:check` 或 CI                                                | 跨包边界矩阵、public/internal import、repo layout drift            |

## 2. 语言与版本

- TypeScript：5.x，ESM only。
- Node.js：`package.json` 要求 `>=22.0.0`。
- pnpm：`package.json` 要求 `>=9.15.0`。
- 包必须声明 `"type": "module"`。

## 3. TypeScript 基线

`tsconfig.base.json` 是唯一根基线。以下规则已机器强制：

- `strict`
- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitOverride`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`
- `noUnusedLocals`
- `noUnusedParameters`
- `noPropertyAccessFromIndexSignature`
- `verbatimModuleSyntax`
- `isolatedModules`
- `forceConsistentCasingInFileNames`

禁止为了通过局部代码而放松包级 tsconfig。确需例外时，先在 PR 中说明原因，再更新本文或相关 ADR。

## 4. ESLint / Prettier / Hooks

已机器强制：

- 根 `eslint.config.js` 使用 ESLint flat config。
- `typescript-eslint` strict typed rules。
- 禁止显式 `any`，测试文件除外。
- 禁止 unsafe assignment / call / member access / return。
- 禁止 floating promises。
- 强制 type-only imports / exports。
- 禁止 `console.log`；`console.warn` 与 `console.error` 当前允许。
- 禁止直接使用 `process` / `process.env`。
- 强制 import order。
- 强制文件名 kebab-case。
- Prettier 是唯一格式化器。
- Husky + lint-staged 在提交时对 staged 文件运行 ESLint / Prettier / markdownlint。

人工 gate：

- `console.warn` / `console.error` 只允许临时边界或 CLI 场景；长期业务日志应迁移到 `@cairn/observability`。
- 直接 `process.env` 已被禁止，但统一 config 包尚未创建；新增环境变量前必须说明读取边界。

## 5. 命名

简表：

| 类型        | 规则                          | 示例                                |
| ----------- | ----------------------------- | ----------------------------------- |
| 文件        | kebab-case                    | `orchestration-run-service.ts`      |
| 测试        | 与被测代码同目录，`*.spec.ts` | `orchestration-run-service.spec.ts` |
| 类型 / 接口 | PascalCase                    | `OrchestrationRun`                  |
| 变量 / 函数 | camelCase                     | `dispatchTask`                      |
| 常量        | UPPER_SNAKE                   | `MAX_RETRIES`                       |
| DB / 枚举值 | snake_case                    | `single_worker`                     |
| 包名        | scoped + kebab                | `@cairn/runtime-gateway`            |

完整命名规则见 [`../reference/naming-conventions.md`](../reference/naming-conventions.md)。

## 6. 模块导出与导入

- 每个包通过 `src/index.ts` 暴露默认公开 API。
- `package.json` 中显式 `exports` 的子路径也属于公开 API。
- 跨包引用必须使用 `@cairn/*` alias 或 package export。
- 不允许跨包相对导入 `../../packages/*`。
- 不允许跨包导入其他包的 `src/internal/*`。
- 依赖方向与边界见 [`module-boundaries.md`](./module-boundaries.md)。

## 7. 错误处理

目标规则：

- 业务错误应有稳定 `code`、人类可读 `message`、可选 `cause`。
- API / IPC / runtime 边界必须捕获内部异常并转译为稳定错误码。
- 不把内部异常结构、secret、本地路径或完整 prompt 暴露给外部响应。

当前状态：

- `@cairn/observability` 尚未创建，`BaseError` 规则暂属目标规则。
- 已存在包内错误类型时，应遵守同样的稳定 code 原则。

## 8. 日志规范

目标规则：

- 统一使用 `@cairn/observability` 的 structured logger。
- 日志必须可通过 `trace_id` / `run_id` / `agent_run_id` 关联。
- 不记录 secret、凭据、完整 prompt、业务内容 payload 或未脱敏本地路径。

当前状态：

- `@cairn/observability` 尚未创建。
- ESLint 已禁止 `console.log`，但 `console.warn` / `console.error` 仍需人工 review。

## 9. 异步与并发

- 优先使用 `async` / `await`。
- 明确无依赖并发才使用 `Promise.all`。
- 长任务必须支持 `AbortSignal` 或等价取消机制。
- 不允许隐式 fire-and-forget；必须 `await` 或显式 `void` 并说明原因。
- runtime adapter、workspace-core route、sidecar 生命周期相关代码必须考虑取消与清理。

## 10. 数据库代码

- 所有 SQL 通过 Drizzle 或 repository 封装，不允许字符串拼接 SQL。
- 跨数据库差异必须隐藏在 storage/repository 边界内。
- `domain` 定义 schema，不直接执行 storage 行为。
- `application` 依赖 repository port，不依赖 storage 具体实现。
- schema / migration 变化必须同步 `CHANGELOG.md`，必要时更新 design docs 或 ADR。

## 11. 测试代码

- 测试文件与被测代码同目录，命名 `*.spec.ts`。
- 契约或跨包测试按 [`testing-strategy.md`](./testing-strategy.md) 放置。
- 测试不得包含业务逻辑分支来“复刻实现”。
- 不依赖真实生产数据。
- SQLite 测试使用临时库或 in-memory 策略。
- skip 测试必须说明原因和恢复条件。

## 12. 公开 API 文档

人工 gate：

- `src/index.ts` 导出的稳定 public API 应有 TSDoc。
- package export 子路径暴露的 public API 应有 TSDoc。
- 纯内部 helper 不强制 TSDoc，但复杂决策应注释“为什么”。
- 不写解释代码表面行为的废注释。

TODO 格式：

```ts
// TODO(@owner, 2026-05-16): explain why this remains unresolved.
```

## 13. 提交与 PR

- Commit 标题必须符合 [`commit-convention.md`](./commit-convention.md)。
- 分支和 PR base 必须符合 [`git-workflow.md`](./git-workflow.md)。
- PR 风险分级与验证命令见 [`review-gates.md`](./review-gates.md)。
- PR 大小建议控制在 400 行 diff 左右；超出时拆分或在 PR 说明中解释。

## 14. 变更历史

| 日期       | 变更                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-05-16 | 对齐实际 tsconfig / eslint / hook 状态，拆分命名、模块边界与 review gate 引用 |
| 2026-05-14 | 初版                                                                          |
````

- [ ] **Step 3: Format and validate**

Run:

```bash
pnpm exec prettier --write docs/engineering/coding-standards.md
pnpm exec markdownlint-cli2 docs/engineering/coding-standards.md
pnpm exec prettier --check docs/engineering/coding-standards.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 4: Commit Task 1**

Run:

```bash
git add docs/engineering/coding-standards.md
git commit -m "docs(standards): 对齐代码规范与工具配置 / align coding standards with tooling"
```

Expected: commit succeeds.

## Task 2: Add Naming Conventions Reference

**Files:**

- Create: `docs/reference/naming-conventions.md`
- Modify: `docs/reference/README.md`

- [ ] **Step 1: Verify the naming conventions file does not exist**

Run:

```bash
test ! -e docs/reference/naming-conventions.md
```

Expected: command exits with status `0`.

- [ ] **Step 2: Create `naming-conventions.md`**

Create `docs/reference/naming-conventions.md` with:

```markdown
# 命名约定 / Naming Conventions

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：统一 Cairn 代码、文档、API、DB、事件与 artifact 的命名。

---

## 1. 总原则

- 领域术语以 [`glossary.md`](./glossary.md) 为准。
- 文件、目录和 route 优先使用 kebab-case。
- DB 表、DB 字段、枚举值、事件 type、artifact type 使用 snake_case。
- TypeScript 类型使用 PascalCase。
- 变量和函数使用 camelCase。
- 公开名称宁可长一点，也不要缩写到失去语义。

## 2. 文件与目录

| 对象           | 规则                    | 示例                                  |
| -------------- | ----------------------- | ------------------------------------- |
| 源码文件       | kebab-case              | `orchestration-run-service.ts`        |
| 测试文件       | 被测文件名 + `.spec.ts` | `orchestration-run-service.spec.ts`   |
| React 组件文件 | kebab-case              | `protected-action-dialog.tsx`         |
| 配置文件       | 保留生态约定            | `vite.config.ts`、`drizzle.config.ts` |
| 生成文件       | 保留生成器约定          | Drizzle migration 文件                |

例外必须来自工具生态、生成器或第三方固定入口，不能为个人偏好新增例外。

## 3. TypeScript 符号

| 对象             | 规则                            | 示例                    |
| ---------------- | ------------------------------- | ----------------------- |
| 类型 / 接口 / 类 | PascalCase                      | `OrchestrationRun`      |
| React 组件导出   | PascalCase                      | `ProtectedActionDialog` |
| 变量 / 函数      | camelCase                       | `dispatchTask`          |
| 常量             | UPPER_SNAKE                     | `MAX_RETRIES`           |
| 私有 helper      | camelCase                       | `normalizeRunStatus`    |
| 类型参数         | PascalCase，短泛型可用 `T` 前缀 | `TRow`、`TEvent`        |

## 4. 包与路径别名

| 对象              | 规则                  | 示例                       |
| ----------------- | --------------------- | -------------------------- |
| package name      | `@cairn/<kebab-name>` | `@cairn/runtime-gateway`   |
| package directory | 允许沿用现有目录      | `packages/runtime_gateway` |
| import alias      | `@cairn/<kebab-name>` | `@cairn/shared-contracts`  |

目录名与 package name 不一致时，以 package name 和 `tsconfig.base.json` alias 为导入权威。

## 5. 领域对象

领域对象命名以 PascalCase 表示类型，以 camelCase 表示变量：

| 领域类型         | 类型名             | 变量示例           |
| ---------------- | ------------------ | ------------------ |
| Workspace        | `Workspace`        | `workspace`        |
| Conversation     | `Conversation`     | `conversation`     |
| OrchestrationRun | `OrchestrationRun` | `orchestrationRun` |
| Task             | `Task`             | `task`             |
| AgentRun         | `AgentRun`         | `agentRun`         |
| Artifact         | `Artifact`         | `artifact`         |
| TraceEvent       | `TraceEvent`       | `traceEvent`       |

不要把 `Run`、`Task`、`AgentRun` 混用。术语含义见 [`glossary.md`](./glossary.md)。

## 6. DB 与枚举值

| 对象      | 规则                    | 示例                   |
| --------- | ----------------------- | ---------------------- |
| 表名      | snake_case 复数         | `orchestration_runs`   |
| 字段名    | snake_case              | `workspace_id`         |
| 枚举值    | snake_case              | `single_worker`        |
| migration | 保留 Drizzle 生成器命名 | `0003_last_satana.sql` |

DB 命名优先保证迁移稳定和跨 SQLite / PostgreSQL 可读性。

## 7. HTTP / WebSocket / Artifact

| 对象                 | 规则                       | 示例                 |
| -------------------- | -------------------------- | -------------------- |
| HTTP route           | `/v1` + kebab-case path    | `/v1/code-search`    |
| path param           | camelCase in contract docs | `workspaceId`        |
| JSON field           | camelCase                  | `workspaceId`        |
| WebSocket event type | snake_case                 | `run_status_changed` |
| Artifact type        | snake_case                 | `planner_output`     |
| Runtime capability   | snake_case                 | `streaming_output`   |

如果已有 shared contract 使用不同约定，以 contract 为准，并在变更时统一迁移。

## 8. 禁用与慎用词

禁用：

- `Pipeline`
- `Workflow Builder`
- `Marketplace`
- `Tenant`

慎用：

- `Job`：优先确认是否应为 `Task`、`AgentRun` 或 scheduler 内部概念。
- `Replay`：只表示从 TraceEvent 重建 UI，不表示重新执行。
- `Replan`：只表示新 run 中重新规划，不表示当前 run 内修改 task graph。

## 9. 变更历史

| 日期       | 变更                         |
| ---------- | ---------------------------- |
| 2026-05-16 | 初版：从代码规范拆出命名约定 |
```

- [ ] **Step 3: Update reference README**

Modify `docs/reference/README.md` so its file table includes:

```markdown
| `naming-conventions.md` | 代码、文档、API、DB、事件与 artifact 命名约定 | 🟡 Draft |
```

If the file does not have a table, add a short “文件” section matching the style of `docs/engineering/README.md`.

- [ ] **Step 4: Format and validate**

Run:

```bash
pnpm exec prettier --write docs/reference/naming-conventions.md docs/reference/README.md
pnpm exec markdownlint-cli2 docs/reference/naming-conventions.md docs/reference/README.md
pnpm exec prettier --check docs/reference/naming-conventions.md docs/reference/README.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add docs/reference/naming-conventions.md docs/reference/README.md
git commit -m "docs(reference): 新增命名约定 / add naming conventions"
```

Expected: commit succeeds.

## Task 3: Add Module Boundaries Document

**Files:**

- Create: `docs/engineering/module-boundaries.md`
- Reference: `docs/engineering/repo-layout.md`

- [ ] **Step 1: Verify the module boundaries file does not exist**

Run:

```bash
test ! -e docs/engineering/module-boundaries.md
```

Expected: command exits with status `0`.

- [ ] **Step 2: Create `module-boundaries.md`**

Create `docs/engineering/module-boundaries.md` with:

````markdown
# 模块边界 / Module Boundaries

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：明确 apps / packages 的职责、允许依赖、禁止依赖与 public API 边界。

---

## 1. 定位

`repo-layout.md` 说明仓库结构。本文件说明模块之间可以如何依赖，以及什么行为必须阻止。

核心原则：

- Desktop 与 Web 共享 Workspace Core 语义。
- 业务状态机不进入 route、bridge、adapter 或 UI。
- 跨包依赖只能走 public API。
- 短期可以人工 review，后续进入 `standards:check`。

## 2. 职责矩阵

| 模块                        | 负责                                                                      | 不负责                                           | 允许依赖                                                                  | 禁止依赖 / 禁止行为                                                   |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/shared_contracts` | Zod schemas、HTTP contracts、WS events、跨端 DTO                          | 业务推进、DB 实现、runtime 行为                  | 无业务包                                                                  | `application`、`domain`、`storage`、`runtime_gateway`、`ui`、`apps/*` |
| `packages/domain`           | Drizzle schema、领域枚举、持久化 schema 形状                              | repository 实现、service 编排                    | `shared_contracts`                                                        | `application`、`storage`、`runtime_gateway`、`apps/*`                 |
| `packages/storage`          | SQLite / Postgres 连接、迁移 runner、repository 实现、artifact store 实现 | orchestration 决策、runtime 调用                 | `domain`、`shared_contracts`                                              | `application`、`runtime_gateway`、`apps/*`                            |
| `packages/runtime_gateway`  | RuntimeAdapter 契约、adapter conformance、mock / Codex adapter            | application 状态推进、storage 持久化             | `shared_contracts`                                                        | `application`、`storage`、`apps/*`                                    |
| `packages/application`      | orchestration service、ports、operator action、状态推进                   | storage 具体实现、HTTP route、adapter 子进程细节 | `domain`、`shared_contracts`、`runtime_gateway` 类型 / 端口               | storage 具体实现、workspace-core routes                               |
| `apps/workspace-core`       | HTTP API、组合 application / storage / runtime adapter、进程入口          | 核心业务状态机、桌面桥接、UI 状态                | `application`、`storage`、`runtime_gateway`、`shared_contracts`、`domain` | 把业务状态机写进 route handler                                        |
| `packages/ui`               | UI primitives、feedback、Cairn 业务展示组件                               | runtime 调用、storage、Workspace Core 进程控制   | `shared_contracts`                                                        | `workspace-core`、`storage`、`runtime_gateway`、`desktop_bridge`      |
| `packages/desktop_bridge`   | 桌面系统能力桥接                                                          | 业务编排、状态机、storage 逻辑                   | `shared_contracts`、`observability`                                       | 被 Web / Workspace Core 引用                                          |
| `apps/desktop`              | Electron shell、sidecar 管理、UI 组合                                     | 绕过 Workspace Core 的业务流程                   | `ui`、`shared_contracts`、`desktop_bridge`                                | 直接实现独立 run/task 状态机                                          |
| `apps/web`                  | Web shell、UI 组合、远程 Workspace Core 控制台                            | 嵌入 sidecar、桌面系统能力桥接                   | `ui`、`shared_contracts`                                                  | 直接实现独立 run/task 状态机                                          |

## 3. 导入规则

允许：

```ts
import { runContract } from '@cairn/shared-contracts/contracts';
import { createOrchestrationRunService } from '@cairn/application';
```

禁止跨包相对导入：

```ts
import { runContract } from '../../packages/shared_contracts/src/contracts';
```

禁止跨包 internal 导入：

```ts
import { privateHelper } from '@cairn/application/internal/private-helper';
```

禁止 app 之间互相导入：

```ts
import { something } from '../../web/src/something';
```

## 4. Public API 规则

每个包的 public API 只有：

- `src/index.ts`
- `package.json` 中显式 `exports` 的子路径

新增 public API 时必须：

1. 从 public entrypoint 导出。
2. 补充 TSDoc 或清楚的类型命名。
3. 如涉及 shared contract，补 schema / contract 测试。
4. 更新相关文档或 CHANGELOG。

## 5. Internal 规则

`src/internal/` 表示包内私有实现。其他包不得导入。

如果某个 internal helper 被多个包需要，不能直接跨包引用。应选择：

1. 提升为该包 public API。
2. 移到更合适的共享包。
3. 复制少量无状态逻辑，并在后续抽象前保持局部。

## 6. Review Checklist

提交或 review 时检查：

- [ ] 是否有跨包相对导入？
- [ ] 是否导入了其他包 internal？
- [ ] 是否违反职责矩阵？
- [ ] 是否把业务逻辑塞进 route、bridge、adapter 或 UI？
- [ ] 是否让 Desktop / Web 绕过 Workspace Core？
- [ ] 新 public API 是否通过 package export 暴露？
- [ ] 需要同步的 contract / design / CHANGELOG 是否已更新？

## 7. 后续自动化

后续 `standards:check` 至少检查：

- 跨包相对导入。
- 跨包 internal 导入。
- `@cairn/*` import 是否符合职责矩阵。
- package exports 与 public API 是否一致。

自动化路线见 [`standards-automation.md`](./standards-automation.md)。

## 8. 变更历史

| 日期       | 变更                                                               |
| ---------- | ------------------------------------------------------------------ |
| 2026-05-16 | 初版：定义 package responsibility matrix 与 import/public API 边界 |
````

- [ ] **Step 3: Format and validate**

Run:

```bash
pnpm exec prettier --write docs/engineering/module-boundaries.md
pnpm exec markdownlint-cli2 docs/engineering/module-boundaries.md
pnpm exec prettier --check docs/engineering/module-boundaries.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add docs/engineering/module-boundaries.md
git commit -m "docs(engineering): 新增模块边界规范 / add module boundary rules"
```

Expected: commit succeeds.

## Task 4: Add Review Gates and Route Agent Collaboration

**Files:**

- Create: `docs/engineering/review-gates.md`
- Modify: `docs/engineering/agent-collaboration.md`

- [ ] **Step 1: Verify the review gates file does not exist**

Run:

```bash
test ! -e docs/engineering/review-gates.md
```

Expected: command exits with status `0`.

- [ ] **Step 2: Create `review-gates.md`**

Create `docs/engineering/review-gates.md` with:

````markdown
# Review Gates

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：定义 Cairn 变更的风险分级、必跑验证、文档同步和 review 输出格式。

---

## 1. 定位

本文是工程 review 的权威 gate。AI 协作流程见 [`agent-collaboration.md`](./agent-collaboration.md)，代码规则见 [`coding-standards.md`](./coding-standards.md)，模块边界见 [`module-boundaries.md`](./module-boundaries.md)。

## 2. 风险分级

| 等级    | 典型 diff                                                       | 最低验证要求                                                      |
| ------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Low     | 文档、注释、README 索引、非行为性说明                           | `pnpm run docs:lint`、`pnpm run format:check`、`git diff --check` |
| Medium  | 单包内部逻辑、局部 UI、局部工具配置                             | 相关包 `typecheck` / `lint` / `test` + `git diff --check`         |
| High    | schema、API、迁移、状态机、runtime、storage、安全边界、跨包流程 | `pnpm run check` + 相关包测试 + 设计/ADR/CHANGELOG                |
| Release | 签名、安装器、更新、数据迁移、隐私/遥测、远程部署               | High 要求 + release playbook / 回滚说明                           |

风险取最高项，不按文件数量平均。

## 3. Changed Surfaces

review 必须标出涉及面：

- schema / DB
- API / contract
- state machine
- runtime / adapter
- storage / artifact
- security / privacy
- desktop bridge
- UI
- docs / ADR
- tooling / dependency

## 4. 必须显式检查的问题

### Schema / DB

- 是否新增字段、枚举、索引或迁移？
- 是否说明旧数据兼容策略？
- 是否同步 shared contracts 或 domain docs？

### API / Contract

- 请求、响应、错误码、状态码是否稳定？
- Desktop 与 Web 是否共享同一语义？
- 是否需要 schema / contract 测试？

### State Machine

- 是否修改状态、转移或终态不变量？
- 是否混用 retry / rerun / replan？
- 是否同步 `state-machines.md`？

### Runtime / Storage / Artifact / Trace

- runtime 错误是否被归一化？
- artifact 是否避免大 payload 或源码内容直接进 API？
- TraceEvent 是否支持 replay，而不是重新执行？

### Security / Privacy

- 是否涉及 secret、token、本地路径、诊断导出、遥测 payload？
- 是否上传业务内容？
- 是否绕过 loopback token 或 preload allowlist？

### Module Boundary

- 是否违反 [`module-boundaries.md`](./module-boundaries.md)？
- 是否跨包相对导入？
- 是否导入其他包 internal？
- 是否把业务逻辑塞进 route、adapter、bridge 或 UI？

### Naming

- 新 public API、route、event、artifact type、DB 字段是否符合 [`../reference/naming-conventions.md`](../reference/naming-conventions.md)？

## 5. 文档同步规则

| 变化类型           | 必须检查的文档                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| 产品范围           | `docs/product/`、必要时 ADR                                                            |
| 领域对象 / 状态机  | `docs/design/domain-model.md`、`docs/design/state-machines.md`                         |
| API / adapter      | `docs/contracts/`、shared contracts tests                                              |
| 工程规范           | `docs/engineering/`、`CHANGELOG.md`                                                    |
| 安全 / 隐私        | `docs/design/security-model.md`、`docs/design/telemetry-and-privacy.md`、`docs/legal/` |
| 用户安装 / 排错    | `docs/ops/`                                                                            |
| 用户可见或重要变更 | `CHANGELOG.md`                                                                         |

## 6. Review 输出格式

review 输出必须包含以下字段：

- `Risk:` 只能写 `Low`、`Medium`、`High` 或 `Release`。
- `Changed surfaces:` 写 §3 中实际涉及的 surfaces，用英文逗号分隔。
- `Required verification run:` 逐行列出已经运行或必须运行的命令。
- `Docs updated:` 逐行列出本次已同步的文档；纯代码变更且无需文档时写 `None required`。
- `Findings:` 先列阻塞问题；没有问题时写 `None`。
- `Residual risk:` 列出未覆盖风险；没有剩余风险时写 `None identified`。

示例：

```text
Risk: Low
Changed surfaces: docs, tooling
Required verification run:
- pnpm run docs:lint
- pnpm run format:check
- git diff --check
Docs updated:
- docs/engineering/coding-standards.md
Findings:
- None
Residual risk:
- None identified
```

## 7. 变更历史

| 日期       | 变更                                              |
| ---------- | ------------------------------------------------- |
| 2026-05-16 | 初版：从 agent collaboration 拆出工程 review gate |
````

- [ ] **Step 3: Update `agent-collaboration.md` routing**

Modify `docs/engineering/agent-collaboration.md`:

1. In section 6, replace the detailed seven-item review list with a short pointer:

```markdown
提交或请求 review 前，先按 [`review-gates.md`](./review-gates.md) 给 diff 做风险分级，并输出 risk、changed surfaces、required verification、docs updated、findings 与 residual risk。
```

1. Replace section 7 content with:

```markdown
## 7. Review Risk Gate

工程 review gate 的权威规则已迁移到 [`review-gates.md`](./review-gates.md)。本文件只保留 AI 协作入口与上下文工程提示，避免 gate 规则在多个文档中分叉。
```

1. Keep sections 8 onward intact.

- [ ] **Step 4: Format and validate**

Run:

```bash
pnpm exec prettier --write docs/engineering/review-gates.md docs/engineering/agent-collaboration.md
pnpm exec markdownlint-cli2 docs/engineering/review-gates.md docs/engineering/agent-collaboration.md
pnpm exec prettier --check docs/engineering/review-gates.md docs/engineering/agent-collaboration.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add docs/engineering/review-gates.md docs/engineering/agent-collaboration.md
git commit -m "docs(review): 拆出工程评审门禁 / split engineering review gates"
```

Expected: commit succeeds.

## Task 5: Add Standards Automation Roadmap

**Files:**

- Create: `docs/engineering/standards-automation.md`

- [ ] **Step 1: Verify the standards automation file does not exist**

Run:

```bash
test ! -e docs/engineering/standards-automation.md
```

Expected: command exits with status `0`.

- [ ] **Step 2: Create `standards-automation.md`**

Create `docs/engineering/standards-automation.md` with:

````markdown
# Standards Automation

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：记录工程规范中哪些已自动化、哪些待进入 `standards:check`、哪些保留人工 review。

---

## 1. 定位

本文不定义新规范，只记录规范如何被机器检查。规则来源：

- [`coding-standards.md`](./coding-standards.md)
- [`module-boundaries.md`](./module-boundaries.md)
- [`review-gates.md`](./review-gates.md)
- [`../reference/naming-conventions.md`](../reference/naming-conventions.md)

## 2. 已自动化

| 规则                                                 | 工具                 |
| ---------------------------------------------------- | -------------------- |
| TypeScript strict                                    | `tsconfig.base.json` |
| no explicit any                                      | ESLint               |
| no unsafe assignment / call / member access / return | ESLint               |
| no floating promises                                 | ESLint               |
| no console.log                                       | ESLint               |
| no direct `process` / `process.env`                  | ESLint               |
| import order                                         | ESLint               |
| filename kebab-case                                  | ESLint unicorn       |
| markdown lint                                        | markdownlint-cli2    |
| format                                               | Prettier             |
| bilingual Conventional Commit title                  | commitlint           |

## 3. Phase 2：`standards:check`

目标命令：

```bash
pnpm run standards:check
```

初期非阻塞，不纳入 `pnpm run check`。

第一批检查：

1. 禁止跨包相对导入 `../../packages/*`。
2. 禁止跨包导入 `src/internal/*`。
3. 检查 `@cairn/*` import 是否符合 `module-boundaries.md`。
4. 检查 public API 是否从 `src/index.ts` 或 package `exports` 暴露。
5. 检查新增文件命名是否符合 `naming-conventions.md`，并尊重例外清单。

## 4. Phase 3：CI 接入

接入条件：

- `standards:check` 在至少 5 个连续 PR 中无误伤。
- 例外清单已经写入文档。
- 失败信息能指出具体文件、import 和违反的边界。

接入步骤：

1. 将 `standards:check` 加入 `pnpm run check`。
2. 将对应命令加入 GitHub CI。
3. 在 `review-gates.md` 中把模块边界部分标为机器 gate。

## 5. 暂不自动化

以下规则继续人工 review：

- 错误码是否语义正确。
- 日志是否泄露业务内容、secret 或本地路径。
- 状态机设计是否符合产品语义。
- UI 是否过早绑定未定型 API。
- 是否需要 ADR。
- 是否违反产品边界。

## 6. 变更历史

| 日期       | 变更                                          |
| ---------- | --------------------------------------------- |
| 2026-05-16 | 初版：记录已自动化规则与 standards:check 路线 |
````

- [ ] **Step 3: Format and validate**

Run:

```bash
pnpm exec prettier --write docs/engineering/standards-automation.md
pnpm exec markdownlint-cli2 docs/engineering/standards-automation.md
pnpm exec prettier --check docs/engineering/standards-automation.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 4: Commit Task 5**

Run:

```bash
git add docs/engineering/standards-automation.md
git commit -m "docs(standards): 记录规范自动化路线 / document standards automation roadmap"
```

Expected: commit succeeds.

## Task 6: Update Indexes and Changelog

**Files:**

- Modify: `docs/engineering/README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update engineering README**

Modify `docs/engineering/README.md` file table to include:

```markdown
| `module-boundaries.md` | 包职责、依赖方向、public/internal API 边界 | 🟡 Draft |
| `review-gates.md` | 风险分级、验证命令、文档同步与 review 输出模板 | 🟡 Draft |
| `standards-automation.md` | 已自动化规则、standards:check 与 CI 接入路线 | 🟡 Draft |
```

Also update `coding-standards.md` description to:

```markdown
| `coding-standards.md` | TS/ESM、错误处理、日志、异步、数据库、测试与公开 API 规则 | 🟡 Draft |
```

- [ ] **Step 2: Update changelog**

Under `[Unreleased]` → `Added`, add:

```markdown
- 新增工程规范补强文档体系：命名约定、模块边界、review gates 与 standards automation 路线
```

Under `[Unreleased]` → `Changed`, add:

```markdown
- `coding-standards.md` 对齐当前 TypeScript、ESLint、Prettier、commitlint 与人工 review gate 状态
```

- [ ] **Step 3: Format and validate**

Run:

```bash
pnpm exec prettier --write docs/engineering/README.md CHANGELOG.md
pnpm exec markdownlint-cli2 docs/engineering/README.md CHANGELOG.md
pnpm exec prettier --check docs/engineering/README.md CHANGELOG.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 4: Commit Task 6**

Run:

```bash
git add docs/engineering/README.md CHANGELOG.md
git commit -m "docs(engineering): 更新规范文档索引 / update standards documentation index"
```

Expected: commit succeeds.

## Task 7: Final Documentation Validation

**Files:**

- Check all files modified by this plan.

- [ ] **Step 1: Run docs validation**

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

- [ ] **Step 2: Verify all expected files exist**

Run:

```bash
test -f docs/engineering/coding-standards.md
test -f docs/reference/naming-conventions.md
test -f docs/engineering/module-boundaries.md
test -f docs/engineering/review-gates.md
test -f docs/engineering/standards-automation.md
```

Expected: all commands exit with status `0`.

- [ ] **Step 3: Verify working tree**

Run:

```bash
git status --short --branch
git log --oneline --decorate --max-count=10
```

Expected: working tree clean. Recent commits include Tasks 1-6.

## Follow-Up Plan: standards:check Implementation

After Phase 1 lands and is reviewed, create a separate plan for Phase 2:

```text
docs/superpowers/plans/YYYY-MM-DD-standards-check.md
```

That plan should implement a small script under `scripts/standards-check.*` or another established scripts location, add `pnpm run standards:check`, and keep it out of `pnpm run check` until Phase 3.

## Self-Review Checklist

- Spec coverage: Tasks cover coding standards, naming conventions, module boundaries, review gates, standards automation, indexes, changelog, and validation.
- Scope control: Plan is documentation-only and does not change ESLint, TypeScript, package structure, or CI.
- Exact paths: Every file path is explicit.
- No placeholders: All new document content is provided inline.
- Validation: Each task includes markdownlint and Prettier checks; final validation includes repository docs lint, format check, and diff check.
