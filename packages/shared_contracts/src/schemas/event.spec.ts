// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { Event, EventCreate, EventSourceType } from './event.js';

const baseEvent = {
  eventId: VALID_ULIDS.event,
  workspaceId: VALID_ULIDS.workspace,
  sourceType: 'user' as const,
  conversationId: VALID_ULIDS.conversation,
  actorId: 'operator-1',
  actorRole: 'user' as const,
  text: 'Please inspect this repo.',
  createdAt: '2026-05-14T01:00:00.000Z',
};

describe('Event schema', () => {
  it('parses a valid event and defaults attachments', () => {
    const parsed = Event.parse(baseEvent);
    expect(parsed.attachments).toEqual([]);
  });

  it('allows system events without a conversation', () => {
    const { conversationId: _conversationId, ...systemEvent } = baseEvent;
    expect(
      Event.safeParse({
        ...systemEvent,
        sourceType: 'system',
        actorRole: 'system',
      }).success,
    ).toBe(true);
  });

  it('rejects unknown source types', () => {
    expect(Event.safeParse({ ...baseEvent, sourceType: 'pipeline' }).success).toBe(false);
  });
});

describe('EventCreate schema', () => {
  it('defaults to user source and actor role', () => {
    const parsed = EventCreate.parse({ text: 'hello' });
    expect(parsed.sourceType).toBe('user');
    expect(parsed.actorRole).toBe('user');
    expect(parsed.attachments).toEqual([]);
  });
});

describe('EventSourceType enum', () => {
  it.each(['user', 'system', 'webhook', 'schedule'])('accepts source type: %s', (value) => {
    expect(EventSourceType.safeParse(value).success).toBe(true);
  });
});
