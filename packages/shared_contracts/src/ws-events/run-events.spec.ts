// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { RunEvent, safeParseRunEvent } from './run-events.js';

import type { PlanningOutputId } from '../schemas/ids.js';

const baseEnvelope = {
  runId: VALID_ULIDS.orchestrationRun,
  traceId: VALID_ULIDS.traceId,
  at: '2026-05-14T01:00:00.000Z',
  seq: 0,
};

const validPlanningOutputId = '01HZZZZZZZZZZZZZZZZZZZZZY0';

const samples = {
  'run.status_changed': {
    ...baseEnvelope,
    type: 'run.status_changed',
    status: 'running',
  },
  'run.planner_output': {
    ...baseEnvelope,
    type: 'run.planner_output',
    plannerOutputRef: validPlanningOutputId,
  },
  'run.synthesis_output': {
    ...baseEnvelope,
    type: 'run.synthesis_output',
    synthesisOutputRef: VALID_ULIDS.artifact,
  },
  'run.succeeded': {
    ...baseEnvelope,
    type: 'run.succeeded',
    finalResponseRef: VALID_ULIDS.artifact,
    resultCompleteness: 'complete',
    completionLevel: 'full',
  },
  'run.failed': {
    ...baseEnvelope,
    type: 'run.failed',
    error: {
      layer: 'orchestration',
      code: 'PLANNER_FAILED',
      message: 'planner returned empty plan',
      retryable: false,
    },
  },
  'run.cancelled': {
    ...baseEnvelope,
    type: 'run.cancelled',
    reason: 'user cancelled',
  },
  'run.timed_out': { ...baseEnvelope, type: 'run.timed_out' },
  'run.paused': { ...baseEnvelope, type: 'run.paused', reason: 'operator paused' },
  'run.resumed': { ...baseEnvelope, type: 'run.resumed' },
  'task.status_changed': {
    ...baseEnvelope,
    type: 'task.status_changed',
    taskId: VALID_ULIDS.task,
    status: 'running',
    attempt: 0,
  },
  'task.failed': {
    ...baseEnvelope,
    type: 'task.failed',
    taskId: VALID_ULIDS.task,
    attempt: 1,
    error: {
      layer: 'task',
      code: 'DEPENDENCY_FAILED',
      message: 'upstream task failed',
      retryable: false,
    },
  },
  'agent_run.status_changed': {
    ...baseEnvelope,
    type: 'agent_run.status_changed',
    agentRunId: VALID_ULIDS.agentRun,
    taskId: VALID_ULIDS.task,
    status: 'running',
    attempt: 0,
  },
  'agent_run.token': {
    ...baseEnvelope,
    type: 'agent_run.token',
    agentRunId: VALID_ULIDS.agentRun,
    delta: 'Hello, ',
  },
  'agent_run.artifact': {
    ...baseEnvelope,
    type: 'agent_run.artifact',
    agentRunId: VALID_ULIDS.agentRun,
    artifactId: VALID_ULIDS.artifact,
  },
  'agent_run.heartbeat': {
    ...baseEnvelope,
    type: 'agent_run.heartbeat',
    agentRunId: VALID_ULIDS.agentRun,
  },
  'agent_run.lost': {
    ...baseEnvelope,
    type: 'agent_run.lost',
    agentRunId: VALID_ULIDS.agentRun,
    reason: 'lease_expired',
  },
  'operator.note_injected': {
    ...baseEnvelope,
    type: 'operator.note_injected',
    messageId: 'msg-1',
    visibility: 'operator_only',
  },
} as const;

describe('RunEvent discriminated union', () => {
  it('covers all 17 documented event variants', () => {
    expect(Object.keys(samples)).toHaveLength(17);
  });

  it.each(Object.entries(samples))('parses sample for %s', (_type, sample) => {
    const result = RunEvent.safeParse(sample);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('types run.planner_output plannerOutputRef as PlanningOutputId', () => {
    const result = RunEvent.parse(samples['run.planner_output']);
    if (result.type !== 'run.planner_output') {
      throw new Error('expected planner output event');
    }

    const plannerOutputRef: PlanningOutputId = result.plannerOutputRef;
    expect(plannerOutputRef).toBe(validPlanningOutputId);
  });

  it('rejects unknown event types', () => {
    expect(RunEvent.safeParse({ ...baseEnvelope, type: 'run.exploded' }).success).toBe(false);
  });

  it('rejects missing required envelope fields', () => {
    const { traceId: _t, ...broken } = samples['run.status_changed'];
    expect(RunEvent.safeParse(broken).success).toBe(false);
  });

  it('rejects negative seq', () => {
    expect(
      RunEvent.safeParse({
        ...samples['run.status_changed'],
        seq: -1,
      }).success,
    ).toBe(false);
  });
});

describe('safeParseRunEvent helper', () => {
  it('returns the parsed event on success', () => {
    const event = safeParseRunEvent(samples['run.succeeded']);
    expect(event).toBeDefined();
    expect(event?.type).toBe('run.succeeded');
  });

  it('returns undefined on unknown payloads (UI fallback path)', () => {
    expect(safeParseRunEvent({ what: 'is this' })).toBeUndefined();
    expect(safeParseRunEvent(null)).toBeUndefined();
    expect(safeParseRunEvent(undefined)).toBeUndefined();
  });

  it('returns undefined for an unknown type but well-shaped envelope', () => {
    expect(safeParseRunEvent({ ...baseEnvelope, type: 'run.future_event' })).toBeUndefined();
  });
});
