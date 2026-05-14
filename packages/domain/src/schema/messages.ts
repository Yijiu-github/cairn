// SPDX-License-Identifier: Apache-2.0
/**
 * Message 表定义。
 *
 * 对齐：domain-model.md §5。消息正文通过 content_ref 指向 artifact 或未来的内嵌内容引用。
 */
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { conversations } from './conversations';
import { orchestrationRuns } from './orchestration-runs';
import { workspaces } from './workspaces';

export const messages = sqliteTable(
  'messages',
  {
    messageId: text('message_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.conversationId, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    orchestrationRunId: text('orchestration_run_id').references(
      () => orchestrationRuns.orchestrationRunId,
      { onDelete: 'set null', onUpdate: 'cascade' },
    ),
    senderType: text('sender_type').notNull(),
    senderId: text('sender_id'),
    visibility: text('visibility').notNull(),
    contentRef: text('content_ref').notNull(),
    createdAt: text('created_at').notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  },
  (t) => ({
    conversationCreatedIdx: index('idx_messages_conversation_created').on(
      t.conversationId,
      t.createdAt,
    ),
    workspaceCreatedIdx: index('idx_messages_workspace_created').on(t.workspaceId, t.createdAt),
    runIdx: index('idx_messages_run').on(t.orchestrationRunId),
  }),
);
