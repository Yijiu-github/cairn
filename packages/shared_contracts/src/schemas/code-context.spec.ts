// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  ContextPackCreate,
  ContextPackManifest,
  SourceRoot,
  SourceRootCreate,
} from './code-context.js';

const ids = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0',
  sourceRoot: '01HZZZZZZZZZZZZZZZZZZZZZC0',
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
});
