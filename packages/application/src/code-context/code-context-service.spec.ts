// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { InMemoryApplicationRepository } from '../testing/memory-run-repository.js';

import { CodeContextService } from './code-context-service.js';

import type {
  CodeIndexFileId,
  CodeIndexSnapshotId,
  ContextPackId,
  EventId,
  OrchestrationRunId,
  SourceRootId,
  TaskId,
  TraceId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

const ids = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0' as WorkspaceId,
  otherWorkspace: '01HZZZZZZZZZZZZZZZZZZZZZW1' as WorkspaceId,
  sourceRoot: '01HZZZZZZZZZZZZZZZZZZZZZC0' as SourceRootId,
  otherSourceRoot: '01HZZZZZZZZZZZZZZZZZZZZZC1' as SourceRootId,
  file: '01HZZZZZZZZZZZZZZZZZZZZZF0' as CodeIndexFileId,
  otherFile: '01HZZZZZZZZZZZZZZZZZZZZZF1' as CodeIndexFileId,
  snapshot: '01HZZZZZZZZZZZZZZZZZZZZZS0' as CodeIndexSnapshotId,
  otherSnapshot: '01HZZZZZZZZZZZZZZZZZZZZZS1' as CodeIndexSnapshotId,
  contextPack: '01HZZZZZZZZZZZZZZZZZZZZZP0' as ContextPackId,
  event: '01HZZZZZZZZZZZZZZZZZZZZZE0' as EventId,
  run: '01HZZZZZZZZZZZZZZZZZZZZZR0' as OrchestrationRunId,
  trace: '01HZZZZZZZZZZZZZZZZZZZZZX0' as TraceId,
  task: '01HZZZZZZZZZZZZZZZZZZZZZT0' as TaskId,
};

const createHarness = () => {
  let fileIndex = 0;
  let sourceRootIndex = 0;
  let snapshotIndex = 0;
  const repository = new InMemoryApplicationRepository();
  const service = new CodeContextService({
    repository,
    clock: { now: () => new Date('2026-05-15T01:00:00.000Z') },
    ids: {
      codeIndexFileId: () => (fileIndex++ === 0 ? ids.file : ids.otherFile),
      sourceRootId: () => (sourceRootIndex++ === 0 ? ids.sourceRoot : ids.otherSourceRoot),
      codeIndexSnapshotId: () => (snapshotIndex++ === 0 ? ids.snapshot : ids.otherSnapshot),
      contextPackId: () => ids.contextPack,
    },
    scanner: {
      scan: () =>
        Promise.resolve([
          {
            path: 'packages/application/src/index.ts',
            sizeBytes: 128,
            mtimeMs: 1_768_000_000_000,
            digest: 'sha256:index',
            language: 'typescript',
          },
        ]),
    },
  });
  return { repository, service };
};

const seedTask = async (repository: InMemoryApplicationRepository): Promise<void> => {
  await repository.createRunGraph({
    run: {
      orchestrationRunId: ids.run,
      workspaceId: ids.workspace,
      originEventId: ids.event,
      status: 'queued',
      executionMode: 'single_worker',
      hasPartialFailures: false,
      resultCompleteness: 'empty',
      completionLevel: 'full',
      traceId: ids.trace,
      createdAt: '2026-05-15T01:00:00.000Z',
      updatedAt: '2026-05-15T01:00:00.000Z',
    },
    tasks: [
      {
        taskId: ids.task,
        workspaceId: ids.workspace,
        orchestrationRunId: ids.run,
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update persistence code.',
        status: 'ready',
        priority: 50,
        attempt: 0,
        idempotencyKey: `${ids.task}:0`,
        dependsOnTaskIds: [],
        contextRefs: [],
        artifactRefs: [],
        createdAt: '2026-05-15T01:00:00.000Z',
        updatedAt: '2026-05-15T01:00:00.000Z',
      },
    ],
  });
};

describe('CodeContextService', () => {
  it('registers a SourceRoot with a pending R1a snapshot', async () => {
    const { repository, service } = createHarness();

    const result = await service.registerSourceRoot({
      workspaceId: ids.workspace,
      sourceRoot: {
        kind: 'local_directory',
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
        includeGlobs: ['packages/**'],
        excludeGlobs: ['node_modules/**'],
      },
    });

    expect(result.sourceRoot).toMatchObject({
      sourceRootId: ids.sourceRoot,
      workspaceId: ids.workspace,
      kind: 'local_directory',
      status: 'active',
    });
    expect(result.initialSnapshot).toMatchObject({
      snapshotId: ids.snapshot,
      status: 'pending',
      indexVersion: 'r1a-manifest-only',
      fileCount: 0,
    });
    await expect(repository.listSourceRootsByWorkspace(ids.workspace)).resolves.toHaveLength(1);
    await expect(
      repository.listCodeIndexSnapshotsBySourceRoot(ids.sourceRoot),
    ).resolves.toHaveLength(1);
  });

  it('lists SourceRoots within one workspace boundary', async () => {
    const { service } = createHarness();

    await service.registerSourceRoot({
      workspaceId: ids.workspace,
      sourceRoot: {
        kind: 'local_directory',
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
        includeGlobs: [],
        excludeGlobs: [],
      },
    });
    await service.registerSourceRoot({
      workspaceId: ids.otherWorkspace,
      sourceRoot: {
        kind: 'local_directory',
        displayName: 'Other',
        uri: 'file:///G:/Code/other',
        includeGlobs: [],
        excludeGlobs: [],
      },
    });

    await expect(service.listSourceRoots({ workspaceId: ids.workspace })).resolves.toMatchObject([
      { sourceRootId: ids.sourceRoot },
    ]);
  });

  it('creates a minimal ContextPack manifest for registered SourceRoots', async () => {
    const { repository, service } = createHarness();
    await seedTask(repository);
    const registered = await service.registerSourceRoot({
      workspaceId: ids.workspace,
      sourceRoot: {
        kind: 'local_directory',
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
        includeGlobs: [],
        excludeGlobs: [],
      },
    });

    const manifest = await service.createContextPack({
      workspaceId: ids.workspace,
      contextPack: {
        sourceRootIds: [registered.sourceRoot.sourceRootId],
        createdFor: {
          type: 'task',
          taskId: ids.task,
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

    expect(manifest).toMatchObject({
      contextPackId: ids.contextPack,
      sourceRootIds: [ids.sourceRoot],
      createdFor: {
        type: 'task',
        taskId: ids.task,
      },
    });
    await expect(repository.getContextPack(ids.contextPack)).resolves.toMatchObject({
      query: 'Find persistence code.',
    });
  });

  it('reindexes a SourceRoot into a ready snapshot with file manifest', async () => {
    const { repository, service } = createHarness();
    await service.registerSourceRoot({
      workspaceId: ids.workspace,
      sourceRoot: {
        kind: 'local_directory',
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
        includeGlobs: [],
        excludeGlobs: [],
      },
    });

    const result = await service.reindexSourceRoot({ sourceRootId: ids.sourceRoot });

    expect(result.sourceRoot).toMatchObject({
      sourceRootId: ids.sourceRoot,
      status: 'active',
      lastIndexedAt: '2026-05-15T01:00:00.000Z',
    });
    expect(result.snapshot).toMatchObject({
      snapshotId: ids.otherSnapshot,
      status: 'ready',
      fileCount: 1,
      indexVersion: 'r1b-file-manifest',
    });
    expect(result.files).toMatchObject([
      {
        fileId: ids.file,
        path: 'packages/application/src/index.ts',
        digest: 'sha256:index',
        language: 'typescript',
      },
    ]);

    await expect(repository.getSourceRoot(ids.sourceRoot)).resolves.toMatchObject({
      status: 'active',
    });
  });

  it('returns the latest index snapshot detail', async () => {
    const { service } = createHarness();
    await service.registerSourceRoot({
      workspaceId: ids.workspace,
      sourceRoot: {
        kind: 'local_directory',
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
        includeGlobs: [],
        excludeGlobs: [],
      },
    });
    await service.reindexSourceRoot({ sourceRootId: ids.sourceRoot });

    await expect(
      service.getSourceRootIndex({ sourceRootId: ids.sourceRoot }),
    ).resolves.toMatchObject({
      sourceRoot: {
        sourceRootId: ids.sourceRoot,
      },
      latestSnapshot: {
        snapshotId: ids.otherSnapshot,
        status: 'ready',
      },
      files: [
        {
          path: 'packages/application/src/index.ts',
        },
      ],
    });
  });

  it('searches indexed file metadata within the workspace boundary', async () => {
    const { service } = createHarness();
    await service.registerSourceRoot({
      workspaceId: ids.workspace,
      sourceRoot: {
        kind: 'local_directory',
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
        includeGlobs: [],
        excludeGlobs: [],
      },
    });
    await service.reindexSourceRoot({ sourceRootId: ids.sourceRoot });

    await expect(
      service.searchCodeIndex({
        workspaceId: ids.workspace,
        sourceRootId: ids.sourceRoot,
        pathContains: 'application',
        language: 'typescript',
        limit: 10,
      }),
    ).resolves.toMatchObject({
      items: [
        {
          path: 'packages/application/src/index.ts',
          language: 'typescript',
        },
      ],
    });
    await expect(
      service.searchCodeIndex({
        workspaceId: ids.otherWorkspace,
        sourceRootId: ids.sourceRoot,
        limit: 10,
      }),
    ).rejects.toMatchObject({
      code: 'SOURCE_ROOT_NOT_FOUND',
    });
  });

  it('rejects ContextPacks that reference SourceRoots outside the workspace', async () => {
    const { service } = createHarness();

    await expect(
      service.createContextPack({
        workspaceId: ids.workspace,
        contextPack: {
          sourceRootIds: [ids.sourceRoot],
          createdFor: {
            type: 'task',
            taskId: ids.task,
          },
          query: 'Find persistence code.',
          items: [],
        },
      }),
    ).rejects.toMatchObject({
      code: 'SOURCE_ROOT_NOT_FOUND',
    });
  });
});
