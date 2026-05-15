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

- 项目正式命名为 **Cairn**，仓库根目录改名为 `cairn-workspace/`
- 设计文档 V0.1.0 落位 `docs/design/`
- 工程文档骨架初始化（product / design / adr / contracts / engineering / ops / legal / reference）
- ADR-0001 ~ ADR-0017 全套技术决策落档
- 工程基线就位：AGENTS.md、ESLint flat config、Prettier、tsconfig、.editorconfig、Husky + commitlint
- Monorepo 引导文件：`pnpm-workspace.yaml`（catalog）、`turbo.json`、根 `package.json`、`.npmrc`、`.nvmrc`
- License 拍板：**Apache-2.0**，仓库公开开源
- NOTICE 文件
- 首发 Runtime Adapter 形态确认：**OpenAI Codex CLI**（子进程 + PTY）
- **`@cairn/domain`**：`packages/domain` 首版 Drizzle SQLite schema（`workspaces`、`orchestration_runs`、`tasks`、`agent_runs`、`artifacts`）及 `drizzle-kit` 初始迁移
- **`@cairn/domain`**：补齐协作闭环持久化表（`conversations`、`events`、`messages`、`trace_events`），并为 `orchestration_runs` 补充 `origin_event_id` / `conversation_id` 外键
- **`@cairn/shared-contracts`**：新增 `Event` / `Message` schema，并补充 `Conversation`、`Event`、`Message` schema 测试
- **`@cairn/storage`**：新增 SQLite-first 存储包基线，包含 `better-sqlite3` + Drizzle 连接封装、PRAGMA 初始化、domain 迁移执行入口与包级测试
- **`@cairn/runtime-gateway`**：新增 RuntimeAdapter 契约、错误归一化、mock adapter 与 adapter conformance 测试基线
- **`@cairn/runtime-gateway`**：新增 Codex CLI `exec --json` JSONL 协议解析、基础错误映射与 S5 spike 记录
- **`@cairn/runtime-gateway`**：新增 Codex CLI 子进程封装，支持 stdout JSONL 流式解析、stderr 收集、非零退出映射与取消升级 kill
- **`@cairn/application`**：新增应用层编排基线，包含 run/task/agentRun repository 端口、Runtime Gateway 提交端口、single-worker run 创建、adapter event 状态推进与终态不变量测试
- **`@cairn/workspace-core`**：新增 Fastify 最小服务骨架，包含 `/health`、R1 run/task/agent-run HTTP 闭环、in-memory application ports 与 mock runtime 验证
- **`@cairn/workspace-core`**：新增 SQLite application repository 适配器，服务启动时执行 domain 迁移并用 `.cairn/workspace-core.sqlite` 持久化 run/task/agent-run 状态
- **`@cairn/ui`**：新增共享 UI 包工程校验基线，纳入 typecheck / lint / test，并补充公共导出 smoke 测试
- 设计文档新增轻量代码上下文索引方案，明确 Cairn 自研 SourceRoot / CodeContextIndex / ContextPack 能力，不引入 GitNexus 依赖或许可证受限代码

### Changed

- Git 提交规范调整为 **中英双语标题，中文在前、英文在后**，并补充 `commit-msg` + `commitlint` 校验
- 设计主线从「Web 优先」升级为「共享核心 + 双外壳 + 可本地运行 + 可远程扩展」
- `package.json` 的 `license` 字段从 `SEE LICENSE IN LICENSE` 改为 `Apache-2.0`
- **`@cairn/storage`**：升级 `better-sqlite3` catalog 至 `^12.10.0`，本机 Node 24.14.0 下可安装 native binding 并执行 SQLite 测试

### Removed

- 废止 v0.3 中所有以 Web-only / Desktop 后置 / MVP 收缩优先 为前提的约束

### Fixed

- `.npmrc`：默认 `node-linker` 改为 `hoisted`，避免 Windows 上 `pnpm install` 出现 `ERR_PNPM_ENOENT`（`@ts-rest/core` 依赖链内嵌套 `@types/node` 重命名失败）
- `pnpm run check`：全仓 Prettier 对齐，并修正少量 markdownlint（代码围栏语言、裸 URL、围栏前后空行）
- **`@cairn/storage`**：修复 SQLite 迁移 runner 在 `better-sqlite3@12` 下把 `PRAGMA` 与 DDL 合并为多 statement 执行的问题，并保留 Drizzle migration journal 记录以避免重复迁移

---

## 版本规划

| 版本  | 代号                                        | 范围                                          |
| ----- | ------------------------------------------- | --------------------------------------------- |
| 0.1.0 | Release 1 — Personal Desktop Edition        | Windows + macOS Apple Silicon 桌面版可装可跑  |
| 0.2.0 | Release 2 — Remote Workspace Edition        | Linux server 部署 + Web 独立接入 + PostgreSQL |
| 0.3.0 | Release 3 — Collaborative Workspace Edition | 小团队共享、增强 operator 介入                |

详见 [`docs/product/roadmap.md`](docs/product/roadmap.md)。
