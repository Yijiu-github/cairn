// SPDX-License-Identifier: Apache-2.0
/**
 * PlanningOutput 表定义。
 *
 * 对齐：`@cairn/shared-contracts/schemas/planning-output`、domain-model.md Goal Planner 输出。
 */
import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { orchestrationRuns } from './orchestration-runs';
import { workspaces } from './workspaces';

export interface PlanningActionNodeRow {
  actionId: string;
  parentActionId?: string;
  taskId?: string;
  title: string;
  intent: string;
  status: 'planned' | 'ready' | 'blocked' | 'skipped';
  dependsOnActionIds: string[];
}

export interface PlanningPreconditionRow {
  actionId?: string;
  description: string;
  status: 'satisfied' | 'missing' | 'unknown';
  evidenceRefs: string[];
}

export interface PlanningBlockedReasonRow {
  scope: 'run' | 'action' | 'task';
  actionId?: string;
  taskId?: string;
  code: string;
  message: string;
  operatorActionHint?: string;
}

export interface PlanningReplanReasonRow {
  previousRunId?: string;
  trigger: 'operator_request' | 'failed_precondition' | 'stale_context' | 'runtime_failure';
  message: string;
}

export const planningOutputs = sqliteTable(
  'planning_outputs',
  {
    planningOutputId: text('planning_output_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    orchestrationRunId: text('orchestration_run_id')
      .notNull()
      .references(() => orchestrationRuns.orchestrationRunId, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    status: text('status').notNull(),
    actionTree: text('action_tree', { mode: 'json' }).$type<PlanningActionNodeRow[]>().notNull(),
    preconditions: text('preconditions', { mode: 'json' })
      .$type<PlanningPreconditionRow[]>()
      .notNull(),
    blockedReason: text('blocked_reason', { mode: 'json' }).$type<
      PlanningBlockedReasonRow | undefined
    >(),
    replanReason: text('replan_reason', { mode: 'json' }).$type<
      PlanningReplanReasonRow | undefined
    >(),
    contextPackRefs: text('context_pack_refs', { mode: 'json' }).$type<string[]>().notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    runUniqueIdx: uniqueIndex('idx_planning_outputs_run_unique').on(t.orchestrationRunId),
    workspaceStatusIdx: index('idx_planning_outputs_workspace_status').on(t.workspaceId, t.status),
  }),
);
