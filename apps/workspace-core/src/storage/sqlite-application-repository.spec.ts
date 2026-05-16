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
  OrchestrationRunId,
  PlanningOutputId,
  SourceRootId,
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
});

function openRepository(databasePath: string): {
  container: WorkspaceCoreContainer;
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
    ),
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
