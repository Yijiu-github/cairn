// SPDX-License-Identifier: Apache-2.0
/**
 * Task 表定义。
 *
 * 对齐：`@cairn/shared-contracts/schemas/task`、domain-model.md §7
 */
import { index, integer, sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

import { orchestrationRuns } from './orchestration-runs';
import { workspaces } from './workspaces';

export interface BudgetHintRow {
  maxTokens?: number;
  maxSeconds?: number;
  maxCostUsd?: number;
}

export const tasks = sqliteTable(
  'tasks',
  {
    taskId: text('task_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    parentTaskId: text('parent_task_id').references((): AnySQLiteColumn => tasks.taskId, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    orchestrationRunId: text('orchestration_run_id')
      .notNull()
      .references(() => orchestrationRuns.orchestrationRunId, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    taskKind: text('task_kind').notNull(),
    title: text('title').notNull(),
    brief: text('brief').notNull(),
    executionProfile: text('execution_profile'),
    status: text('status').notNull(),
    priority: integer('priority').notNull().default(50),
    attempt: integer('attempt').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    dependsOnTaskIds: text('depends_on_task_ids', { mode: 'json' }).$type<string[]>().notNull(),
    contextRefs: text('context_refs', { mode: 'json' }).$type<string[]>().notNull(),
    artifactRefs: text('artifact_refs', { mode: 'json' }).$type<string[]>().notNull(),
    budgetHint: text('budget_hint', { mode: 'json' }).$type<BudgetHintRow | undefined>(),
    failureReason: text('failure_reason'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    runStatusIdx: index('idx_tasks_run_status').on(t.orchestrationRunId, t.status),
    workspaceKindIdx: index('idx_tasks_workspace_kind').on(t.workspaceId, t.taskKind),
  }),
);
