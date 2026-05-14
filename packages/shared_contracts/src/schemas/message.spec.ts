// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { Message, MessageCreate } from './message.js';

const baseMessage = {
  messageId: VALID_ULIDS.message,
  workspaceId: VALID_ULIDS.workspace,
  conversationId: VALID_ULIDS.conversation,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  senderType: 'human' as const,
  visibility: 'public' as const,
  contentRef: VALID_ULIDS.artifact,
  createdAt: '2026-05-14T01:00:00.000Z',
};

describe('Message schema', () => {
  it('parses a valid message', () => {
    expect(Message.safeParse(baseMessage).success).toBe(true);
  });

  it('requires contentRef to be non-empty', () => {
    expect(Message.safeParse({ ...baseMessage, contentRef: '' }).success).toBe(false);
  });

  it('allows messages not tied to a run', () => {
    const { orchestrationRunId: _runId, ...withoutRun } = baseMessage;
    expect(Message.safeParse(withoutRun).success).toBe(true);
  });
});

describe('MessageCreate schema', () => {
  it('defaults visibility to public', () => {
    const parsed = MessageCreate.parse({
      conversationId: VALID_ULIDS.conversation,
      senderType: 'human',
      contentRef: VALID_ULIDS.artifact,
    });
    expect(parsed.visibility).toBe('public');
  });
});
