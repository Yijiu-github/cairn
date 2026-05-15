// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { InMemoryApplicationRepository } from '../testing/memory-run-repository.js';

import { CodeContextService } from './code-context-service.js';

import type {
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
  snapshot: '01HZZZZZZZZZZZZZZZZZZZZZS0' as CodeIndexSnapshotId,
  otherSnapshot: '01HZZZZZZZZZZZZZZZZZZZZZS1' as CodeIndexSnapshotId,
  contextPack: '01HZZZZZZZZZZZZZZZZZZZZZP0' as ContextPackId,
  event: '01HZZZZZZZZZZZZZZZZZZZZZE0' as EventId,
  run: '01HZZZZZZZZZZZZZZZZZZZZZR0' as OrchestrationRunId,
  trace: '01HZZZZZZZZZZZZZZZZZZZZZX0' as TraceId,
  task: '01HZZZZZZZZZZZZZZZZZZZZZT0' as TaskId,
};

const createHarness = () => {
  let sourceRootIndex = 0;
  let snapshotIndex = 0;
  const repository = new InMemoryApplicationRepository();
  const service = new CodeContextService({
    repository,
    clock: { now: () => new Date('2026-05-15T01:00:00.000Z') },
    ids: {
      sourceRootId: () => (sourceRootIndex++ === 0 ? ids.sourceRoot : ids.otherSourceRoot),
      codeIndexSnapshotId: () => (snapshotIndex++ === 0 ? ids.snapshot : ids.otherSnapshot),
      contextPackId: () => ids.contextPack,
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
