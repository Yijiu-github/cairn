# Cairn

> 一个面向个人开发者与小技术团队的、自托管且本地优先的 **多 Agent 协作工作台**。

**Cairn** = 登山者沿途堆起的石头路标。每完成一段路，加一颗石头。
我们用它来比喻这个产品的核心：**复杂任务一步步堆积、过程可见、产物沉淀、长期可回看**。

---

## 这是什么

Cairn 不是又一个聊天 bot，也不是一个 IDE 内的补全 copilot。它是一个：

- **本地优先 + 自托管** 的多 Agent 协作系统
- 在 **桌面端（Windows / macOS Apple Silicon）** 与 **Web 端** 共享同一套协作核心
- 支持把复杂工程任务 **拆分 → 执行 → 回传 → 回放 → 沉淀**
- 由主 Agent（Supervisor）统筹、worker 角色分工、**人类可随时接管**

适合谁：

1. 重度 AI 编程的个人开发者
2. 2~10 人的小技术团队
3. 本地优先 / 数据自控 / 不愿被某个 SaaS 绑死的用户

---

## 当前状态

> **Pre-Release / 设计与基线建设阶段**

- ✅ 统一设计 v0.4 已定稿（见 [`docs/design/unified-design-v0.4.md`](docs/design/unified-design-v0.4.md)）
- 🚧 代码尚未启动；当前正在沉淀工程基线与决策文档
- 🗓 Release 1 目标：Personal Desktop Edition（Windows + macOS Apple Silicon）

详情见 [`docs/product/roadmap.md`](docs/product/roadmap.md)。

---

## 文档地图

| 我想…… | 去看 |
|---|---|
| 了解产品愿景与定位 | [`docs/product/`](docs/product/) |
| 看完整的统一设计主稿 | [`docs/design/unified-design-v0.4.md`](docs/design/unified-design-v0.4.md) |
| 看领域模型 / 状态机 / 安全模型等设计细节 | [`docs/design/`](docs/design/) |
| 了解为什么选 Electron / Node / SQLite 等 | [`docs/adr/`](docs/adr/) |
| 接入新的 runtime adapter | [`docs/contracts/runtime-adapter.md`](docs/contracts/runtime-adapter.md) |
| 了解仓库结构、代码风格、测试策略 | [`docs/engineering/`](docs/engineering/) |
| 安装与使用 | [`docs/ops/`](docs/ops/) |
| 隐私与数据本地化承诺 | [`docs/legal/`](docs/legal/) |
| 看术语定义 | [`docs/reference/glossary.md`](docs/reference/glossary.md) |

---

## 快速开始

> ⚠️ 代码尚未启动，本节为占位。Release 0 工程基线就绪后会更新。

```bash
# (planned)
pnpm install
pnpm dev
```

完整步骤见 [`docs/engineering/local-dev-setup.md`](docs/engineering/local-dev-setup.md)。

---

## 技术栈一览

| 层 | 选型 |
|---|---|
| 主语言 | TypeScript / Node.js |
| 桌面壳 | Electron（默认） / Tauri（备选） |
| Web 壳 | React + Vite |
| Workspace Core | Fastify |
| 编排底座 | LangGraph JS（产品状态模型自持） |
| 存储 | SQLite first / PostgreSQL ready，Drizzle ORM |
| 调度 | DB-driven scheduler（首发不引入 Redis/Temporal） |
| 观测 | structured logging（Pino） + OpenTelemetry 兼容 |

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

```
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
