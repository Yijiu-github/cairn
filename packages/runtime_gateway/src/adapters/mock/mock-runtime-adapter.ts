// SPDX-License-Identifier: Apache-2.0
/**
 * 测试用 RuntimeAdapter。
 *
 * 根因：Gateway / application 在真实 Codex CLI 接入前也需要稳定执行契约。
 * 修复要点：提供完全内存态 adapter，让 conformance suite 先固定生命周期语义。
 */

import { setTimeout as sleep } from 'node:timers/promises';

import { createAdapterError } from '../../runtime-errors.js';

import type {
  AdapterCancelAck,
  AdapterContext,
  AdapterRunSnapshot,
  AdapterRunStatus,
  AdapterSubmitAck,
  AdapterSubmitRequest,
  CapabilityProfile,
  RuntimeAdapter,
} from '../../runtime-adapter.js';
import type { AdapterStreamEvent } from '../../runtime-events.js';
import type { ArtifactRef } from '@cairn/shared-contracts/schemas';

export interface MockRuntimeAdapterOptions {
  id?: string;
  displayName?: string;
  capabilities?: Partial<CapabilityProfile>;
  clock?: () => number;
}

interface MockRunState {
  request: AdapterSubmitRequest;
  status: AdapterRunStatus;
  providerRunId: string;
  events: AdapterStreamEvent[];
  finalArtifactRef?: ArtifactRef;
}

const DEFAULT_MODEL_ID = 'mock-model';

export const createMockRuntimeAdapter = (
  options: MockRuntimeAdapterOptions = {},
): RuntimeAdapter => {
  const clock = options.clock ?? Date.now;
  const runs = new Map<string, MockRunState>();
  let initialized = false;

  const capabilities: CapabilityProfile = {
    streaming: true,
    cancellable: true,
    toolCalling: false,
    midStreamInjection: false,
    idempotent: true,
    supportedArtifactKinds: ['text', 'log'],
    models: [{ id: DEFAULT_MODEL_ID, displayName: 'Mock Model' }],
    ...options.capabilities,
  };

  const ensureInitialized = () => {
    if (!initialized) {
      throw new Error('Mock runtime adapter has not been initialized');
    }
  };

  const adapter: RuntimeAdapter = {
    id: options.id ?? 'mock',
    displayName: options.displayName ?? 'Mock Runtime Adapter',
    capabilities,

    async init(_ctx: AdapterContext) {
      await sleep(0);
      initialized = true;
    },

    async shutdown() {
      await sleep(0);
      initialized = false;
      runs.clear();
    },

    async submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
      await sleep(0);
      ensureInitialized();

      const existing = runs.get(request.runId);
      if (existing !== undefined) {
        return {
          runId: request.runId,
          accepted: true,
          providerRunId: existing.providerRunId,
          idempotentReplay: true,
        };
      }

      const providerRunId = `mock:${request.runId}`;
      const finalArtifactRef = request.inputs[0] ?? { artifactId: `artifact:${request.runId}` };
      const events: AdapterStreamEvent[] = [
        { type: 'queued', at: clock() },
        { type: 'started', at: clock(), providerRunId },
        { type: 'heartbeat', at: clock() },
        { type: 'token', at: clock(), delta: 'mock response' },
        { type: 'succeeded', at: clock(), finalArtifactRef },
      ];

      runs.set(request.runId, {
        request,
        status: 'succeeded',
        providerRunId,
        events,
        finalArtifactRef,
      });

      return { runId: request.runId, accepted: true, providerRunId };
    },

    async *stream(runId: string): AsyncIterable<AdapterStreamEvent> {
      await sleep(0);
      ensureInitialized();

      const run = runs.get(runId);
      if (run === undefined) {
        yield {
          type: 'failed',
          at: clock(),
          error: createAdapterError('INPUT_INVALID', `Unknown run id: ${runId}`, false),
        };
        return;
      }

      for (const event of run.events) {
        yield event;
      }
    },

    async cancel(runId: string, reason?: string): Promise<AdapterCancelAck> {
      await sleep(0);
      ensureInitialized();

      const run = runs.get(runId);
      if (run === undefined) {
        return { runId, cancelled: false, reason: 'unknown_run' };
      }

      if (run.status === 'succeeded' || run.status === 'failed' || run.status === 'timeout') {
        return { runId, cancelled: false, reason: 'already_terminal' };
      }

      run.status = 'cancelled';
      const cancelledEvent: AdapterStreamEvent =
        reason === undefined
          ? { type: 'cancelled', at: clock() }
          : { type: 'cancelled', at: clock(), reason };
      run.events.push(cancelledEvent);

      const ack: AdapterCancelAck = { runId, cancelled: true };
      if (reason !== undefined) {
        ack.reason = reason;
      }
      return ack;
    },

    async query(runId: string): Promise<AdapterRunSnapshot> {
      await sleep(0);
      ensureInitialized();

      const run = runs.get(runId);
      if (run === undefined) {
        return { runId, status: 'unknown' };
      }

      const lastEvent = run.events.at(-1);
      const snapshot: AdapterRunSnapshot = {
        runId,
        status: run.status,
        providerRunId: run.providerRunId,
      };
      if (lastEvent !== undefined) {
        snapshot.lastEventAt = lastEvent.at;
      }
      if (run.finalArtifactRef !== undefined) {
        snapshot.finalArtifactRef = run.finalArtifactRef;
      }
      return snapshot;
    },
  };

  return adapter;
};
