# Planning Output Model Design

> 状态：Draft
> 日期：2026-05-17
> 分支：`docs/planning-output-model-design`
> 上游：`docs/design/domain-model.md`、`docs/design/state-machines.md`、`docs/design/code-context-index.md`

---

## 1. 摘要

Planning Output Model 把 Goal Planner 的输出从“文档里的结构草案”落成 Cairn 的一等领域对象。它解释一次 OrchestrationRun 为什么这样拆分、哪些前置条件已满足或缺失、为什么阻塞，以及为什么新开一轮 replan。

本阶段选择 **独立领域对象 + 独立持久化表**，而不是复用 `Artifact`。`OrchestrationRun.planner_output_ref` 继续保留，但语义从“泛化 Artifact id”收窄为“PlanningOutput id”。同时保留 TraceEvent 镜像，让规划过程可观察、可回放。

本阶段推进到 schema + domain/storage/application 闭环；Workspace Core HTTP API 暂不新增，避免在真实 Planner 与 Artifact/Trace 基线前过早固定外部 API。

## 2. 背景与约束

现有事实：

- `docs/design/domain-model.md` 已定义 Goal Planner 输出草案：`actionTree`、`preconditions`、`blockedReason`、`replanReason`、`contextPackRefs`。
- `docs/design/state-machines.md` 要求进入 planning、完成 planning、阻塞和失败都写 TraceEvent。
- `orchestration_runs.planner_output_ref` 已存在于 shared contracts 与 domain schema。
- `ContextPackManifest` 已有独立 manifest + repository port + SQLite 持久化模式，可作为 PlanningOutput 的实现风格参考。

必须遵守：

- Planning Output 不是新的执行状态机，不驱动 Task / AgentRun 状态推进。
- 同一 OrchestrationRun 内不做大规模改图；`replan` 必须新建 OrchestrationRun。
- 不把源码片段、大 prompt 或完整 ContextPack 内容直接塞进 PlanningOutput JSON。
- Desktop / Web Shell 仍未启动；本阶段不做 UI 或 shell API。
- 不引入复杂 workflow builder、拖拽编排器或企业审批治理语义。

## 3. 目标

R1 Planning Output Model 要提供：

1. 共享契约：`PlanningOutput` 及其子结构的 Zod schema。
2. Domain schema：SQLite-first `planning_outputs` 表。
3. Repository port：创建、读取、更新 PlanningOutput。
4. Application service：开始、完成、阻塞、失败 planning，并同步 `OrchestrationRun.plannerOutputRef` 与 TraceEvent。
5. 测试闭环：shared contracts、domain/storage、application service 覆盖核心状态与不变量。
6. 文档同步：`docs/STATUS.md`、`CHANGELOG.md` 记录能力边界。

## 4. 非目标

本阶段不做：

- 不实现真实 LLM Planner。
- 不生成多 Task DAG 的完整调度策略。
- 不新增 Workspace Core HTTP route。
- 不新增 Desktop / Web / UI preview 页面。
- 不写 Artifact 文件内容。
- 不实现 `Artifact` 与 PlanningOutput 的双写。
- 不把 planning output 作为 workflow builder 配置或可编辑流程图。

## 5. 核心领域对象

### 5.1 PlanningOutput

`PlanningOutput` 是一次 OrchestrationRun 的规划解释对象。

建议字段：

| 字段                 | 类型                                    | 说明                                  |
| -------------------- | --------------------------------------- | ------------------------------------- |
| `planningOutputId`   | `PlanningOutputId`                      | stable id，供 `plannerOutputRef` 引用 |
| `workspaceId`        | `WorkspaceId`                           | Workspace 边界                        |
| `orchestrationRunId` | `OrchestrationRunId`                    | 所属 run                              |
| `status`             | `pending \| ready \| blocked \| failed` | 规划输出自身状态，不是执行状态        |
| `actionTree`         | `PlanningActionNode[]`                  | 规划意图树                            |
| `preconditions`      | `PlanningPrecondition[]`                | 前置条件与证据                        |
| `blockedReason`      | `PlanningBlockedReason?`                | 规划阻塞原因                          |
| `replanReason`       | `PlanningReplanReason?`                 | 新 run 为什么重新规划                 |
| `contextPackRefs`    | `ContextPackId[]`                       | 使用过的上下文包引用                  |
| `createdAt`          | ISO 8601                                | 创建时间                              |
| `updatedAt`          | ISO 8601                                | 更新时间                              |

### 5.2 Planning Status

状态只描述规划输出本身：

- `pending`：已开始 planning，还没有完整输出。
- `ready`：规划完成，action tree 与 preconditions 可用于解释本轮 run。
- `blocked`：规划无法继续，必须给出 `blockedReason`。
- `failed`：规划异常失败，TraceEvent 记录错误摘要。

`ready`、`blocked`、`failed` 在 R1 中视为 PlanningOutput 终态。终态后不可原地修改；需要重新规划时新建 OrchestrationRun 与新的 PlanningOutput。

### 5.3 Action Tree

`actionTree` 是解释规划意图的树，不是执行图本身。

字段：

- `actionId`: string，PlanningOutput 内唯一。
- `parentActionId?`: string，表示解释树层级。
- `taskId?`: TaskId，如果该 action 已映射到 Task。
- `title`: string。
- `intent`: string。
- `status`: `planned | ready | blocked | skipped`。
- `dependsOnActionIds`: string[]。

约束：

- `dependsOnActionIds` 只能引用同一 PlanningOutput 内的 `actionId`。
- `taskId` 只是引用现有 Task，不创建新 Task。
- `status` 不等于 Task status；它只用于解释 UI。

### 5.4 Preconditions

`preconditions` 描述 Planner 判断任务可执行性的依据。

字段：

- `actionId?`: string。
- `description`: string。
- `status`: `satisfied | missing | unknown`。
- `evidenceRefs`: string[]。

`evidenceRefs` 可引用 ContextPack、Artifact、TraceEvent、SourceRoot 或其他未来稳定引用。R1 不强制解析引用类型，但必须保存为字符串数组，不能保存源码正文。

### 5.5 Blocked Reason

`blockedReason` 用于 Operator 判断下一步动作。

字段：

- `scope`: `run | action | task`。
- `actionId?`: string。
- `taskId?`: TaskId。
- `code`: string。
- `message`: string。
- `operatorActionHint?`: string。

当 `status = blocked` 时，`blockedReason` 必填。

### 5.6 Replan Reason

`replanReason` 只出现在新 run 的 PlanningOutput 中，用于说明为什么不是继续旧 run。

字段：

- `previousRunId?`: OrchestrationRunId。
- `trigger`: `operator_request | failed_precondition | stale_context | runtime_failure`。
- `message`: string。

`replanReason` 不允许让旧 OrchestrationRun 复活，也不允许在旧 run 内大规模改 Task graph。

## 6. Shared Contracts 设计

新增文件：`packages/shared_contracts/src/schemas/planning-output.ts`。

新增 ID：`PlanningOutputId`，采用 ULID branded type。

导出：

- `PlanningOutputStatus`
- `PlanningActionStatus`
- `PlanningActionNode`
- `PlanningPrecondition`
- `PlanningBlockedReason`
- `PlanningReplanReason`
- `PlanningOutput`

更新 barrel：`packages/shared_contracts/src/schemas/index.ts`。

`OrchestrationRun.plannerOutputRef` 后续仍保持字段名不变，但类型应从 `ArtifactId.optional()` 调整为 `PlanningOutputId.optional()`。这是语义收窄，不改变 JSON 字段名。

## 7. Domain / Storage 设计

新增表：`planning_outputs`。

字段建议：

| column                 | 类型               | 说明                   |
| ---------------------- | ------------------ | ---------------------- |
| `planning_output_id`   | text PK            | PlanningOutputId       |
| `workspace_id`         | text FK            | cascade                |
| `orchestration_run_id` | text FK            | cascade                |
| `status`               | text               | PlanningOutputStatus   |
| `action_tree`          | json text          | PlanningActionNode[]   |
| `preconditions`        | json text          | PlanningPrecondition[] |
| `blocked_reason`       | json text nullable | PlanningBlockedReason  |
| `replan_reason`        | json text nullable | PlanningReplanReason   |
| `context_pack_refs`    | json text          | ContextPackId[]        |
| `created_at`           | text               | ISO                    |
| `updated_at`           | text               | ISO                    |

索引：

- `(workspace_id, status)`
- `(orchestration_run_id)` unique 或普通索引。R1 推荐 unique，确保一个 run 只有一个 PlanningOutput。

SQLite repository 增加：

- `createPlanningOutput(output)`
- `getPlanningOutput(planningOutputId)`
- `getPlanningOutputByRun(orchestrationRunId)`
- `updatePlanningOutput(output)`

## 8. Application 设计

新增服务可以放在 `packages/application/src/orchestration/planning-output-service.ts`，避免继续膨胀 `orchestration-run-service.ts`。

依赖：

- `ApplicationRepository`
- `ApplicationClock`
- `ApplicationIdFactory`

`ApplicationIdFactory` 增加：

- `planningOutputId(): PlanningOutputId`

方法：

### 8.1 startPlanning

输入：`runId`、可选 `contextPackRefs`、可选 `replanReason`。

行为：

- require run 存在且非终态。
- 如果 run 已有 `plannerOutputRef`，返回 409 风格应用错误。
- 创建 `PlanningOutput(status = pending)`。
- 更新 run：`status = planning`、`plannerOutputRef = planningOutputId`、`updatedAt = now`。
- 写 `run.planning_started` TraceEvent，payload 包含 `planningOutputId`。

### 8.2 completePlanning

输入：`planningOutputId`、`actionTree`、`preconditions`、可选 `contextPackRefs`。

行为：

- require PlanningOutput 存在且非终态。
- 校验 action id 引用一致性。
- 更新 PlanningOutput 为 `ready`。
- 写 `run.planning_completed` TraceEvent，payload 包含 action/precondition 计数与 `planningOutputId`。
- 不自动创建或 dispatch Task；Task 仍由后续 planning/execution slice 决定。

### 8.3 blockPlanning

输入：`planningOutputId`、`blockedReason`、可选 `actionTree` / `preconditions`。

行为：

- require PlanningOutput 存在且非终态。
- `blockedReason` 必填。
- 更新 PlanningOutput 为 `blocked`。
- 写 `run.planning_blocked` TraceEvent，payload 包含 `code`、`scope`、`planningOutputId`。

### 8.4 failPlanning

输入：`planningOutputId`、`error`。

行为：

- require PlanningOutput 存在且非终态。
- 更新 PlanningOutput 为 `failed`。
- run 可保持 `planning` 或转 `failed`。R1 建议转 `failed`，并写 orchestration layer error。
- 写 `run.planning_failed` TraceEvent。

### 8.5 getPlanningOutput

按 id 读取 PlanningOutput，用于应用层测试与未来 API。

## 9. TraceEvent 约定

保留 TraceEvent 镜像，但只写轻量摘要：

| eventType                | level   | payloadInline                                          |
| ------------------------ | ------- | ------------------------------------------------------ |
| `run.planning_started`   | `info`  | `planningOutputId`, `contextPackRefsCount`             |
| `run.planning_completed` | `info`  | `planningOutputId`, `actionCount`, `preconditionCount` |
| `run.planning_blocked`   | `warn`  | `planningOutputId`, `code`, `scope`                    |
| `run.planning_failed`    | `error` | `planningOutputId`, `code`, `message`                  |

TraceEvent 不复制完整 action tree 或 preconditions；完整内容在 `planning_outputs` 表。

## 10. 错误模型

新增 application error codes：

- `PLANNING_OUTPUT_NOT_FOUND`
- `PLANNING_OUTPUT_TERMINAL`
- `PLANNING_OUTPUT_ALREADY_EXISTS`
- `PLANNING_OUTPUT_RUN_MISMATCH`
- `INVALID_PLANNING_OUTPUT`

语义：

- `404`: planning output 不存在。
- `409`: 终态 PlanningOutput 被修改、run 已有关联输出、output 与 run 不匹配。
- `400` 类 validation 由 shared schema / route 层承担；本阶段不新增 route。

## 11. 测试计划

### 11.1 Shared Contracts

- `PlanningOutput` 可解析最小 pending 输出。
- `PlanningOutput` 可解析 ready 输出。
- `blocked` 状态缺少 `blockedReason` 时失败。
- `PlanningReplanReason.trigger` 限制在允许枚举。
- `OrchestrationRun.plannerOutputRef` 接受 `PlanningOutputId`。

### 11.2 Domain / Storage

- Drizzle schema 暴露 `planning_outputs` 表。
- SQLite repository 可 create/get/update PlanningOutput。
- `getPlanningOutputByRun` 能按 run 查到输出。
- unique run 约束或 repository 层防重复。

### 11.3 Application

- `startPlanning` 创建 pending output、更新 run `plannerOutputRef`、写 `run.planning_started`。
- `completePlanning` 更新 ready output、写 completed trace。
- `blockPlanning` 要求 blockedReason，写 blocked trace。
- `failPlanning` 更新 failed output、run failed、写 failed trace。
- 终态 PlanningOutput 拒绝修改。
- action dependencies 引用不存在 action 时拒绝。
- `replanReason` 可引用 previous run，但不修改 previous run。

## 12. 文档同步

实施时同步：

- `docs/design/domain-model.md`：将 Goal Planner 输出草案升级为 PlanningOutput 领域对象。
- `docs/design/state-machines.md`：保留 planning TraceEvent 要求，并说明 PlanningOutput 终态不可修改。
- `docs/STATUS.md`：Planning 输出模型从缺口移动到基线能力。
- `CHANGELOG.md`：记录新增 PlanningOutput schema / storage / application 闭环。

## 13. 取舍说明

选择独立领域对象的原因：

- Planning Output 是解释执行计划的核心对象，不只是任意产物文件。
- 独立表可以做 run 级唯一约束、状态约束与查询索引。
- 后续 UI / replay / recovery 可以直接读取结构化内容，不必反解 Artifact 文件。

暂不新增 API 的原因：

- Workspace Core 当前还没有真实 Planner。
- 过早暴露 HTTP API 容易固定未成熟读写模型。
- Application + repository 闭环足够支撑后续 Planner slice 与内部测试。
