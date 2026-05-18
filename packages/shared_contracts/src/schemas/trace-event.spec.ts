// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { TraceEvent, TraceLevel } from './trace-event.js';

const baseTraceEvent = {
  traceEventId: VALID_ULIDS.traceEvent,
  workspaceId: VALID_ULIDS.workspace,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  taskId: VALID_ULIDS.task,
  runId: VALID_ULIDS.agentRun,
  eventType: 'task.dispatched',
  level: 'info' as const,
  createdAt: '2026-05-18T01:00:00.000Z',
  traceId: VALID_ULIDS.traceId,
};

describe('TraceLevel enum', () => {
  it('contains exactly debug/info/warn/error', () => {
    expect(TraceLevel.options).toEqual(['debug', 'info', 'warn', 'error']);
  });

  it('rejects unknown levels', () => {
    expect(TraceLevel.safeParse('fatal').success).toBe(false);
  });
});

describe('TraceEvent payload boundary', () => {
  it('accepts payloadRef only', () => {
    expect(
      TraceEvent.safeParse({
        ...baseTraceEvent,
        payloadRef: VALID_ULIDS.artifact,
      }).success,
    ).toBe(true);
  });

  it('accepts payloadInline only', () => {
    expect(
      TraceEvent.safeParse({
        ...baseTraceEvent,
        payloadInline: { reason: 'lease_expired' },
      }).success,
    ).toBe(true);
  });

  it('accepts neither payloadRef nor payloadInline', () => {
    expect(TraceEvent.safeParse(baseTraceEvent).success).toBe(true);
  });

  it('rejects payloadRef and payloadInline together', () => {
    expect(
      TraceEvent.safeParse({
        ...baseTraceEvent,
        payloadRef: VALID_ULIDS.artifact,
        payloadInline: { duplicated: true },
      }).success,
    ).toBe(false);
  });
});
