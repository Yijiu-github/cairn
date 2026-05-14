# ADR-0002: 主产品语言采用 TypeScript / Node.js

- **状态**：🟢 Accepted
- **日期**：2026-05-13
- **决策者**：项目主理
- **关联**：ADR-0001, ADR-0003, ADR-0004, [`../design/设计文档V0.1.0.md#91-主语言typescript--nodejs`](../design/设计文档V0.1.0.md)

---

## 背景

ADR-0001 决定共享核心 + 双外壳 + 桌面一等。这给主语言选型带来强约束：

- 桌面端需要紧密集成（Electron / Tauri）
- Web 端需要前端框架（React 等）
- Workspace Core 必须能同时**嵌入桌面**和**部署远程**
- 需要长运行 agent 编排能力（LangGraph 等）
- 需要单一 monorepo 共享 contracts 与类型

候选语言生态：

- TypeScript / Node.js
- Python（FastAPI + 桌面 sidecar）
- Go（高性能、但前端共享差）
- Rust（Tauri 原生、但生态门槛高）

## 决策

**主语言采用 TypeScript / Node.js。**

具体地：

1. `apps/desktop` / `apps/web` / `apps/workspace-core` / `packages/*` 全部使用 TypeScript
2. 共享类型契约（`packages/shared_contracts`）由 Zod schema 定义并派生
3. 启用 TS strict 模式
4. Node.js 版本基线：LTS（具体版本在 `engineering/local-dev-setup.md` 中钉死）

## 后果

### 好的

- 桌面、Web、Server、Contracts 共用同一语言生态，开发心智一致
- LangGraph 有官方 JavaScript 文档与能力说明，编排不必绑死 Python
- Electron + Node sidecar 的组合比 Python sidecar 更顺
- npm 生态在桌面、前端、AI 工具链上覆盖最广
- 类型可从 schema 自动派生，前后端契约不分裂

### 坏的

- 放弃 Python 在 AI 框架整合上的部分现成生态优势（如 langchain-python 更成熟）
- 放弃 FastAPI 这类熟悉路径的启动速度
- 性能上限不如 Go / Rust（但当前阶段并非性能瓶颈）

### 中性的

- 需要在 ADR 中钉死 Node 版本基线与运行时打包方式
- 若未来需要高性能计算密集任务，可通过子进程 / WASM 隔离引入其他语言

## 备选方案

- **Python + FastAPI**：放弃。桌面 sidecar、前端共享、运行时打包都更繁。
- **Go**：放弃。前端共享差，桌面集成不如 Node。
- **Rust**：放弃。生态与上手门槛过高，对个人/小团队不友好。

## 后续

- [ ] 在 `engineering/coding-standards.md` 钉死 TS 配置基线（strict / verbatimModuleSyntax 等）
- [ ] 在 `engineering/local-dev-setup.md` 钉死 Node 版本与包管理器

## 变更历史

| 日期       | 变更                                   |
| ---------- | -------------------------------------- |
| 2026-05-13 | 初次提议（来自 V0.1.0）                |
| 2026-05-14 | 拆出独立 ADR 文件，状态升级为 Accepted |
