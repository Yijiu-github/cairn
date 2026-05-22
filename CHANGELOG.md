# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范，
版本号采用 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

格式提示：

- `Added` 新增
- `Changed` 变更
- `Deprecated` 废弃
- `Removed` 移除
- `Fixed` 修复
- `Security` 安全

---

## [Unreleased]

### Added

- 新增第一轮内部开发者试用文档基线：`docs/ops/internal-trial-runbook.md` 统一记录 scope、smoke path、failure triage、known limits 与 gate，明确它不是外部 alpha、installer、signing、notarization 或 `apps/web` 验证。
- Desktop 新增 `pnpm --filter @cairn/desktop test:e2e` 最小窗口级 smoke；当前只覆盖默认 mock sidecar 路径。
- Desktop 已记录一次 Codex-backed internal-trial 手动 smoke 成功；自动 e2e 仍待补齐。
- 收口静态预览数据中的旧固定协作角色名，改为中性 preview label。
- **M3 Operator Control evidence polish**：补齐 operator cancel 的 runtime requested / acknowledged / not-acknowledged / dispatch-failed TraceEvent 证据，并为 retry / rerun trace 增加最小恢复路径 payload。
- 新增战略定位刷新说明，明确 Cairn 以个人本地工作台切入，长期聚焦小团队 Agent 工程控制台，并通过 runtime-neutral control plane 接入 Codex / Claude 等官方 agent 工具。
- 项目正式命名为 **Cairn**，仓库根目录改名为 `cairn-workspace/`
- 设计文档 V0.1.0 落位 `docs/design/`
- 工程文档骨架初始化（product / design / adr / contracts / engineering / ops / legal / reference）
- ADR-0001 ~ ADR-0017 全套技术决策落档
- 工程基线就位：AGENTS.md、ESLint flat config、Prettier、tsconfig、.editorconfig、Husky + commitlint
- Monorepo 引导文件：`pnpm-workspace.yaml`（catalog）、`turbo.json`、根 `package.json`、`.npmrc`、`.nvmrc`
- License 拍板：**Apache-2.0**，仓库公开开源
- NOTICE 文件
- 首发 Runtime Adapter 形态确认：**OpenAI Codex CLI**（子进程 + stdout/stderr pipes）
- **`@cairn/domain`**：`packages/domain` 首版 Drizzle SQLite schema（`workspaces`、`orchestration_runs`、`tasks`、`agent_runs`、`artifacts`）及 `drizzle-kit` 初始迁移
- **`@cairn/domain`**：补齐协作闭环持久化表（`conversations`、`events`、`messages`、`trace_events`），并为 `orchestration_runs` 补充 `origin_event_id` / `conversation_id` 外键
- **`@cairn/shared-contracts`**：新增 `Event` / `Message` schema，并补充 `Conversation`、`Event`、`Message` schema 测试
- **`@cairn/storage`**：新增 SQLite-first 存储包基线，包含 `better-sqlite3` + Drizzle 连接封装、PRAGMA 初始化、domain 迁移执行入口与包级测试
- **`@cairn/runtime-gateway`**：新增 RuntimeAdapter 契约、错误归一化、mock adapter 与 adapter conformance 测试基线
- **`@cairn/runtime-gateway`**：新增 Codex CLI `exec --json` JSONL 协议解析、基础错误映射与 S5 spike 记录
- **`@cairn/runtime-gateway`**：新增 Codex CLI 子进程封装，支持 stdout JSONL 流式解析、stderr 收集、非零退出映射与取消升级 kill
- **`@cairn/runtime-gateway`**：新增 `createCodexRuntimeAdapter`，把 Codex CLI 子进程封装为 RuntimeAdapter 的 submit / stream / cancel / query 生命周期
- **`@cairn/application`**：新增应用层编排基线，包含 run/task/agentRun repository 端口、Runtime Gateway 提交端口、single-worker run 创建、adapter event 状态推进与终态不变量测试
- **`@cairn/workspace-core`**：新增 Fastify 最小服务骨架，包含 `/health`、R1 run/task/agent-run HTTP 闭环、in-memory application ports 与 mock runtime 验证
- **`@cairn/workspace-core`**：新增 SQLite application repository 适配器，服务启动时执行 domain 迁移并用 `.cairn/workspace-core.sqlite` 持久化 run/task/agent-run 状态
- **`@cairn/workspace-core`**：新增 runtime gateway factory 与显式 `CAIRN_WORKSPACE_CORE_RUNTIME=codex` 启动开关，可把 Codex RuntimeAdapter 注入服务容器；默认仍为 mock runtime
- **Codex runtime hardening**：Codex adapter 可解析 Workspace Core runtime input artifact payload，补充取消升级细节与手动真实 Codex smoke 指引；默认测试仍不依赖真实 Codex CLI
- **Orchestration Control R1a**：新增 application 与 workspace-core 最小接管控制面，覆盖 pause / resume / cancel run、retry task、rerun 与 operator note，并写入 TraceEvent。
- **`@cairn/ui`**：新增共享 UI 包工程校验基线，纳入 typecheck / lint / test，并补充公共导出 smoke 测试
- **`@cairn/desktop`**：新增 Electron 最小 shell 骨架与静态 UI 壳视图，包含 Home / Run Detail / Artifact Review / Settings 四个静态视图、只读 preload identity bridge 与 preview-safe 默认隔离设置
- **`@cairn/desktop`**：新增最小 Workspace Core dev sidecar bridge，包含 per-launch bearer token、Core status allowlist、internal-trial IPC、renderer Core 状态面板，以及 sidecar manager / smoke client 单元测试
- **`@cairn/desktop`**：新增并手动验证 Desktop window-level Codex-backed internal-trial smoke，Electron / CDP 可读回同一条真实 run 的 replay evidence、bounded payload text 与 operator note
- **`@cairn/desktop`**：新增非阻塞 Desktop bootstrap 与无密钥 sidecar 诊断快照，窗口创建不再等待 Workspace Core 健康检查完成
- **`@cairn/desktop`**：修复 Electron ESM 主入口顶层 `await app.whenReady()` 导致真实窗口 smoke 卡住的问题，并补充 main module 非阻塞加载回归测试
- **M4a Desktop observer prep**：Desktop preload 新增只读 replay-source bridge，可通过 `runInternalTrial` 读取真实 Workspace Core evidence 并在 Run Detail 展示摘要；完整 operator cockpit、完整 Artifact workspace 和本地路径 reveal 仍未开放。
- **Desktop internal trial bridge**：Desktop 当前内部试用入口调整为 `workspaceCore.runInternalTrial()` / `workspace-core:run-internal-trial`，sidecar 默认 runtime 为 mock，并可通过 `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex` 启动 Codex-backed Workspace Core sidecar。
- **Desktop artifact payload preview**：Desktop preload/main 新增 `workspaceCore.getArtifactPayload(artifactId)` allowlist，Run Detail 可按 artifact id 通过 Workspace Core bounded payload API 按需读取文本 payload；仍不暴露本地路径、token、任意文件访问或完整 Artifact workspace。
- 设计文档新增轻量代码上下文索引方案，明确 Cairn 自研 SourceRoot / CodeContextIndex / ContextPack 能力，不引入 GitNexus 依赖或许可证受限代码
- **Code Context R1a**：新增 SourceRoot registry、最小 CodeIndexSnapshot 元数据、ContextPack manifest 契约、domain schema、application service 与 workspace-core API/SQLite 持久化基线
- **Code Context R1b-a**：新增手动 reindex 与本地文件清单快照，持久化 `code_index_files` 派生元数据并通过 workspace-core 查询最新索引
- **Code Context R1b-a**：新增 `GET /v1/code-search` 最小文件清单搜索接口，支持按 workspace、SourceRoot、路径片段、语言与 limit 查询最新 ready 快照元数据
- **Code Context R1b-a**：新增 `POST /v1/workspaces/:workspaceId/context-packs/from-code-search`，可把文件清单搜索结果转换为不含源码内容的 ContextPack manifest 条目
- **Code Context R1b-a**：`from-code-search` 支持显式 excerpt 行号范围，并在未传 `tokenEstimate` 时基于索引文件大小生成保守 token 估算
- 新增 AI 协作工程手册 `docs/engineering/agent-collaboration.md`，沉淀上下文工程、契约设计、文档/ADR 路由，并指向 review gate 文档
- 新增外部项目参考雷达 `docs/reference/external-project-radar.md`，记录 GitNexus、Graphify、Ruflo、agent-skills、Superpowers、OpenAI Skills 等后续阶段性参考入口
- 新增项目状态页 `docs/STATUS.md`，记录当前可用能力、测试基线、R1 已完成 / 未完成能力与近期主线
- 新增 Cairn 工程体检报告，按 R1 交付链路梳理当前工程状态、风险与下一步优先级
- 新增分支管理设计文档，明确 `main` / `develop` / agent 专项分支 / release / hotfix 的治理边界
- Orchestration / Code Context 设计补充 Goal Planner 参考：action tree、preconditions、blocked reason 与 replan reason
- **Planning Output Model**：新增独立 PlanningOutput schema、SQLite 持久化与 application planning lifecycle，覆盖 action tree、preconditions、blocked reason、replan reason 与 TraceEvent 镜像。
- **Planning Output API**：新增 `GET /v1/runs/:runId/planning-output` 只读接口，供 UI / Desktop Shell 查看现有 PlanningOutput。
- **UI Preview Planning Output**：Run Detail preview 新增静态 PlanningOutput 展示，覆盖 planning summary、blocked reason、preconditions 与 action tree。
- **Runtime Drain Slice**：新增显式 runtime stream drain 路径，Workspace Core 可把 submitted AgentRun 的 AdapterStreamEvent 应用回 run/task/agent-run 状态，为 Codex CLI 真实闭环铺路。
- **Runtime Drain Slice**：补充 RuntimeAdapter-backed gateway 注入测试，验证 Workspace Core submit/drain API 可走统一 RuntimeAdapter 事件流。
- **M1 real runtime loop**：确认 Codex adapter 确定性短任务 smoke，强化 Workspace Core RuntimeAdapter-backed submit/drain 终态证明，并补充可复制的手动 Codex smoke 文档；真实 Codex CLI 仍为 opt-in 手动验证，不进入默认 CI。
- **Runtime Artifact/Trace Demo Loop**：新增 Task runtime submit、bounded artifact payload reference/read、runtime output artifact metadata 与 TraceEvent replay source 闭环。
- **Artifact / Trace Read API**：Workspace Core 实现 Artifact metadata、bounded artifact payload 与 TraceEvent timeline/read 只读接口，供 Run Detail / Replay UI 消费。
- **M2 Artifact / Trace evidence**：新增 `GET /v1/runs/:runId/replay-source` Inspector-ready Run Replay Source 设计与实现，聚合 run/task/agent-run/artifact metadata/trace timeline 与轻量摘要，供后续 Run Detail / Desktop 观察台消费。
- 新增工程规范补强文档体系：命名约定、模块边界、review gates 与 standards automation 路线；其中 `docs/engineering/review-gates.md` 覆盖风险分级、验证命令、文档同步与 review 输出模板
- 新增非阻塞 `pnpm run standards:check`，用于检查跨包相对导入、internal 导入、模块边界与 package exports 漂移
- 设计文档新增 R1 Codex E2E + Artifact / Trace 最小闭环，明确 Workspace Core、Codex CLI adapter、ArtifactStore 与 TraceEvent 的端到端验收边界

### Changed

- README、STATUS、本地开发与测试文档已对齐第一轮内部试用口径：开发态默认 mock sidecar，真实 Codex 需显式 opt-in，且不包含外部 alpha、`apps/web`、installer、signing 或 notarization。
- Desktop 内部试用入口文档已对齐 `runInternalTrial` / Codex sidecar runtime switch。
- `docs/ops/internal-trial-runbook.md` 与 `docs/engineering/local-dev-setup.md` 的 Codex smoke 示例已收敛为当前契约允许的 `taskKind: "custom"` 和受控 runtime workdir 口径。
- Git 提交规范调整为 **中英双语标题，中文在前、英文在后**，并补充 `commit-msg` + `commitlint` 校验
- Git 工作流统一 `develop` 为日常集成分支，并补充远程短分支清理、agent 分支、release / hotfix 回灌规则
- 设计主线从「Web 优先」升级为「共享核心 + 双外壳 + 可本地运行 + 可远程扩展」
- R1 执行路线调整为证据链优先，并将当前协作模型收口为产品裁剪人 + Codex 两方推进；UI、QA 与文档验证纳入每个里程碑完成定义。
- `package.json` 的 `license` 字段从 `SEE LICENSE IN LICENSE` 改为 `Apache-2.0`
- **`@cairn/storage`**：升级 `better-sqlite3` catalog 至 `^12.10.0`，本机 Node 24.14.0 下可安装 native binding 并执行 SQLite 测试
- `coding-standards.md` 对齐当前 TypeScript、ESLint、Prettier、commitlint 与人工 review gate 状态
- `docs/STATUS.md` 同步 UI preview、Node 26 验证观察项与工程体检建议
- `docs/engineering/standards-automation.md` 更新 Phase 2 状态，明确 `standards:check` 暂不纳入 `pnpm run check` 或 CI

### Removed

- 废止 v0.3 中所有以 Web-only / Desktop 后置 / MVP 收缩优先 为前提的约束

### Fixed

- **Desktop bridge errors**：main process 在格式化 Workspace Core action 错误前会先收窄
  error payload，只接受字符串 code / message；畸形错误体会返回通用安全错误，不再抛出
  `code?.trim` 之类的内部 TypeError。
- **Desktop Run Detail copy**：空 replay / 空 task / 空 artifact / metadata-only artifact 文案改为明确的
  read-only evidence 口径，避免把刷新误解为重新执行或把 metadata-only 误解为 UI 故障。
- **Desktop allowlist docs**：STATUS 与 changelog 的 Desktop preload 口径对齐当前实现，明确
  bounded artifact payload read 与最小 operator action allowlist 已存在，但不代表完整 operator cockpit。
- **Desktop operator actions**：renderer 端 operator action 增加请求序号保护，避免旧的 note /
  cancel / retry / rerun 请求在乱序返回时覆盖最新动作的 loading、错误或反馈状态。
- **Desktop replay loader**：renderer 端 replay evidence 加载会在空白 run id 时停在本地错误态，
  不再触发 Desktop bridge / Workspace Core 请求。
- **UI preview artifact review**：`artifactReviewViewModel` 的 hero 标题改为 Artifact Review，
  并补充静态数据 smoke，避免继续沿用 Run Detail 残留口径。
- **Desktop artifact payload preview**：renderer 端 payload 加载增加请求序号保护，避免旧的 payload
  请求在乱序返回时覆盖最新加载状态或错误提示。
- `.npmrc`：默认 `node-linker` 改为 `hoisted`，避免 Windows 上 `pnpm install` 出现 `ERR_PNPM_ENOENT`（`@ts-rest/core` 依赖链内嵌套 `@types/node` 重命名失败）
- `pnpm run check`：全仓 Prettier 对齐，并修正少量 markdownlint（代码围栏语言、裸 URL、围栏前后空行）
- **`@cairn/storage`**：修复 SQLite 迁移 runner 在 `better-sqlite3@12` 下把 `PRAGMA` 与 DDL 合并为多 statement 执行的问题，并保留 Drizzle migration journal 记录以避免重复迁移
- **Local Artifact Store**：本地 payload 写入改为同目录临时文件 + rename，避免读取到半写入 artifact payload。

---

## 版本规划

| 版本  | 代号                                        | 范围                                          |
| ----- | ------------------------------------------- | --------------------------------------------- |
| 0.1.0 | Release 1 — Personal Desktop Edition        | Windows + macOS Apple Silicon 桌面版可装可跑  |
| 0.2.0 | Release 2 — Remote Workspace Edition        | Linux server 部署 + Web 独立接入 + PostgreSQL |
| 0.3.0 | Release 3 — Collaborative Workspace Edition | 小团队共享、增强 operator 介入                |

详见 [`docs/product/roadmap.md`](docs/product/roadmap.md)。
