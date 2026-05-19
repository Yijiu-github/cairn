# 状态机 / State Machines

> 状态：🟡 Draft
> 最后更新：2026-05-17
> 来源：[`设计文档V0.1.0.md §11`](设计文档V0.1.0.md) 抽出并扩展
> 上游术语：见 [`../reference/glossary.md`](../reference/glossary.md)

---

## 0. 总则

- **所有执行对象都有显式状态枚举**
- **状态转移必须是单向单调**（除少数明确允许的回退）
- **每个状态转移必须可观察**（写入 TraceEvent）
- **终态后只能新建对象，不能复活旧对象**

## 1. OrchestrationRun 状态机

### 1.1 状态枚举

| 状态           | 含义                                          |
| -------------- | --------------------------------------------- |
| `queued`       | 已入队，等待规划                              |
| `planning`     | Supervisor 在做 Mode Decision + Task Planning |
| `running`      | Task 正在执行（有至少一个 AgentRun 在跑）     |
| `synthesizing` | 所有 Task 已完结，Supervisor 在做结果综合     |
| `paused`       | 被 operator 暂停（可恢复）                    |
| `succeeded`    | ✅ 终态：成功                                 |
| `failed`       | ❌ 终态：失败（含 partial failure 视情况）    |
| `cancelled`    | ❌ 终态：被取消                               |
| `timeout`      | ❌ 终态：超时                                 |

### 1.2 转移图

```text
queued ──► planning ──► running ──► synthesizing ──► succeeded
   │           │           │              │
   ▼           ▼           ▼              ▼
cancelled   failed     paused◄──►running  failed
                          │
                          ▼
                       cancelled
```

允许的转移：

- `queued → planning | cancelled | failed`
- `planning → running | failed | cancelled`
- `running → synthesizing | paused | failed | cancelled | timeout`
- `paused → running | cancelled`
- `synthesizing → succeeded | failed`
- 终态（`succeeded` / `failed` / `cancelled` / `timeout`）**不可再转出**

### 1.3 Planning 可观察性

`planning` 阶段必须产出可观察事件与 PlanningOutput：

- 进入 planning 时写 `run.planning_started` TraceEvent。
- 生成 Goal Planner 输出后写 `run.planning_completed` TraceEvent，并将 `PlanningOutputId` 写入 `OrchestrationRun.planner_output_ref`。
- 如果无法规划，写 `run.planning_blocked` 或 `run.planning_failed` TraceEvent；被阻塞时在 PlanningOutput 中记录 `blockedReason`，失败错误摘要保存在 OrchestrationRun error 与 TraceEvent 轻量 payload。
- 因 stale context、前置条件缺失、runtime 失败或 operator 请求触发新一轮规划时，必须新建 OrchestrationRun，并在新 run 的 PlanningOutput 中记录 `replanReason`。
- PlanningOutput 的完整结构保存在 `planning_outputs`，TraceEvent 只保存 `planningOutputId`、计数、错误码等轻量摘要。

Planning 输出只解释 action tree、preconditions、blocked reason 与 replan reason；实际执行仍由 Task 状态机推进。

## 2. Task 状态机

### 2.1 状态枚举

| 状态         | 含义                              |
| ------------ | --------------------------------- |
| `pending`    | 已规划，依赖未满足                |
| `ready`      | 依赖满足，等待 dispatch           |
| `dispatched` | 已分配给 Worker / AgentRun        |
| `running`    | 至少一个 AgentRun 在跑            |
| `succeeded`  | ✅ 终态                           |
| `failed`     | ❌ 终态                           |
| `skipped`    | ❌ 终态：被跳过（如上游失败传播） |
| `cancelled`  | ❌ 终态                           |

### 2.2 转移图

```text
pending ──► ready ──► dispatched ──► running ──► succeeded
                          │             │           │
                          ▼             ▼           ▼
                       cancelled    failed     (终态)
                                       │
                                       ▼
                                   ready (retry 时)
```

注意：

- `failed → ready` 仅在 **retry** 场景下允许，且 `attempt` 必须加 1
- 上游 Task `failed` 时下游可能进入 `skipped`（依配置）

## 3. AgentRun 状态机

### 3.1 状态枚举

| 状态        | 含义                                |
| ----------- | ----------------------------------- |
| `submitted` | 已提交到 Runtime Gateway            |
| `queued`    | Runtime 已接受，等待执行            |
| `running`   | 实际执行中（持有 lease）            |
| `succeeded` | ✅ 终态                             |
| `failed`    | ❌ 终态                             |
| `cancelled` | ❌ 终态                             |
| `timeout`   | ❌ 终态                             |
| `lost`      | ❌ 终态：lease 超时未续约，视为丢失 |

### 3.2 转移图

```text
submitted ──► queued ──► running ──► succeeded
    │           │           │            │
    ▼           ▼           ▼            │
cancelled   cancelled  cancelled/timeout │
                           │             │
                           ▼             │
                          lost (heartbeat 超时)
```

### 3.3 heartbeat / lease 规则

- `running` 状态下 AgentRun 必须**周期性更新** `heartbeat_at`（建议默认间隔 15s）
- `lease_expires_at = heartbeat_at + lease_ttl`（建议默认 60s）
- Scheduler 周期性扫描 `status = running AND lease_expires_at < now()`，将其转为 `lost`
- `lost` 不可恢复；Task 层可以决定是否 `retry`（新建 attempt）

详见 [`replay-and-recovery.md`](replay-and-recovery.md)。

---

## 4. retry / rerun / replan 语义（极其重要，不可混用）

| 操作       | 作用对象             | 行为                                                                               | 是否新对象            |
| ---------- | -------------------- | ---------------------------------------------------------------------------------- | --------------------- |
| **retry**  | 单个 Task / AgentRun | 同一 OrchestrationRun 内，重试失败节点；Task `attempt + 1`，新建 AgentRun          | 仅新建 AgentRun       |
| **rerun**  | OrchestrationRun     | 基于同一原始 Event，**新建一轮** OrchestrationRun；可以复用 planner 结果或重新规划 | 新建 OrchestrationRun |
| **replan** | OrchestrationRun     | 在新一轮 run 中**重做规划**，不允许中途强改 task graph                             | 新建 OrchestrationRun |

### 设计约束

- **同一 OrchestrationRun 内不允许在线大规模改图**（避免状态机失稳）
- replan 必须走"新 run"路径
- retry 受 Task 的 `retryable` 字段限制
- retry / rerun / replan 都必须写 TraceEvent，便于事后回看
- replan 必须在新 run 的 PlanningOutput 中写明 `replanReason`，并可引用上一轮 run / failed task / stale ContextPack 作为证据。

---

## 5. operator 接管动作矩阵

| 动作                   | 触发                  | 允许的源状态                                                  | 结果状态                    |
| ---------------------- | --------------------- | ------------------------------------------------------------- | --------------------------- |
| **观察**               | 任何时候              | 任意                                                          | 不变                        |
| **暂停 run**           | operator 主动         | `running`                                                     | `paused`                    |
| **恢复 run**           | operator 主动         | `paused`                                                      | `running`                   |
| **取消 run**           | operator 主动         | `queued` / `planning` / `running` / `synthesizing` / `paused` | `cancelled`                 |
| **retry task**         | operator 或自动       | task `failed`                                                 | task → `ready`（attempt+1） |
| **rerun**              | operator 主动         | 任何终态                                                      | 新建 OrchestrationRun       |
| **注入 operator note** | operator 主动         | run 任意状态                                                  | 不变（写 message + trace）  |
| **approve / reject**   | operator 在受保护步骤 | task 处于"等待审批"                                           | task → `running` / `failed` |

接管动作按 effect 分三类：

| Effect         | 含义                                 | 示例                                                 |
| -------------- | ------------------------------------ | ---------------------------------------------------- |
| `applies_now`  | 立即影响当前调度                     | approve once、reject、cancel、retry now              |
| `applies_next` | 作为下一次 planning / retry 的上下文 | add instruction then retry、调整 acceptance criteria |
| `records_only` | 只沉淀 decision / note，不改变调度   | 记录人工观察、标记需后续复盘                         |

Handoff Queue 只展示需要人类处理的动作，不允许把纯信息流都塞入队列；每个 queue item 必须能追到源对象与 TraceEvent。

---

## 6. 错误分层

为了支持 Operator 排错，错误必须能分层归因：

| 层     | 字段                                  | 来源                          |
| ------ | ------------------------------------- | ----------------------------- |
| 编排层 | `OrchestrationRun.error_code/message` | planner / synthesizer 失败    |
| 任务层 | `Task.failure_reason`                 | 依赖失败 / 任务级超时         |
| 执行层 | `AgentRun.error_code/message`         | runtime 失败 / heartbeat 丢失 |
| 产物层 | `Artifact` 缺失 / 校验失败            | 检验阶段                      |

每一层错误都应触发对应 TraceEvent。

---

## 7. Scheduler 推进逻辑（伪代码）

```ts
// Workspace Core 内嵌 scheduler，DB 为唯一真相源（ADR-0006）
async function tick() {
  // 1. 推进 OrchestrationRun: queued → planning
  await advanceQueuedRuns();

  // 2. 在 planning 中的 run，分配 ready 的 task 给 worker
  await dispatchReadyTasks();

  // 3. 推进 running 中的 task / run（通过 runtime gateway 回写状态）
  // - 这一步由 runtime 回调驱动，scheduler 只做兜底扫描

  // 4. 扫描 lease 过期的 AgentRun → lost
  await reclaimLostRuns();

  // 5. 推进完成的 run: running → synthesizing → succeeded
  await advanceFinishedRuns();
}

// 退避策略
let backoffMs = 500;
const maxBackoffMs = 5000;
while (running) {
  const didWork = await tick();
  backoffMs = didWork ? 500 : Math.min(backoffMs * 1.5, maxBackoffMs);
  await sleepWithJitter(backoffMs);
}
```

详细实现规范在 `packages/application/orchestration/` 的代码与注释中。

---

## 8. 不变量（Invariants）

以下条件**任何时候都必须为真**，违反即为 bug：

1. 终态对象不可被修改（含状态、错误码、时间戳）
2. Task `attempt` 单调递增
3. AgentRun `attempt` ≤ 对应 Task 的 `attempt`
4. OrchestrationRun 终态时，所有 Task 必须处于终态
5. `lease_owner` 非空时 `lease_expires_at` 必须非空
6. `trace_id` 在 OrchestrationRun 创建时分配，整个生命周期不变

---

## 9. 待办

- [ ] 补充 Mermaid 状态图
- [ ] 补充测试矩阵（每条转移至少一条测试）
- [ ] 与 `contracts/runtime-adapter.md` 的错误码归一化映射

---

## 变更历史

| 日期       | 变更                                                             |
| ---------- | ---------------------------------------------------------------- |
| 2026-05-17 | 补充 operator intervention effect 与 Handoff Queue 约束          |
| 2026-05-15 | 补充 planning artifact、blocked reason 与 replan reason 可观察性 |
| 2026-05-14 | 初版，从 V0.1.0 §11 抽出并补充 lease/heartbeat 与不变量          |
