// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from 'vitest';

import { OrchestrationRunId, EventId, TraceId, WorkspaceId } from '@cairn/shared-contracts';

import { loadRunReplaySource } from './run-replay-loader.js';

import type { RunReplaySource } from '@cairn/shared-contracts';

describe('loadRunReplaySource', () => {
  it('does not call the desktop bridge when the run id is blank', async () => {
    const requestState = { current: 0 };
    const getRunReplaySource = vi.fn();
    const getStatus = vi.fn();
    const setRunReplayError = vi.fn();
    const setRunReplayLoading = vi.fn();
    const setRunReplaySource = vi.fn();
    const setWorkspaceCoreStatus = vi.fn();

    await loadRunReplaySource(
      requestState,
      {
        getRunReplaySource,
        getStatus,
        setRunReplayError,
        setRunReplayLoading,
        setRunReplaySource,
        setWorkspaceCoreStatus,
        toErrorMessage: (error: unknown) =>
          error instanceof Error ? error.message : 'Unknown desktop bridge error.',
      },
      '   ',
      { replaceCurrentSource: true },
    );

    expect(getRunReplaySource).not.toHaveBeenCalled();
    expect(getStatus).not.toHaveBeenCalled();
    expect(setRunReplaySource).toHaveBeenCalledWith(undefined);
    expect(setRunReplayError).toHaveBeenCalledWith('Enter a Workspace Core run id to observe.');
    expect(setRunReplayLoading).not.toHaveBeenCalled();
    expect(setWorkspaceCoreStatus).not.toHaveBeenCalled();
  });

  it('clears stale replay source before loading a replacement run', async () => {
    const requestState = { current: 0 };
    const runFreshId = '01HZZZZZZZZZZZZZZZZZZZZZR0';
    let resolveReplay: ((value: RunReplaySource) => void) | undefined;
    const setRunReplaySource = vi.fn();
    const setWorkspaceCoreStatus = vi.fn();
    const loadedReplaySource = createReplaySource(runFreshId);

    const loadPromise = loadRunReplaySource(
      requestState,
      {
        getRunReplaySource: vi.fn(
          () =>
            new Promise<RunReplaySource>((resolve) => {
              resolveReplay = resolve;
            }),
        ),
        getStatus: vi.fn(() => Promise.resolve({ state: 'healthy' as const })),
        setRunReplayError: vi.fn(),
        setRunReplayLoading: vi.fn(),
        setRunReplaySource,
        setWorkspaceCoreStatus,
        toErrorMessage: (error: unknown) =>
          error instanceof Error ? error.message : 'Unknown desktop bridge error.',
      },
      runFreshId,
      { replaceCurrentSource: true },
    );

    expect(setRunReplaySource).toHaveBeenCalledWith(undefined);
    expect(resolveReplay).toBeDefined();

    resolveReplay?.(loadedReplaySource);
    await loadPromise;

    expect(setRunReplaySource).toHaveBeenLastCalledWith(loadedReplaySource);
    expect(setWorkspaceCoreStatus).toHaveBeenLastCalledWith({ state: 'healthy' });
  });

  it('keeps only the latest replay source when requests resolve out of order', async () => {
    const requestState = { current: 0 };
    const firstRunId = '01HZZZZZZZZZZZZZZZZZZZZZQ0';
    const secondRunId = '01HZZZZZZZZZZZZZZZZZZZZZP0';
    const firstReplaySource = createReplaySource(firstRunId);
    const secondReplaySource = createReplaySource(secondRunId);
    let resolveFirst: ((value: RunReplaySource) => void) | undefined;
    let resolveSecond: ((value: RunReplaySource) => void) | undefined;
    const getStatus = vi.fn(() => Promise.resolve({ state: 'healthy' as const }));
    const setRunReplaySource = vi.fn();
    const setRunReplayLoading = vi.fn();
    const setRunReplayError = vi.fn();
    const setWorkspaceCoreStatus = vi.fn();

    const firstLoad = loadRunReplaySource(
      requestState,
      {
        getRunReplaySource: vi.fn(
          () =>
            new Promise<RunReplaySource>((resolve) => {
              resolveFirst = resolve;
            }),
        ),
        getStatus,
        setRunReplayError,
        setRunReplayLoading,
        setRunReplaySource,
        setWorkspaceCoreStatus,
        toErrorMessage: (error: unknown) =>
          error instanceof Error ? error.message : 'Unknown desktop bridge error.',
      },
      firstRunId,
    );

    const secondLoad = loadRunReplaySource(
      requestState,
      {
        getRunReplaySource: vi.fn(
          () =>
            new Promise<RunReplaySource>((resolve) => {
              resolveSecond = resolve;
            }),
        ),
        getStatus,
        setRunReplayError,
        setRunReplayLoading,
        setRunReplaySource,
        setWorkspaceCoreStatus,
        toErrorMessage: (error: unknown) =>
          error instanceof Error ? error.message : 'Unknown desktop bridge error.',
      },
      secondRunId,
    );

    expect(setRunReplayLoading).toHaveBeenCalledTimes(2);

    resolveSecond?.(secondReplaySource);
    await secondLoad;
    expect(setRunReplaySource).toHaveBeenLastCalledWith(secondReplaySource);
    expect(setWorkspaceCoreStatus).toHaveBeenLastCalledWith({ state: 'healthy' });

    resolveFirst?.(firstReplaySource);
    await firstLoad;
    expect(setRunReplaySource).toHaveBeenLastCalledWith(secondReplaySource);
    expect(setWorkspaceCoreStatus).toHaveBeenLastCalledWith({ state: 'healthy' });
    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(setRunReplayLoading.mock.calls).toEqual([[true], [true], [false]]);
  });

  it('does not write workspace status when a request becomes stale while refreshing status', async () => {
    const requestState = { current: 0 };
    const firstRunId = '01HZZZZZZZZZZZZZZZZZZZZZQ0';
    const secondRunId = '01HZZZZZZZZZZZZZZZZZZZZZP0';
    const firstReplaySource = createReplaySource(firstRunId);
    const secondReplaySource = createReplaySource(secondRunId);
    let resolveFirstStatus: ((value: { readonly state: 'stale' }) => void) | undefined;
    const setRunReplaySource = vi.fn();
    const setWorkspaceCoreStatus = vi.fn();
    const setRunReplayLoading = vi.fn();

    const firstLoad = loadRunReplaySource(
      requestState,
      {
        getRunReplaySource: vi.fn(() => Promise.resolve(firstReplaySource)),
        getStatus: vi.fn(
          () =>
            new Promise<{ readonly state: 'stale' }>((resolve) => {
              resolveFirstStatus = resolve;
            }),
        ),
        setRunReplayError: vi.fn(),
        setRunReplayLoading,
        setRunReplaySource,
        setWorkspaceCoreStatus,
        toErrorMessage: (error: unknown) =>
          error instanceof Error ? error.message : 'Unknown desktop bridge error.',
      },
      firstRunId,
    );
    await Promise.resolve();

    await loadRunReplaySource(
      requestState,
      {
        getRunReplaySource: vi.fn(() => Promise.resolve(secondReplaySource)),
        getStatus: vi.fn(() => Promise.resolve({ state: 'fresh' as const })),
        setRunReplayError: vi.fn(),
        setRunReplayLoading,
        setRunReplaySource,
        setWorkspaceCoreStatus,
        toErrorMessage: (error: unknown) =>
          error instanceof Error ? error.message : 'Unknown desktop bridge error.',
      },
      secondRunId,
    );

    resolveFirstStatus?.({ state: 'stale' });
    await firstLoad;

    expect(setRunReplaySource).toHaveBeenLastCalledWith(secondReplaySource);
    expect(setWorkspaceCoreStatus).toHaveBeenCalledTimes(1);
    expect(setWorkspaceCoreStatus).toHaveBeenLastCalledWith({ state: 'fresh' });
    expect(setRunReplayLoading.mock.calls).toEqual([[true], [true], [false]]);
  });
});

function createReplaySource(runId: string): RunReplaySource {
  return {
    agentRuns: [],
    artifacts: [],
    inspector: {
      agentRunCount: 0,
      artifactCount: 0,
      completedAt: undefined,
      durationMs: undefined,
      errorEventCount: 0,
      finalArtifactId: undefined,
      firstFailureEventId: undefined,
      firstFailureEventType: undefined,
      startedAt: undefined,
      status: 'running',
      taskCount: 0,
      traceEventCount: 0,
      warningEventCount: 0,
    },
    run: {
      completionLevel: 'full',
      createdAt: '2026-05-21T00:00:00.000Z',
      executionMode: 'single_worker',
      hasPartialFailures: false,
      orchestrationRunId: OrchestrationRunId.parse(
        runId === 'run-fresh'
          ? '01HZZZZZZZZZZZZZZZZZZZZZR0'
          : runId === 'run-first'
            ? '01HZZZZZZZZZZZZZZZZZZZZZQ0'
            : '01HZZZZZZZZZZZZZZZZZZZZZP0',
      ),
      originEventId: EventId.parse('01HZZZZZZZZZZZZZZZZZZZZZE0'),
      resultCompleteness: 'complete',
      status: 'running',
      traceId: TraceId.parse('01HZZZZZZZZZZZZZZZZZZZZZX0'),
      updatedAt: '2026-05-21T00:00:00.000Z',
      workspaceId: WorkspaceId.parse('01HZZZZZZZZZZZZZZZZZZZZZW0'),
    },
    tasks: [],
    traceEvents: [],
  };
}
