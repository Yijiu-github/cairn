# 领域模型 / Domain Model

> 状态：🟡 Draft
> 最后更新：2026-05-14
> 来源：[`设计文档V0.1.0.md §12`](设计文档V0.1.0.md) 抽出并扩展
> 上游术语：见 [`../reference/glossary.md`](../reference/glossary.md)

---

## 0. 总则

- 所有 UI 可见对象**必须有 stable id**
- 所有执行对象**必须有状态枚举**
- 所有可重试执行**必须记录 `attempt`**
- 错误归因必须能**分层到：编排 / 任务 / 执行 / 产物**
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

| 字段                   | 类型                                                   | 必填 | 说明              |
| ---------------------- | ------------------------------------------------------ | ---- | ----------------- |
| `orchestration_run_id` | `string`                                               | ✅   |                   |
| `workspace_id`         | `string`                                               | ✅   |                   |
| `conversation_id`      | `string`                                               | ⛔   |                   |
| `origin_event_id`      | `string`                                               | ✅   | 触发的 event      |
| `status`               | `enum`（见下）                                         | ✅   |                   |
| `execution_mode`       | `enum: direct_answer \| single_worker \| multi_worker` | ✅   | 首发三种          |
| `planner_output_ref`   | `string`                                               | ⛔   | Artifact id       |
| `synthesis_output_ref` | `string`                                               | ⛔   |                   |
| `final_response_ref`   | `string`                                               | ⛔   |                   |
| `has_partial_failures` | `bool`                                                 | ✅   |                   |
| `result_completeness`  | `enum: complete \| partial \| empty`                   | ✅   |                   |
| `completion_level`     | `enum: full \| degraded \| failed`                     | ✅   |                   |
| `started_at`           | `timestamp`                                            | ⛔   |                   |
| `finished_at`          | `timestamp`                                            | ⛔   |                   |
| `error_code`           | `string`                                               | ⛔   |                   |
| `error_message`        | `text`                                                 | ⛔   |                   |
| `trace_id`             | `string`                                               | ✅   | 贯穿一切的关联 id |

**状态枚举（与 state-machines.md 同步）**：

`queued` → `planning` → `running` → `synthesizing` → `succeeded`  
`paused`（任意运行中状态可入）  
`cancelled` / `failed` / `timeout`（终态）

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

| 字段                   | 类型                                                            | 必填 | 说明              |
| ---------------------- | --------------------------------------------------------------- | ---- | ----------------- |
| `artifact_id`          | `string`                                                        | ✅   |                   |
| `workspace_id`         | `string`                                                        | ✅   |                   |
| `orchestration_run_id` | `string`                                                        | ⛔   |                   |
| `task_id`              | `string`                                                        | ⛔   |                   |
| `run_id`               | `string`                                                        | ⛔   |                   |
| `artifact_role`        | `enum: input \| intermediate \| output \| summary \| trace`     | ✅   |                   |
| `kind`                 | `enum: text \| patch \| log \| file_snapshot \| json \| binary` | ✅   |                   |
| `format_version`       | `string`                                                        | ✅   | 内容格式版本      |
| `uri_or_path`          | `string`                                                        | ✅   | 本地路径或 S3 URI |
| `content_type`         | `string`                                                        | ⛔   | MIME              |
| `size_bytes`           | `int`                                                           | ⛔   |                   |
| `producer_type`        | `enum: human \| agent \| system`                                | ✅   |                   |
| `producer_id`          | `string`                                                        | ⛔   |                   |
| `visibility`           | `enum: public \| operator_only \| debug`                        | ✅   |                   |
| `created_at`           | `timestamp`                                                     | ✅   |                   |

**存储原则**：

- DB 存元数据
- 内容存文件系统（本地）或 S3 兼容存储（远程）
- 大文件（> N MB，N 待定）必须落对象存储而非 DB

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

---

## 13. 待办

- [ ] 给出 ER 图（Mermaid）
- [ ] 提交对应的 Drizzle schema（落地后引用 `packages/storage/sqlite/` 与 `packages/storage/postgres/`）
- [ ] 列出 schema 演进时的破坏性变更分类

---

## 变更历史

| 日期       | 变更                                                |
| ---------- | --------------------------------------------------- |
| 2026-05-15 | 补充 CodeIndexFile 文件清单对象                     |
| 2026-05-15 | 补充轻量代码上下文索引 R1a 领域对象                 |
| 2026-05-14 | 初版，从 V0.1.0 §12 抽出并补充 heartbeat/lease 字段 |
