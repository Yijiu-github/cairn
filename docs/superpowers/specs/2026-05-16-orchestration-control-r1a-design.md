# Orchestration Control R1a Design

> 状态：Draft
> 日期：2026-05-16
> 分支：`docs/orchestration-control-r1a-design`
> 上游：`docs/design/state-machines.md`、`docs/design/domain-model.md`、`packages/shared_contracts/src/contracts/operator.contract.ts`

---

## 1. 摘要

Orchestration Control R1a 补齐 Workspace Core 的最小 operator control plane，让上层 UI 或脚本可以通过正式 API 对 run/task 做有限接管：暂停、恢复、取消、重试失败 task、基于已结束 run 重开一轮、注入 operator note。

R1a 不启动 Desktop/Web Shell，也不实现真实 runtime kill、审批流或复杂 replan。它只把已在 shared contracts 中声明的 operator routes 落到 application service 与 workspace-core routes，并用 TraceEvent 保证每次接管可观察、可回放。

## 2. 背景与约束

当前仓库已有：

- `@cairn/shared-contracts` 的 `operatorContract` 已定义 `/v1/runs/:runId/pause`、`resume`、`cancel`、`rerun`、`notes` 与 `/v1/tasks/:taskId/retry` 等路径。
- `@cairn/application` 已有 single-worker run 创建、task dispatch、adapter event 状态推进与 TraceEvent 写入能力。
- `apps/workspace-core` 已有 run/task/agent-run 最小 HTTP 闭环，但没有 operator action routes。

必须遵守：

- 终态 OrchestrationRun 不可被原地修改，除 `rerun` 新建对象外不能复活旧 run。
- `retry`、`rerun`、`replan` 语义不可混用。
- Desktop/Web 共享同一套 Workspace Core 语义，不允许为未来 UI 预设旁路 API。
- R1a 不进入复杂 workflow builder、企业审批治理或 runtime marketplace 范围。

## 3. 范围

### 3.1 In Scope

R1a 实现六个 operator 动作：

| 动作          | API                            | 应用层语义                                                           |
| ------------- | ------------------------------ | -------------------------------------------------------------------- |
| pause run     | `POST /v1/runs/:runId/pause`   | `running → paused`                                                   |
| resume run    | `POST /v1/runs/:runId/resume`  | `paused → running`                                                   |
| cancel run    | `POST /v1/runs/:runId/cancel`  | `queued/planning/running/synthesizing/paused → cancelled`            |
| retry task    | `POST /v1/tasks/:taskId/retry` | failed task 在同一 run 内变回 `ready`，`attempt + 1`                 |
| rerun         | `POST /v1/runs/:runId/rerun`   | 从终态 run 新建一个 single-worker OrchestrationRun                   |
| operator note | `POST /v1/runs/:runId/notes`   | 状态不变，写 TraceEvent，返回 note/message 占位 id 与 trace event id |

### 3.2 Out of Scope

- 不实现 `retryAgentRun` 与 `approveOrReject` 的 route 行为；保留 contract，等待 AgentRun retry 与 protected step 设计。
- 不实现真实 Runtime Gateway cancel/kill；`cancel run` 是 application state change，并写 best-effort trace。
- 不实现 Message 持久化路径；operator note 在 R1a 只写 TraceEvent，响应中的 `messageId` 是未来 Message 表接入前的稳定占位。
- 不实现 Desktop Shell、Web Shell 或 UI preview API 绑定。
- 不新增依赖，不改 TS/ESLint/CI 配置。
- 不做同一 run 内 replan 或 task graph 编辑。

## 4. 状态转移设计

### 4.1 Pause Run

允许源状态只有 `running`。成功后：

- run `status = paused`
- run `updatedAt = now`
- 写 `run.paused` TraceEvent，payload 包含可选 `reason`

非 `running` 状态返回应用层 invalid-state 错误。终态 run 也返回 invalid-state，不做任何修改。

### 4.2 Resume Run

允许源状态只有 `paused`。成功后：

- run `status = running`
- run `updatedAt = now`
- 写 `run.resumed` TraceEvent

R1a 不自动 dispatch task；恢复后仍由现有调度或显式 submit route 推进。

### 4.3 Cancel Run

允许源状态：`queued`、`planning`、`running`、`synthesizing`、`paused`。成功后：

- run `status = cancelled`
- run `finishedAt = now`
- run `resultCompleteness = empty`，`completionLevel = failed`
- run `error = { layer: 'orchestration', code: 'CANCELLED_BY_OPERATOR', message, retryable: false }`
- 所属 non-terminal tasks 置为 `cancelled`，`failureReason` 写入取消原因
- 所属 cancelable 且 non-terminal AgentRun 置为 `cancelled`，`cancelable = false`
- 写 `run.cancelled` TraceEvent

R1a 只做状态收敛，不调用 Runtime Gateway kill。未来真实 runtime cancellation 接入时，应在同一 action 内增加 best-effort gateway 调用并保留当前状态机语义。

### 4.4 Retry Task

允许源状态：task `failed`，并且所属 run 不在终态。成功后：

- task `status = ready`
- task `attempt = attempt + 1`
- task `idempotencyKey = ${taskId}:${newAttempt}`
- 清除 `failureReason`
- task `updatedAt = now`
- 如果所属 run 是 `failed` 且失败来自该 task，R1a 不原地复活 run；用户应使用 `rerun`。因此 R1a retry 只允许非终态 run 内失败 task。
- 写 `task.retry_requested` TraceEvent
- API 返回 `{ taskId, newAttempt }`

这个限制比状态机矩阵更保守，原因是现有 single-worker 闭环会在 task failed 时直接把 run 置为终态 `failed`。为避免违反“终态不可修改”，R1a 不尝试从 failed run 内复活 task。

### 4.5 Rerun

允许源状态：任意终态 run（`succeeded`、`failed`、`cancelled`、`timeout`）。成功后：

- 新建 OrchestrationRun，旧 run 不修改状态。
- 默认使用旧 run 的 `originEventId`；body 传入 `originEventId` 时使用覆盖值。
- R1a 只支持旧 run 有且仅有一个 task 的 single-worker rerun。
- 新 task 复制旧 task 的 `taskKind`、`title`、`brief`、`executionProfile`、`priority`、`contextRefs`、`budgetHint`。
- 如 body 提供 `operatorNote`，把 note 追加到新 task brief 的末尾，标题保留不变。
- 新 run `executionMode = single_worker`，状态仍从 `queued` 开始。
- 写新 run 的 `run.queued` TraceEvent；同时写 `run.rerun_created` TraceEvent，payload 包含 `previousRunId`、`replan` 与可选 `operatorNote` 摘要。

`replan: true` 在 R1a 仅记录意图，不实现 Goal Planner 输出重算。真正 replan 的 planning artifact 在后续 “Planning 输出模型” 主线处理。

### 4.6 Operator Note

允许 run 任意状态，包括终态。成功后：

- 不改变 run 状态、`updatedAt` 或终态字段。
- 写 `operator.note` TraceEvent，payload 包含 `note` 与 `visibility`。
- 返回 `{ messageId, traceEventId }`。

`messageId` 由 application id factory 生成或用 TraceEvent 派生稳定 id。R1a 不写 Message 表，避免在还没有 content/artifact 边界时提前固定消息持久化模型。

## 5. Application 设计

在 `OrchestrationRunService` 增加方法：

- `pauseRun(input)`
- `resumeRun(input)`
- `cancelRun(input)`
- `retryTask(input)`
- `rerun(input)`
- `injectOperatorNote(input)`

新增 input/result 类型保持小而明确。状态校验放在 application service，workspace-core routes 只负责 HTTP 解析与错误映射。

Repository port 不新增通用事务接口。R1a 允许按现有 repository 方法顺序更新 run/tasks/agentRuns/trace；后续 SQLite repository 如需强一致事务，再以专门 Unit of Work 设计补齐。

`ApplicationErrorCode` 增加：

- `INVALID_RUN_STATE`
- `INVALID_TASK_STATE`
- `RERUN_UNSUPPORTED_GRAPH`

已有 missing errors 继续映射到 404。

## 6. Workspace Core HTTP 设计

在 `apps/workspace-core/src/service/app.ts` 增加 routes：

- `POST /v1/runs/:runId/pause`
- `POST /v1/runs/:runId/resume`
- `POST /v1/runs/:runId/cancel`
- `POST /v1/tasks/:taskId/retry`
- `POST /v1/runs/:runId/rerun`
- `POST /v1/runs/:runId/notes`

请求体验：

- path params 使用 shared schemas 解析。
- body 使用 operator contract 中同源 schema；如果当前 contract 未导出 body schema，实施计划应先把 body schema 命名导出，避免 route 里复制 Zod 定义。
- 400：参数或 body 校验失败。
- 404：run/task 不存在。
- 409：状态不允许或 R1a 不支持的 graph。
- 202：`retryTask` 与 `rerun` 成功。
- 200：`pauseRun`、`resumeRun`、`cancelRun` 成功。
- 201：`injectNote` 成功。

## 7. TraceEvent 约定

R1a 至少写入以下 event types：

| eventType              | level  | 触发                   |
| ---------------------- | ------ | ---------------------- |
| `run.paused`           | `info` | pause 成功             |
| `run.resumed`          | `info` | resume 成功            |
| `run.cancelled`        | `warn` | cancel 成功            |
| `task.retry_requested` | `info` | retry task 成功        |
| `run.rerun_created`    | `info` | rerun 新建 run 成功    |
| `operator.note`        | `info` | operator note 注入成功 |

Payload 只放结构化元数据与 operator 提供的短文本；不把源码片段或大 artifact 内容塞进 TraceEvent。

## 8. 测试计划

### 8.1 Application Tests

在 `packages/application` 增加 service tests：

- pause: running run 可暂停，queued/terminal run 被拒绝。
- resume: paused run 可恢复，running/terminal run 被拒绝。
- cancel: active run 可取消，并取消 non-terminal tasks / agentRuns。
- retry task: non-terminal run 内 failed task 可回 ready 且 attempt 增加；terminal run 内 failed task 被拒绝。
- rerun: terminal single-task run 可新建 run；non-terminal run 与 multi-task run 被拒绝。
- operator note: active 与 terminal run 都可写 trace，状态不变。

### 8.2 Workspace Core Tests

在 `apps/workspace-core` 增加 `app.inject` tests：

- 每个 route 的成功响应状态码与响应体。
- invalid id/body 返回 400。
- missing run/task 返回 404。
- invalid state 返回 409。

### 8.3 Contract Tests

若只导出已有 body schema，不改变路径或响应 shape，则更新/补充 contract export smoke test 即可。若响应 shape 变化，必须同步 `packages/shared_contracts` tests。

## 9. 文档与变更记录

实施时需要同步：

- `CHANGELOG.md`：记录 Orchestration Control R1a API 与 application service。
- `docs/STATUS.md`：把 retry/rerun/cancel/operator action 从缺口移动到“R1 基线能力”，并保留真实 runtime cancellation 未完成。
- 如实现过程中发现状态机矩阵需改变，先更新 `docs/design/state-machines.md`，再改代码。

## 10. 非目标风险处理

- 如果现有 repository 没有列出 run 下 AgentRun 的方法，实施可通过 `listTasksByRun` + `listAgentRunsByTask` 聚合，避免新增宽泛查询。
- 如果 rerun 需要复制原始 Event 文本但当前 repository 无 Event 读取能力，R1a 复制旧 task seed，不新增 Event repository。
- 如果 operator note 的 Message 持久化需求变强，拆到后续 Artifact / Trace baseline，不在 R1a 偷偷定型。
