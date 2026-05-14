// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { defineRuntimeAdapterConformanceSuite } from '../../testing/adapter-conformance.js';
import { createTestAdapterContext, createTestSubmitRequest } from '../../testing/fixtures.js';

import { createMockRuntimeAdapter } from './mock-runtime-adapter.js';

defineRuntimeAdapterConformanceSuite({
  name: 'mock',
  createAdapter: () => createMockRuntimeAdapter({ clock: () => 1_715_654_400_000 }),
});

describe('createMockRuntimeAdapter', () => {
  it('fails unknown streams with normalized input error', async () => {
    const adapter = createMockRuntimeAdapter({ clock: () => 1_715_654_400_000 });
    await adapter.init(createTestAdapterContext());

    const events = [];
    for await (const event of adapter.stream('missing-run')) {
      events.push(event);
    }

    expect(events).toEqual([
      {
        type: 'failed',
        at: 1_715_654_400_000,
        error: {
          code: 'INPUT_INVALID',
          message: 'Unknown run id: missing-run',
          retryable: false,
        },
      },
    ]);
  });

  it('does not cancel an already completed run', async () => {
    const adapter = createMockRuntimeAdapter({ clock: () => 1_715_654_400_000 });
    await adapter.init(createTestAdapterContext());

    const request = createTestSubmitRequest();
    await adapter.submit(request);
    const cancelAck = await adapter.cancel(request.runId, 'operator_cancelled');

    expect(cancelAck).toEqual({
      runId: request.runId,
      cancelled: false,
      reason: 'already_terminal',
    });
  });
});
