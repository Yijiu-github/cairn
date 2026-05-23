# 项目状态 / Project Status

> 状态：🟡 Draft
> 最后更新：2026-05-22
> 目的：给人类与多 agent 协作提供当前事实基线，减少“我以为已经有 Desktop/Web”的误判。
> 协作口径：自 2026-05-20 起，Cairn 当前按产品裁剪人 + Codex 两方推进；旧的白霓 / 海棠固定角色分工不再作为项目计划依据。

---

## 1. 一句话状态

Cairn 现在处于 **R1 工程基线 + Workspace Core 最小闭环建设阶段**。

已经可运行的主线是共享契约、领域 schema、SQLite storage、Runtime Gateway、Application 编排基线、`apps/workspace-core` 的最小 Fastify 服务、静态 `apps/ui-preview` 预览应用，以及 `apps/desktop` 的 Electron shell 骨架与最小 Workspace Core dev sidecar bridge。Web Shell 还没有创建。

当前第一轮**内部开发者试用**以 `docs/ops/internal-trial-runbook.md` 为统一口径，目标是验证 `Desktop + embedded Workspace Core + Codex runtime` 的最小真实闭环。Desktop 默认 sidecar runtime 仍为 mock；真实 Codex 需通过环境变量显式 opt-in。本阶段不是外部 alpha，不包含 `apps/web`、安装器、签名或公证。

---

## 2. 当前可用能力

### Monorepo 与工程基线

- pnpm workspace + Turborepo 已就位。
- TypeScript strict、ESM、ESLint、Prettier、markdownlint、commitlint、Husky 基线已就位。
- Apache-2.0 License 与 NOTICE 已就位。

### 已存在 apps / packages

| 路径                        | 状态      | 当前能力                                                                                      |
| --------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `apps/workspace-core`       | 🟢 可用   | Fastify 最小服务，包含 `/health`、run/task/agent-run 闭环与 code context API                  |
| `apps/ui-preview`           | 🟡 基线   | 静态 UI 组件与产品视图预览应用，可 production build                                           |
| `apps/desktop`              | 🟡 骨架   | Electron Desktop Shell 骨架，包含 main / preload / renderer、静态 UI 壳视图与最小 Core bridge |
| `apps/web`                  | ⚪ 未创建 | Web Shell 尚未启动                                                                            |
| `packages/shared_contracts` | 🟢 可用   | Zod schemas、ts-rest contracts、Run WebSocket events                                          |
| `packages/domain`           | 🟢 可用   | Drizzle SQLite-first schema 与迁移                                                            |
| `packages/storage`          | 🟢 可用   | better-sqlite3 连接封装、PRAGMA 初始化、domain 迁移 runner                                    |
| `packages/runtime_gateway`  | 🟢 可用   | RuntimeAdapter 契约、mock adapter、Codex CLI JSONL / process / adapter 生命周期基线           |
| `packages/application`      | 🟢 可用   | OrchestrationRun service、repository ports、CodeContext service                               |
| `packages/ui`               | 🟡 基线   | 共享 UI tokens、primitives、feedback 与 Cairn 业务组件基线                                    |

### Workspace Core

- `GET /health` 健康检查。
- R1 run/task/agent-run HTTP 闭环：可创建 single-worker run，并通过 mock runtime 验证状态推进。
- R1 runtime artifact/trace demo loop：可提交任务、写入 bounded artifact payload refs，并通过 `GET /v1/artifacts/:artifactId/payload` 读取 payload text。
- `GET /v1/runs/:runId/replay-source` 提供 Inspector-ready 聚合证据包；artifact payload 仍通过 bounded payload API 懒加载。
- Runtime gateway factory：服务默认使用 mock runtime，也可通过 `CAIRN_WORKSPACE_CORE_RUNTIME=codex` 显式注入 Codex RuntimeAdapter。
- Operator control：pause / resume / cancel run、retry task、rerun 与 operator note 的最小 HTTP 接管面；cancel / retry / rerun 已补齐 TraceEvent evidence。
- SQLite application repository：服务启动可执行 domain 迁移，并用本地 SQLite 持久化 run/task/agent-run 状态。
- Code Context API：注册 / 列出 SourceRoot，手动 reindex 本地目录，查询最新索引快照，并基于 code-search 结果创建 metadata-only ContextPack manifest。

### Runtime Gateway

- `RuntimeAdapter` 接口与 capability profile 基线。
- Mock runtime adapter 用于 application / workspace-core 测试。
- Codex CLI adapter 基线：
  - `codex exec --json` 参数构造。
  - JSONL 输出解析。
  - stdout/stderr、非零退出、spawn error、取消升级 kill 的错误映射。
  - `createCodexRuntimeAdapter` 最小 submit / stream / cancel / query 生命周期封装。

### UI package / UI preview

- `packages/ui` 已提供共享 tokens、primitives、feedback 与 Cairn 业务组件基线。
- `apps/ui-preview` 已提供静态产品视图预览：
  - Desktop Shell preview。
  - Home Inbox preview。
  - Run Detail preview。
  - Artifact Review preview。
  - Components Gallery preview。
- UI preview 是静态预览层，不代表 `apps/web` 已启动。

### Desktop Shell

- `apps/desktop` 已提供 Electron 最小 shell 骨架。
- 当前包含 main / preload / renderer、Mission Control 风格 Home 首屏、Run Detail / Artifact Review / Settings 壳视图，以及最小 Workspace Core dev sidecar bridge。
- Renderer 壳新增简体中文 / English 切换，默认 `zh-CN`，语言偏好只保存在本地 `localStorage`；当前是 Desktop 内部试用壳的轻量实现，不代表 `apps/web` 已创建。
- Home 首屏已从内部观察面板调整为更面向用户的“派活工作台”：突出“派发给总 Agent”、Agent 统计、运行中的 Agent 与最近进展；右侧继续收口为“下一步 / 待处理”主区与更轻的“已固定运行”摘要，任务草稿目前只保存在 renderer 本地，按钮仍触发 bounded internal-trial 路径，不是自由文本 Supervisor 执行入口。
- 默认简中已将 Home 与第一轮 Run Detail / Artifact payload / Settings 会看到的主要状态词收敛为“本地运行服务 / 运行安全 / 回放证据 / 运行编号 / 桌面桥接范围”等用户可读口径；底层仍是 Workspace Core dev sidecar bridge，不代表完整产品 UI 或真实自由文本派发已完成。
- Desktop main 可用 per-launch token 启动 loopback Workspace Core sidecar，并在创建窗口后后台等待 sidecar 健康检查；preload 暴露 `workspaceCore.getStatus()`、`workspaceCore.runInternalTrial()`、`workspaceCore.getRunReplaySource(runId)`、`workspaceCore.getArtifactPayload(artifactId)` 与最小 operator action allowlist（cancel / retry / rerun / operator note）。
- Renderer 可通过 internal-trial 入口创建 run、读取 task、提交 AgentRun、drain runtime，在 Run Detail 按需读取 bounded payload text，并调用最小 operator action allowlist。默认 sidecar 走 mock runtime；`CAIRN_DESKTOP_SIDECAR_RUNTIME=codex` 仅用于观察 Codex-backed Workspace Core sidecar 产生的真实 run evidence。
- Desktop 额外提供 `pnpm --filter @cairn/desktop smoke:codex` 作为 opt-in 的真实 Codex window-level smoke；它会要求 `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex`，并通过现有 Desktop 窗口驱动 internal-trial、replay evidence 与 operator note 口径，但不进入默认 CI。
- 启动会写入不含 token 的 sidecar 诊断快照：`<userData>/diagnostics/workspace-core-sidecar.json`，其中记录 `runtime: "mock" | "codex"` 以区分本次 sidecar 后端。
- 当前不读取或写入用户本地文件系统，不暴露真实本地路径；operator action 仅保留最小 internal-trial allowlist，不是完整接管台。
- 自动化验证已覆盖 Desktop bootstrap 顺序、main module 非阻塞加载、sidecar manager、Workspace Core HTTP smoke 与默认 mock sidecar 的最小 window-level Electron smoke；`smoke:codex` 已可作为本机 opt-in 真实 Codex window-level evidence smoke。
- 当前 `@cairn/desktop test:e2e` 只覆盖窗口 ready smoke，不会自动触发 `runInternalTrial()`、读取 replay evidence 或验证 operator note；真实 Codex window-level smoke 需通过 `smoke:codex` 和专用环境 opt-in。
- 当前 renderer 默认安全基线为 `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。

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
| `pnpm --filter @cairn/desktop build`    | Desktop shell production build 验证         |
| `pnpm run check`                        | typecheck + lint + docs lint + format check |
| `git diff --check`                      | 空白、冲突标记、行尾问题检查                |

提交前至少跑与改动范围匹配的命令；跨契约 / schema / application / workspace-core 的改动优先跑 `pnpm run check`。

### 当前测试覆盖分布

| 包 / 应用                   | `*.spec.ts` 数量 | 覆盖重点                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared_contracts` | 16               | schema、contracts、WS events、ID / enum 基础                                                                                                                                                                                                                                                             |
| `packages/domain`           | 1                | 生成迁移与核心表结构                                                                                                                                                                                                                                                                                     |
| `packages/storage`          | 2                | SQLite connection 与迁移目录                                                                                                                                                                                                                                                                             |
| `packages/runtime_gateway`  | 4                | mock adapter、Codex protocol、Codex process wrapper、Codex RuntimeAdapter                                                                                                                                                                                                                                |
| `packages/application`      | 3                | orchestration、planning output 与 code context service                                                                                                                                                                                                                                                   |
| `packages/ui`               | 1                | 公共导出与 token / primitive smoke test                                                                                                                                                                                                                                                                  |
| `apps/ui-preview`           | 1                | preview model / static data smoke，当前以 typecheck / lint / production build 作为验证门禁                                                                                                                                                                                                               |
| `apps/desktop`              | 12               | main module 非阻塞加载、bootstrap 顺序、sidecar manager、Workspace Core internal-trial client、renderer Mission Control home / task draft、locale copy、replay/payload/operator action loaders 与 Run Detail copy helper（含空 run id / 乱序防护）、Electron Vite config；另以 typecheck/lint/build 验证 |
| `apps/workspace-core`       | 6                | Fastify app、config、SQLite repository、runtime gateway factory、local artifact store、local code index scanner                                                                                                                                                                                          |

### 本地环境注意事项

- `.nvmrc` 目标 Node 为 22；当前仓库已经升级 `better-sqlite3` catalog 到可在 Node 24.14.0 本机安装 native binding 的版本。
- Node 26.0.0 下 `pnpm install --frozen-lockfile`、`pnpm run check`、`pnpm test` 与 `pnpm --filter @cairn/ui-preview build` 可通过；`better-sqlite3` 可能因预编译包不可用而走本地编译，并出现 V8 deprecation warnings。
- 如果 SQLite 相关测试因 native binding 缺失失败，优先重新 `pnpm install`，再跑 `pnpm --filter @cairn/storage test` 与 `pnpm --filter @cairn/workspace-core test`。
- 不要因为本机 Node 版本不一致就删除或长期 skip SQLite 测试；skip 必须有明确原因与后续处理记录。

### 内部试用口径

- 统一 runbook：[`ops/internal-trial-runbook.md`](ops/internal-trial-runbook.md)
- 统一自动化 gate：`pnpm run check`、`pnpm test`、`pnpm --filter @cairn/ui-preview build`、`pnpm --filter @cairn/desktop build`；`pnpm --filter @cairn/desktop test:e2e` 只验证默认 mock sidecar 的窗口级 smoke
- 统一手动 gate：至少完成一次真实 Codex 短任务 smoke，确认终态、replay evidence 与最小 operator action 口径
- 统一记录方式：区分“自动化已验证”“手动已验证”“本次未执行”

---

## 4. R1 已完成能力

这些能力已经有代码或明确文档基线：

- 工程基线：monorepo、lint、format、typecheck、test、commit hooks。
- 文档基线：product / design / adr / contracts / engineering / ops / legal / reference 分层。
- ADR-0001 ~ ADR-0017 已落档。
- `@cairn/shared-contracts`：核心领域 schema、API contract、run event schema、PlanningOutput schema。
- `@cairn/domain`：核心协作对象、code context 元数据与 PlanningOutput schema。
- `@cairn/storage`：SQLite-first connection 与 migration runner。
- `@cairn/runtime-gateway`：RuntimeAdapter 契约、mock adapter、Codex CLI adapter 生命周期基线。
- `@cairn/application`：single-worker orchestration、planning output 与 code context service。
- `@cairn/workspace-core`：最小服务、SQLite 持久化、code context R1a/R1b-a API 与显式 Codex runtime gateway factory。
- Orchestration Control R1a/M3 evidence：`@cairn/application` 与 `@cairn/workspace-core` 支持最小 operator control plane，覆盖 pause / resume / cancel / retry task / rerun 与 operator note；取消链路记录 runtime requested / acknowledged / warning evidence，retry / rerun 记录最小恢复证据。
- Code Context R1a/R1b-a：
  - SourceRoot registry。
  - 本地文件清单 reindex。
  - metadata-only code search。
  - metadata-only ContextPack manifest。
  - excerpt 行号范围与保守 token 估算。
- Planning Output Model：`planner_output_ref` 指向独立 PlanningOutput，支持 action tree、preconditions、blocked reason、replan reason 的 schema / storage / application 闭环，并保留 TraceEvent 镜像。
- Planning Output read API：Workspace Core 提供 `GET /v1/runs/:runId/planning-output`。
- Runtime Drain Slice：Workspace Core 可把 submitted AgentRun 的 AdapterStreamEvent 应用回 run/task/agent-run 状态，并已有 RuntimeAdapter-backed gateway 注入测试。
- M1 real-runtime loop：Codex adapter 确定性短任务 smoke 与 Workspace Core RuntimeAdapter-backed submit/drain 证明都在自动化测试内；真实 Codex CLI smoke 已文档化为 opt-in 手动流程，且 2026-05-21 已完成一次 Workspace Core + Codex API 手动成功记录。
- Artifact / Trace Read API：Workspace Core 提供 Artifact metadata、bounded artifact payload 与 run trace timeline/read 只读接口。
- Artifact / Trace Replay Source M2 milestone：Workspace Core 已落地 `GET /v1/runs/:runId/replay-source`，聚合 run/task/agent-run/artifact metadata/trace timeline 与轻量 Inspector 摘要。
- Local Artifact Store M2：本地 payload 写入采用同目录临时文件 + rename，payload ref 保持 opaque 且不暴露本地路径。
- `@cairn/ui`：共享 UI 包基线。
- `apps/ui-preview`：静态 UI 组件与产品视图预览应用，可用于验证 `packages/ui` 的产品组合形态。
- `apps/desktop`：Electron 最小 shell 骨架，包含 main / preload / renderer、Mission Control 风格 Home 首屏、Run Detail / Artifact Review / Settings 壳视图、最小 Workspace Core dev sidecar bridge、internal-trial allowlist、只读 replay-source / bounded artifact payload bridge、最小 operator action bridge，以及 preview-safe 默认隔离设置。

---

## 5. R1 未完成能力

这些仍然不能假设已经存在：

- `apps/web` React Web Shell。
- UI preview 不是 Web Shell，不能假设已有远程 workspace 控制台。
- Desktop 生产 sidecar 打包、签名后内嵌启动与完整 preload / contextBridge allowlist。
- Desktop 完整真实 Workspace Core UI 接入、Chat、Runs、Tasks、Run Detail、Artifact、Trace 视图（当前已有 internal-trial 入口与只读 replay-source 摘要，不是完整产品数据面）。
- Desktop 完整 operator action UI、完整 Artifact workspace、run 列表 / 选择器与本地路径 reveal。
- Artifact store 的导出、清理/retention、hash 校验与更完整 review metadata。
- 真实 Goal Planner 与 Planner 到多 Task DAG 的生成逻辑。
- Desktop 真实 Codex 自动化 window-level e2e，以及更完整的 payload / long-run 证据收集。
- 真实 Runtime Gateway cancellation / kill、AgentRun retry、protected step approve/reject 与 operator control UI。
- TraceEvent replay UI。
- 代码上下文索引的文本搜索、symbol outline、import/export dependency edge。
- macOS / Windows 签名、公证、安装器、更新引导。
- 面向用户的 install guide、troubleshooting、privacy statement 公开版完善。

### 第一轮内部试用的非目标

- 不是公开 alpha 或外部用户试用
- 不是 installer/package/signing/notarization 验证
- 不是 Desktop 完整产品 UI 验证
- 不是 Web Shell 启动或远程 workspace 验证
- 不是复杂 operator workflow、审批流或多租户治理验证

### 第一轮内部试用的已知限制

- 真实 Codex CLI smoke 仍为手动步骤，不进入默认 CI；当前已有 Workspace Core API 主路径成功、Desktop window-level trial 成功和默认 mock sidecar window-level smoke，但仍不等同于真实 Codex 完整自动化 E2E 已覆盖。
- Desktop 当前 Home 首屏已转向“派活工作台”体验，但真实数据面与交互仍有限；自由文本派发、自动创建多子 Agent、完整 operator cockpit 仍未完成。
- 最小 operator action 只验证口径，不代表完整人工接管台已完成。
- 长任务、复杂 payload、跨平台取消链路仍需要后续额外证据。

---

## 6. 近期主线

当前 R1 主线按证据链优先推进：Workspace Core 真实 Run 生命周期 -> Codex RuntimeAdapter 可观测执行 -> Artifact / Trace 证据层 -> Operator control -> Desktop 真实观察台 -> 0.1.0 预发布硬化。

### Week of 2026-05-18

目标：完成战略定位刷新，并补齐 PlanningOutput 的读取面，让 UI preview 和后续 Desktop Shell 可以消费规划结果。

1. **战略文档刷新**：更新 README、positioning、roadmap，并新增 competitive positioning 文档。
2. **Planning Output API slice**：为 Workspace Core 增加 PlanningOutput 读取接口，只读返回现有 application/storage 数据，不实现真实 Planner。
3. **R1 demo-loop 收口**：补齐 runtime submit、bounded artifact payload read、trace replay 说明与 smoke note。
4. **Desktop Shell dev bridge 收口**：补齐生产 sidecar 打包策略、完整 Core 状态/错误展示，以及自动化 window-level smoke 覆盖。
5. **验证门禁**：保持 `pnpm run check`、`pnpm test`、`pnpm --filter @cairn/ui-preview build` 通过。

### Week of 2026-05-25

目标：推进 R1 控制台护城河，优先把 Codex runtime 真实闭环和 Artifact / Trace 基线接近可演示状态。

1. **Runtime Gateway 真实闭环**：在 M1 自动化证据基础上，继续收集真实 Codex CLI opt-in smoke 证据，并完善可观测 AgentRun 流。
2. **Artifact / Trace 基线**：明确 artifact store 的文件边界、payload 引用、TraceEvent replay 输入格式。
3. **Operator control polish**：补齐取消、runtime kill、失败映射与重试路径的最小真实行为。
4. **Desktop Shell 接入准备**：在当前 Electron 静态骨架上，继续补齐完整产品数据面、artifact payload viewer、trace/replay 观察和更完善的 operator UI。

### 暂不插队

- 不启动企业级团队权限。
- 不做 marketplace。
- 不做 workflow builder。
- 不创建 `apps/web`。
- 不把 `apps/desktop` 当前首屏误写成完整产品 UI；当前仍是 Mission Control 风格首轮体验壳 + internal-trial allowlist。

---

## 7. 协作提醒

- 开始任何任务前先读 `AGENTS.md`、产品边界、术语表、主设计文档和任务相关文档。
- 不要引用尚未创建的 `apps/web/src`；`apps/desktop/src` 当前已有最小 Workspace Core dev sidecar bridge 与 internal-trial allowlist，但仍不能假设已有完整产品数据面或完整 operator UI。
- UI 主线可能有其他 agent 并行开发，改 UI 文档或 `packages/ui` 前先看 `git status` 与相关 diff。
- 重大更新、接口、状态机、安全边界、数据模型、迁移策略必须同步相关 docs 与 `CHANGELOG.md`。
- 外部项目只作为参考雷达，详见 [`reference/external-project-radar.md`](reference/external-project-radar.md)。

---

## 8. 变更历史

| 日期       | 变更                                                            |
| ---------- | --------------------------------------------------------------- |
| 2026-05-20 | 更新 M4a Desktop observer prep 状态                             |
| 2026-05-20 | 更新 M3 Operator Control evidence polish 状态                   |
| 2026-05-20 | 更新 M1 Runtime Gateway / Workspace Core 真实运行时闭环状态     |
| 2026-05-19 | 更新 `apps/desktop` 最小 Workspace Core dev sidecar bridge 状态 |
| 2026-05-17 | 新增 `apps/desktop` Electron 最小静态 shell 骨架状态说明        |
| 2026-05-16 | 补充 UI preview、Node 26 验证观察项与工程体检同步建议           |
| 2026-05-15 | 初版：记录当前能力、测试基线、R1 完成 / 未完成能力与近期主线    |
