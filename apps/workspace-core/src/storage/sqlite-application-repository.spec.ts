// SPDX-License-Identifier: Apache-2.0

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { openSqliteStorage } from '@cairn/storage/sqlite';

import { MockRuntimeGatewayPort } from '../runtime/mock-runtime-gateway-port.js';
import { createWorkspaceCoreContainer } from '../service/container.js';

import { SqliteApplicationRepository } from './sqlite-application-repository.js';

import type { WorkspaceCoreContainer } from '../service/container.js';
import type { CodeContextScannerPort } from '@cairn/application';
import type {
  ContextPackId,
  EventId,
  ArtifactId,
  OrchestrationRunId,
  PlanningOutputId,
  SourceRootId,
  TraceEventId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

const ids = {
  workspace: '01J000000000000000000000W1' as WorkspaceId,
  event: '01J000000000000000000000E1' as EventId,
};

const tempDirectories: string[] = [];

const scanner: CodeContextScannerPort = {
  scan: () =>
    Promise.resolve([
      {
        path: 'packages/application/src/index.ts',
        sizeBytes: 128,
        mtimeMs: 1_768_000_000_000,
        digest: 'sha256:index',
        language: 'typescript',
      },
      {
        path: 'README.md',
        sizeBytes: 256,
        mtimeMs: 1_768_000_000_001,
        digest: 'sha256:readme',
        language: 'markdown',
      },
    ]),
};

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe.skipIf(!isNativeSqliteAvailable())('SqliteApplicationRepository', () => {
  it('persists run graph records across repository instances', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    let createdRunId: OrchestrationRunId;

    const first = openRepository(databasePath);

    try {
      const created = await first.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Persist task',
          brief: 'Verify SQLite persistence.',
        },
      });
      createdRunId = created.run.orchestrationRunId;

      expect(await first.container.repository.getRun(createdRunId)).toMatchObject({
        orchestrationRunId: created.run.orchestrationRunId,
        status: 'queued',
      });
    } finally {
      first.close();
    }

    const second = openRepository(databasePath);

    try {
      expect(await second.container.repository.getRun(createdRunId)).toMatchObject({
        orchestrationRunId: createdRunId,
        status: 'queued',
      });

      const tasks = await second.container.repository.listTasksByRun(createdRunId);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        title: 'Persist task',
        status: 'ready',
      });
    } finally {
      second.close();
    }
  });

  it('submits runtime work with prompt artifacts using SQLite foreign keys', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');

    const repository = openRepository(databasePath);

    try {
      const created = await repository.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Runtime submit',
          brief: 'Verify runtime input artifacts keep SQLite referential integrity.',
        },
      });

      const submitted = await repository.container.orchestrationRuns.submitTaskToRuntime({
        taskId: created.task.taskId,
        runtimeType: 'codex',
        model: 'default',
        prompt: 'Say hello.',
      });

      await expect(
        repository.container.repository.getAgentRun(submitted.agentRun.runId),
      ).resolves.toMatchObject({
        runId: submitted.agentRun.runId,
        inputRef: expect.any(String) as unknown,
      });
      await expect(
        repository.container.repository.listArtifactsByRun(created.run.orchestrationRunId),
      ).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            artifactRole: 'input',
            runId: submitted.agentRun.runId,
          }),
        ]),
      );

      await expect(
        repository.container.orchestrationRuns.drainAgentRunRuntime({
          agentRunId: submitted.agentRun.runId,
        }),
      ).resolves.toMatchObject({
        agentRunId: submitted.agentRun.runId,
      });
      await expect(
        repository.container.repository.getRun(created.run.orchestrationRunId),
      ).resolves.toMatchObject({
        status: 'succeeded',
        finalResponseRef: expect.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/) as unknown,
      });
    } finally {
      repository.close();
    }
  });

  it('persists SourceRoots and ContextPack manifests across repository instances', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    let sourceRootId: SourceRootId;
    let contextPackId: ContextPackId;

    const first = openRepository(databasePath);

    try {
      const created = await first.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Apply patch',
          brief: 'Update the target module.',
        },
      });
      const registered = await first.container.codeContext.registerSourceRoot({
        workspaceId: ids.workspace,
        sourceRoot: {
          kind: 'local_directory',
          displayName: 'Cairn',
          uri: 'file:///G:/Code/cairn',
          includeGlobs: [],
          excludeGlobs: ['node_modules/**'],
        },
      });
      sourceRootId = registered.sourceRoot.sourceRootId;
      const reindexed = await first.container.codeContext.reindexSourceRoot({ sourceRootId });
      expect(reindexed.snapshot).toMatchObject({
        status: 'ready',
        fileCount: 2,
      });

      const manifest = await first.container.codeContext.createContextPack({
        workspaceId: ids.workspace,
        contextPack: {
          sourceRootIds: [sourceRootId],
          createdFor: {
            type: 'task',
            taskId: created.task.taskId,
          },
          query: 'Find persistence code.',
          items: [
            {
              kind: 'user_note',
              reason: 'Operator selected this repo before scanner output exists.',
            },
          ],
        },
      });
      contextPackId = manifest.contextPackId;
    } finally {
      first.close();
    }

    const second = openRepository(databasePath);

    try {
      await expect(
        second.container.repository.listSourceRootsByWorkspace(ids.workspace),
      ).resolves.toMatchObject([
        {
          sourceRootId,
          displayName: 'Cairn',
          status: 'active',
        },
      ]);

      const snapshots =
        await second.container.repository.listCodeIndexSnapshotsBySourceRoot(sourceRootId);
      const latestSnapshot = snapshots.find((snapshot) => snapshot.status === 'ready');
      expect(latestSnapshot).toMatchObject({
        fileCount: 2,
      });
      if (latestSnapshot === undefined) {
        throw new Error('Expected ready snapshot');
      }
      await expect(
        second.container.repository.listCodeIndexFilesBySnapshot(latestSnapshot.snapshotId),
      ).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'packages/application/src/index.ts',
            language: 'typescript',
          }),
        ]),
      );
      await expect(
        second.container.repository.searchCodeIndexFiles({
          workspaceId: ids.workspace,
          sourceRootId,
          pathContains: 'application',
          language: 'typescript',
          limit: 10,
        }),
      ).resolves.toMatchObject([
        {
          path: 'packages/application/src/index.ts',
          language: 'typescript',
        },
      ]);

      await expect(
        second.container.repository.getContextPack(contextPackId),
      ).resolves.toMatchObject({
        contextPackId,
        sourceRootIds: [sourceRootId],
        query: 'Find persistence code.',
      });
    } finally {
      second.close();
    }
  });

  it('persists PlanningOutput records across repository instances', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    const planningOutputId = '01J000000000000000000000P1' as PlanningOutputId;
    let createdRunId: OrchestrationRunId;

    const first = openRepository(databasePath);

    try {
      const created = await first.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Plan persistence',
          brief: 'Verify planning output persistence.',
        },
      });

      createdRunId = created.run.orchestrationRunId;

      await first.container.repository.createPlanningOutput({
        planningOutputId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        status: 'ready',
        actionTree: [
          {
            actionId: 'action-1',
            title: 'Inspect repository',
            intent: 'Confirm planning output rows persist.',
            status: 'ready',
            dependsOnActionIds: [],
          },
        ],
        preconditions: [],
        contextPackRefs: [],
        createdAt: '2026-05-17T00:00:00.000Z',
        updatedAt: '2026-05-17T00:00:00.000Z',
      });
    } finally {
      first.close();
    }

    const second = openRepository(databasePath);

    try {
      await expect(
        second.container.repository.getPlanningOutput(planningOutputId),
      ).resolves.toMatchObject({
        planningOutputId,
        orchestrationRunId: createdRunId,
        status: 'ready',
        actionTree: [
          {
            actionId: 'action-1',
            title: 'Inspect repository',
          },
        ],
      });
      await expect(
        second.container.repository.getPlanningOutputByRun(createdRunId),
      ).resolves.toMatchObject({
        planningOutputId,
        orchestrationRunId: createdRunId,
        status: 'ready',
      });
    } finally {
      second.close();
    }
  });

  it('clears PlanningOutput reasons across repository instances', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    const planningOutputId = '01J000000000000000000000P2' as PlanningOutputId;
    let createdRunId: OrchestrationRunId;

    const first = openRepository(databasePath);

    try {
      const created = await first.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Plan persistence',
          brief: 'Verify planning output reason clearing.',
        },
      });

      createdRunId = created.run.orchestrationRunId;

      await first.container.repository.createPlanningOutput({
        planningOutputId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        status: 'blocked',
        actionTree: [],
        preconditions: [],
        contextPackRefs: [],
        blockedReason: {
          scope: 'run',
          code: 'needs_review',
          message: 'Initial block reason.',
        },
        createdAt: '2026-05-17T00:00:00.000Z',
        updatedAt: '2026-05-17T00:00:00.000Z',
      });
    } finally {
      first.close();
    }

    const second = openRepository(databasePath);

    try {
      await expect(
        second.container.repository.getPlanningOutput(planningOutputId),
      ).resolves.toMatchObject({
        planningOutputId,
        orchestrationRunId: createdRunId,
        blockedReason: {
          code: 'needs_review',
        },
      });
      await expect(
        second.container.repository.getPlanningOutputByRun(createdRunId),
      ).resolves.toMatchObject({
        planningOutputId,
        orchestrationRunId: createdRunId,
        blockedReason: {
          message: 'Initial block reason.',
        },
      });

      await second.container.repository.updatePlanningOutput({
        planningOutputId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        status: 'ready',
        actionTree: [],
        preconditions: [],
        contextPackRefs: [],
        blockedReason: undefined,
        replanReason: undefined,
        createdAt: '2026-05-17T00:00:00.000Z',
        updatedAt: '2026-05-17T01:00:00.000Z',
      });
    } finally {
      second.close();
    }

    const third = openRepository(databasePath);

    try {
      const updatedOutput = await third.container.repository.getPlanningOutput(planningOutputId);
      const updatedOutputByRun =
        await third.container.repository.getPlanningOutputByRun(createdRunId);

      expect(updatedOutput).toMatchObject({
        planningOutputId,
        orchestrationRunId: createdRunId,
        status: 'ready',
      });
      expect(updatedOutputByRun).toMatchObject({
        planningOutputId,
        orchestrationRunId: createdRunId,
        status: 'ready',
      });
      expect(updatedOutput?.blockedReason).toBeUndefined();
      expect(updatedOutput?.replanReason).toBeUndefined();
      expect(updatedOutputByRun?.blockedReason).toBeUndefined();
      expect(updatedOutputByRun?.replanReason).toBeUndefined();
    } finally {
      third.close();
    }
  });

  it('reads Artifact metadata and ordered TraceEvents across repository instances', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    const artifactId = '01J000000000000000000000A1' as ArtifactId;
    let createdRunId: OrchestrationRunId;

    const first = openRepository(databasePath);

    try {
      const created = await first.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Trace persistence',
          brief: 'Verify artifact and trace reads.',
        },
      });
      createdRunId = created.run.orchestrationRunId;

      await first.container.repository.createArtifact({
        artifactId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        taskId: created.task.taskId,
        artifactRole: 'output',
        kind: 'text',
        formatVersion: 'text.v1',
        uriOrPath: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/content.txt`,
        contentType: 'text/plain',
        sizeBytes: 12,
        payloadRef: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/content.txt`,
        sensitivity: 'none',
        producerType: 'agent',
        visibility: 'operator_only',
        createdAt: '2026-05-17T00:00:01.000Z',
      });

      await first.container.repository.appendTraceEvent({
        traceEventId: '01J000000000000000000000T2' as TraceEventId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        eventType: 'run.succeeded',
        level: 'info',
        payloadInline: { artifactId },
        createdAt: '2026-05-17T00:00:02.000Z',
        traceId: created.run.traceId,
      });
      await first.container.repository.appendTraceEvent({
        traceEventId: '01J000000000000000000000T1' as TraceEventId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        eventType: 'run.queued',
        level: 'info',
        payloadInline: { executionMode: 'single_worker' },
        createdAt: '2026-05-17T00:00:00.000Z',
        traceId: created.run.traceId,
      });
    } finally {
      first.close();
    }

    const second = openRepository(databasePath);

    try {
      await expect(second.container.repository.listArtifactsByRun(createdRunId)).resolves.toEqual([
        expect.objectContaining({
          artifactId,
          orchestrationRunId: createdRunId,
          artifactRole: 'output',
          kind: 'text',
          uriOrPath: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/content.txt`,
          payloadRef: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/content.txt`,
          sensitivity: 'none',
        }),
      ]);
      await expect(second.container.repository.getArtifact(artifactId)).resolves.toMatchObject({
        artifactId,
        orchestrationRunId: createdRunId,
        contentType: 'text/plain',
        sizeBytes: 12,
        payloadRef: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/content.txt`,
      });
      const traceEvents = await second.container.repository.listTraceEventsByRun(createdRunId);
      expect(traceEvents.slice(0, 2)).toEqual([
        expect.objectContaining({ eventType: 'run.queued' }),
        expect.objectContaining({ eventType: 'run.succeeded' }),
      ]);
      expect(traceEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'run.queued',
            payloadInline: { executionMode: 'single_worker' },
          }),
        ]),
      );
    } finally {
      second.close();
    }
  });

  it('preserves append order for TraceEvents with identical timestamps', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    let createdRunId: OrchestrationRunId;

    const repository = openRepository(databasePath);

    try {
      const created = await repository.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Trace ordering',
          brief: 'Verify stable trace ordering.',
        },
      });
      createdRunId = created.run.orchestrationRunId;

      for (const [traceEventId, eventType] of [
        ['01J000000000000000000000T3' as TraceEventId, 'agent_run.cancel_requested'],
        ['01J000000000000000000000T1' as TraceEventId, 'agent_run.cancel_acknowledged'],
        ['01J000000000000000000000T2' as TraceEventId, 'run.cancelled'],
      ] as const) {
        await repository.container.repository.appendTraceEvent({
          traceEventId,
          workspaceId: ids.workspace,
          orchestrationRunId: createdRunId,
          eventType,
          level: eventType === 'run.cancelled' ? 'warn' : 'info',
          payloadInline: {},
          createdAt: '2026-05-20T00:00:00.000Z',
          traceId: created.run.traceId,
        });
      }

      const traceEvents = await repository.container.repository.listTraceEventsByRun(createdRunId);

      const cancelEvidence = traceEvents.filter((event) =>
        ['agent_run.cancel_requested', 'agent_run.cancel_acknowledged', 'run.cancelled'].includes(
          event.eventType,
        ),
      );

      expect(cancelEvidence.map((event) => event.eventType)).toEqual([
        'agent_run.cancel_requested',
        'agent_run.cancel_acknowledged',
        'run.cancelled',
      ]);
    } finally {
      repository.close();
    }
  });

  it('updates Artifact metadata across repository instances', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    const artifactId = '01J000000000000000000000A2' as ArtifactId;
    let createdRunId: OrchestrationRunId;

    const first = openRepository(databasePath);

    try {
      const created = await first.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Artifact update',
          brief: 'Verify artifact update persistence.',
        },
      });
      createdRunId = created.run.orchestrationRunId;

      await first.container.repository.createArtifact({
        artifactId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        artifactRole: 'output',
        kind: 'log',
        formatVersion: 'runtime-output.v1',
        uriOrPath: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/runtime-output.txt`,
        contentType: 'text/plain',
        sizeBytes: 3,
        payloadRef: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/runtime-output.txt`,
        sensitivity: 'none',
        producerType: 'agent',
        visibility: 'debug',
        createdAt: '2026-05-17T00:00:01.000Z',
      });
      await first.container.repository.updateArtifact({
        artifactId,
        workspaceId: ids.workspace,
        orchestrationRunId: createdRunId,
        artifactRole: 'output',
        kind: 'log',
        formatVersion: 'runtime-output.v1',
        uriOrPath: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/runtime-output.txt`,
        contentType: 'text/plain',
        sizeBytes: 6,
        payloadRef: `artifact-payload://${ids.workspace}/${createdRunId}/${artifactId}/runtime-output.txt`,
        sensitivity: 'secret_risk',
        producerType: 'agent',
        visibility: 'operator_only',
        createdAt: '2026-05-17T00:00:01.000Z',
      });
    } finally {
      first.close();
    }

    const second = openRepository(databasePath);

    try {
      await expect(second.container.repository.getArtifact(artifactId)).resolves.toMatchObject({
        artifactId,
        sizeBytes: 6,
        sensitivity: 'secret_risk',
        visibility: 'operator_only',
      });
    } finally {
      second.close();
    }
  });
});

function openRepository(databasePath: string): {
  container: WorkspaceCoreContainer;
  storage: ReturnType<typeof openSqliteStorage>;
  close: () => void;
} {
  const storage = openSqliteStorage({ databasePath });
  const repository = new SqliteApplicationRepository(storage.db);
  repository.migrate();
  repository.ensureBootstrapWorkspace({
    workspaceId: ids.workspace,
    originEventId: ids.event,
  });

  return {
    container: createWorkspaceCoreContainer(
      repository,
      new MockRuntimeGatewayPort(),
      undefined,
      scanner,
      undefined,
    ),
    storage,
    close: () => {
      storage.close();
    },
  };
}

function isNativeSqliteAvailable(): boolean {
  try {
    const storage = openSqliteStorage({ databasePath: ':memory:' });
    storage.close();
    return true;
  } catch {
    return false;
  }
}
