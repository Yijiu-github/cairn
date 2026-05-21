// SPDX-License-Identifier: Apache-2.0

import * as fsPromises from 'node:fs/promises';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

type FsPromisesModule = typeof fsPromises;

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<FsPromisesModule>();

  return {
    ...actual,
    rename: vi.fn(actual.rename),
    writeFile: vi.fn(actual.writeFile),
  };
});

import { LocalArtifactStore } from './local-artifact-store.js';

import type { ArtifactId, OrchestrationRunId, WorkspaceId } from '@cairn/shared-contracts/schemas';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
  vi.clearAllMocks();
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

  it('writes payloads through a same-directory temp file and leaves only the final file', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });
    const writeFileMock = vi.mocked(fsPromises.writeFile);
    const renameMock = vi.mocked(fsPromises.rename);

    const write = await store.writeText({
      artifactId: '01J000000000000000000000A1' as ArtifactId,
      workspaceId: '01J000000000000000000000W1' as WorkspaceId,
      orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
      filename: 'runtime-output.txt',
      mediaType: 'text/plain',
      text: 'atomic hello',
      maxBytes: 1024,
    });

    const relativePath = write.payloadRef.slice('artifact-payload://'.length);
    const absolutePath = path.join(rootDir, relativePath);
    const finalDirectory = path.join(rootDir, path.dirname(relativePath));
    const entries = await readdir(finalDirectory);
    const temporaryPath = writeFileMock.mock.calls.at(-1)?.[0];
    const renameCall = renameMock.mock.calls.at(-1);

    expect(temporaryPath).toEqual(expect.any(String));
    expect(temporaryPath).not.toBe(absolutePath);
    expect(path.dirname(temporaryPath as string)).toBe(finalDirectory);
    expect(renameCall).toEqual([temporaryPath, absolutePath]);
    expect(entries).toEqual(['runtime-output.txt']);
    await expect(store.readText(write.payloadRef)).resolves.toMatchObject({
      text: 'atomic hello',
    });
  });

  it('persists runtime output artifacts atomically for trial inspection', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

    const write = await store.writeText({
      artifactId: '01J000000000000000000000A1' as ArtifactId,
      workspaceId: '01J000000000000000000000W1' as WorkspaceId,
      orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
      filename: 'runtime-output.txt',
      mediaType: 'text/plain',
      text: 'expected output',
      maxBytes: 1024,
    });

    expect(write.payloadRef).toMatch(/^artifact-payload:\/\//u);
    expect(await store.readText(write.payloadRef)).toMatchObject({
      text: 'expected output',
      mediaType: 'text/plain',
    });
  });

  it('removes the temp file when an atomic rename fails', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });
    const renameMock = vi.mocked(fsPromises.rename);
    const rmSpy = vi.spyOn(fsPromises, 'rm');

    renameMock.mockRejectedValueOnce(new Error('rename failed'));

    await expect(
      store.writeText({
        artifactId: '01J000000000000000000000A1' as ArtifactId,
        workspaceId: '01J000000000000000000000W1' as WorkspaceId,
        orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
        filename: 'runtime-output.txt',
        mediaType: 'text/plain',
        text: 'expected output',
        maxBytes: 1024,
      }),
    ).rejects.toThrow('rename failed');

    const temporaryPath = renameMock.mock.calls[0]?.[0];
    expect(temporaryPath).toEqual(expect.any(String));
    expect(rmSpy).toHaveBeenCalledWith(temporaryPath, { force: true });
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

  it('does not mark a payload truncated when its size exactly matches the inline bound', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 3 });

    const write = await store.writeText({
      artifactId: '01J000000000000000000000A1' as ArtifactId,
      workspaceId: '01J000000000000000000000W1' as WorkspaceId,
      orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
      filename: 'runtime-output.txt',
      mediaType: 'text/plain',
      text: 'abc',
      maxBytes: 3,
    });

    await expect(store.readText(write.payloadRef)).resolves.toMatchObject({
      text: 'abc',
      truncated: false,
    });
    expect(write).toMatchObject({
      byteLength: 3,
      truncated: false,
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

  it('rejects absolute-path and empty-segment payload refs', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
    tempDirectories.push(rootDir);
    const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

    await expect(
      store.readText('artifact-payload:///Users/alice/project/output.txt'),
    ).rejects.toThrow('Invalid artifact payload reference.');
    await expect(store.readText('artifact-payload://workspace//artifact/file.txt')).rejects.toThrow(
      'Invalid artifact payload reference.',
    );
  });
});
