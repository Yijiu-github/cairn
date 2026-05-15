// SPDX-License-Identifier: Apache-2.0
/**
 * Code context index persistence tables.
 *
 * R1a keeps only SourceRoot registry, index snapshot metadata, and ContextPack
 * manifest metadata. Derived file lists, FTS, and AST details arrive later.
 */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { orchestrationRuns } from './orchestration-runs';
import { tasks } from './tasks';
import { workspaces } from './workspaces';

export type CodeContextSourceRootIdRow = string;

export interface ContextPackTargetRow {
  type: 'orchestration_run' | 'task';
  orchestrationRunId?: string;
  taskId?: string;
}

export interface ContextPackItemRow {
  kind: 'file_excerpt' | 'symbol_outline' | 'dependency_edge' | 'user_note';
  sourceRootId?: string | undefined;
  path?: string | undefined;
  startLine?: number | undefined;
  endLine?: number | undefined;
  digest?: string | undefined;
  reason: string;
  confidence?: 'extracted' | 'inferred' | 'ambiguous' | undefined;
  contentRef?: string | undefined;
}

export const sourceRoots = sqliteTable(
  'source_roots',
  {
    sourceRootId: text('source_root_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    kind: text('kind').notNull(),
    displayName: text('display_name').notNull(),
    uri: text('uri').notNull(),
    status: text('status').notNull(),
    includeGlobs: text('include_globs', { mode: 'json' }).$type<string[]>().notNull(),
    excludeGlobs: text('exclude_globs', { mode: 'json' }).$type<string[]>().notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    lastIndexedAt: text('last_indexed_at'),
    error: text('error'),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  },
  (t) => ({
    workspaceStatusIdx: index('idx_source_roots_workspace_status').on(t.workspaceId, t.status),
    workspaceUriIdx: index('idx_source_roots_workspace_uri').on(t.workspaceId, t.uri),
  }),
);

export const codeIndexSnapshots = sqliteTable(
  'code_index_snapshots',
  {
    snapshotId: text('snapshot_id').primaryKey().notNull(),
    sourceRootId: text('source_root_id')
      .notNull()
      .references(() => sourceRoots.sourceRootId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: text('status').notNull(),
    indexVersion: text('index_version').notNull(),
    fileCount: integer('file_count').notNull(),
    createdAt: text('created_at').notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  },
  (t) => ({
    sourceRootCreatedIdx: index('idx_code_index_snapshots_source_root_created').on(
      t.sourceRootId,
      t.createdAt,
    ),
    workspaceCreatedIdx: index('idx_code_index_snapshots_workspace_created').on(
      t.workspaceId,
      t.createdAt,
    ),
  }),
);

export const contextPacks = sqliteTable(
  'context_packs',
  {
    contextPackId: text('context_pack_id').primaryKey().notNull(),
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
    sourceRootIds: text('source_root_ids', { mode: 'json' })
      .$type<CodeContextSourceRootIdRow[]>()
      .notNull(),
    createdFor: text('created_for', { mode: 'json' }).$type<ContextPackTargetRow>().notNull(),
    query: text('query').notNull(),
    items: text('items', { mode: 'json' }).$type<ContextPackItemRow[]>().notNull(),
    tokenEstimate: integer('token_estimate'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    workspaceCreatedIdx: index('idx_context_packs_workspace_created').on(
      t.workspaceId,
      t.createdAt,
    ),
    runIdx: index('idx_context_packs_run').on(t.orchestrationRunId),
    taskIdx: index('idx_context_packs_task').on(t.taskId),
  }),
);
