// SPDX-License-Identifier: Apache-2.0
/**
 * TraceEvent 表定义。
 *
 * TraceEvent 是 replay 与排错的持久化输入；状态转移必须写入本表。
 * 对齐：`@cairn/shared-contracts/schemas/trace-event`、domain-model.md §10
 */
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { agentRuns } from './agent-runs';
import { artifacts } from './artifacts';
import { orchestrationRuns } from './orchestration-runs';
import { tasks } from './tasks';
import { workspaces } from './workspaces';

export const traceEvents = sqliteTable(
  'trace_events',
  {
    traceEventId: text('trace_event_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    orchestrationRunId: text('orchestration_run_id').references(
      () => orchestrationRuns.orchestrationRunId,
      { onDelete: 'set null', onUpdate: 'cascade' },
    ),
    taskId: text('task_id').references(() => tasks.taskId, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    runId: text('run_id').references(() => agentRuns.runId, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    eventType: text('event_type').notNull(),
    level: text('level').notNull(),
    payloadRef: text('payload_ref').references(() => artifacts.artifactId, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    payloadInline: text('payload_inline', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: text('created_at').notNull(),
    traceId: text('trace_id').notNull(),
  },
  (t) => ({
    traceCreatedIdx: index('idx_trace_events_trace_created').on(t.traceId, t.createdAt),
    runCreatedIdx: index('idx_trace_events_run_created').on(t.orchestrationRunId, t.createdAt),
    runTypeIdx: index('idx_trace_events_run_type').on(t.orchestrationRunId, t.eventType),
    workspaceCreatedIdx: index('idx_trace_events_workspace_created').on(t.workspaceId, t.createdAt),
  }),
);
