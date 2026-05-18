// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import {
  TraceFrame,
  TraceStreamClosed,
  TraceStreamEvent,
  TraceStreamReady,
} from './trace-events.js';

const traceEventSample = {
  traceEventId: VALID_ULIDS.traceEvent,
  workspaceId: VALID_ULIDS.workspace,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  taskId: VALID_ULIDS.task,
  runId: VALID_ULIDS.agentRun,
  eventType: 'agent_run.token',
  level: 'info',
  payloadInline: { delta: 'hello' },
  createdAt: '2026-05-18T09:00:00.000Z',
  traceId: VALID_ULIDS.traceId,
} as const;

describe('trace-events ws schema', () => {
  it('accepts ready/event/closed frames', () => {
    expect(
      TraceStreamReady.safeParse({
        type: 'trace.ready',
        runId: VALID_ULIDS.orchestrationRun,
        fromSeq: 0,
      }).success,
    ).toBe(true);

    expect(
      TraceStreamEvent.safeParse({
        type: 'trace.event',
        event: traceEventSample,
        seq: 1,
      }).success,
    ).toBe(true);

    expect(
      TraceStreamClosed.safeParse({ type: 'trace.closed', reason: 'run_completed' }).success,
    ).toBe(true);
  });

  it('rejects invalid runId in ready frame', () => {
    expect(
      TraceStreamReady.safeParse({
        type: 'trace.ready',
        runId: 'not-a-ulid',
        fromSeq: 0,
      }).success,
    ).toBe(false);
  });

  it('rejects unknown frame type via TraceFrame union', () => {
    expect(
      TraceFrame.safeParse({
        type: 'trace.unknown',
      }).success,
    ).toBe(false);
  });
});
