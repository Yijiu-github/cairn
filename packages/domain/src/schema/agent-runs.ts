// SPDX-License-Identifier: Apache-2.0
/**
 * AgentRun 表定义。
 *
 * 对齐：`@cairn/shared-contracts/schemas/agent-run`、domain-model.md §8
 */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { orchestrationRuns } from './orchestration-runs';
import { tasks } from './tasks';
import { workspaces } from './workspaces';

import type { StructuredErrorRow } from './orchestration-runs';

export const agentRuns = sqliteTable(
  'agent_runs',
  {
    runId: text('run_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.taskId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    orchestrationRunId: text('orchestration_run_id')
      .notNull()
      .references(() => orchestrationRuns.orchestrationRunId, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    runtimeType: text('runtime_type').notNull(),
    runtimeModel: text('runtime_model'),
    status: text('status').notNull(),
    attempt: integer('attempt').notNull(),
    providerRunId: text('provider_run_id'),
    submittedAt: text('submitted_at'),
    queuedAt: text('queued_at'),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
    timeoutAt: text('timeout_at'),
    retryable: integer('retryable', { mode: 'boolean' }).notNull(),
    cancelable: integer('cancelable', { mode: 'boolean' }).notNull(),
    inputRef: text('input_ref'),
    outputRef: text('output_ref'),
    error: text('error', { mode: 'json' }).$type<StructuredErrorRow | undefined>(),
    heartbeatAt: text('heartbeat_at'),
    leaseOwner: text('lease_owner'),
    leaseExpiresAt: text('lease_expires_at'),
    traceId: text('trace_id').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    taskIdx: index('idx_agent_runs_task').on(t.taskId),
    workspaceRunIdx: index('idx_agent_runs_workspace_run').on(t.workspaceId, t.orchestrationRunId),
  }),
);
