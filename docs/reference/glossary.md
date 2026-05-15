# 术语表 / Glossary

> 状态：🟡 Draft  
> 最后更新：2026-05-14  
> 目的：统一项目内所有文档与代码使用的核心术语，避免歧义。

本术语表只收录**项目专属或有歧义**的术语。通用工程术语（如 HTTP / WebSocket / SQL）不收录。

---

## 总览

| 术语                                            | 一句话                                 | 类别 |
| ----------------------------------------------- | -------------------------------------- | ---- |
| [Cairn](#cairn)                                 | 本产品的名字                           | 品牌 |
| [Workspace Core](#workspace-core)               | 唯一的服务核心                         | 系统 |
| [Desktop Shell](#desktop-shell)                 | 桌面端外壳                             | 系统 |
| [Web Shell](#web-shell)                         | Web 端外壳                             | 系统 |
| [Local Workspace](#local-workspace)             | 本地工作区运行模式                     | 系统 |
| [Remote Workspace](#remote-workspace)           | 远程工作区运行模式                     | 系统 |
| [Workspace](#workspace)                         | 一等领域对象，所有数据的一级边界       | 领域 |
| [Conversation](#conversation)                   | 对话单位                               | 领域 |
| [Event](#event)                                 | 一次外部输入                           | 领域 |
| [Message](#message)                             | 一条消息                               | 领域 |
| [OrchestrationRun](#orchestrationrun)           | 一次完整编排执行                       | 领域 |
| [Task](#task)                                   | 编排中的一个子任务                     | 领域 |
| [AgentRun](#agentrun)                           | 一次具体的 agent 执行                  | 领域 |
| [Artifact](#artifact)                           | 执行产物                               | 领域 |
| [TraceEvent](#traceevent)                       | 一条可观察事件                         | 领域 |
| [Supervisor](#supervisor)                       | 主 agent，统筹编排                     | 角色 |
| [Worker](#worker)                               | 子任务执行 agent                       | 角色 |
| [Operator](#operator)                           | 接管系统的人类                         | 角色 |
| [Runtime Gateway](#runtime-gateway)             | 执行总线                               | 系统 |
| [Runtime Adapter](#runtime-adapter)             | 接入具体 runtime 的适配层              | 系统 |
| [SourceRoot](#sourceroot)                       | 用户授权给 Workspace 使用的代码根目录  | 系统 |
| [CodeContextIndex](#codecontextindex)           | SourceRoot 的派生代码上下文索引        | 系统 |
| [ContextPack](#contextpack)                     | 给 run / task / runtime 使用的上下文包 | 机制 |
| [Goal Planner](#goal-planner)                   | 生成 planning artifact 的规划器语义    | 机制 |
| [Execution Mode](#execution-mode)               | 编排执行模式                           | 概念 |
| [Retry / Rerun / Replan](#retry--rerun--replan) | 三种不同的"重做"语义                   | 概念 |
| [Capability Profile](#capability-profile)       | runtime 能力档案                       | 概念 |
| [Heartbeat / Lease](#heartbeat--lease)          | 崩溃恢复机制                           | 机制 |
| [Replay](#replay)                               | 回放（见专文）                         | 概念 |
| [Trace ID](#trace-id)                           | 贯穿一次执行的关联 ID                  | 机制 |

---

## 品牌

### Cairn

读音：/kɛrn/。  
意为登山者沿途堆起的石头路标。在本项目中比喻：复杂任务一步步堆积、过程可见、产物沉淀。

---

## 系统层

### Workspace Core

唯一的服务核心。可以**嵌入式**运行在桌面端，也可以独立部署为**远程 server**。

- 所有协作语义（编排 / 任务 / 执行 / 产物 / 追踪）都在 Workspace Core 内推进
- 对应代码包：`apps/workspace-core`

### Desktop Shell

桌面端外壳，基于 Electron 实现。负责：

- 窗口 / 托盘 / 通知 / 自动启动
- 升级与安装
- 系统能力桥接（文件、命令、终端等）
- 启动并管理嵌入式 Workspace Core sidecar

对应代码包：`apps/desktop`。

### Web Shell

Web 端外壳，基于 React + Vite。作为远程工作区的浏览器控制台。

对应代码包：`apps/web`。

### Local Workspace

**本地工作区模式**。桌面端安装后即可启动，本地嵌入 Workspace Core，数据落 SQLite，artifact 落本地目录。无需先部署远程 server。

### Remote Workspace

**远程工作区模式**。Workspace Core 部署在用户自控服务器上，Web 端或桌面端作为远程控制台。数据落 PostgreSQL，artifact 可落本地磁盘或 S3 兼容存储。

---

## 领域对象（与 [`../design/domain-model.md`](../design/domain-model.md) 同步）

### Workspace

一等领域对象。所有其他对象都通过 `workspace_id` 归属。

- 类型：`personal` / `shared`
- 部署模式：`local_desktop` / `remote_server`

### Conversation

对话单位。一个 Workspace 下可有多个 Conversation。

### Event

一次**外部输入**（用户消息、系统触发、外部 webhook 等）。

### Message

Conversation 内的一条消息。可以由人类、agent、系统发出。

### OrchestrationRun

**一次完整的编排执行**。从某个 Event 触发开始，到给出最终响应或失败为止。

是产品最重要的一等对象之一。所有 retry / cancel / rerun 操作都围绕 OrchestrationRun。

### Task

OrchestrationRun 内部的一个**子任务**。Task 之间可以有依赖关系（DAG）。

### AgentRun

**一次具体的 agent 调用执行**。一个 Task 在重试场景下可能产生多次 AgentRun（`attempt` 字段累计）。

### Artifact

执行过程中产生的产物。可能是：

- summary（摘要文本）
- patch（代码补丁）
- log（日志片段）
- file snapshot（文件快照）
- 其他自定义类型

每个 artifact 必须有稳定 id 与元数据。

### TraceEvent

一条可观察事件。用于：

- 重建执行时间线
- 失败归因
- Replay 回放

---

## 角色

### Supervisor

主 agent。负责：

1. Mode Decision（决定执行模式）
2. Task Planning（拆分任务）
3. Dispatch Coordination（协调 Worker）
4. Result Synthesis / Recovery（综合结果与恢复）
5. Operator Mediation（必要时请求人类确认）

### Worker

执行具体子任务的 agent。一个 OrchestrationRun 内可能并行多个 Worker。

### Operator

**接管系统的人类**。可以执行：观察 / 暂停 / 取消 / 重试 / 重开 / 注入补充说明 / approve-reject。

详见 [`../design/设计文档V0.1.0.md#13-人类接管模型`](../design/设计文档V0.1.0.md)。

---

## 执行与运行时

### Runtime Gateway

执行总线。所有 AgentRun 的提交、取消、流式回传都通过 Runtime Gateway 路由到具体的 Runtime Adapter。

对应代码包：`packages/runtime_gateway`。

### Runtime Adapter

具体 runtime（如 Codex、Claude、本地模型等）的适配层。实现统一的 `RuntimeAdapter` 接口。

接口规范见 [`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md)。

### SourceRoot

用户明确授权给某个 Workspace 使用的本地代码根目录。Workspace Core 可以对 SourceRoot 建立派生索引，但不能把它当成 Artifact 的权威副本。

详见 [`../design/code-context-index.md`](../design/code-context-index.md)。

### CodeContextIndex

SourceRoot 的派生代码上下文索引，包含文件清单、文本搜索、符号 outline、依赖边和索引快照信息。它是可删除、可重建的派生数据。

### ContextPack

给 Planner / Worker / Runtime Adapter 使用的上下文包。它通常包含文件片段、符号 outline、依赖边和用户说明，并作为 Artifact 被 Task 的 `context_refs` 引用。

### Goal Planner

Supervisor 在 `planning` 阶段使用的规划器语义。它输出可回放的 planning artifact，说明本轮 run 的 action tree、preconditions、blocked reason 与 replan reason。

Goal Planner 不是 workflow builder，也不是独立执行状态机；实际执行仍以 OrchestrationRun / Task / AgentRun 状态机为准。

### Execution Mode

OrchestrationRun 的执行模式：

| 模式            | 含义              | 首发    |
| --------------- | ----------------- | ------- |
| `direct_answer` | 不拆分，直接回答  | ✅      |
| `single_worker` | 单 worker 完成    | ✅      |
| `multi_worker`  | 多 worker 并行    | ✅      |
| `deliberation`  | 多 agent 讨论收敛 | ❌ 未来 |
| `meeting`       | 会议形态          | ❌ 未来 |
| `committee`     | 投票 / 仲裁       | ❌ 未来 |

### Retry / Rerun / Replan

**三种不同的"重做"语义，不可混用**：

| 术语       | 含义                                                            | 范围   |
| ---------- | --------------------------------------------------------------- | ------ |
| **retry**  | 在同一 OrchestrationRun 内，重试失败的节点                      | run 内 |
| **rerun**  | 基于同一原始请求，**新建**一轮 OrchestrationRun                 | 新 run |
| **replan** | 在新一轮 run 中**重做规划**，不在当前 run 内中途强改 task graph | 新 run |

详见 [`../design/state-machines.md`](../design/state-machines.md)。

### Capability Profile

每个 Runtime Adapter 暴露自己的能力档案，包括：

- 是否支持流式输出
- 是否支持工具调用
- 是否支持取消
- 是否支持中途注入上下文
- 模型最大 context window
- 支持的产出类型

OrchestrationRun 在分配 Task 给 Worker 时会参考 Capability Profile。

---

## 机制

### Heartbeat / Lease

桌面端崩溃恢复机制。AgentRun 在运行期间需要周期性更新 `heartbeat_at`；如果 lease 超时未续约，系统视为该 run 已死。

详见 [`../design/replay-and-recovery.md`](../design/replay-and-recovery.md)。

### Replay

回放——**注意：本项目的 replay 指"从 TraceEvent 重建 UI 视图"，不是"重新执行 task"**。

如需重新执行，使用 `rerun` 或 `retry`。

详见 [`../design/replay-and-recovery.md`](../design/replay-and-recovery.md)。

### Trace ID

贯穿一次执行的关联 ID，写入 OrchestrationRun / Task / AgentRun / TraceEvent / 日志，用于跨对象关联与排错。

---

## 边界外的术语（明确不收）

为了避免混淆，以下术语在本项目内**不使用**或**有特定限制含义**：

- ❌ **Agent**（单独使用，太泛）→ 使用 Supervisor / Worker / AgentRun
- ❌ **Task Graph Editor / Workflow Builder** → 不在产品范围
- ❌ **Marketplace** → 不在产品范围
- ❌ **Tenant**（多租户）→ 当前不做企业多租户
- ❌ **Pipeline** → 与 Task / OrchestrationRun 概念冲突，避免使用

---

## 变更记录

| 日期       | 变更                                                  |
| ---------- | ----------------------------------------------------- |
| 2026-05-15 | 新增 Goal Planner 术语                                |
| 2026-05-15 | 新增 SourceRoot / CodeContextIndex / ContextPack 术语 |
| 2026-05-14 | 术语表初版，对齐设计文档 V0.1.0                       |
