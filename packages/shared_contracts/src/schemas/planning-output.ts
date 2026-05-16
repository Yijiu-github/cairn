// SPDX-License-Identifier: Apache-2.0
/**
 * PlanningOutput：Goal Planner 输出的可回放规划结果。
 *
 * 它描述 action tree、preconditions、blocked reason 与 replan reason；
 * 实际执行状态仍由 OrchestrationRun / Task / AgentRun 状态机推进。
 */

import { z } from 'zod';

import { Iso8601 } from './common.js';
import { ContextPackId, OrchestrationRunId, PlanningOutputId, TaskId, WorkspaceId } from './ids.js';

export const PlanningOutputStatus = z.enum(['pending', 'ready', 'blocked', 'failed']);
export type PlanningOutputStatus = z.infer<typeof PlanningOutputStatus>;

export const PLANNING_OUTPUT_TERMINAL_STATUSES = [
  'ready',
  'blocked',
  'failed',
] as const satisfies readonly PlanningOutputStatus[];

export const PlanningActionStatus = z.enum(['planned', 'ready', 'blocked', 'skipped']);
export type PlanningActionStatus = z.infer<typeof PlanningActionStatus>;

export const PlanningActionNode = z.object({
  actionId: z.string().min(1),
  parentActionId: z.string().min(1).optional(),
  taskId: TaskId.optional(),
  title: z.string().min(1).max(200),
  intent: z.string().min(1),
  status: PlanningActionStatus,
  dependsOnActionIds: z.array(z.string().min(1)).default([]),
});
export type PlanningActionNode = z.infer<typeof PlanningActionNode>;

export const PlanningPrecondition = z.object({
  actionId: z.string().min(1).optional(),
  description: z.string().min(1),
  status: z.enum(['satisfied', 'missing', 'unknown']),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type PlanningPrecondition = z.infer<typeof PlanningPrecondition>;

export const PlanningBlockedReason = z.object({
  scope: z.enum(['run', 'action', 'task']),
  actionId: z.string().min(1).optional(),
  taskId: TaskId.optional(),
  code: z.string().min(1),
  message: z.string().min(1),
  operatorActionHint: z.string().min(1).optional(),
});
export type PlanningBlockedReason = z.infer<typeof PlanningBlockedReason>;

export const PlanningReplanReason = z.object({
  previousRunId: OrchestrationRunId.optional(),
  trigger: z.enum(['operator_request', 'failed_precondition', 'stale_context', 'runtime_failure']),
  message: z.string().min(1),
});
export type PlanningReplanReason = z.infer<typeof PlanningReplanReason>;

export const PlanningOutput = z
  .object({
    planningOutputId: PlanningOutputId,
    workspaceId: WorkspaceId,
    orchestrationRunId: OrchestrationRunId,
    status: PlanningOutputStatus,
    actionTree: z.array(PlanningActionNode).default([]),
    preconditions: z.array(PlanningPrecondition).default([]),
    blockedReason: PlanningBlockedReason.optional(),
    replanReason: PlanningReplanReason.optional(),
    contextPackRefs: z.array(ContextPackId).default([]),
    createdAt: Iso8601,
    updatedAt: Iso8601,
  })
  .superRefine((planningOutput, context) => {
    if (planningOutput.status === 'blocked' && planningOutput.blockedReason === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['blockedReason'],
        message: 'blockedReason is required when status is blocked',
      });
    }
  });
export type PlanningOutput = z.infer<typeof PlanningOutput>;
