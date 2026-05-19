// SPDX-License-Identifier: Apache-2.0

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { LocalArtifactStore } from './local-artifact-store.js';

import type { ArtifactId, OrchestrationRunId, WorkspaceId } from '@cairn/shared-contracts/schemas';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('LocalArtifactStore', () => {
  it('writes and reads bounded text through an opaque payloadRef', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

    const write = await store.writeText({
      artifactId: '01J000000000000000000000A1' as ArtifactId,
      workspaceId: '01J000000000000000000000W1' as WorkspaceId,
      orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
      filename: 'runtime-output.txt',
      mediaType: 'text/plain',
      text: 'hello',
      maxBytes: 1024,
    });

    expect(write).toMatchObject({
      payloadRef: expect.stringMatching(/^artifact-payload:\/\//u),
      byteLength: 5,
      truncated: false,
    });
    await expect(readFile(write.payloadRef, 'utf8')).rejects.toThrow();
    await expect(store.readText(write.payloadRef)).resolves.toMatchObject({
      mediaType: 'text/plain',
      text: 'hello',
      truncated: false,
    });
  });

  it('truncates text using the stricter explicit write bound', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

    const write = await store.writeText({
      artifactId: '01J000000000000000000000A1' as ArtifactId,
      workspaceId: '01J000000000000000000000W1' as WorkspaceId,
      orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
      filename: 'runtime-output.txt',
      mediaType: 'text/plain',
      text: 'abcdef',
      maxBytes: 3,
    });

    await expect(store.readText(write.payloadRef)).resolves.toMatchObject({
      text: 'abc',
    });
    expect(write).toMatchObject({
      byteLength: 3,
      truncated: true,
    });
  });

  it('does not split multibyte UTF-8 characters while truncating', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

    const write = await store.writeText({
      artifactId: '01J000000000000000000000A1' as ArtifactId,
      workspaceId: '01J000000000000000000000W1' as WorkspaceId,
      orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
      filename: 'runtime-output.txt',
      mediaType: 'text/plain',
      text: '你a',
      maxBytes: 1,
    });

    await expect(store.readText(write.payloadRef)).resolves.toMatchObject({ text: '' });
    expect(write).toMatchObject({ byteLength: 0, truncated: true });
  });

  it('rejects dot segment payload refs', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

    await expect(
      store.readText(
        'artifact-payload://01J000000000000000000000W1/../01J000000000000000000000A1/file.txt',
      ),
    ).rejects.toThrow('Invalid artifact payload reference.');
  });
});
