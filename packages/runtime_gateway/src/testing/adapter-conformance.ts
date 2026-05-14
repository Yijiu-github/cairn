// SPDX-License-Identifier: Apache-2.0
/**
 * RuntimeAdapter 契约测试套件。
 *
 * 新 adapter 实现后先跑这组测试，避免不同 runtime 在生命周期语义上悄悄分叉。
 */

import { describe, expect, it } from 'vitest';

import { isAdapterTerminalEvent } from '../runtime-events.js';

import { createTestAdapterContext, createTestSubmitRequest } from './fixtures.js';

import type { RuntimeAdapter } from '../runtime-adapter.js';

export interface RuntimeAdapterConformanceOptions {
  name: string;
  createAdapter: () => RuntimeAdapter;
}

export const defineRuntimeAdapterConformanceSuite = (options: RuntimeAdapterConformanceOptions) => {
  describe(`${options.name} RuntimeAdapter conformance`, () => {
    it('initializes, accepts a run, streams a terminal event, and supports query', async () => {
      const adapter = options.createAdapter();
      await adapter.init(createTestAdapterContext());

      const request = createTestSubmitRequest();
      const ack = await adapter.submit(request);

      expect(ack).toMatchObject({ runId: request.runId, accepted: true });

      const events = [];
      for await (const event of adapter.stream(request.runId)) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((event) => isAdapterTerminalEvent(event))).toBe(true);

      const snapshot = await adapter.query(request.runId);
      expect(snapshot.runId).toBe(request.runId);
      expect(snapshot.status).not.toBe('unknown');

      await adapter.shutdown();
    });

    it('returns idempotent replay ack when the same run is submitted twice', async () => {
      const adapter = options.createAdapter();
      await adapter.init(createTestAdapterContext());

      const request = createTestSubmitRequest();
      await adapter.submit(request);
      const replayAck = await adapter.submit(request);

      expect(replayAck).toMatchObject({
        runId: request.runId,
        accepted: true,
        idempotentReplay: true,
      });

      await adapter.shutdown();
    });
  });
};
