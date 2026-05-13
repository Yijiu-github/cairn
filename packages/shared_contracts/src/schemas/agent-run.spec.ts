// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  AgentRun,
  AgentRunStatus,
  AGENT_RUN_TERMINAL_STATUSES,
} from './agent-run.js';
import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

const baseAgentRun = {
  runId: VALID_ULIDS.agentRun,
  workspaceId: VALID_ULIDS.workspace,
  taskId: VALID_ULIDS.task,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  runtimeType: 'codex',
  status: 'running' as const,
  attempt: 0,
  retryable: true,
  cancelable: true,
  traceId: VALID_ULIDS.traceId,
  createdAt: '2026-05-14T01:00:00.000Z',
  updatedAt: '2026-05-14T01:00:00.000Z',
};

describe('AgentRun schema', () => {
  it('parses a minimum valid agent run', () => {
    expect(AgentRun.safeParse(baseAgentRun).success).toBe(true);
  });

  it('allows heartbeat fields to be omitted', () => {
    const parsed = AgentRun.parse(baseAgentRun);
    expect(parsed.heartbeatAt).toBeUndefined();
    expect(parsed.leaseOwner).toBeUndefined();
    expect(parsed.leaseExpiresAt).toBeUndefined();
  });

  it('accepts heartbeat fields when provided', () => {
    const parsed = AgentRun.parse({
      ...baseAgentRun,
      heartbeatAt: '2026-05-14T01:00:15.000Z',
      leaseOwner: 'sidecar-pid-1234',
      leaseExpiresAt: '2026-05-14T01:01:15.000Z',
    });
    expect(parsed.heartbeatAt).toBe('2026-05-14T01:00:15.000Z');
    expect(parsed.leaseOwner).toBe('sidecar-pid-1234');
  });

  it('requires runtimeType to be non-empty', () => {
    expect(
      AgentRun.safeParse({ ...baseAgentRun, runtimeType: '' }).success,
    ).toBe(false);
  });

  it('requires both retryable and cancelable as booleans', () => {
    const { retryable: _r, ...withoutRetryable } = baseAgentRun;
    expect(AgentRun.safeParse(withoutRetryable).success).toBe(false);
  });
});

describe('AgentRunStatus enum', () => {
  it.each([
    'submitted',
    'queued',
    'running',
    'succeeded',
    'failed',
    'cancelled',
    'timeout',
    'lost',
  ])('accepts: %s', (s) => {
    expect(AgentRunStatus.safeParse(s).success).toBe(true);
  });

  it('rejects undocumented statuses', () => {
    expect(AgentRunStatus.safeParse('aborted').success).toBe(false);
  });
});

describe('AGENT_RUN_TERMINAL_STATUSES', () => {
  it('contains exactly 5 terminal states (including lost)', () => {
    expect(AGENT_RUN_TERMINAL_STATUSES).toEqual([
      'succeeded',
      'failed',
      'cancelled',
      'timeout',
      'lost',
    ]);
  });
});
