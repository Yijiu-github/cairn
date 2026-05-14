// SPDX-License-Identifier: Apache-2.0
/**
 * Event：一次外部输入，如用户消息、系统触发或 webhook。
 *
 * 参考：docs/design/domain-model.md §3
 */

import { z } from 'zod';

import { ActorRole, Iso8601 } from './common.js';
import { ConversationId, EventId, WorkspaceId } from './ids.js';

export const EventSourceType = z.enum(['user', 'system', 'webhook', 'schedule']);
export type EventSourceType = z.infer<typeof EventSourceType>;

export const Event = z.object({
  eventId: EventId,
  workspaceId: WorkspaceId,
  sourceType: EventSourceType,
  conversationId: ConversationId.optional(),
  actorId: z.string().optional(),
  actorRole: ActorRole,
  text: z.string().optional(),
  attachments: z.array(z.record(z.unknown())).default([]),
  createdAt: Iso8601,
  metadata: z.record(z.unknown()).optional(),
});
export type Event = z.infer<typeof Event>;

export const EventCreate = z.object({
  sourceType: EventSourceType.default('user'),
  conversationId: ConversationId.optional(),
  actorId: z.string().optional(),
  actorRole: ActorRole.default('user'),
  text: z.string().optional(),
  attachments: z.array(z.record(z.unknown())).default([]),
  metadata: z.record(z.unknown()).optional(),
});
export type EventCreate = z.infer<typeof EventCreate>;
