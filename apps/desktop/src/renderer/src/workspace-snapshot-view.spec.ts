// SPDX-License-Identifier: Apache-2.0
import { expect, it } from 'vitest';

import {
  mapWorkspaceArtifactsToArtifactCards,
  mapWorkspaceRunsToRunCards,
  mapWorkspaceTasksToTaskTree,
  mapWorkspaceTraceToEvidence,
} from './workspace-snapshot-view.js';

import type { WorkspaceCoreReadSnapshot } from '../../shared/workspace-core-data.js';

const snapshot = {
  connection: {
    detail: 'Workspace Core sidecar is connected.',
    mode: 'development',
    state: 'connected',
    updatedAt: '2026-05-18T12:00:00.000Z',
  },
  runs: [
    {
      runId: '01J000000000000000000000R0',
      status: 'succeeded',
      executionMode: 'single_worker',
      hasPartialFailures: false,
      resultCompleteness: 'complete',
      completionLevel: 'final',
      createdAt: '2026-05-18T12:00:00.000Z',
      updatedAt: '2026-05-18T12:03:00.000Z',
    },
  ],
  sourceRoots: [],
  selectedRun: {
    runId: '01J000000000000000000000R0',
    status: 'succeeded',
    executionMode: 'single_worker',
    hasPartialFailures: false,
    resultCompleteness: 'complete',
    completionLevel: 'final',
    createdAt: '2026-05-18T12:00:00.000Z',
    updatedAt: '2026-05-18T12:03:00.000Z',
    tasks: [
      {
        taskId: '01J000000000000000000000T0',
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update the target module.',
        status: 'succeeded',
        attempt: 2,
        dependsOnTaskIds: [],
        artifactRefs: ['01J000000000000000000000A0'],
        createdAt: '2026-05-18T12:00:00.000Z',
        updatedAt: '2026-05-18T12:02:00.000Z',
      },
    ],
    artifacts: [
      {
        artifactId: '01J000000000000000000000A0',
        label: 'output patch',
        artifactRole: 'output',
        kind: 'patch',
        contentType: 'text/plain',
        sizeBytes: 128,
        sensitivity: 'local_path',
        storage: 'redacted',
        createdAt: '2026-05-18T12:02:00.000Z',
      },
    ],
    trace: [
      {
        traceEventId: '01J000000000000000000000E0',
        eventType: 'run.succeeded',
        level: 'info',
        payloadSummary: 'payload keys: result',
        createdAt: '2026-05-18T12:03:00.000Z',
        traceId: '01J000000000000000000000Z0',
      },
    ],
  },
  updatedAt: '2026-05-18T12:03:00.000Z',
} satisfies WorkspaceCoreReadSnapshot;

it('maps workspace runs into run cards', () => {
  expect(mapWorkspaceRunsToRunCards(snapshot.runs)).toEqual([
    expect.objectContaining({
      runId: '01J000000000000000000000R0',
      status: 'completed',
      title: 'Workspace run',
    }),
  ]);
});

it('maps workspace tasks into task tree items', () => {
  expect(mapWorkspaceTasksToTaskTree(snapshot.selectedRun.tasks)).toEqual([
    expect.objectContaining({
      attempt: 2,
      id: '01J000000000000000000000T0',
      label: 'Apply patch',
      status: 'completed',
    }),
  ]);
});

it('maps workspace artifacts into redacted artifact cards', () => {
  const cards = mapWorkspaceArtifactsToArtifactCards(snapshot.selectedRun.artifacts);
  const serialized = JSON.stringify(cards);

  expect(cards).toEqual([
    expect.objectContaining({
      artifactId: '01J000000000000000000000A0',
      kind: 'patch',
      pathDisplayMode: 'hidden',
      reviewState: 'pending_review',
      sensitivity: 'local_path',
      title: 'output patch',
    }),
  ]);
  expect(serialized).not.toContain('/Users/');
  expect(serialized).not.toContain('artifact-payload://');
});

it('maps trace events into evidence timeline items without raw payload values', () => {
  expect(mapWorkspaceTraceToEvidence(snapshot.selectedRun.trace)).toEqual([
    expect.objectContaining({
      id: '01J000000000000000000000E0',
      metadata: 'payload keys: result',
      title: 'run.succeeded',
      tone: 'info',
    }),
  ]);
});
