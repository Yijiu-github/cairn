// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  CodeIndexFile,
  CodeIndexReindexResult,
  CodeSearchQuery,
  CodeSearchResult,
  ContextPackCreate,
  ContextPackFromCodeSearchCreate,
  ContextPackManifest,
  SourceRoot,
  SourceRootCreate,
} from './code-context.js';

const ids = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0',
  sourceRoot: '01HZZZZZZZZZZZZZZZZZZZZZC0',
  snapshot: '01HZZZZZZZZZZZZZZZZZZZZZS0',
  file: '01HZZZZZZZZZZZZZZZZZZZZZF0',
  contextPack: '01HZZZZZZZZZZZZZZZZZZZZZP0',
  task: '01HZZZZZZZZZZZZZZZZZZZZZT0',
};

describe('code context schemas', () => {
  it('defaults SourceRootCreate to local directory with empty globs', () => {
    expect(
      SourceRootCreate.parse({
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
      }),
    ).toEqual({
      kind: 'local_directory',
      displayName: 'Cairn',
      uri: 'file:///G:/Code/cairn',
      includeGlobs: [],
      excludeGlobs: [],
    });
  });

  it('validates a persisted SourceRoot', () => {
    expect(
      SourceRoot.parse({
        sourceRootId: ids.sourceRoot,
        workspaceId: ids.workspace,
        kind: 'local_directory',
        displayName: 'Cairn',
        uri: 'file:///G:/Code/cairn',
        status: 'active',
        includeGlobs: [],
        excludeGlobs: ['node_modules/**'],
        createdAt: '2026-05-15T01:00:00.000Z',
        updatedAt: '2026-05-15T01:00:00.000Z',
      }),
    ).toMatchObject({
      sourceRootId: ids.sourceRoot,
      status: 'active',
    });
  });

  it('validates a lightweight indexed file record', () => {
    expect(
      CodeIndexFile.parse({
        fileId: ids.file,
        snapshotId: ids.snapshot,
        sourceRootId: ids.sourceRoot,
        workspaceId: ids.workspace,
        path: 'packages/application/src/index.ts',
        sizeBytes: 128,
        mtimeMs: 1_768_000_000_000,
        digest: 'sha256:abc',
        language: 'typescript',
        createdAt: '2026-05-15T01:00:00.000Z',
      }),
    ).toMatchObject({
      fileId: ids.file,
      ignored: false,
      language: 'typescript',
    });
  });

  it('validates reindex results with snapshot and file manifest', () => {
    expect(
      CodeIndexReindexResult.parse({
        sourceRoot: {
          sourceRootId: ids.sourceRoot,
          workspaceId: ids.workspace,
          kind: 'local_directory',
          displayName: 'Cairn',
          uri: 'file:///G:/Code/cairn',
          status: 'active',
          includeGlobs: [],
          excludeGlobs: ['node_modules/**'],
          createdAt: '2026-05-15T01:00:00.000Z',
          updatedAt: '2026-05-15T01:00:00.000Z',
          lastIndexedAt: '2026-05-15T01:00:01.000Z',
        },
        snapshot: {
          snapshotId: ids.snapshot,
          sourceRootId: ids.sourceRoot,
          workspaceId: ids.workspace,
          status: 'ready',
          indexVersion: 'r1b-file-manifest',
          fileCount: 1,
          createdAt: '2026-05-15T01:00:01.000Z',
        },
        files: [
          {
            fileId: ids.file,
            snapshotId: ids.snapshot,
            sourceRootId: ids.sourceRoot,
            workspaceId: ids.workspace,
            path: 'README.md',
            sizeBytes: 12,
            mtimeMs: 1_768_000_000_000,
            digest: 'sha256:def',
            createdAt: '2026-05-15T01:00:01.000Z',
          },
        ],
      }),
    ).toMatchObject({
      snapshot: {
        status: 'ready',
        fileCount: 1,
      },
    });
  });

  it('validates metadata-only code search query and result', () => {
    expect(
      CodeSearchQuery.parse({
        workspaceId: ids.workspace,
        sourceRootId: ids.sourceRoot,
        pathContains: 'application',
        language: 'typescript',
        limit: '20',
      }),
    ).toEqual({
      workspaceId: ids.workspace,
      sourceRootId: ids.sourceRoot,
      pathContains: 'application',
      language: 'typescript',
      limit: 20,
    });

    expect(
      CodeSearchResult.parse({
        items: [
          {
            fileId: ids.file,
            snapshotId: ids.snapshot,
            sourceRootId: ids.sourceRoot,
            workspaceId: ids.workspace,
            path: 'packages/application/src/index.ts',
            sizeBytes: 128,
            mtimeMs: 1_768_000_000_000,
            digest: 'sha256:abc',
            language: 'typescript',
            createdAt: '2026-05-15T01:00:00.000Z',
          },
        ],
      }),
    ).toMatchObject({
      items: [
        {
          path: 'packages/application/src/index.ts',
        },
      ],
    });
  });

  it('validates a minimal ContextPack manifest', () => {
    expect(
      ContextPackManifest.parse({
        contextPackId: ids.contextPack,
        workspaceId: ids.workspace,
        sourceRootIds: [ids.sourceRoot],
        createdFor: {
          type: 'task',
          taskId: ids.task,
        },
        query: 'Find persistence code.',
        items: [
          {
            kind: 'user_note',
            reason: 'R1a supports explicit notes before scanner output exists.',
            confidence: 'extracted',
          },
        ],
        createdAt: '2026-05-15T01:00:00.000Z',
      }),
    ).toMatchObject({
      contextPackId: ids.contextPack,
      sourceRootIds: [ids.sourceRoot],
    });
  });

  it('defaults ContextPackCreate optional arrays', () => {
    expect(
      ContextPackCreate.parse({
        createdFor: {
          type: 'task',
          taskId: ids.task,
        },
        query: 'Summarize context.',
      }),
    ).toMatchObject({
      sourceRootIds: [],
      items: [],
    });
  });

  it('defaults ContextPackFromCodeSearchCreate search options', () => {
    expect(
      ContextPackFromCodeSearchCreate.parse({
        createdFor: {
          type: 'task',
          taskId: ids.task,
        },
        query: 'Find application code.',
      }),
    ).toMatchObject({
      query: 'Find application code.',
      search: {
        limit: 50,
      },
    });
  });
});
