// SPDX-License-Identifier: Apache-2.0
/**
 * OrchestrationRun 表定义。
 *
 * 对齐：`@cairn/shared-contracts/schemas/orchestration-run`、domain-model.md §6
 */
import { index, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { conversations } from './conversations';
import { events } from './events';
import { workspaces } from './workspaces';

/** 与 StructuredError Zod 对象同构，避免 domain → shared_contracts 依赖。 */
export interface StructuredErrorRow {
  layer: 'orchestration' | 'task' | 'execution' | 'artifact';
  code: string;
  message: string;
  retryable: boolean;
}

export const orchestrationRuns = sqliteTable(
  'orchestration_runs',
  {
    orchestrationRunId: text('orchestration_run_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    conversationId: text('conversation_id').references(() => conversations.conversationId, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    originEventId: text('origin_event_id')
      .notNull()
      .references(() => events.eventId, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: text('status').notNull(),
    executionMode: text('execution_mode').notNull(),
    plannerOutputRef: text('planner_output_ref'),
    synthesisOutputRef: text('synthesis_output_ref'),
    finalResponseRef: text('final_response_ref'),
    hasPartialFailures: integer('has_partial_failures', { mode: 'boolean' }).notNull(),
    resultCompleteness: text('result_completeness').notNull(),
    completionLevel: text('completion_level').notNull(),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
    error: text('error', { mode: 'json' }).$type<StructuredErrorRow | undefined>(),
    traceId: text('trace_id').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    workspaceIdx: index('idx_orchestration_runs_workspace').on(t.workspaceId),
    statusIdx: index('idx_orchestration_runs_status').on(t.workspaceId, t.status),
  }),
);
