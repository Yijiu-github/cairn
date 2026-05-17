// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import {
  OrchestrationRun,
  OrchestrationRunStatus,
  ExecutionMode,
  ORCHESTRATION_RUN_TERMINAL_STATUSES,
} from './orchestration-run.js';

const fullRun = {
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  workspaceId: VALID_ULIDS.workspace,
  conversationId: VALID_ULIDS.conversation,
  originEventId: VALID_ULIDS.event,
  status: 'running' as const,
  executionMode: 'multi_worker' as const,
  hasPartialFailures: false,
  resultCompleteness: 'complete' as const,
  completionLevel: 'full' as const,
  traceId: VALID_ULIDS.traceId,
  createdAt: '2026-05-14T01:00:00.000Z',
  updatedAt: '2026-05-14T01:00:00.000Z',
};

const validPlanningOutputId = '01HZZZZZZZZZZZZZZZZZZZZZY0';

describe('OrchestrationRunStatus enum', () => {
  it('contains the 9 documented statuses', () => {
    const expected = [
      'queued',
      'planning',
      'running',
      'synthesizing',
      'paused',
      'succeeded',
      'failed',
      'cancelled',
      'timeout',
    ] satisfies (typeof OrchestrationRunStatus._type)[];
    for (const s of expected) {
      expect(OrchestrationRunStatus.safeParse(s).success).toBe(true);
    }
    expect(OrchestrationRunStatus.options).toHaveLength(expected.length);
  });

  it('rejects undocumented statuses', () => {
    expect(OrchestrationRunStatus.safeParse('partial').success).toBe(false);
    expect(OrchestrationRunStatus.safeParse('').success).toBe(false);
  });
});

describe('ORCHESTRATION_RUN_TERMINAL_STATUSES', () => {
  it('contains exactly the 4 terminal states', () => {
    expect(ORCHESTRATION_RUN_TERMINAL_STATUSES).toEqual([
      'succeeded',
      'failed',
      'cancelled',
      'timeout',
    ]);
  });

  it('terminal states are all valid OrchestrationRunStatus values', () => {
    for (const s of ORCHESTRATION_RUN_TERMINAL_STATUSES) {
      expect(OrchestrationRunStatus.safeParse(s).success).toBe(true);
    }
  });
});

describe('ExecutionMode enum', () => {
  it('contains R1 documented modes (no deliberation / meeting / committee yet)', () => {
    const r1Modes = ['direct_answer', 'single_worker', 'multi_worker'];
    for (const m of r1Modes) {
      expect(ExecutionMode.safeParse(m).success).toBe(true);
    }
    // Future modes must remain rejected until ADR introduces them
    expect(ExecutionMode.safeParse('deliberation').success).toBe(false);
    expect(ExecutionMode.safeParse('meeting').success).toBe(false);
    expect(ExecutionMode.safeParse('committee').success).toBe(false);
  });
});

describe('OrchestrationRun', () => {
  it('parses a fully populated valid run', () => {
    expect(OrchestrationRun.safeParse(fullRun).success).toBe(true);
  });

  it('allows optional ref / timestamp / error fields to be omitted', () => {
    expect(OrchestrationRun.safeParse({ ...fullRun }).success).toBe(true);
  });

  it('accepts plannerOutputRef as a PlanningOutputId', () => {
    expect(
      OrchestrationRun.safeParse({
        ...fullRun,
        plannerOutputRef: validPlanningOutputId,
      }).success,
    ).toBe(true);
  });

  it('rejects when required field is missing', () => {
    const { traceId: _omit, ...withoutTrace } = fullRun;
    expect(OrchestrationRun.safeParse(withoutTrace).success).toBe(false);
  });

  it('rejects when status is not in enum', () => {
    expect(OrchestrationRun.safeParse({ ...fullRun, status: 'planet' }).success).toBe(false);
  });

  it('rejects an obviously malformed traceId', () => {
    expect(OrchestrationRun.safeParse({ ...fullRun, traceId: 'not-a-ulid' }).success).toBe(false);
  });
});
