# M3 Operator Control Polish Design

> 状态：🟡 Draft  
> 日期：2026-05-20  
> 分支：`develop`  
> 上游路线：R1 evidence-chain roadmap / M3 Operator Control Polish

---

## 1. 目标

M3 的目标是把现有 Operator Control R1a 从“动作可调用”推进到“取消与恢复证据可解释”。

本轮选择 **Cancel Reliability + Minimal Recovery Evidence**：

- 取消 run 时，为每个非终态 AgentRun 记录 runtime cancel 请求、确认、未确认或派发失败。
- runtime cancel 仍是 best-effort；runtime 失败不阻止 Workspace Core 本地把 run/task/agent-run 收束为 `cancelled`。
- retry/rerun 继续保持 R1a 最小行为，但补齐 TraceEvent payload 中的恢复证据字段。
- 后续 Run Inspector / Desktop 观察台可以从 trace/replay-source 解释“operator 做了什么、runtime 是否响应、恢复路径是什么”。

M3 不实现 Desktop UI、Handoff Queue、approve/reject、scheduler、schema migration 或新的 Runtime Adapter 能力。

---

## 2. 背景与现状

当前 `develop` 已具备：

- Workspace Core operator routes：pause / resume / cancel / retry task / rerun / operator note。
- `OrchestrationRunService.cancelRun()` 会遍历 run 下非终态 task/AgentRun，并对非终态 AgentRun 调用 `runtimeGateway.cancel()`。
- runtime cancel 抛错时已写 `agent_run.cancel_dispatch_failed` warning trace。
- runtime cancel 返回 `cancelled: false` 时已写 `agent_run.cancel_not_acknowledged` warning trace。
- `task.retry_requested` 与 `run.rerun_created` 已有基础 trace。
- M2 已新增 `GET /v1/runs/:runId/replay-source`，可聚合 trace timeline 和 inspector 摘要。

薄弱点：

- cancel 链路缺少显式 `agent_run.cancel_requested` 与 `agent_run.cancel_acknowledged` 事件，无法完整解释请求是否发出、runtime 是否确认。
- retry trace 只记录 `newAttempt`，缺少 `previousAttempt`，恢复路径证据不够完整。
- rerun trace 已记录 `previousRunId` 和 `replan`，但缺少上游 task 关联，后续 Inspector 难以从新 run 反查旧 task。
- Workspace Core route 测试证明了 runtime cancel 被调用，但还没有验证 replay-source/trace 可消费这些接管证据。

---

## 3. 设计决策

### 3.1 证据优先，不改变产品状态机

M3 不改变 R1a 状态机：

- `cancelRun()` 对非终态 run 可用。
- cancel 后 run 进入 `cancelled`。
- 非终态 task 进入 `cancelled`。
- 非终态 AgentRun 进入 `cancelled`。
- retry 只把 failed task 转回 `ready` 并增加 task attempt，不创建 AgentRun。
- rerun 只为 R1a 单 task graph 创建新 OrchestrationRun。

本轮重点是补齐 TraceEvent 证据，让后续 replay/Inspector 可以解释这些状态变化。

### 3.2 runtime cancel 仍是 best-effort

Runtime Adapter 的 `cancel()` 是 best-effort。M3 不把 runtime cancel 失败升级为 `cancelRun()` 失败。

原因：

- Operator 的“取消”首先是 Workspace Core 的本地控制动作。
- runtime 可能已经终态、连接断开或不支持确认；这些都应该作为 warning trace 呈现，而不是阻止本地状态收束。
- Desktop 后续需要看到“本地已取消，但 runtime 未确认 / 派发失败”的解释。

### 3.3 不新增持久化字段

M3 的证据全部写入 TraceEvent payload，不新增 domain schema 或迁移。

原因：

- 取消与恢复证据是 timeline/replay 的一部分，当前 TraceEvent 足够表达。
- 后续如果 Handoff Queue 或 Inspector projection 需要结构化查询，再设计 projection 或索引字段。

---

## 4. TraceEvent 设计

### 4.1 Cancel trace sequence

对每个非终态 AgentRun，`cancelRun()` 按以下语义写 trace：

1. `agent_run.cancel_requested`
   - level: `info`
   - 写在调用 `runtimeGateway.cancel()` 前。
   - payload:
     - `reason`
     - `agentRunId`

2. `agent_run.cancel_acknowledged`
   - level: `info`
   - 当 `runtimeGateway.cancel()` 返回 `cancelled: true`。
   - payload:
     - `reason`
     - `agentRunId`

3. `agent_run.cancel_not_acknowledged`
   - level: `warn`
   - 当 `runtimeGateway.cancel()` 返回 `cancelled: false`。
   - payload:
     - `reason`
     - `agentRunId`
     - `runtimeReason`

4. `agent_run.cancel_dispatch_failed`
   - level: `warn`
   - 当 `runtimeGateway.cancel()` 抛错。
   - payload:
     - `reason`
     - `agentRunId`
     - `message`

5. `run.cancelled`
   - level: `warn`
   - run 本地状态收束为 `cancelled` 后写入。
   - payload:
     - `reason`

如果某个 AgentRun 已处于终态，不调用 runtime cancel，也不写 agent-run cancel request/ack trace。

### 4.2 Retry trace evidence

`task.retry_requested` payload 增加：

- `previousAttempt`
- `newAttempt`
- `reason?`

保持行为不变：

- 只允许 parent run 非终态。
- 只允许 task `failed`。
- task 状态回到 `ready`。
- task attempt + 1。
- 不创建 AgentRun。

### 4.3 Rerun trace evidence

`run.rerun_created` payload 明确包含：

- `previousRunId`
- `previousTaskId`
- `replan`
- `operatorNote?`

保持行为不变：

- 只允许 previous run 终态。
- R1a 只支持单 task graph。
- `replan` 只表达意图，不在本轮实现真实 planner/replan。

---

## 5. API 与数据流

### 5.1 HTTP API

M3 不新增 HTTP endpoint，也不修改既有 route path。

沿用：

- `POST /v1/runs/:runId/cancel`
- `POST /v1/tasks/:taskId/retry`
- `POST /v1/runs/:runId/rerun`
- `GET /v1/runs/:runId/trace`
- `GET /v1/runs/:runId/replay-source`

### 5.2 Cancel data flow

1. Workspace Core route 解析 `runId` 与 reason。
2. Application service 校验 run 非终态。
3. Service 遍历 run 下 task 与 AgentRun。
4. 对每个非终态 AgentRun：
   - 写 `agent_run.cancel_requested`。
   - 调 `runtimeGateway.cancel(agentRunId, reason)`。
   - 根据结果写 acknowledged / not_acknowledged / dispatch_failed。
   - 本地更新 AgentRun 为 `cancelled`。
5. 本地更新非终态 task 为 `cancelled`。
6. 本地更新 run 为 `cancelled`。
7. 写 `run.cancelled`。
8. Replay Source 聚合 trace，供后续 Inspector 消费。

### 5.3 Recovery data flow

Retry:

1. Operator 调 `POST /v1/tasks/:taskId/retry`。
2. Service 校验 parent run 非终态、task 为 `failed`。
3. Task attempt + 1，状态回到 `ready`。
4. 写 `task.retry_requested`，包含 previous/new attempt 与 reason。

Rerun:

1. Operator 调 `POST /v1/runs/:runId/rerun`。
2. Service 校验 previous run 终态、单 task graph。
3. 创建新 queued run 和 ready task。
4. 写 `run.rerun_created`，包含 previous run/task、replan 与 operator note。

---

## 6. 测试策略

### 6.1 Application service

新增或扩展 `packages/application/src/orchestration/orchestration-run-service.spec.ts`：

- cancel 写 `agent_run.cancel_requested` 后再写 acknowledged。
- cancel ack false 写 `agent_run.cancel_not_acknowledged`，payload 含 `runtimeReason`。
- cancel 抛错写 `agent_run.cancel_dispatch_failed`，payload 含 operator reason 与 error message。
- cancel 不对终态 AgentRun 调 runtime cancel 或写 agent-run cancel trace。
- retry trace payload 含 `previousAttempt`、`newAttempt` 与 reason。
- rerun trace payload 含 `previousRunId`、`previousTaskId`、`replan` 与 operator note。

### 6.2 Workspace Core

扩展 `apps/workspace-core/src/service/app.spec.ts`：

- 通过 operator cancel route 后，`GET /v1/runs/:runId/replay-source` 可看到 cancel requested / acknowledged / run cancelled。
- runtime cancel not acknowledged 或 dispatch failed 的 warning trace 可通过 run trace/replay source 读取。

### 6.3 Verification

实施时至少运行：

```bash
pnpm --filter @cairn/application test -- src/orchestration/orchestration-run-service.spec.ts
pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts
pnpm run check
pnpm test
git diff --check
```

---

## 7. 非目标

- 不做 Desktop UI 或 Browser 验证。
- 不做 Handoff Queue / projection。
- 不做 approve / reject。
- 不新增 scheduler。
- 不新增 Runtime Adapter 能力。
- 不新增 schema migration。
- 不实现真实 planner/replan。
- 不做多 task graph rerun。
- 不创建 `apps/web`。

---

## 8. 文档同步

实现 M3 时需要同步：

- `docs/design/state-machines.md`：补充 cancel trace evidence 与 retry/rerun payload 约定。
- `docs/STATUS.md`：更新 Operator control polish 状态，不声明 UI/Handoff 已完成。
- `CHANGELOG.md`：记录 M3 Operator Control evidence polish。

若实现中发现既有 Accepted ADR 需要修正，应新建 ADR，而不是直接改旧 ADR。

---

## 9. 风险与边界

- **runtime 终态竞态**：runtime cancel 可能返回未确认或抛错。本地 cancel 仍完成，warning trace 解释风险。
- **事件顺序**：`agent_run.cancel_requested` 必须在 runtime cancel 调用前写入；ack/not-ack/dispatch-failed 在调用返回后写入。
- **TraceEvent 体积**：payload 只放小型结构化摘要，不放 runtime stderr/stdout 正文。
- **未来 projection**：M3 只沉淀 trace，不设计 Handoff Queue 或 Inspector projection，避免提前做厚。

---

## 10. 验收标准

- Cancel route 和 service tests 能证明 runtime cancel 请求、确认、未确认、失败均可由 TraceEvent 回放。
- Retry/rerun tests 能证明恢复动作有 previous/current 关联证据。
- Replay Source 能聚合新 trace，且不调用 runtime、不内联 artifact payload。
- 文档明确 M3 已完成的是 operator evidence polish，不是 Desktop UI、Handoff Queue 或真实 replan。
- 目标验证命令通过。
