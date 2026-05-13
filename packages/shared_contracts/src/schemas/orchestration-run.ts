// SPDX-License-Identifier: Apache-2.0
/**
 * OrchestrationRun：一次完整编排执行。
 *
 * 产品最重要的一等对象之一。所有 retry / cancel / rerun 都围绕它。
 *
 * 状态机：docs/design/state-machines.md §1
 * 字段：  docs/design/domain-model.md §6
 */

import { z } from 'zod';

import { Iso8601, ResultCompleteness, CompletionLevel, StructuredError } from './common.js';
import {
  OrchestrationRunId,
  WorkspaceId,
  ConversationId,
  EventId,
  ArtifactId,
  TraceId,
} from './ids.js';

// ---------------------------------------------------------------------------
// 枚举
// ---------------------------------------------------------------------------

/**
 * OrchestrationRun 状态机。
 *
 * 终态：succeeded / failed / cancelled / timeout（不可再转出）
 */
export const OrchestrationRunStatus = z.enum([
  'queued',
  'planning',
  'running',
  'synthesizing',
  'paused',
  'succeeded',
  'failed',
  'cancelled',
  'timeout',
]);
export type OrchestrationRunStatus = z.infer<typeof OrchestrationRunStatus>;

/**
 * 首发执行模式（R1）。
 * 未来：deliberation / meeting / committee（不在 R1）。
 */
export const ExecutionMode = z.enum(['direct_answer', 'single_worker', 'multi_worker']);
export type ExecutionMode = z.infer<typeof ExecutionMode>;

export const ORCHESTRATION_RUN_TERMINAL_STATUSES = [
  'succeeded',
  'failed',
  'cancelled',
  'timeout',
] as const satisfies readonly OrchestrationRunStatus[];

// ---------------------------------------------------------------------------
// 核心对象
// ---------------------------------------------------------------------------

export const OrchestrationRun = z.object({
  orchestrationRunId: OrchestrationRunId,
  workspaceId: WorkspaceId,
  conversationId: ConversationId.optional(),
  originEventId: EventId,
  status: OrchestrationRunStatus,
  executionMode: ExecutionMode,
  plannerOutputRef: ArtifactId.optional(),
  synthesisOutputRef: ArtifactId.optional(),
  finalResponseRef: ArtifactId.optional(),
  hasPartialFailures: z.boolean(),
  resultCompleteness: ResultCompleteness,
  completionLevel: CompletionLevel,
  startedAt: Iso8601.optional(),
  finishedAt: Iso8601.optional(),
  error: StructuredError.optional(),
  traceId: TraceId,
  createdAt: Iso8601,
  updatedAt: Iso8601,
});
export type OrchestrationRun = z.infer<typeof OrchestrationRun>;
