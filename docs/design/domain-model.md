# 领域模型 / Domain Model

> 状态：🟡 Draft
> 最后更新：2026-05-17
> 来源：[`设计文档V0.1.0.md §12`](设计文档V0.1.0.md) 抽出并扩展
> 上游术语：见 [`../reference/glossary.md`](../reference/glossary.md)

---

## 0. 总则

- 所有 UI 可见对象**必须有 stable id**
- 所有执行对象**必须有状态枚举**
- 所有可重试执行**必须记录 `attempt`**
- 错误归因必须能**分层到：编排 / 任务 / 执行 / 产物**
- 用户可见 Artifact **必须可追溯、可审阅、可复用性可判断**
- Handoff Queue 可以先作为 projection，但每个 queue item 必须能追到源对象与 TraceEvent
- `workspace_id` 是**所有核心对象的一级边界字段**

## 1. 对象关系总图

```text
Workspace
  ├─ SourceRoot
  │    ├─ CodeIndexSnapshot
  │    └─ ContextPack (引用 SourceRoot / Task / OrchestrationRun)
  └─ Conversation
       ├─ Event (外部输入)
       ├─ Message
       └─ OrchestrationRun
            ├─ Task (DAG)
            │    └─ AgentRun (1..N, 重试累计)
            │         └─ Artifact (产出)
            └─ TraceEvent (横切，全量观察)
```

依赖与归属：

- 一个 `Workspace` 下有多个 `Conversation`
- 一个 `Workspace` 下有多个 `SourceRoot`，每个 `SourceRoot` 可产生多个 `CodeIndexSnapshot`
- 一个 `Conversation` 下有多个 `Event` / `Message` / `OrchestrationRun`
- 一个 `OrchestrationRun` 下有多个 `Task`（DAG 结构）
- 一个 `Task` 下有 1 到 N 个 `AgentRun`（每次 retry 是新的 attempt）
- 一个 `AgentRun` 可产生多个 `Artifact`
- `ContextPack` 是 run / task 的上下文输入证据，引用 `SourceRoot`，后续应作为 `Artifact` 持久化内容
- `TraceEvent` 横切所有层级，仅用于观察

---

## 2. Workspace

**一等领域对象**，所有其他对象的一级边界。

| 字段                      | 类型                                   | 必填 | 说明              |
| ------------------------- | -------------------------------------- | ---- | ----------------- |
| `workspace_id`            | `string (ulid)`                        | ✅   | 全局唯一          |
| `workspace_type`          | `enum: personal \| shared`             | ✅   | 决定权限模型      |
| `deployment_mode`         | `enum: local_desktop \| remote_server` | ✅   | 决定运行拓扑      |
| `display_name`            | `string`                               | ✅   | 用户可见名        |
| `status`                  | `enum: active \| paused \| archived`   | ✅   | 工作区生命周期    |
| `default_runtime_profile` | `string`                               | ⛔   | 默认 runtime 偏好 |
| `created_at`              | `timestamp`                            | ✅   |                   |
| `updated_at`              | `timestamp`                            | ✅   |                   |
| `metadata`                | `jsonb / json text`                    | ⛔   | 扩展位            |

**索引**：`(workspace_type, status)`

---

## 3. Event

一次**外部输入**。

| 字段              | 类型                                          | 必填 | 说明                       |
| ----------------- | --------------------------------------------- | ---- | -------------------------- |
| `event_id`        | `string (ulid)`                               | ✅   |                            |
| `workspace_id`    | `string`                                      | ✅   |                            |
| `source_type`     | `enum: user \| system \| webhook \| schedule` | ✅   |                            |
| `conversation_id` | `string`                                      | ⛔   | 不属于 conversation 时为空 |
| `actor_id`        | `string`                                      | ⛔   | 用户/系统标识              |
| `actor_role`      | `enum: user \| operator \| system`            | ✅   |                            |
| `text`            | `text`                                        | ⛔   |                            |
| `attachments`     | `jsonb`                                       | ⛔   | 附件元数据                 |
| `created_at`      | `timestamp`                                   | ✅   |                            |
| `metadata`        | `jsonb`                                       | ⛔   |                            |

---

## 4. Conversation

| 字段                | 类型                                               | 必填 | 说明         |
| ------------------- | -------------------------------------------------- | ---- | ------------ |
| `conversation_id`   | `string`                                           | ✅   |              |
| `workspace_id`      | `string`                                           | ✅   |              |
| `channel_type`      | `enum: default \| task_focused \| operator_review` | ✅   |              |
| `title`             | `string`                                           | ⛔   | 可由系统生成 |
| `status`            | `enum: open \| archived`                           | ✅   |              |
| `summary_ref`       | `string`                                           | ⛔   | Artifact id  |
| `latest_message_at` | `timestamp`                                        | ⛔   |              |

---

## 5. Message

| 字段                   | 类型                                     | 必填 | 说明                     |
| ---------------------- | ---------------------------------------- | ---- | ------------------------ |
| `message_id`           | `string`                                 | ✅   |                          |
| `workspace_id`         | `string`                                 | ✅   |                          |
| `conversation_id`      | `string`                                 | ✅   |                          |
| `orchestration_run_id` | `string`                                 | ⛔   | 如属于某次 run 的输出    |
| `sender_type`          | `enum: human \| agent \| system`         | ✅   |                          |
| `sender_id`            | `string`                                 | ⛔   |                          |
| `visibility`           | `enum: public \| operator_only \| debug` | ✅   |                          |
| `content_ref`          | `string`                                 | ✅   | 指向 artifact 或内嵌内容 |
| `created_at`           | `timestamp`                              | ✅   |                          |
| `metadata`             | `jsonb`                                  | ⛔   |                          |

---

## 6. OrchestrationRun

**一次完整编排执行**，产品最重要的一等对象之一。

| 字段                   | 类型                                                   | 必填 | 说明                                        |
| ---------------------- | ------------------------------------------------------ | ---- | ------------------------------------------- |
| `orchestration_run_id` | `string`                                               | ✅   |                                             |
| `workspace_id`         | `string`                                               | ✅   |                                             |
| `conversation_id`      | `string`                                               | ⛔   |                                             |
| `origin_event_id`      | `string`                                               | ✅   | 触发的 event                                |
| `status`               | `enum`（见下）                                         | ✅   |                                             |
| `execution_mode`       | `enum: direct_answer \| single_worker \| multi_worker` | ✅   | 首发三种                                    |
| `planner_output_ref`   | `string`                                               | ⛔   | PlanningOutput id，见下文 Goal Planner 输出 |
| `synthesis_output_ref` | `string`                                               | ⛔   |                                             |
| `final_response_ref`   | `string`                                               | ⛔   |                                             |
| `has_partial_failures` | `bool`                                                 | ✅   |                                             |
| `result_completeness`  | `enum: complete \| partial \| empty`                   | ✅   |                                             |
| `completion_level`     | `enum: full \| degraded \| failed`                     | ✅   |                                             |
| `started_at`           | `timestamp`                                            | ⛔   |                                             |
| `finished_at`          | `timestamp`                                            | ⛔   |                                             |
| `error_code`           | `string`                                               | ⛔   |                                             |
| `error_message`        | `text`                                                 | ⛔   |                                             |
| `trace_id`             | `string`                                               | ✅   | 贯穿一切的关联 id                           |

**状态枚举（与 state-machines.md 同步）**：

`queued` → `planning` → `running` → `synthesizing` → `succeeded`  
`paused`（任意运行中状态可入）  
`cancelled` / `failed` / `timeout`（终态）

### Goal Planner 输出

`planner_output_ref` 指向独立的 `PlanningOutputId`。它用于解释本轮 run 为什么这样拆分、哪些前置条件已满足、哪里被阻塞，以及下一轮是否需要 replan。

R1 只要求 planning 输出是可回放、可审计的结构化说明，不做复杂 workflow builder 或拖拽编辑器。

### PlanningOutput

PlanningOutput 是 Goal Planner 的一等领域对象，不是普通 Artifact。它保存 action tree、preconditions、blocked reason、replan reason 与 ContextPack 引用，用于解释本轮 run 为什么这样规划。

PlanningOutput 状态为 `pending` / `ready` / `blocked` / `failed`；`ready`、`blocked`、`failed` 为终态，终态后不可修改。PlanningOutput 不驱动 Task / AgentRun 状态推进，实际执行仍以 Task DAG 为准。

最小结构：

```ts
interface PlanningOutput {
  planningOutputId: string;
  workspaceId: string;
  orchestrationRunId: string;
  status: 'pending' | 'ready' | 'blocked' | 'failed';
  actionTree: PlanningActionNode[];
  preconditions: PlanningPrecondition[];
  blockedReason?: PlanningBlockedReason;
  replanReason?: PlanningReplanReason;
  contextPackRefs: string[];
  createdAt: string;
  updatedAt: string;
}

interface PlanningActionNode {
  actionId: string;
  parentActionId?: string;
  taskId?: string;
  title: string;
  intent: string;
  status: 'planned' | 'ready' | 'blocked' | 'skipped';
  dependsOnActionIds: string[];
}

interface PlanningPrecondition {
  actionId?: string;
  description: string;
  status: 'satisfied' | 'missing' | 'unknown';
  evidenceRefs: string[];
}

interface PlanningBlockedReason {
  scope: 'run' | 'action' | 'task';
  actionId?: string;
  taskId?: string;
  code: string;
  message: string;
  operatorActionHint?: string;
}

interface PlanningReplanReason {
  previousRunId?: string;
  trigger: 'operator_request' | 'failed_precondition' | 'stale_context' | 'runtime_failure';
  message: string;
}
```

设计约束：

- `actionTree` 是解释规划意图的树，不是新的执行状态机；实际执行仍以 `Task` DAG 为准。
- `preconditions` 必须能引用 evidence / ContextPack / TraceEvent / Artifact，不能只写模型猜测。
- `blockedReason` 用于 UI 和 Operator 判断是否要补充输入、批准受保护动作或取消本轮 run。
- `replanReason` 只描述“为什么新开一轮重新规划”，不允许在同一 OrchestrationRun 内大规模改图。
- PlanningOutput 里的大内容或源码片段仍通过引用保存，不能把 ContextPack 内容直接塞进 JSON。

---

## 7. Task

OrchestrationRun 内的一个**子任务节点**。

| 字段                   | 类型                                                       | 必填 | 说明                     |
| ---------------------- | ---------------------------------------------------------- | ---- | ------------------------ |
| `task_id`              | `string`                                                   | ✅   |                          |
| `workspace_id`         | `string`                                                   | ✅   |                          |
| `parent_task_id`       | `string`                                                   | ⛔   | 嵌套场景                 |
| `orchestration_run_id` | `string`                                                   | ✅   |                          |
| `task_kind`            | `enum: research \| edit \| review \| synthesize \| custom` | ✅   |                          |
| `title`                | `string`                                                   | ✅   |                          |
| `brief`                | `text`                                                     | ✅   | 任务指令                 |
| `execution_profile`    | `string`                                                   | ⛔   | 偏好 runtime / 模型      |
| `status`               | `enum`（见 state-machines.md）                             | ✅   |                          |
| `priority`             | `int`                                                      | ⛔   |                          |
| `attempt`              | `int`                                                      | ✅   | 累计重试次数             |
| `idempotency_key`      | `string`                                                   | ✅   | 防重复提交               |
| `depends_on_task_ids`  | `jsonb (string[])`                                         | ⛔   | DAG 依赖                 |
| `context_refs`         | `jsonb (string[])`                                         | ⛔   | 输入 artifact            |
| `artifact_refs`        | `jsonb (string[])`                                         | ⛔   | 输出 artifact            |
| `budget_hint`          | `jsonb`                                                    | ⛔   | token / time / cost 预算 |
| `failure_reason`       | `string`                                                   | ⛔   |                          |
| `created_at`           | `timestamp`                                                | ✅   |                          |
| `updated_at`           | `timestamp`                                                | ✅   |                          |

**索引**：`(orchestration_run_id, status)`, `(workspace_id, task_kind)`

---

## 8. AgentRun

**一次具体的 agent 调用执行**。

| 字段                      | 类型        | 必填 | 说明                            |
| ------------------------- | ----------- | ---- | ------------------------------- |
| `run_id`                  | `string`    | ✅   |                                 |
| `workspace_id`            | `string`    | ✅   |                                 |
| `task_id`                 | `string`    | ✅   |                                 |
| `orchestration_run_id`    | `string`    | ✅   |                                 |
| `runtime_type`            | `string`    | ✅   | 如 `codex`                      |
| `runtime_model`           | `string`    | ⛔   |                                 |
| `status`                  | `enum`      | ✅   |                                 |
| `attempt`                 | `int`       | ✅   |                                 |
| `provider_run_id`         | `string`    | ⛔   | 外部 runtime 的 id              |
| `submitted_at`            | `timestamp` | ⛔   |                                 |
| `queued_at`               | `timestamp` | ⛔   |                                 |
| `started_at`              | `timestamp` | ⛔   |                                 |
| `finished_at`             | `timestamp` | ⛔   |                                 |
| `timeout_at`              | `timestamp` | ⛔   |                                 |
| `retryable`               | `bool`      | ✅   |                                 |
| `cancelable`              | `bool`      | ✅   |                                 |
| `input_ref`               | `string`    | ⛔   | Artifact id                     |
| `output_ref`              | `string`    | ⛔   |                                 |
| `error_code`              | `string`    | ⛔   |                                 |
| `error_message`           | `text`      | ⛔   |                                 |
| `trace_id`                | `string`    | ✅   |                                 |
| **🆕 `heartbeat_at`**     | `timestamp` | ⛔   | 心跳，崩溃恢复用                |
| **🆕 `lease_owner`**      | `string`    | ⛔   | 当前持有者（进程 id / 节点 id） |
| **🆕 `lease_expires_at`** | `timestamp` | ⛔   | lease 超时                      |

> 🆕 标记的字段是**对 V0.1.0 的补充**，用于崩溃恢复，见 [`replay-and-recovery.md`](replay-and-recovery.md)。

**索引**：`(task_id, attempt)`, `(status, lease_expires_at)`（恢复扫描专用）

---

## 9. Artifact

执行过程中的**产出**。

| 字段                     | 类型                                                            | 必填 | 说明                                     |
| ------------------------ | --------------------------------------------------------------- | ---- | ---------------------------------------- |
| `artifact_id`            | `string`                                                        | ✅   |                                          |
| `workspace_id`           | `string`                                                        | ✅   |                                          |
| `orchestration_run_id`   | `string`                                                        | ⛔   |                                          |
| `task_id`                | `string`                                                        | ⛔   |                                          |
| `run_id`                 | `string`                                                        | ⛔   |                                          |
| `artifact_role`          | `enum: input \| intermediate \| output \| summary \| trace`     | ✅   |                                          |
| `kind`                   | `enum: text \| patch \| log \| file_snapshot \| json \| binary` | ✅   |                                          |
| `format_version`         | `string`                                                        | ✅   | 内容格式版本                             |
| `uri_or_path`            | `string`                                                        | ✅   | 本地路径或 S3 URI                        |
| `content_type`           | `string`                                                        | ⛔   | MIME                                     |
| `size_bytes`             | `int`                                                           | ⛔   |                                          |
| `producer_type`          | `enum: human \| agent \| system`                                | ✅   |                                          |
| `producer_id`            | `string`                                                        | ⛔   |                                          |
| `visibility`             | `enum: public \| operator_only \| debug`                        | ✅   |                                          |
| `review_state`           | `enum: unreviewed \| accepted \| rejected \| superseded`        | ✅   | 默认 `unreviewed`                        |
| `owner_type`             | `enum: human \| agent \| system`                                | ✅   | 谁负责后续交接                           |
| `source_input_refs`      | `jsonb (string[])`                                              | ⛔   | 输入 artifact / 文件引用                 |
| `verification_refs`      | `jsonb (string[])`                                              | ⛔   | test log / screenshot / CI / review note |
| `reuse_policy`           | `enum: reusable \| run_local \| sensitive \| expired`           | ✅   | 默认 `run_local`                         |
| `supersedes_artifact_id` | `string`                                                        | ⛔   | 新版本取代旧产物                         |
| `created_at`             | `timestamp`                                                     | ✅   |                                          |

**存储原则**：

- DB 存元数据
- 内容存文件系统（本地）或 S3 兼容存储（远程）
- 大文件（> N MB，N 待定）必须落对象存储而非 DB
- 用户可见 Artifact 不允许成为“孤儿文件”：至少要能追到 `orchestration_run_id`、`task_id` 或 `run_id` 之一
- `verification_refs` 指向的验证产物也必须是 Artifact，不允许只写自由文本结论

### 9.1 Artifact 作为交接物

Artifact Detail 必须能回答四个问题：

1. **谁生成**：`producer_type` / `producer_id` / `run_id`。
2. **基于什么生成**：`source_input_refs`。
3. **是否验证过**：`verification_refs` 与对应 artifact 的状态。
4. **是否可复用**：`reuse_policy`。

`review_state` 的语义：

| 状态         | 含义                               |
| ------------ | ---------------------------------- |
| `unreviewed` | 尚无人类或系统确认                 |
| `accepted`   | 已被接受，可作为后续上下文或交付物 |
| `rejected`   | 已被拒绝，不应默认复用             |
| `superseded` | 已被新 artifact 取代               |

### 9.2 Handoff Queue Projection

Handoff Queue 是 UI / application 层的**待处理投影**，R1 可以由 Task、AgentRun、Artifact、Runtime/Core health 与 TraceEvent 派生，不要求立刻持久化为独立表。

最小字段：

| 字段              | 类型                                                                                          | 说明                                               |
| ----------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `handoff_item_id` | `string`                                                                                      | projection id，可由源对象 id + reason 生成         |
| `workspace_id`    | `string`                                                                                      | 一级边界                                           |
| `source_type`     | `enum: run \| task \| agent_run \| artifact \| runtime \| core`                               | 来源对象类型                                       |
| `source_id`       | `string`                                                                                      | 来源对象 id                                        |
| `reason`          | `enum: protected_action \| failed_task \| review_artifact \| runtime_issue \| ambiguous_plan` | 阻塞 / 待处理原因                                  |
| `primary_action`  | `string`                                                                                      | 推荐主操作，如 `approve_once` / `retry` / `accept` |
| `effect`          | `enum: applies_now \| applies_next \| records_only`                                           | 提交后影响范围                                     |
| `trace_event_id`  | `string`                                                                                      | 触发该 queue item 的事件                           |
| `created_at`      | `timestamp`                                                                                   | 等待时长计算基准                                   |

---

## 10. TraceEvent

| 字段                   | 类型                                   | 必填 | 说明                              |
| ---------------------- | -------------------------------------- | ---- | --------------------------------- |
| `trace_event_id`       | `string`                               | ✅   |                                   |
| `workspace_id`         | `string`                               | ✅   |                                   |
| `orchestration_run_id` | `string`                               | ⛔   |                                   |
| `task_id`              | `string`                               | ⛔   |                                   |
| `run_id`               | `string`                               | ⛔   |                                   |
| `event_type`           | `string`                               | ✅   | 如 `task.dispatched`, `run.token` |
| `level`                | `enum: debug \| info \| warn \| error` | ✅   |                                   |
| `payload_ref`          | `string`                               | ⛔   | 大 payload 存 artifact            |
| `created_at`           | `timestamp`                            | ✅   |                                   |
| `trace_id`             | `string`                               | ✅   |                                   |

**写入策略**（与 ADR-0006 配套）：

- 启用 batch insert
- SQLite 启用 WAL，避免每条 fsync
- 定期 archive（保留期限在 `legal/data-locality.md` 中明确）

---

## 11. ID 与 ULID

所有 id 采用 **ULID**（128-bit、字典序、时间排序友好）：

- 长度短于 UUID
- 排序天然按时间
- 双数据库都易表达为 `TEXT` / `VARCHAR(26)`

---

## 12. Code Context

R1a 先落地轻量代码上下文索引的元数据基线，不扫描真实文件、不写 AST/FTS，不把源码内容直接塞进数据库。

### SourceRoot

用户授权给 Workspace 使用的代码根目录。

| 字段              | 类型                                         | 必填 | 说明                   |
| ----------------- | -------------------------------------------- | ---- | ---------------------- |
| `source_root_id`  | `string (ulid)`                              | ✅   |                        |
| `workspace_id`    | `string`                                     | ✅   | 一级边界               |
| `kind`            | `enum: local_directory \| remote_repository` | ✅   | R1a 主要使用本地目录   |
| `display_name`    | `string`                                     | ✅   | 用户可见名             |
| `uri`             | `string`                                     | ✅   | 本地 file URI 或远程仓 |
| `status`          | `enum: active \| indexing \| stale \| error` | ✅   | 索引状态               |
| `include_globs`   | `json (string[])`                            | ✅   | 用户 include 规则      |
| `exclude_globs`   | `json (string[])`                            | ✅   | 用户 exclude 规则      |
| `created_at`      | `timestamp`                                  | ✅   |                        |
| `updated_at`      | `timestamp`                                  | ✅   |                        |
| `last_indexed_at` | `timestamp`                                  | ⛔   | 后续索引完成时写入     |
| `error`           | `text`                                       | ⛔   | 最近一次索引错误       |
| `metadata`        | `json`                                       | ⛔   | 扩展位                 |

**索引**：`(workspace_id, status)`, `(workspace_id, uri)`

### CodeIndexSnapshot

一次稳定索引快照的元数据。R1a 注册 SourceRoot 时创建 `pending` 快照；R1b-a 手动 reindex 后创建 `ready` 快照，并将文件清单写入 `code_index_files`。

| 字段             | 类型                              | 必填 | 说明            |
| ---------------- | --------------------------------- | ---- | --------------- |
| `snapshot_id`    | `string (ulid)`                   | ✅   |                 |
| `source_root_id` | `string`                          | ✅   | 所属 SourceRoot |
| `workspace_id`   | `string`                          | ✅   | 一级边界        |
| `status`         | `enum: pending \| ready \| error` | ✅   | 快照状态        |
| `index_version`  | `string`                          | ✅   | 索引格式版本    |
| `file_count`     | `int`                             | ✅   | R1a 为 0        |
| `created_at`     | `timestamp`                       | ✅   |                 |
| `metadata`       | `json`                            | ⛔   | 扩展位          |

**索引**：`(source_root_id, created_at)`, `(workspace_id, created_at)`

### CodeIndexFile

某个 `CodeIndexSnapshot` 内的一条文件清单记录。它只保存元数据与 digest，不保存源码内容。

| 字段             | 类型            | 必填 | 说明                  |
| ---------------- | --------------- | ---- | --------------------- |
| `file_id`        | `string (ulid)` | ✅   |                       |
| `snapshot_id`    | `string`        | ✅   | 所属快照              |
| `source_root_id` | `string`        | ✅   | 所属 SourceRoot       |
| `workspace_id`   | `string`        | ✅   | 一级边界              |
| `path`           | `text`          | ✅   | SourceRoot 内相对路径 |
| `size_bytes`     | `int`           | ✅   | 文件大小              |
| `mtime_ms`       | `int`           | ✅   | 文件修改时间          |
| `digest`         | `text`          | ✅   | `sha256:<hex>`        |
| `language`       | `string`        | ⛔   | 基于扩展名的猜测      |
| `ignored`        | `bool`          | ✅   | 当前阶段恒为 false    |
| `created_at`     | `timestamp`     | ✅   |                       |

**索引**：`(snapshot_id, path)`, `(source_root_id, path)`, `(workspace_id, language)`

### ContextPack

给 Planner / Worker / Runtime Adapter 使用的上下文 manifest。R1a 只持久化 manifest；大内容后续放 artifact store。

| 字段                   | 类型        | 必填 | 说明                               |
| ---------------------- | ----------- | ---- | ---------------------------------- |
| `context_pack_id`      | `string`    | ✅   |                                    |
| `workspace_id`         | `string`    | ✅   | 一级边界                           |
| `orchestration_run_id` | `string`    | ⛔   | 当目标是 run 时填                  |
| `task_id`              | `string`    | ⛔   | 当目标是 task 时填                 |
| `source_root_ids`      | `json`      | ✅   | 参与构造上下文的 SourceRoot        |
| `created_for`          | `json`      | ✅   | `{ type, orchestrationRunId? }` 等 |
| `query`                | `text`      | ✅   | 上下文构造意图                     |
| `items`                | `json`      | ✅   | file excerpt / symbol 等条目       |
| `token_estimate`       | `int`       | ⛔   | 估算 token                         |
| `created_at`           | `timestamp` | ✅   |                                    |

**索引**：`(workspace_id, created_at)`, `(orchestration_run_id)`, `(task_id)`

`items` 中的 file excerpt 可保存 `path`、`startLine`、`endLine`、`digest`、`reason` 与
`confidence`。R1b-a 阶段这些字段仍属于 manifest 元数据；源码片段内容后续通过
`contentRef` 指向 Artifact store，不直接写入 `context_packs.items`。

---

## 13. 待办

- [ ] 给出 ER 图（Mermaid）
- [ ] 提交对应的 Drizzle schema（落地后引用 `packages/storage/sqlite/` 与 `packages/storage/postgres/`）
- [ ] 列出 schema 演进时的破坏性变更分类

---

## 变更历史

| 日期       | 变更                                                                  |
| ---------- | --------------------------------------------------------------------- |
| 2026-05-17 | 补充 Artifact review/provenance/reuse 字段与 Handoff Queue projection |
| 2026-05-15 | 补充 Goal Planner planning artifact 输出草案                          |
| 2026-05-15 | 明确 ContextPack item 可保存片段行号与 token 估算                     |
| 2026-05-15 | 补充 CodeIndexFile 文件清单对象                                       |
| 2026-05-15 | 补充轻量代码上下文索引 R1a 领域对象                                   |
| 2026-05-14 | 初版，从 V0.1.0 §12 抽出并补充 heartbeat/lease 字段                   |
