// SPDX-License-Identifier: Apache-2.0
/**
 * Conversation 表定义。
 *
 * 对齐：`@cairn/shared-contracts/schemas/conversation`、domain-model.md §4
 */
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { workspaces } from './workspaces';

export const conversations = sqliteTable(
  'conversations',
  {
    conversationId: text('conversation_id').primaryKey().notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    channelType: text('channel_type').notNull(),
    title: text('title'),
    status: text('status').notNull(),
    summaryRef: text('summary_ref'),
    latestMessageAt: text('latest_message_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    workspaceStatusIdx: index('idx_conversations_workspace_status').on(t.workspaceId, t.status),
    workspaceLatestIdx: index('idx_conversations_workspace_latest').on(
      t.workspaceId,
      t.latestMessageAt,
    ),
  }),
);
