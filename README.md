# Cairn

> 一个本地优先、可自托管的 **AI 工程工作台 / Agent 工程控制台**：连接 Codex / Claude Code / 本地模型等 runtime，把复杂工程任务放大为可追踪、可回放、可接管、可复用的 run / artifact / trace 系统。

**Cairn** = 登山者沿途堆起的石头路标。每完成一段路，加一颗石头。
我们用它来比喻这个产品的核心：**复杂任务一步步堆积、过程可见、产物沉淀、长期可回看**。

---

## 这是什么

Cairn 不是又一个聊天 bot，也不是一个 IDE 内的补全 copilot，更不把自己定位为 Codex、Claude Code 或任何单一 coding agent 的替身。它是一个：

- **本地优先 + 自托管** 的 AI 工程工作台 / Agent 工程控制台
- 面向 Codex CLI / Claude Code CLI / 本地模型 / 用户自配 runtime 的 **控制面与证据层**
- 在 **桌面端（Windows / macOS Apple Silicon）** 与 **Web 端** 共享同一套 Workspace Core
- 支持把复杂工程任务 **规划 → 执行 → 回传 → 回放 → 沉淀**
- 将 Codex / Claude / 本地模型等 runtime 纳入统一的 run、artifact、trace、operator control 语义
- 由主 Agent（Supervisor）统筹、worker 角色分工、**人类可随时接管**

Runtime 负责“生成与执行”，Cairn 负责“组织、观察、接管、验证、沉淀与复用”。因此 Cairn 的差异化不在于比 Codex/Claude 更会写代码，而在于让这些能力在真实工程任务中更可控、更可信、更可持续。

适合谁：

1. 重度 AI 编程的个人开发者
2. 2~10 人的小技术团队
3. 本地优先 / 数据自控 / 不愿被某个 SaaS 绑死的用户

Cairn 不试图替代 Codex、Claude Code、Cursor 或 Windsurf 的代码生成能力。它更像这些 agent runtime 之上的本地塔台：记录任务为什么启动、如何规划、谁执行了什么、产物在哪里、失败如何恢复，以及人类何时介入。

---

## 当前状态

> **Pre-Release / 工程基线建设阶段**

- ✅ 设计文档 V0.1.0 已定稿，并补充 runtime 控制面 / 证据层定位语义（见 [`docs/design/设计文档V0.1.0.md`](docs/design/设计文档V0.1.0.md)）
- ✅ Monorepo 工程基线、共享契约、领域持久化 schema、SQLite storage、Runtime Gateway 与 Application 编排基线已启动
- ✅ Workspace Core 最小服务骨架已启动：Fastify 入口、健康检查、R1 run/task/agent-run 基础 HTTP 闭环与 mock runtime 验证
- 🚧 Desktop 已有最小 Electron shell、静态 UI 壳视图与 Workspace Core dev sidecar bridge；默认 sidecar runtime 仍为 mock，真实 Codex 需显式 opt-in
- 🚧 当前正在收口第一轮**内部开发者试用**：目标是验证 `Desktop + embedded Workspace Core + Codex runtime` 的最小真实闭环；这不是外部 alpha，也不包含 `apps/web`、安装器、签名或公证
- 🗓 Release 1 目标：Personal Desktop Edition（Windows + macOS Apple Silicon）

详情见 [`docs/product/roadmap.md`](docs/product/roadmap.md)。

内部试用范围、前提、smoke path、排障与最终 gate 见 [`docs/ops/internal-trial-runbook.md`](docs/ops/internal-trial-runbook.md)。

---

## 文档地图

| 我想……                                   | 去看                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| 了解产品愿景与定位                       | [`docs/product/`](docs/product/)                                           |
| 看完整的设计主稿                         | [`docs/design/设计文档V0.1.0.md`](docs/design/设计文档V0.1.0.md)           |
| 看领域模型 / 状态机 / 安全模型等设计细节 | [`docs/design/`](docs/design/)                                             |
| 看外部调研与产品模式参考                 | [`docs/research/`](docs/research/)                                         |
| 了解为什么选 Electron / Node / SQLite 等 | [`docs/adr/`](docs/adr/)                                                   |
| 接入新的 runtime adapter                 | [`docs/contracts/runtime-adapter.md`](docs/contracts/runtime-adapter.md)   |
| 了解仓库结构、代码风格、测试策略         | [`docs/engineering/`](docs/engineering/)                                   |
| 参与第一轮内部试用                       | [`docs/ops/internal-trial-runbook.md`](docs/ops/internal-trial-runbook.md) |
| 安装与使用                               | [`docs/ops/`](docs/ops/)                                                   |
| 隐私与数据本地化承诺                     | [`docs/legal/`](docs/legal/)                                               |
| 看术语定义                               | [`docs/reference/glossary.md`](docs/reference/glossary.md)                 |

---

## 快速开始

> 当前可运行的是工程校验、包级测试与 `apps/workspace-core` 最小服务。

```bash
pnpm install
pnpm run check
pnpm test
pnpm --filter @cairn/workspace-core dev
```

完整步骤见 [`docs/engineering/local-dev-setup.md`](docs/engineering/local-dev-setup.md)。

如果你的目标是执行第一轮内部 trial，请直接按 [`docs/ops/internal-trial-runbook.md`](docs/ops/internal-trial-runbook.md) 操作。

---

## 技术栈一览

| 层             | 选型                                             |
| -------------- | ------------------------------------------------ |
| 主语言         | TypeScript / Node.js                             |
| 桌面壳         | Electron（默认） / Tauri（备选）                 |
| Web 壳         | React + Vite                                     |
| Workspace Core | Fastify                                          |
| 编排底座       | LangGraph JS（产品状态模型自持）                 |
| 存储           | SQLite first / PostgreSQL ready，Drizzle ORM     |
| 调度           | DB-driven scheduler（首发不引入 Redis/Temporal） |
| 观测           | structured logging（Pino） + OpenTelemetry 兼容  |

详细原因见 [`docs/adr/`](docs/adr/)。

---

## 贡献与协作

- 提 Issue / PR：见 [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 行为准则：见 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- 报告安全问题：见 [`SECURITY.md`](SECURITY.md)

---

## License

**Apache License 2.0** — 见 [`LICENSE`](LICENSE) 全文与 [`NOTICE`](NOTICE) 归属声明。

决策记录见 [ADR-0016](docs/adr/0016-license-apache-2.md)。

```text
Copyright 2026 Cairn Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

> ℹ️ **关于贡献**：项目当前处于早期快迭代阶段，**暂不积极接受外部 Pull Request**。
> Issue / Discussion / 安全报告均欢迎；详见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

---

## 项目命名

**Cairn** /kɛrn/ — 登山路标石堆。

- 多 Agent run 是"一步步堆积"的过程
- artifact / trace 是"沿途留下的石头"
- 桌面本地优先 = 不依赖云端、独立可达
