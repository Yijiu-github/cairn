# Architecture Decision Records (ADR)

回答："**为什么我们当时这么决定**"。

## 什么是 ADR

ADR 是**架构决策的不可变快照**。一旦 `Accepted`，**永远不修改**——它代表了那一刻团队基于已有信息作出的判断。

后续如果决策变化，**新建一份 ADR `Supersede` 旧的**，而不是改旧的。这样未来任何人都能沿着时间线看到完整决策脉络。

## 文件命名

`NNNN-short-kebab-title.md`，从 `0001` 开始递增。

`0000-template.md` 是模板，**不要直接编辑作为决策**。

## ADR 列表

### 产品与架构基线（0001–0006）

| 编号                                        | 标题                                         | 状态        |
| ------------------------------------------- | -------------------------------------------- | ----------- |
| [0000](0000-template.md)                    | 模板                                         | —           |
| [0001](0001-shared-core-dual-shell.md)      | 产品采用「共享核心 + 双外壳」而不是 Web-only | 🟢 Accepted |
| [0002](0002-language-typescript-node.md)    | 主产品语言采用 TypeScript / Node.js          | 🟢 Accepted |
| [0003](0003-desktop-shell-electron.md)      | 桌面壳默认采用 Electron                      | 🟢 Accepted |
| [0004](0004-orchestration-langgraph-js.md)  | 编排底座采用 LangGraph JS，产品状态模型自持  | 🟢 Accepted |
| [0005](0005-sqlite-first-postgres-ready.md) | 数据库采用 SQLite first / PostgreSQL ready   | 🟢 Accepted |
| [0006](0006-db-driven-scheduler.md)         | 调度采用 DB-driven，不引入 Redis/Temporal    | 🟢 Accepted |

### 工程与技术选型（0007–0015）

| 编号                                                     | 标题                                                       | 状态        |
| -------------------------------------------------------- | ---------------------------------------------------------- | ----------- |
| [0007](0007-sidecar-loopback-protocol.md)                | Sidecar 通信协议采用 Loopback HTTP + WS + per-launch token | 🟢 Accepted |
| [0008](0008-orm-drizzle.md)                              | ORM 采用 Drizzle                                           | 🟢 Accepted |
| [0009](0009-schema-contracts-zod-ts-rest.md)             | Schema 与契约派生采用 Zod + ts-rest + zod-to-openapi       | 🟢 Accepted |
| [0010](0010-secret-storage.md)                           | Secret 存储采用 Electron safeStorage + 系统 Keychain/DPAPI | 🟢 Accepted |
| [0011](0011-monorepo-pnpm-turborepo.md)                  | Monorepo 工具采用 pnpm + turborepo                         | 🟢 Accepted |
| [0012](0012-electron-toolchain-and-sidecar-packaging.md) | Electron 工具链 + Sidecar 打包 + 自动更新                  | 🟢 Accepted |
| [0013](0013-ui-shadcn-tailwind.md)                       | UI 组件采用 shadcn/ui + Tailwind CSS                       | 🟢 Accepted |
| [0014](0014-orchestration-scheduler-port.md)             | OrchestrationScheduler 端口 + LangGraph JS 退路            | 🟢 Accepted |
| [0015](0015-frontend-core-libs.md)                       | 前端核心库（TanStack Router + Query / Zustand / Pino）     | 🟢 Accepted |

### License 与首发 Adapter（0016–0018）

| 编号                                           | 标题                                                          | 状态        |
| ---------------------------------------------- | ------------------------------------------------------------- | ----------- |
| [0016](0016-license-apache-2.md)               | License 采用 Apache-2.0 + 完全开源（暂不积极接外部 PR）       | 🟢 Accepted |
| [0017](0017-codex-cli-runtime-adapter.md)      | 首发 Runtime Adapter 采用 OpenAI Codex CLI（子进程 + PTY）    | 🟢 Accepted |
| [0018](0018-codex-cli-exec-jsonl-transport.md) | Codex CLI Adapter 首发传输优先采用 `exec --json` stdout JSONL | 🟡 Proposed |

## 状态约定

| 状态                      | 含义                           |
| ------------------------- | ------------------------------ |
| 🟡 Proposed               | 提议中，等待评审               |
| 🟢 Accepted               | 已采纳，正在执行               |
| 🔄 Superseded by ADR-NNNN | 被新 ADR 取代                  |
| ⚫ Rejected               | 评审后未采纳，保留作为后续参考 |
| 📦 Archived               | 决策对象（功能/模块）已不存在  |

## 什么时候应该写 ADR

至少满足下列任一条：

- 选项之间有**显著的长期影响**（如语言、框架、存储、协议）
- 决策一旦做出**回退成本高**
- 团队曾经在这个问题上**辩论过 30 分钟以上**
- 未来 6 个月内可能有人问"为什么不选 X"
