// SPDX-License-Identifier: Apache-2.0
/**
 * Workspace 表定义。
 *
 * 字段与枚举对齐：`@cairn/shared-contracts/schemas` 与 docs/design/domain-model.md §2
 */
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const workspaces = sqliteTable(
  'workspaces',
  {
    workspaceId: text('workspace_id').primaryKey().notNull(),
    workspaceType: text('workspace_type').notNull(),
    deploymentMode: text('deployment_mode').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull(),
    defaultRuntimeProfile: text('default_runtime_profile'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  },
  (t) => ({
    typeStatusIdx: index('idx_workspaces_type_status').on(t.workspaceType, t.status),
  }),
);
