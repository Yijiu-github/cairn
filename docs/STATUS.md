# 项目状态 / Project Status

> 状态：🟡 Draft
> 最后更新：2026-05-16
> 目的：给人类与多 agent 协作提供当前事实基线，减少“我以为已经有 Desktop/Web”的误判。

---

## 1. 一句话状态

Cairn 现在处于 **R1 工程基线 + Workspace Core 最小闭环建设阶段**。

已经可运行的主线是共享契约、领域 schema、SQLite storage、Runtime Gateway、Application 编排基线、`apps/workspace-core` 的最小 Fastify 服务，以及静态 `apps/ui-preview` 预览应用。Desktop Shell 与 Web Shell 还没有创建。

---

## 2. 当前可用能力

### Monorepo 与工程基线

- pnpm workspace + Turborepo 已就位。
- TypeScript strict、ESM、ESLint、Prettier、markdownlint、commitlint、Husky 基线已就位。
- Apache-2.0 License 与 NOTICE 已就位。

### 已存在 apps / packages

| 路径                        | 状态      | 当前能力                                                                     |
| --------------------------- | --------- | ---------------------------------------------------------------------------- |
| `apps/workspace-core`       | 🟢 可用   | Fastify 最小服务，包含 `/health`、run/task/agent-run 闭环与 code context API |
| `apps/ui-preview`           | 🟡 基线   | 静态 UI 组件与产品视图预览应用，可 production build                          |
| `apps/desktop`              | ⚪ 未创建 | Electron Desktop Shell 尚未启动                                              |
| `apps/web`                  | ⚪ 未创建 | Web Shell 尚未启动                                                           |
| `packages/shared_contracts` | 🟢 可用   | Zod schemas、ts-rest contracts、Run WebSocket events                         |
| `packages/domain`           | 🟢 可用   | Drizzle SQLite-first schema 与迁移                                           |
| `packages/storage`          | 🟢 可用   | better-sqlite3 连接封装、PRAGMA 初始化、domain 迁移 runner                   |
| `packages/runtime_gateway`  | 🟢 可用   | RuntimeAdapter 契约、mock adapter、Codex CLI JSONL / process 基线            |
| `packages/application`      | 🟢 可用   | OrchestrationRun service、repository ports、CodeContext service              |
| `packages/ui`               | 🟡 基线   | 共享 UI tokens、primitives、feedback 与 Cairn 业务组件基线                   |

### Workspace Core

- `GET /health` 健康检查。
- R1 run/task/agent-run HTTP 闭环：可创建 single-worker run，并通过 mock runtime 验证状态推进。
- Orchestration Control R1a API：pause / resume / cancel run、retry task、rerun、operator note 的最小 HTTP 接管面；取消仍是 application state change，尚未调用真实 runtime kill。
- SQLite application repository：服务启动可执行 domain 迁移，并用本地 SQLite 持久化 run/task/agent-run 状态。
- Code Context R1a/R1b-a API：
  - 注册与列出 SourceRoot。
  - 手动 reindex 本地目录，生成 privacy-aware 文件清单。
  - 查询最新索引快照。
  - 按路径 / 语言等元数据搜索文件清单。
  - 基于 code-search 结果创建 metadata-only ContextPack manifest。

### Runtime Gateway

- `RuntimeAdapter` 接口与 capability profile 基线。
- Mock runtime adapter 用于 application / workspace-core 测试。
- Codex CLI adapter 基线：
  - `codex exec --json` 参数构造。
  - JSONL 输出解析。
  - stdout/stderr、非零退出、spawn error、取消升级 kill 的错误映射。

### UI package / UI preview

- `packages/ui` 已提供共享 tokens、primitives、feedback 与 Cairn 业务组件基线。
- `apps/ui-preview` 已提供静态产品视图预览：
  - Home Inbox preview。
  - Run Detail preview。
  - Artifact Review preview。
  - Components Gallery preview。
- UI preview 是静态预览层，不代表 `apps/web` 或 `apps/desktop` 已启动。

---

## 3. 测试与验证基线

### 常用验证命令

| 命令                                    | 用途                                        |
| --------------------------------------- | ------------------------------------------- |
| `pnpm run docs:lint`                    | Markdown 规范检查                           |
| `pnpm run format:check`                 | Prettier 格式检查                           |
| `pnpm run lint`                         | 全仓 ESLint                                 |
| `pnpm run typecheck`                    | 全仓 TypeScript 类型检查                    |
| `pnpm test`                             | 全仓 Vitest 测试                            |
| `pnpm --filter @cairn/ui-preview build` | UI preview production build 验证            |
| `pnpm run check`                        | typecheck + lint + docs lint + format check |
| `git diff --check`                      | 空白、冲突标记、行尾问题检查                |

提交前至少跑与改动范围匹配的命令；跨契约 / schema / application / workspace-core 的改动优先跑 `pnpm run check`。

### 当前测试覆盖分布

| 包 / 应用                   | `*.spec.ts` 数量 | 覆盖重点                                                 |
| --------------------------- | ---------------- | -------------------------------------------------------- |
| `packages/shared_contracts` | 11               | schema、contracts、WS events、ID / enum 基础             |
| `packages/domain`           | 1                | 生成迁移与核心表结构                                     |
| `packages/storage`          | 2                | SQLite connection 与迁移目录                             |
| `packages/runtime_gateway`  | 3                | mock adapter、Codex protocol、Codex process wrapper      |
| `packages/application`      | 2                | orchestration service 与 code context service            |
| `packages/ui`               | 1                | 公共导出与 token / primitive smoke test                  |
| `apps/ui-preview`           | 0                | 当前以 typecheck / lint / production build 作为验证门禁  |
| `apps/workspace-core`       | 3                | Fastify app、SQLite repository、local code index scanner |

### 本地环境注意事项

- `.nvmrc` 目标 Node 为 22；当前仓库已经升级 `better-sqlite3` catalog 到可在 Node 24.14.0 本机安装 native binding 的版本。
- Node 26.0.0 下 `pnpm install --frozen-lockfile`、`pnpm run check`、`pnpm test` 与 `pnpm --filter @cairn/ui-preview build` 可通过；`better-sqlite3` 可能因预编译包不可用而走本地编译，并出现 V8 deprecation warnings。
- 如果 SQLite 相关测试因 native binding 缺失失败，优先重新 `pnpm install`，再跑 `pnpm --filter @cairn/storage test` 与 `pnpm --filter @cairn/workspace-core test`。
- 不要因为本机 Node 版本不一致就删除或长期 skip SQLite 测试；skip 必须有明确原因与后续处理记录。

---

## 4. R1 已完成能力

这些能力已经有代码或明确文档基线：

- 工程基线：monorepo、lint、format、typecheck、test、commit hooks。
- 文档基线：product / design / adr / contracts / engineering / ops / legal / reference 分层。
- ADR-0001 ~ ADR-0017 已落档。
- `@cairn/shared-contracts`：核心领域 schema、API contract、run event schema。
- `@cairn/domain`：核心协作对象与 code context 元数据 schema。
- `@cairn/storage`：SQLite-first connection 与 migration runner。
- `@cairn/runtime-gateway`：RuntimeAdapter 契约、mock adapter、Codex CLI adapter 基线。
- `@cairn/application`：single-worker orchestration 与 code context service。
- `@cairn/workspace-core`：最小服务、SQLite 持久化、code context R1a/R1b-a API。
- Orchestration Control R1a：`@cairn/application` 与 `@cairn/workspace-core` 支持最小 operator control plane，覆盖 pause / resume / cancel / retry task / rerun / operator note。
- Code Context R1a/R1b-a：
  - SourceRoot registry。
  - 本地文件清单 reindex。
  - metadata-only code search。
  - metadata-only ContextPack manifest。
  - excerpt 行号范围与保守 token 估算。
- `@cairn/ui`：共享 UI 包基线。
- `apps/ui-preview`：静态 UI 组件与产品视图预览应用，可用于验证 `packages/ui` 的产品组合形态。

---

## 5. R1 未完成能力

这些仍然不能假设已经存在：

- `apps/desktop` Electron Desktop Shell。
- `apps/web` React Web Shell。
- UI preview 不是 Web Shell，不能假设已有远程 workspace 控制台。
- Desktop sidecar 生命周期管理、loopback token、preload / contextBridge allowlist。
- Artifact store 的真实文件内容写入、保留策略与导出。
- Orchestration Planner 的真实 planning 输出与多 task DAG。
- Goal Planner 的 action tree、preconditions、blocked reason、replan reason 持久化。
- Runtime Gateway 接入真实 Codex CLI 任务的端到端 workspace-core 流程。
- 真实 Runtime Gateway cancellation / kill、AgentRun retry、protected step approve/reject 与 operator control UI。
- TraceEvent 持久化与 replay UI。
- 代码上下文索引的文本搜索、symbol outline、import/export dependency edge。
- Desktop / Web 的 Chat、Runs、Tasks、Run Detail、Artifact、Trace 视图。
- macOS / Windows 签名、公证、安装器、更新引导。
- 面向用户的 install guide、troubleshooting、privacy statement 公开版完善。

---

## 6. 近期主线

建议近期按以下顺序推进：

1. **Application / Workspace Core orchestration API**：补齐 run lifecycle、operator action、retry/rerun/cancel 的 shared contracts、application ports 与 workspace-core routes。
2. **Planning 输出模型**：让 `planner_output_ref` 指向可回放的 planning artifact，包含 action tree、preconditions、blocked reason、replan reason，但不做 workflow builder。
3. **Code Context R1b**：补文本搜索、TS/JS symbol outline、import/export edges，并让 Planner 能消费 ContextPack。
4. **Runtime Gateway 真实闭环**：将 Codex CLI adapter 接进 workspace-core 的实际执行路径，形成可观测的 AgentRun 流。
5. **Artifact / Trace 基线**：把 input/output/planner/context/trace 的 artifact 元数据与文件存储边界打通。
6. **Desktop Shell 启动 slice**：在 Workspace Core 与 Codex adapter 闭环稳定后，再启动 Electron shell、sidecar 管理与 UI 接入。

---

## 7. 协作提醒

- 开始任何任务前先读 `AGENTS.md`、产品边界、术语表、主设计文档和任务相关文档。
- 不要引用不存在的 `apps/desktop/src` 或 `apps/web/src`。
- UI 主线可能有其他 agent 并行开发，改 UI 文档或 `packages/ui` 前先看 `git status` 与相关 diff。
- 重大更新、接口、状态机、安全边界、数据模型、迁移策略必须同步相关 docs 与 `CHANGELOG.md`。
- 外部项目只作为参考雷达，详见 [`reference/external-project-radar.md`](reference/external-project-radar.md)。

---

## 8. 变更历史

| 日期       | 变更                                                         |
| ---------- | ------------------------------------------------------------ |
| 2026-05-16 | 补充 UI preview、Node 26 验证观察项与工程体检同步建议        |
| 2026-05-15 | 初版：记录当前能力、测试基线、R1 完成 / 未完成能力与近期主线 |
