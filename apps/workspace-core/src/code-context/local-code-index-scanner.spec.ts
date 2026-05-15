// SPDX-License-Identifier: Apache-2.0

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { LocalCodeIndexScanner } from './local-code-index-scanner.js';

import type { SourceRoot, SourceRootId, WorkspaceId } from '@cairn/shared-contracts/schemas';

const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('LocalCodeIndexScanner', () => {
  it('builds a privacy-aware file manifest for local directories', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'cairn-code-index-'));
    tempDirectories.push(root);
    mkdirSync(path.join(root, 'src'));
    mkdirSync(path.join(root, 'node_modules', 'left-pad'), { recursive: true });
    writeFileSync(path.join(root, 'src', 'index.ts'), 'export const answer = 42;\n');
    writeFileSync(path.join(root, '.env'), 'TOKEN=secret\n');
    writeFileSync(path.join(root, 'node_modules', 'left-pad', 'index.js'), 'module.exports = 1;\n');
    writeFileSync(path.join(root, 'README.md'), '# Cairn\n');

    const scanner = new LocalCodeIndexScanner();
    const files = await scanner.scan(createSourceRoot(root, ['src/**', 'README.md'], []));

    expect(files).toMatchObject([
      {
        path: 'README.md',
        language: 'markdown',
      },
      {
        path: 'src/index.ts',
        language: 'typescript',
      },
    ]);
    expect(files.map((file) => file.path)).not.toContain('.env');
    expect(files.map((file) => file.path)).not.toContain('node_modules/left-pad/index.js');
    expect(files[0]?.digest.startsWith('sha256:')).toBe(true);
  });

  it('honors user exclude globs', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'cairn-code-index-'));
    tempDirectories.push(root);
    mkdirSync(path.join(root, 'src'));
    writeFileSync(path.join(root, 'src', 'index.ts'), 'export const answer = 42;\n');
    writeFileSync(path.join(root, 'src', 'generated.ts'), 'export const generated = true;\n');

    const scanner = new LocalCodeIndexScanner();
    const files = await scanner.scan(createSourceRoot(root, ['src/**'], ['src/generated.ts']));

    expect(files.map((file) => file.path)).toEqual(['src/index.ts']);
  });
});

const createSourceRoot = (
  root: string,
  includeGlobs: string[],
  excludeGlobs: string[],
): SourceRoot => ({
  sourceRootId: '01HZZZZZZZZZZZZZZZZZZZZZC0' as SourceRootId,
  workspaceId: '01HZZZZZZZZZZZZZZZZZZZZZW0' as WorkspaceId,
  kind: 'local_directory',
  displayName: 'Temp',
  uri: pathToFileURL(root).toString(),
  status: 'active',
  includeGlobs,
  excludeGlobs,
  createdAt: '2026-05-15T01:00:00.000Z',
  updatedAt: '2026-05-15T01:00:00.000Z',
});
