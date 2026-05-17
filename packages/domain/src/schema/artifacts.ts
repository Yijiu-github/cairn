// SPDX-License-Identifier: Apache-2.0
/**
 * Artifact 表定义。
 *
 * 对齐：`@cairn/shared-contracts/schemas/artifact`、domain-model.md §9
 */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { agentRuns } from './agent-runs';
import { orchestrationRuns } from './orchestration-runs';
import { tasks } from './tasks';
import { workspaces } from './workspaces';

export const artifacts = sqliteTable(
  'artifacts',
  {
    artifactId: text('artifact_id').primaryKey().notNull(),
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
    artifactRole: text('artifact_role').notNull(),
    kind: text('kind').notNull(),
    formatVersion: text('format_version').notNull(),
    uriOrPath: text('uri_or_path').notNull(),
    contentType: text('content_type'),
    sizeBytes: integer('size_bytes'),
    payloadRef: text('payload_ref'),
    sensitivity: text('sensitivity').default('none').notNull(),
    producerType: text('producer_type').notNull(),
    producerId: text('producer_id'),
    visibility: text('visibility').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    workspaceIdx: index('idx_artifacts_workspace').on(t.workspaceId),
    runIdx: index('idx_artifacts_run').on(t.orchestrationRunId),
  }),
);
