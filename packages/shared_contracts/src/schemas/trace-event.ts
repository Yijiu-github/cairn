// SPDX-License-Identifier: Apache-2.0
/**
 * TraceEvent：横切的可观察事件。
 *
 * 用于：
 *   - 重建执行时间线（replay 的输入）
 *   - 失败归因
 *
 * 注意："Replay" = 从 TraceEvent 重建 UI，不是重新执行（见 replay-and-recovery.md §2）
 *
 * 字段：docs/design/domain-model.md §10
 */

import { z } from 'zod';

import {
  TraceEventId,
  WorkspaceId,
  OrchestrationRunId,
  TaskId,
  AgentRunId,
  TraceId,
  ArtifactId,
} from './ids.js';
import { Iso8601 } from './common.js';

// ---------------------------------------------------------------------------
// 等级
// ---------------------------------------------------------------------------

export const TraceLevel = z.enum(['debug', 'info', 'warn', 'error']);
export type TraceLevel = z.infer<typeof TraceLevel>;

// ---------------------------------------------------------------------------
// 事件类型（开放枚举，新事件可扩展）
//
// 命名约定：<domain>.<verb_past>
//   run.queued / run.started / run.token / run.heartbeat / run.succeeded / ...
//   task.dispatched / task.failed / ...
//   agent_run.lost / ...
//   operator.intervened / ...
//
// 解析时遇到未知 event_type 不应失败，只显示 raw payload。
// ---------------------------------------------------------------------------

export const TraceEventType = z.string().min(1);
export type TraceEventType = z.infer<typeof TraceEventType>;

// ---------------------------------------------------------------------------
// 核心对象
// ---------------------------------------------------------------------------

export const TraceEvent = z.object({
  traceEventId: TraceEventId,
  workspaceId: WorkspaceId,

  // 关联（按层级填）
  orchestrationRunId: OrchestrationRunId.optional(),
  taskId: TaskId.optional(),
  runId: AgentRunId.optional(),

  eventType: TraceEventType,
  level: TraceLevel,
  /** 大 payload 落 artifact，本字段为 artifact id */
  payloadRef: ArtifactId.optional(),
  /** 小 payload 可以内嵌 */
  payloadInline: z.record(z.unknown()).optional(),

  createdAt: Iso8601,
  traceId: TraceId,
});
export type TraceEvent = z.infer<typeof TraceEvent>;
