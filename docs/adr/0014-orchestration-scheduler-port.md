# ADR-0014: OrchestrationScheduler 端口 + LangGraph JS 退路

- **状态**：🟢 Accepted
- **日期**：2026-05-14
- **决策者**：项目主理
- **关联**：**扩展 ADR-0004**（不替代）、ADR-0006、[`../design/state-machines.md`](../design/state-machines.md)、[`../design/replay-and-recovery.md`](../design/replay-and-recovery.md)

---

## 背景

ADR-0004 已经决定采用 LangGraph JS 作为编排底座，并明确"产品状态模型自持"。

但 LangGraph JS 是当前项目最大的**单点技术风险**：

- 功能完整度滞后于 Python 版
- 长任务 checkpoint / durable execution 的 JS 实现仍较新
- 取消传播链需要实战验证
- 上游商业化方向（与 LangChain Inc）可能影响开源版本

如果 LangGraph JS 在关键能力上卡住（长任务恢复不完整、取消不传播、上游中止维护等），整个项目不应被锁死。

**ADR-0004 对此只是声明"保留替换可能"，没有给出可执行的退路。本 ADR 把这个退路落到接口层。**

## 决策

**在 `packages/application/orchestration/` 中定义 `OrchestrationScheduler` 端口（接口），并提供两个实现：**

1. **`LangGraphJsScheduler`**：默认实现，基于 LangGraph JS
2. **`NaiveDbDrivenScheduler`**：退路实现，基于 ADR-0006 的状态机 + DB 推进，不引入图编排

**所有 application 层代码只依赖 `OrchestrationScheduler` 接口，不直接引用 LangGraph 内部对象。**

### 切换策略

- Release 1：默认使用 `LangGraphJsScheduler`
- 启动时通过 config 决定具体实现：`CAIRN_SCHEDULER_IMPL=langgraph_js|naive`
- `naive` 始终保留为 functional fallback；CI 必须同时跑两种实现的契约测试

### 退路触发条件（任一发生即可切换）

1. LangGraph JS 长任务 checkpoint 在 spike 中无法恢复
2. LangGraph JS 取消传播在 spike 中存在断裂
3. LangGraph JS 上游中止维护或商业化策略与本项目根本冲突
4. 出现影响首发的不可绕过 bug 且上游修复不可及时

## 接口草案

```ts
// packages/application/orchestration/scheduler-port.ts

import type {
  OrchestrationRunId,
  OrchestrationRun,
  TaskId,
  AgentRunId,
} from '@cairn/domain';

/**
 * 编排调度端口。
 * 实现负责把 OrchestrationRun 从 queued 推进到终态，
 * 并响应 operator 接管动作（pause / cancel / retry）。
 *
 * 实现必须遵守 state-machines.md 中的状态机不变量。
 */
export interface OrchestrationScheduler {
  /** 入队一个新的 run（已写入 DB 的 queued 状态） */
  enqueue(runId: OrchestrationRunId): Promise<void>;

  /** 暂停（仅作用于运行中的 run） */
  pause(runId: OrchestrationRunId, reason?: string): Promise<void>;

  /** 恢复 */
  resume(runId: OrchestrationRunId): Promise<void>;

  /** 取消（best-effort） */
  cancel(runId: OrchestrationRunId, reason?: string): Promise<void>;

  /** 重试单个失败 task（attempt+1） */
  retryTask(runId: OrchestrationRunId, taskId: TaskId): Promise<void>;

  /** 重试单个失败 agent_run（attempt+1） */
  retryAgentRun(runId: OrchestrationRunId, agentRunId: AgentRunId): Promise<void>;

  /** 健康自检 */
  healthcheck(): Promise<{ ok: boolean; details?: string }>;

  /** 优雅关闭（崩溃恢复扫描在 init 中完成） */
  shutdown(): Promise<void>;
}
```

### 共享依赖

两个实现都依赖：

- `packages/storage/`：通过 repository 端口读写 OrchestrationRun / Task / AgentRun
- `packages/runtime_gateway/`：提交 AgentRun，订阅流式事件
- `packages/observability/`：日志、trace_id

它们的差异**只在状态机推进策略**：

- LangGraph 实现：图节点状态由 LangGraph 推动，scheduler 桥接到 Cairn 领域对象
- Naive 实现：直接基于 `state-machines.md §7` 的 tick 循环推进

## 契约测试（强制）

`tests/contract/scheduler-conformance.spec.ts` 必须覆盖：

| 场景 | 期望 |
|---|---|
| `enqueue` → 短任务跑完 | run → succeeded，artifacts 与 trace 写入 |
| `cancel` 运行中 run | 在 ≤ 2s 内停止，状态 → cancelled，子 AgentRun 触发 cancel |
| `pause` 运行中 → `resume` | 状态正确转移 |
| `retryTask` 失败 task | attempt+1，新 AgentRun 启动 |
| sidecar 崩溃后重启 | running 状态的 AgentRun 中 lease 过期者 → lost；run 不卡死 |
| 部分失败 run | run → succeeded，`has_partial_failures=true`，`result_completeness=partial` |
| 长 run（≥ 30 min mock）中断恢复 | 状态正确恢复，trace 完整 |

**两个实现必须都通过同一套测试**。任意一个挂掉都不发版。

## 后果

### 好的

- 编排底座**从单点变成可替换组件**
- LangGraph 出问题时 Release 1 仍可交付（只是少了高级图编排能力）
- 强迫 application 层不直接绑死 LangGraph 内部结构（符合 ADR-0004 精神）
- 契约测试给两个实现共同的真理标尺

### 坏的

- 需要持续维护两个实现的功能对齐（短期内 naive 实现会偏弱）
- 接口设计如果错过 LangGraph 的某些特殊能力，会限制功能发挥

### 中性的

- 两个实现的差异点必须文档化（在 `application/orchestration/README.md` 维护对照表）

## 备选方案

- **不做退路，只赌 LangGraph**：放弃。单点风险过高，违反"个人项目可活下去"原则。
- **使用 Inngest / Trigger.dev 作为退路**：放弃为首选退路。它们是商业 SaaS / self-hosted 工具，引入新依赖与运维负担；与"local-first 桌面"调性不完全吻合。**保留为 Release 3+ 的远程模式可选实现**。
- **使用 Temporal**：放弃。重型工作流引擎，对当前规模过大。

## 实施提示

### 目录

```text
packages/application/src/orchestration/
├─ scheduler-port.ts            # 接口
├─ langgraph-js/
│  ├─ langgraph-scheduler.ts
│  ├─ graph-builder.ts
│  └─ checkpoint-adapter.ts
├─ naive/
│  ├─ naive-scheduler.ts
│  └─ tick-loop.ts
├─ shared/
│  ├─ recovery.ts              # heartbeat / lease 恢复逻辑（共享）
│  └─ event-translator.ts
└─ index.ts
```

### Config

```ts
// 来自 @cairn/config
export const schedulerImpl = (process.env.CAIRN_SCHEDULER_IMPL ?? 'langgraph_js') as
  | 'langgraph_js'
  | 'naive';
```

### Spike（首发前 P0）

必须在写 production 代码前完成：

1. **S1**：`NaiveDbDrivenScheduler` 单独跑通契约测试全集 — 退路可用性验证
2. **S2**：`LangGraphJsScheduler` 跑通契约测试全集 — 默认实现可用性验证
3. **S3**：30 min 长任务，中途 `kill -9` sidecar，重启后状态恢复 — 验证 lease/heartbeat
4. **S4**：发起带子工具调用循环的任务，调用 `cancel()` — 验证取消传播

任一 spike 失败 → 触发对应退路或修复。

## 后续

- [ ] 提交 `scheduler-port.ts` 接口文件草案
- [ ] 起草 `naive-scheduler.ts` 的伪代码到实现转换文档
- [ ] 起草契约测试用例文件
- [ ] 在 `application/orchestration/README.md` 维护实现差异对照表
- [ ] Release 1 第一次提交代码前完成 S1–S4 spike

## 变更历史

| 日期 | 变更 |
|---|---|
| 2026-05-14 | 初版，扩展 ADR-0004 提出的"保留替换可能"为可执行接口 |
