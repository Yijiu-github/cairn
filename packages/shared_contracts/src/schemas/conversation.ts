// SPDX-License-Identifier: Apache-2.0
/**
 * Conversation：对话单位。一个 Workspace 下可有多个 Conversation。
 *
 * 参考：docs/design/domain-model.md §4
 */

import { z } from 'zod';

import { ConversationId, WorkspaceId, ArtifactId } from './ids.js';
import { Iso8601 } from './common.js';

export const ChannelType = z.enum(['default', 'task_focused', 'operator_review']);
export type ChannelType = z.infer<typeof ChannelType>;

export const ConversationStatus = z.enum(['open', 'archived']);
export type ConversationStatus = z.infer<typeof ConversationStatus>;

export const Conversation = z.object({
  conversationId: ConversationId,
  workspaceId: WorkspaceId,
  channelType: ChannelType,
  title: z.string().max(200).optional(),
  status: ConversationStatus,
  summaryRef: ArtifactId.optional(),
  latestMessageAt: Iso8601.optional(),
  createdAt: Iso8601,
  updatedAt: Iso8601,
});
export type Conversation = z.infer<typeof Conversation>;

export const ConversationCreate = z.object({
  channelType: ChannelType.default('default'),
  title: z.string().max(200).optional(),
});
export type ConversationCreate = z.infer<typeof ConversationCreate>;
