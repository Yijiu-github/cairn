# R1 Codex E2E + Artifact / Trace 最小闭环设计

> 状态：🟡 Draft<br>
> 最后更新：2026-05-15<br>
> 关联：[`设计文档V0.1.0.md`](设计文档V0.1.0.md)、[`domain-model.md`](domain-model.md)、[`state-machines.md`](state-machines.md)、[`replay-and-recovery.md`](replay-and-recovery.md)、[`../contracts/runtime-adapter.md`](../contracts/runtime-adapter.md)、[`../adr/0017-codex-cli-runtime-adapter.md`](../adr/0017-codex-cli-runtime-adapter.md)、[`../adr/0018-codex-cli-exec-jsonl-transport.md`](../adr/0018-codex-cli-exec-jsonl-transport.md)

---

## 1. 本文解决什么

Release 1 已经拍板：桌面本地工作区、Workspace Core、SQLite、本地 artifact store、Run / Task / AgentRun / Artifact / Trace 视图，以及 OpenAI Codex CLI 首发 Runtime Adapter。

目前仓库已有：

- `@cairn/application`：single-worker run 创建、Task 提交、AdapterStreamEvent 回写 AgentRun / Task / OrchestrationRun 状态。
- `@cairn/runtime-gateway`：RuntimeAdapter 契约、mock adapter、Codex `exec --json` 子进程封装与 JSONL parser。
- `@cairn/workspace-core`：Fastify 最小 HTTP 服务、SQLite application repository、mock runtime 提交流程。
- `@cairn/domain` / `@cairn/shared-contracts`：AgentRun、Artifact、TraceEvent 等 schema 与 SQLite 表。

但这些能力还没有被钉成一个可验收的 R1 端到端闭环。本文把最小闭环定义为：

> 从 Workspace Core 接收一次用户任务开始，创建 OrchestrationRun / Task / AgentRun，调用 Codex CLI adapter 执行，沉淀 stdout / stderr / final response 等 Artifact，写入可回放 TraceEvent，最终通过 API / UI 能看到 run 状态、产物和时间线。

---

## 2. 设计目标

### 2.1 必须做到

1. 一次真实或 mock Codex 执行能贯穿：`Event -> OrchestrationRun -> Task -> AgentRun -> Artifact -> TraceEvent`。
2. Codex stdout JSONL 只进入协议解析器；stderr 只进入 log/debug artifact，不混入 JSONL parser。
3. AgentRun 状态必须由 AdapterStreamEvent 驱动，终态不可再改。
4. Artifact 元数据落 DB，内容落本地 artifact store；TraceEvent 只内嵌小 payload，大 payload 通过 `payloadRef` 指向 Artifact。
5. Run Detail 页面需要的三组数据都可由 Workspace Core API 提供：状态树、artifact 列表、trace timeline。
6. Replay 只从 TraceEvent + Artifact 重建视图，不重新执行 runtime。
7. Artifact 必须带 provenance / review / verification / reuse 元数据，避免成为不可审阅的附件。
8. Run Detail Inspector 至少保留 timeline、causality、first failure、cost / latency 四类视角的数据位置。
9. 无 Codex CLI / 无 OpenAI 凭据环境下，仍可用 mock / fixture adapter 验收同一条状态与持久化链路。

### 2.2 暂不做到

- 不做多 worker DAG；R1 验收先用 single-worker。
- 不做 Desktop / Web 两套不同语义；UI 只消费 Workspace Core 契约。
- 不做远程 workspace、PostgreSQL、S3 artifact store。
- 不做中途 operator note 注入到 Codex CLI；只保留后续扩展点。
- 不把 Codex CLI stderr 作为用户可见主输出；它默认是 debug / 排错信息。

---

## 3. 最小对象链路

```text
Event(user/system input)
  -> OrchestrationRun(trace_id)
    -> Task(idempotency_key, context_refs)
      -> AgentRun(runtime_type=codex, runtime_model, provider_run_id?)
        -> Artifact(input / stdout-log / stderr-log / final-response / error-debug)
        -> TraceEvent(run.*, task.*, agent_run.*, artifact.*)
```

### 3.1 对象职责

- **Event**：用户输入或系统触发源。`origin_event_id` 是 run 的来源锚点。
- **OrchestrationRun**：一次完整执行。R1 single-worker 下依然保留 `execution_mode`，不因为简单而绕过 run。
- **Task**：可调度的子任务。R1 只有一个 ready task，但仍写 `idempotency_key`。
- **AgentRun**：一次具体 runtime 调用。Task retry 时新增 AgentRun，不覆盖旧 AgentRun。
- **Artifact**：大内容与可下载内容的唯一载体，也是 review / handoff 的一等交接物。
- **TraceEvent**：回放和排错的时间线输入，不承载大正文；用于把 failure / artifact 反查到上游原因。

### 3.2 ID 与引用

- `OrchestrationRun.trace_id` 是 UI timeline 的主聚合键。
- `AgentRun.run_id` 传给 RuntimeAdapter，作为本地幂等基准。
- `Artifact.artifact_id` 用于：
  - `Task.context_refs`：输入上下文。
  - `Task.artifact_refs`：该 task 产生的产物。
  - `AgentRun.input_ref` / `output_ref`：主输入和最终输出。
  - `TraceEvent.payload_ref`：大 payload 外置。

---

## 4. R1 E2E 数据流

### 4.1 启动 run

调用方：Desktop Shell 或测试用 HTTP client。

```text
POST /v1/workspaces/:workspaceId/runs
body:
  originEventId
  task:
    title
    brief
    taskKind
    contextRefs?
    budgetHint?
```

Workspace Core 做：

1. 校验 workspace / origin event 存在；本地 bootstrap 可创建 system event。
2. 调 `OrchestrationRunService.createSingleWorkerRun()`。
3. 在同一业务动作中创建：
   - `OrchestrationRun(status=queued)`
   - `Task(status=ready, attempt=0, idempotency_key=<task_id>:0)`
   - `TraceEvent(event_type=run.queued)`
4. 返回 `202 OrchestrationRun`。

### 4.2 提交 runtime

R1 可以先保留显式提交 endpoint，后续由 scheduler tick 自动拾取 ready task：

```text
POST /v1/tasks/:taskId/agent-runs
body:
  runtimeType: "codex"
  model?: string
  options?:
    sandboxMode?: "read-only" | "workspace-write"
```

Workspace Core 做：

1. 读取 Task / Run，确认非终态且 Task 为 `ready`。
2. 创建 `AgentRun(status=submitted, runtime_type=codex)`。
3. 将 Run 推到 `running`，Task 推到 `dispatched`。
4. 写 `TraceEvent(event_type=task.dispatched)`。
5. 调 Runtime Gateway `submit(AdapterSubmitRequest)`。
6. 保存 `provider_run_id`（Codex `thread_id` 出现时补写）。

### 4.3 Codex adapter 执行

Codex 首发命令形态由 ADR-0018 约束：

```text
codex exec --json --color never --sandbox read-only --ephemeral --skip-git-repo-check --ignore-rules -C <sandboxDir> <prompt>
```

Adapter / Gateway 做：

1. 从 input artifact 组装 prompt；如果没有 input artifact，则使用 Task brief 生成的 prompt artifact。
2. 为本次 AgentRun 准备 sandbox：`<userData>/Cairn/workspaces/<workspace_id>/runs/<agent_run_id>/`。
3. 只传白名单环境变量；不展开继承完整 `process.env`。
4. stdout 按 JSONL 逐行解析为 AdapterStreamEvent。
5. stderr 按原文写入 `codex.stderr.log` artifact。
6. stdout 原始 JSONL 可写入 `codex.stdout.jsonl` debug artifact，方便上游 schema 变化时排查。
7. 最终 agent message 写入 `final-response` artifact。

### 4.4 回写状态与事件

Application service 消费 AdapterStreamEvent：

- `queued` -> `AgentRun.status=queued`，写 `agent_run.queued`。
- `started` -> `AgentRun.status=running`、`Task.status=running`，写 `agent_run.started`。
- `token` -> 不直接落 DB 大正文；聚合到 final response buffer，必要时写 `agent_run.token` debug trace。
- `progress` / 未知 Codex event -> 写 `agent_run.progress` trace。
- `artifact` -> 注册 Artifact 元数据，更新 `Task.artifact_refs`，写 `artifact.recorded`。
- `succeeded` -> `AgentRun/Task/Run` 进入成功终态，`Run.final_response_ref` 指向 final artifact，写 `run.succeeded`。
- `failed` -> 归一化错误写入 `AgentRun.error` / `Run.error`，写 `run.failed`。
- `cancelled` -> 写取消终态和 `run.cancelled`。
- `timeout` -> 写超时终态和 `run.timeout`。

---

## 5. Artifact 设计

### 5.1 本地路径约定

R1 本地 artifact store 使用 workspace 目录下的相对路径，DB 中存 `uri_or_path`：

```text
<userData>/Cairn/workspaces/<workspace_id>/artifacts/<artifact_id>/<file_name>
```

Sandbox 与 artifact store 分开：

```text
<userData>/Cairn/workspaces/<workspace_id>/runs/<agent_run_id>/       # runtime cwd
<userData>/Cairn/workspaces/<workspace_id>/artifacts/<artifact_id>/   # immutable-ish content
```

原则：

- sandbox 是执行现场，可以清理或打快照。
- artifact store 是产品记录，默认保留。
- Artifact 内容写入完成后再插入 DB 元数据，避免 DB 指向半文件。

### 5.2 R1 必备 artifact

| 名称                 | role   | kind | format_version          | visibility    | 说明                     |
| -------------------- | ------ | ---- | ----------------------- | ------------- | ------------------------ |
| `prompt.md`          | input  | text | `text.markdown.v1`      | operator_only | 送给 Codex 的最终 prompt |
| `codex.stdout.jsonl` | trace  | log  | `codex.stdout-jsonl.v1` | debug         | Codex stdout 原始 JSONL  |
| `codex.stderr.log`   | trace  | log  | `codex.stderr-log.v1`   | debug         | Codex stderr 原文        |
| `final-response.md`  | output | text | `text.markdown.v1`      | public        | 最终 agent message       |
| `error.json`         | trace  | json | `adapter-error.v1`      | debug         | 失败时的归一化错误与摘要 |

> 如果某次执行没有 stderr 内容，可以不创建 `codex.stderr.log`，但 trace 中应记录 `stderr_empty=true`。

### 5.3 Review / Provenance 默认值

R1 创建 artifact 时必须写入这些默认值：

| artifact             | `review_state` | `owner_type` | `reuse_policy`                                | `verification_refs`                  |
| -------------------- | -------------- | ------------ | --------------------------------------------- | ------------------------------------ |
| `prompt.md`          | `unreviewed`   | `system`     | `sensitive`                                   | 空                                   |
| `codex.stdout.jsonl` | `unreviewed`   | `system`     | `run_local`                                   | 空                                   |
| `codex.stderr.log`   | `unreviewed`   | `system`     | `run_local`                                   | 空                                   |
| `final-response.md`  | `unreviewed`   | `agent`      | `reusable`（人工接受后）/ `run_local`（默认） | 可指向 test log / manual review note |
| `error.json`         | `unreviewed`   | `system`     | `run_local`                                   | 空                                   |

`source_input_refs` 至少包含 prompt / context artifact；没有输入 artifact 时，必须记录由 Task brief 生成的 prompt artifact。

### 5.4 写入顺序

1. 写临时文件：`<artifact>.tmp`。
2. fsync / close 后 rename 到目标文件名。
3. 计算 `size_bytes`，可选计算 hash（R1 可暂不入 schema）。
4. 插入 Artifact 元数据。
5. 写 `TraceEvent(event_type=artifact.recorded, payload_inline={ artifact_id, role, kind })`。
6. 将 artifact id 加入 `Task.artifact_refs`；最终输出同时写 `AgentRun.output_ref` 与 `OrchestrationRun.final_response_ref`。
7. 为用户可见 artifact 写入 `review_state` / `owner_type` / `source_input_refs` / `verification_refs` / `reuse_policy` 默认值。

### 5.4.1 M2 Local Artifact Payload Boundary

M2 的本地 artifact payload 写入采用同目录临时文件 + rename，避免 DB/API 指向半写入文件。
`artifact-payload://...` 仍是 opaque reference，不是本地路径；读取端只接受安全 segment，拒绝绝对路径、空 segment 与路径穿越。

R1/M2 默认保留 payload 文件。hash 校验、导出、清理与 retention API 留到后续里程碑。

### 5.5 ArtifactStorePort 扩展

现有 `ArtifactStorePort.registerRuntimeArtifact()` 只登记 descriptor。R1 E2E 需要补齐内容写入端口：

```ts
export interface WriteArtifactInput {
  workspaceId: WorkspaceId;
  orchestrationRunId?: OrchestrationRunId;
  taskId?: TaskId;
  runId?: AgentRunId;
  artifactRole: ArtifactRole;
  kind: ArtifactKind;
  formatVersion: string;
  contentType?: string;
  visibility: Visibility;
  producerType: ProducerType;
  producerId?: string;
  fileName: string;
  content: Uint8Array | string;
}

export interface ArtifactStorePort {
  writeArtifact(input: WriteArtifactInput): Promise<Artifact>;
  registerRuntimeArtifact(input: RegisterRuntimeArtifactInput): Promise<Artifact>;
}
```

约束：

- Runtime Adapter 不直接写 DB。
- Runtime Adapter 可以写它自己的 sandbox 输出，但正式 Artifact 必须通过 Workspace Core / ArtifactStorePort 登记。
- Application service 在处理 `artifact` / terminal event 时只接收 ArtifactRef，不猜路径。

---

## 6. TraceEvent 设计

### 6.1 事件命名

R1 最小事件集：

| event_type            | level | payload                                           |
| --------------------- | ----- | ------------------------------------------------- |
| `run.queued`          | info  | `execution_mode`                                  |
| `run.running`         | info  | 可选                                              |
| `task.dispatched`     | info  | `runtime_type`, `task_id`, `agent_run_id`         |
| `agent_run.queued`    | info  | `provider_run_id?`                                |
| `agent_run.started`   | info  | `provider_run_id?`                                |
| `agent_run.heartbeat` | debug | `at`                                              |
| `agent_run.progress`  | debug | `note` 或 `payload_ref`                           |
| `agent_run.token`     | debug | `payload_ref` 或 `{ size_bytes }`，避免大正文内嵌 |
| `artifact.recorded`   | info  | `artifact_id`, `role`, `kind`, `format_version`   |
| `run.succeeded`       | info  | `final_response_ref`                              |
| `run.failed`          | error | `code`, `retryable`, `payload_ref?`               |
| `run.cancelled`       | warn  | `reason`                                          |
| `run.timeout`         | error | `timeout_ms`                                      |

命名规则沿用 `TraceEventType` 的开放枚举：未知事件前端不应崩溃，只显示 raw payload。

### 6.2 payload_inline 与 payload_ref

- 小于约 4 KB 的结构化摘要可放 `payload_inline`。
- stdout JSONL、stderr、token 聚合正文、错误详情栈等必须放 Artifact，再用 `payload_ref` 指向。
- `payload_inline` 禁止放 secret、完整 prompt、完整用户代码片段。

### 6.3 Inspector 视角

R1 Inspector 不要求复杂图可视化，但数据与 UI tab 必须能表达四种视角：

| 视角           | 回答的问题                           | 最小数据来源                                               |
| -------------- | ------------------------------------ | ---------------------------------------------------------- |
| Timeline       | 发生了什么、顺序如何                 | `TraceEvent.created_at` + `event_type`                     |
| Causality      | 这个 artifact / failure 从哪里来     | `task_id` / `run_id` / `payload_ref` / `source_input_refs` |
| First failure  | 第一处 error / timeout / lost 在哪里 | 最早 `level=error` 或终态失败事件                          |
| Cost & latency | 这次长任务花了多久、重试几次         | AgentRun 时间戳、Task attempt、budget/cost payload         |

未知 TraceEvent 前端必须可降级显示 raw payload，不能让 replay 崩溃。

### 6.4 Replay 输入

Run Detail 的 replay 数据源：

1. `GET /v1/runs/:runId`
2. `GET /v1/runs/:runId/tasks`
3. `GET /v1/tasks/:taskId/agent-runs`
4. `GET /v1/runs/:runId/artifacts`
5. `GET /v1/runs/:runId/trace`

Replay 渲染层只接受 TraceEvent 序列和懒加载 Artifact，不调用 runtime，不提交新 task。

以上五个 endpoint 仍作为可组合的只读 baseline API；M2 在其上新增首选的 Inspector 聚合入口。

### 6.5 M2 Replay Source API

M2 新增 `GET /v1/runs/:runId/replay-source` 作为 Run Detail Inspector 的证据包入口。它聚合 OrchestrationRun、Task、AgentRun、Artifact metadata、TraceEvent timeline 与轻量 inspector 摘要，用于从已有 TraceEvent / Artifact 重建视图。

Replay Source 不调用 RuntimeAdapter，不提交新 Task，不重新执行 Codex，也不内联 artifact 正文。Artifact 内容仍通过 `GET /v1/artifacts/:artifactId/payload` 懒加载。

---

## 7. Workspace Core API baseline 与剩余缺口

现有 `run.contract.ts` 已声明 list/get Run、Task、AgentRun、Artifact、TraceEvent。当前 `develop` 已落地 Workspace Core 的 artifact / trace 只读 baseline，R1 E2E 继续依赖这些接口作为 Run Detail 与 Replay 的数据源：

- `GET /v1/runs/:runId`
- `GET /v1/runs/:runId/tasks`
- `GET /v1/tasks/:taskId/agent-runs`
- `GET /v1/runs/:runId/artifacts`
- `GET /v1/artifacts/:artifactId`
- `GET /v1/artifacts/:artifactId/payload`
- `GET /v1/runs/:runId/trace`
- `GET /v1/runs/:runId/replay-source`
- `GET /v1/workspaces/:workspaceId/handoff-items`（可先由现有对象实时投影，不要求 R1 独立持久化）

R1 剩余重点不再是补齐 artifact / trace 读 API，而是把这些已落地 endpoint 接到真实 Codex runtime drain 与 Run Detail / Replay 消费路径上。

当前还保留一个提交 runtime 的实现细节接口，直到 scheduler tick 接管：

```text
POST /v1/tasks/:taskId/agent-runs
```

R1 该接口可以作为 internal / desktop-only，后续自动调度后仍可保留为测试辅助或废弃。

---

## 8. Runtime Gateway / Application 边界

### 8.1 Runtime Gateway 负责

- 选择 adapter：`runtimeType=codex` -> CodexRuntimeAdapter。
- 调 adapter `submit()` / `stream()` / `cancel()` / `query()`。
- 将 Codex 子进程 stdout/stderr 转为统一 AdapterStreamEvent 和 Artifact 写入请求。
- 不直接推进 OrchestrationRun / Task / AgentRun 状态。

### 8.2 Application 负责

- 检查状态机合法性。
- 创建 AgentRun。
- 消费 AdapterStreamEvent 并推进状态。
- 写 TraceEvent。
- 调 ArtifactStorePort 登记正式产物。

### 8.3 Repository / Store 负责

- Repository：Run / Task / AgentRun / TraceEvent 的 DB 读写。
- ArtifactStore：内容写入 + Artifact 元数据登记。
- 两者可以在 Workspace Core 层用同一个 SQLite transaction 包起来，但接口上不要互相吞并。

---

## 9. 错误与恢复

### 9.1 错误归一化

沿用 `AdapterErrorCode`：

- `AUTH_INVALID` / `AUTH_EXPIRED`：Codex 凭据不可用。
- `AUTH_RATE_LIMITED` / `QUOTA_EXCEEDED`：额度或速率问题。
- `SERVICE_UNAVAILABLE`：Codex CLI 未安装、不可执行或子进程启动失败。
- `MODEL_UNAVAILABLE`：Codex CLI 已启动但模型不可用。
- `CONTEXT_OVERFLOW`：输入超上下文。
- `TIMEOUT`：本地 timeout 触发。
- `INTERNAL_ERROR`：未知非零退出或无效 JSONL。

失败时必须：

1. 写 `error.json` artifact（debug visibility）。
2. 写 `run.failed` trace。
3. `AgentRun.error` 和 `Run.error` 使用同一份结构化摘要。
4. `retryable` 由错误码决定，不由 UI 猜。

### 9.2 崩溃恢复

R1 至少做到：

- Workspace Core 启动时扫描 `AgentRun.status=running` 且 `lease_expires_at < now` 的记录。
- 标记为 `lost` 或 `failed` 前写 `agent_run.lost` trace。
- 不自动重放 Codex CLI。
- 用户若选择 retry，创建新的 AgentRun attempt。

如果 `lost` 状态尚未在 schema 中落地，R1 可临时映射为：

- `AgentRun.status=failed`
- `StructuredError.code=RUNTIME_LOST`
- `TraceEvent.event_type=agent_run.lost`

后续再决定是否把 `lost` 纳入正式 AgentRunStatus。

---

## 10. 安全与隐私边界

- Codex CLI 会把输入发送给 OpenAI；R1 install guide / 首启提示必须明确告知。
- `prompt.md` 默认 `operator_only`，不作为公开分享内容。
- stderr / stdout JSONL 默认 `debug`，避免泄漏路径、环境、warning 中的敏感信息。
- Adapter 环境变量必须白名单；禁止 `env: process.env`。
- Sandbox cwd 必须限制在该 AgentRun 的 run dir。
- `--sandbox read-only` 是默认；需要写 workspace 时必须由执行 profile 显式启用 `workspace-write`。
- Artifact API 返回 metadata；内容下载 API 后续单独设计访问控制。

---

## 11. 测试与验收

### 11.1 单元测试

- Codex JSONL parser：
  - `thread.started` -> queued
  - `turn.started` -> started
  - `item.completed(agent_message)` -> token
  - `turn.completed` -> succeeded
  - 未知事件 -> progress
  - 非法 JSONL -> failed(INTERNAL_ERROR)
- Codex process：
  - stdout / stderr 分离
  - 非零退出映射错误
  - timeout / cancel 语义
- Application 状态推进：
  - artifact event 更新 Task.artifact_refs
  - succeeded 设置 AgentRun.output_ref / Run.final_response_ref
  - terminal 后拒绝继续更新

### 11.2 集成测试

用 fixture adapter 跑完整链路：

1. 创建 workspace + origin event。
2. `POST /runs` 创建 run。
3. `POST /tasks/:taskId/agent-runs` 提交 mock/codex fixture。
4. 注入或消费事件直到 succeeded。
5. 断言：
   - Run status = `succeeded`
   - Task status = `succeeded`
   - AgentRun status = `succeeded`
   - 至少存在 `prompt.md`、`final-response.md` artifact
   - TraceEvent 含 `run.queued`、`task.dispatched`、`agent_run.started`、`artifact.recorded`、`run.succeeded`

### 11.3 真实 Codex smoke test

在装有 Codex CLI 和凭据的机器上手动/可选执行：

```text
任务：Reply exactly: CAIRN_E2E_OK
期望 final-response.md 内容：CAIRN_E2E_OK
```

验收点：

- stderr warning 不影响 stdout JSONL parser。
- `provider_run_id` 可从 `thread.started` 回填。
- final response 可通过 Artifact 读取。
- Run Detail replay 不需要 runtime 在线。

---

## 12. 落地顺序建议

当前 `develop` 已完成 ArtifactStorePort / SQLite 内容写入、ApplicationRepository artifact / trace 查询、Workspace Core Artifact / Trace read API 与 Runtime Artifact/Trace demo loop baseline。后续 R1 收口顺序建议调整为：

1. **完成 CodexRuntimeAdapter 集成**：把 `codex-process.ts` 接入 RuntimeAdapter 接口，并保留 mock / fixture 路径。
2. **收紧 RuntimeGatewayPort stream 消费循环**：submit 后持续把 adapter events 交给 Application service，覆盖取消 / drain / 非零退出边界。
3. **补 fixture E2E 集成测试**：不依赖真实 Codex，验证 final response artifact 与 trace replay source。
4. **补真实 Codex smoke 文档**：作为手动验收，不放进默认 CI。
5. **Run Detail UI 消费同一组 API**：不要让 UI 直接读文件系统。
6. **补 handoff projection 与 operator review 文案**：先 projection，不要求 R1 独立持久化。

---

## 13. 开放问题

- R1 是否正式引入 `AgentRun.status=lost`，还是先用 failed + `RUNTIME_LOST` 表达？
- Handoff Queue 是否在 R1 只做 projection，还是同时落最小 `handoff_items` 表？建议 R1 先 projection。
- Artifact 内容下载 API 是否放进 R1，还是 R1 UI 只通过 Workspace Core 内部读取？
- `agent_run.token` 是否需要逐 token trace，还是只保留 final response + progress？建议 R1 不逐 token 入库，避免 SQLite 写放大。
- `workspace-write` 的授权入口放在 execution profile 还是 operator confirmation？建议 R1 先只做 execution profile 显式配置。

## 变更历史

| 日期       | 变更                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 2026-05-17 | 补充 Artifact provenance/review/reuse、Inspector 视角与 Handoff Queue API projection |
| 2026-05-15 | 初版，定义 R1 Codex E2E + Artifact / Trace 最小闭环                                  |
