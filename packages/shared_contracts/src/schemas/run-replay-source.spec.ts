// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { RunReplayInspector, RunReplaySource } from './run-replay-source.js';

const ids = {
  workspace: VALID_ULIDS.workspace,
  orchestrationRun: VALID_ULIDS.orchestrationRun,
  originEvent: VALID_ULIDS.event,
  task: VALID_ULIDS.task,
  agentRun: VALID_ULIDS.agentRun,
  artifact: VALID_ULIDS.artifact,
  traceEvent: VALID_ULIDS.traceEvent,
  traceId: VALID_ULIDS.traceId,
};

const timestamps = {
  createdAt: '2026-05-20T01:00:00.000Z',
  startedAt: '2026-05-20T01:01:00.000Z',
  completedAt: '2026-05-20T01:02:00.000Z',
};

const run = {
  orchestrationRunId: ids.orchestrationRun,
  workspaceId: ids.workspace,
  originEventId: ids.originEvent,
  status: 'failed' as const,
  executionMode: 'single_worker' as const,
  hasPartialFailures: true,
  resultCompleteness: 'partial' as const,
  completionLevel: 'failed' as const,
  startedAt: timestamps.startedAt,
  finishedAt: timestamps.completedAt,
  traceId: ids.traceId,
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.completedAt,
};

const task = {
  taskId: ids.task,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.orchestrationRun,
  taskKind: 'custom' as const,
  title: 'Add replay source contract',
  brief: 'Define the shared contract shape for replay reconstruction.',
  status: 'failed' as const,
  attempt: 1,
  idempotencyKey: 'task-replay-source-1',
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.completedAt,
};

const agentRun = {
  runId: ids.agentRun,
  workspaceId: ids.workspace,
  taskId: ids.task,
  orchestrationRunId: ids.orchestrationRun,
  runtimeType: 'codex',
  status: 'failed' as const,
  attempt: 1,
  retryable: true,
  cancelable: false,
  outputRef: ids.artifact,
  traceId: ids.traceId,
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.completedAt,
};

const artifact = {
  artifactId: ids.artifact,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.orchestrationRun,
  taskId: ids.task,
  runId: ids.agentRun,
  artifactRole: 'output' as const,
  kind: 'text' as const,
  formatVersion: 'text.v1',
  uriOrPath: 'artifact-payload://run-replay-source/output',
  producerType: 'agent' as const,
  producerId: ids.agentRun,
  visibility: 'public' as const,
  createdAt: timestamps.completedAt,
};

const traceEvent = {
  traceEventId: ids.traceEvent,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.orchestrationRun,
  taskId: ids.task,
  runId: ids.agentRun,
  eventType: 'task.failed',
  level: 'error' as const,
  payloadInline: { message: 'Task failed during replay source contract test.' },
  createdAt: timestamps.completedAt,
  traceId: ids.traceId,
};

describe('RunReplayInspector', () => {
  it('parses counters and first failure metadata for a replay source', () => {
    expect(
      RunReplayInspector.parse({
        status: 'failed',
        taskCount: 1,
        agentRunCount: 1,
        artifactCount: 1,
        traceEventCount: 1,
        errorEventCount: 1,
        warningEventCount: 0,
        finalArtifactId: ids.artifact,
        firstFailureEventId: ids.traceEvent,
        firstFailureEventType: 'task.failed',
        startedAt: timestamps.startedAt,
        completedAt: timestamps.completedAt,
        durationMs: 60_000,
      }),
    ).toMatchObject({
      status: 'failed',
      taskCount: 1,
      agentRunCount: 1,
      artifactCount: 1,
      traceEventCount: 1,
      errorEventCount: 1,
      warningEventCount: 0,
      firstFailureEventType: 'task.failed',
    });
  });
});

describe('RunReplaySource', () => {
  it('parses a run with its replay source collections and inspector summary', () => {
    const parsed = RunReplaySource.parse({
      run,
      tasks: [task],
      agentRuns: [agentRun],
      artifacts: [artifact],
      traceEvents: [traceEvent],
      inspector: {
        status: 'failed',
        taskCount: 1,
        agentRunCount: 1,
        artifactCount: 1,
        traceEventCount: 1,
        errorEventCount: 1,
        warningEventCount: 0,
        finalArtifactId: ids.artifact,
        firstFailureEventId: ids.traceEvent,
        firstFailureEventType: 'task.failed',
        startedAt: timestamps.startedAt,
        completedAt: timestamps.completedAt,
        durationMs: 60_000,
      },
    });

    expect(parsed.traceEvents[0]?.eventType).toBe('task.failed');
  });

  it('accepts a Desktop-consumable replay source without artifact payload bodies', () => {
    const parsed = RunReplaySource.parse({
      run,
      tasks: [task],
      agentRuns: [agentRun],
      artifacts: [
        {
          ...artifact,
          payloadRef: 'artifact-payload://workspace/run/artifact/runtime-output.txt',
        },
      ],
      traceEvents: [traceEvent],
      inspector: {
        status: 'failed',
        taskCount: 1,
        agentRunCount: 1,
        artifactCount: 1,
        traceEventCount: 1,
        errorEventCount: 1,
        warningEventCount: 0,
      },
    });

    expect(parsed.run.orchestrationRunId).toBe(ids.orchestrationRun);
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.traceEvents).toHaveLength(1);
    expect(
      parsed.artifacts.every(
        (replayArtifact) =>
          replayArtifact.payloadRef === undefined || typeof replayArtifact.payloadRef === 'string',
      ),
    ).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain('payloadBody');
  });
});
