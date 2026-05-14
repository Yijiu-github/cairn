// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import {
  Conversation,
  ConversationCreate,
  ChannelType,
  ConversationStatus,
} from './conversation.js';

const baseConversation = {
  conversationId: VALID_ULIDS.conversation,
  workspaceId: VALID_ULIDS.workspace,
  channelType: 'default' as const,
  title: 'Release 1 planning',
  status: 'open' as const,
  createdAt: '2026-05-14T01:00:00.000Z',
  updatedAt: '2026-05-14T01:00:00.000Z',
};

describe('Conversation schema', () => {
  it('parses a valid conversation', () => {
    expect(Conversation.safeParse(baseConversation).success).toBe(true);
  });

  it('allows optional title and summary fields to be omitted', () => {
    const { title: _title, ...withoutTitle } = baseConversation;
    expect(Conversation.safeParse(withoutTitle).success).toBe(true);
  });

  it('rejects malformed workspace ids', () => {
    expect(Conversation.safeParse({ ...baseConversation, workspaceId: 'not-a-ulid' }).success).toBe(
      false,
    );
  });
});

describe('ConversationCreate schema', () => {
  it('defaults channelType to default', () => {
    expect(ConversationCreate.parse({}).channelType).toBe('default');
  });
});

describe('Conversation enums', () => {
  it.each(['default', 'task_focused', 'operator_review'])('accepts channel type: %s', (value) => {
    expect(ChannelType.safeParse(value).success).toBe(true);
  });

  it.each(['open', 'archived'])('accepts status: %s', (value) => {
    expect(ConversationStatus.safeParse(value).success).toBe(true);
  });
});
