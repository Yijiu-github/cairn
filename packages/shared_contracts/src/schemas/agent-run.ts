// SPDX-License-Identifier: Apache-2.0
/**
 * AgentRun：一次具体的 agent 调用执行。
 *
 * 一个 Task 在 retry 场景下可能产生多次 AgentRun（attempt 累计）。
 *
 * 状态机：docs/design/state-machines.md §3（含 heartbeat / lease 机制）
 * 字段：  docs/design/domain-model.md §8
 */

import { z } from 'zod';

import { Iso8601, StructuredError } from './common.js';
import { AgentRunId, WorkspaceId, TaskId, OrchestrationRunId, ArtifactId, TraceId } from './ids.js';

// ---------------------------------------------------------------------------
// 枚举
// ---------------------------------------------------------------------------

/**
 * AgentRun 状态机。
 *
 * 注意 `lost`：lease 超时未续约，视为丢失（不可恢复，Task 层决定是否 retry）。
 */
export const AgentRunStatus = z.enum([
  'submitted',
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'timeout',
  'lost',
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatus>;

export const AGENT_RUN_TERMINAL_STATUSES = [
  'succeeded',
  'failed',
  'cancelled',
  'timeout',
  'lost',
] as const satisfies readonly AgentRunStatus[];

/**
 * 允许进入 retry 的来源状态（state-machines.md §5 operator 动作矩阵）。
 *
 * 当前明确仅支持 failed / lost，timeout / cancelled 需要走 rerun。
 */
export const AgentRunRetrySourceStatus = z.enum(['failed', 'lost']);
export type AgentRunRetrySourceStatus = z.infer<typeof AgentRunRetrySourceStatus>;

export const AGENT_RUN_RETRY_SOURCE_STATUSES =
  AgentRunRetrySourceStatus.options satisfies readonly AgentRunStatus[];

// ---------------------------------------------------------------------------
// 核心对象
// ---------------------------------------------------------------------------

export const AgentRun = z.object({
  runId: AgentRunId,
  workspaceId: WorkspaceId,
  taskId: TaskId,
  orchestrationRunId: OrchestrationRunId,
  /** 实际接入的 runtime adapter id，如 "codex" / "openai-compat" */
  runtimeType: z.string().min(1),
  runtimeModel: z.string().optional(),
  status: AgentRunStatus,
  attempt: z.number().int().min(0),
  /** 上游 runtime 返回的 run id（如 Codex CLI 的 session id） */
  providerRunId: z.string().optional(),

  // --- 时间戳 ---
  submittedAt: Iso8601.optional(),
  queuedAt: Iso8601.optional(),
  startedAt: Iso8601.optional(),
  finishedAt: Iso8601.optional(),
  timeoutAt: Iso8601.optional(),

  // --- 控制 ---
  retryable: z.boolean(),
  cancelable: z.boolean(),

  // --- 输入 / 输出 ---
  inputRef: ArtifactId.optional(),
  outputRef: ArtifactId.optional(),

  // --- 错误 ---
  error: StructuredError.optional(),

  // --- 崩溃恢复（heartbeat + lease）---
  heartbeatAt: Iso8601.optional(),
  leaseOwner: z.string().optional(),
  leaseExpiresAt: Iso8601.optional(),

  // --- 关联 ---
  traceId: TraceId,
  createdAt: Iso8601,
  updatedAt: Iso8601,
});
export type AgentRun = z.infer<typeof AgentRun>;
