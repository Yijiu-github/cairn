// SPDX-License-Identifier: Apache-2.0
/**
 * Task：OrchestrationRun 内的子任务节点（DAG 结构）。
 *
 * 状态机：docs/design/state-machines.md §2
 * 字段：  docs/design/domain-model.md §7
 */

import { z } from 'zod';

import { TaskId, WorkspaceId, OrchestrationRunId, ArtifactId } from './ids.js';
import { Iso8601, BudgetHint } from './common.js';

// ---------------------------------------------------------------------------
// 枚举
// ---------------------------------------------------------------------------

export const TaskKind = z.enum(['research', 'edit', 'review', 'synthesize', 'custom']);
export type TaskKind = z.infer<typeof TaskKind>;

/**
 * Task 状态机。
 *
 * 允许的转移见 state-machines.md §2.2；终态后只在 retry 时回到 ready，且 attempt+1。
 */
export const TaskStatus = z.enum([
  'pending',
  'ready',
  'dispatched',
  'running',
  'succeeded',
  'failed',
  'skipped',
  'cancelled',
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TASK_TERMINAL_STATUSES = [
  'succeeded',
  'failed',
  'skipped',
  'cancelled',
] as const satisfies readonly TaskStatus[];

// ---------------------------------------------------------------------------
// 核心对象
// ---------------------------------------------------------------------------

export const Task = z.object({
  taskId: TaskId,
  workspaceId: WorkspaceId,
  parentTaskId: TaskId.optional(),
  orchestrationRunId: OrchestrationRunId,
  taskKind: TaskKind,
  title: z.string().min(1).max(200),
  brief: z.string(),
  executionProfile: z.string().optional(),
  status: TaskStatus,
  priority: z.number().int().min(0).max(100).default(50),
  attempt: z.number().int().min(0),
  /**
   * 防重提交。
   * 同一 task 在同一 attempt 上，向 runtime gateway 提交的 idempotency key 必须稳定。
   */
  idempotencyKey: z.string().min(1),
  dependsOnTaskIds: z.array(TaskId).default([]),
  contextRefs: z.array(ArtifactId).default([]),
  artifactRefs: z.array(ArtifactId).default([]),
  budgetHint: BudgetHint.optional(),
  failureReason: z.string().optional(),
  createdAt: Iso8601,
  updatedAt: Iso8601,
});
export type Task = z.infer<typeof Task>;
