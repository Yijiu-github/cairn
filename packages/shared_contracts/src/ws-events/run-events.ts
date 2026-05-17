// SPDX-License-Identifier: Apache-2.0
/**
 * WebSocket 事件：OrchestrationRun / Task / AgentRun 的流式状态与输出。
 *
 * 这一层不依赖 ts-rest（ts-rest 不擅长 streaming）。
 * 协议：客户端订阅一个 run → 服务端推送 RunEvent 序列直到 run 终态。
 *
 * 命名约定：<domain>.<verb_past>
 *   run.* / task.* / agent_run.* / operator.*
 *
 * 与 TraceEvent 的关系：
 *   - RunEvent 是「实时推送给 UI 的流」
 *   - TraceEvent 是「持久化到 DB 的可观察事件」
 *   - 多数 RunEvent 会对应一条 TraceEvent，但 UI 可以选择性订阅
 *
 * 参考：docs/contracts/runtime-adapter.md（AdapterStreamEvent）
 */

import { z } from 'zod';

import { AgentRunStatus } from '../schemas/agent-run.js';
import {
  Iso8601,
  ResultCompleteness,
  CompletionLevel,
  StructuredError,
} from '../schemas/common.js';
import {
  OrchestrationRunId,
  TaskId,
  AgentRunId,
  ArtifactId,
  PlanningOutputId,
  TraceId,
} from '../schemas/ids.js';
import { OrchestrationRunStatus, ExecutionMode } from '../schemas/orchestration-run.js';
import { TaskStatus } from '../schemas/task.js';

// ---------------------------------------------------------------------------
// 共享子 schema
// ---------------------------------------------------------------------------

const BaseRunEvent = z.object({
  runId: OrchestrationRunId,
  traceId: TraceId,
  at: Iso8601,
  /** 用于客户端去重 / 乱序矫正 */
  seq: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// OrchestrationRun 级事件
// ---------------------------------------------------------------------------

const RunStatusChanged = BaseRunEvent.extend({
  type: z.literal('run.status_changed'),
  status: OrchestrationRunStatus,
  executionMode: ExecutionMode.optional(),
});

const RunPlannerOutput = BaseRunEvent.extend({
  type: z.literal('run.planner_output'),
  plannerOutputRef: PlanningOutputId,
});

const RunSynthesisOutput = BaseRunEvent.extend({
  type: z.literal('run.synthesis_output'),
  synthesisOutputRef: ArtifactId,
});

const RunSucceeded = BaseRunEvent.extend({
  type: z.literal('run.succeeded'),
  finalResponseRef: ArtifactId.optional(),
  resultCompleteness: ResultCompleteness,
  completionLevel: CompletionLevel,
});

const RunFailed = BaseRunEvent.extend({
  type: z.literal('run.failed'),
  error: StructuredError,
});

const RunCancelled = BaseRunEvent.extend({
  type: z.literal('run.cancelled'),
  reason: z.string().optional(),
});

const RunTimedOut = BaseRunEvent.extend({
  type: z.literal('run.timed_out'),
});

const RunPaused = BaseRunEvent.extend({
  type: z.literal('run.paused'),
  reason: z.string().optional(),
});

const RunResumed = BaseRunEvent.extend({
  type: z.literal('run.resumed'),
});

// ---------------------------------------------------------------------------
// Task 级事件
// ---------------------------------------------------------------------------

const TaskStatusChanged = BaseRunEvent.extend({
  type: z.literal('task.status_changed'),
  taskId: TaskId,
  status: TaskStatus,
  attempt: z.number().int().nonnegative(),
});

const TaskFailed = BaseRunEvent.extend({
  type: z.literal('task.failed'),
  taskId: TaskId,
  attempt: z.number().int().nonnegative(),
  error: StructuredError,
});

// ---------------------------------------------------------------------------
// AgentRun 级事件
// ---------------------------------------------------------------------------

const AgentRunStatusChanged = BaseRunEvent.extend({
  type: z.literal('agent_run.status_changed'),
  agentRunId: AgentRunId,
  taskId: TaskId,
  status: AgentRunStatus,
  attempt: z.number().int().nonnegative(),
});

/** 流式 token 输出（来自 runtime adapter） */
const AgentRunToken = BaseRunEvent.extend({
  type: z.literal('agent_run.token'),
  agentRunId: AgentRunId,
  delta: z.string(),
});

const AgentRunArtifact = BaseRunEvent.extend({
  type: z.literal('agent_run.artifact'),
  agentRunId: AgentRunId,
  artifactId: ArtifactId,
});

const AgentRunHeartbeat = BaseRunEvent.extend({
  type: z.literal('agent_run.heartbeat'),
  agentRunId: AgentRunId,
});

const AgentRunLost = BaseRunEvent.extend({
  type: z.literal('agent_run.lost'),
  agentRunId: AgentRunId,
  reason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Operator 介入事件（不改变 run 状态，但需推给 UI）
// ---------------------------------------------------------------------------

const OperatorNoteInjected = BaseRunEvent.extend({
  type: z.literal('operator.note_injected'),
  messageId: z.string(),
  visibility: z.enum(['public', 'operator_only']),
});

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export const RunEvent = z.discriminatedUnion('type', [
  RunStatusChanged,
  RunPlannerOutput,
  RunSynthesisOutput,
  RunSucceeded,
  RunFailed,
  RunCancelled,
  RunTimedOut,
  RunPaused,
  RunResumed,
  TaskStatusChanged,
  TaskFailed,
  AgentRunStatusChanged,
  AgentRunToken,
  AgentRunArtifact,
  AgentRunHeartbeat,
  AgentRunLost,
  OperatorNoteInjected,
]);
export type RunEvent = z.infer<typeof RunEvent>;

/** 解析失败时 UI 应当显示 raw payload 而非 crash。 */
export const safeParseRunEvent = (raw: unknown): RunEvent | undefined => {
  const parsed = RunEvent.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
};
