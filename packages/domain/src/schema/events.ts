// SPDX-License-Identifier: Apache-2.0
/**
 * Event 表定义。
 *
 * Event 是一次外部输入；OrchestrationRun.origin_event_id 必须指向这里。
 * 对齐：domain-model.md §3
 */
import { index, sqliteTable, text as sqliteText } from 'drizzle-orm/sqlite-core';

import { conversations } from './conversations';
import { workspaces } from './workspaces';

export const events = sqliteTable(
  'events',
  {
    eventId: sqliteText('event_id').primaryKey().notNull(),
    workspaceId: sqliteText('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    sourceType: sqliteText('source_type').notNull(),
    conversationId: sqliteText('conversation_id').references(() => conversations.conversationId, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    actorId: sqliteText('actor_id'),
    actorRole: sqliteText('actor_role').notNull(),
    text: sqliteText('text'),
    attachments: sqliteText('attachments', { mode: 'json' }).$type<Record<string, unknown>[]>(),
    createdAt: sqliteText('created_at').notNull(),
    metadata: sqliteText('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  },
  (t) => ({
    workspaceCreatedIdx: index('idx_events_workspace_created').on(t.workspaceId, t.createdAt),
    conversationCreatedIdx: index('idx_events_conversation_created').on(
      t.conversationId,
      t.createdAt,
    ),
    sourceCreatedIdx: index('idx_events_source_created').on(t.sourceType, t.createdAt),
  }),
);
