// SPDX-License-Identifier: Apache-2.0
/**
 * Message：Conversation 内的一条消息。
 *
 * 参考：docs/design/domain-model.md §5
 */

import { z } from 'zod';

import { Iso8601, SenderType, Visibility } from './common.js';
import { ConversationId, MessageId, OrchestrationRunId, WorkspaceId } from './ids.js';

export const Message = z.object({
  messageId: MessageId,
  workspaceId: WorkspaceId,
  conversationId: ConversationId,
  orchestrationRunId: OrchestrationRunId.optional(),
  senderType: SenderType,
  senderId: z.string().optional(),
  visibility: Visibility,
  contentRef: z.string().min(1),
  createdAt: Iso8601,
  metadata: z.record(z.unknown()).optional(),
});
export type Message = z.infer<typeof Message>;

export const MessageCreate = z.object({
  conversationId: ConversationId,
  orchestrationRunId: OrchestrationRunId.optional(),
  senderType: SenderType,
  senderId: z.string().optional(),
  visibility: Visibility.default('public'),
  contentRef: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});
export type MessageCreate = z.infer<typeof MessageCreate>;
