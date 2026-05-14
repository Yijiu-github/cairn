// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { openSqliteStorage } from './connection.js';

const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe.skipIf(!isNativeSqliteAvailable())('openSqliteStorage', () => {
  it('opens an in-memory database and applies core pragmas', () => {
    const storage = openSqliteStorage({ databasePath: ':memory:' });

    try {
      expect(storage.client.pragma('foreign_keys', { simple: true })).toBe(1);
      expect(storage.client.pragma('busy_timeout', { simple: true })).toBe(5000);
    } finally {
      storage.close();
    }
  });

  it('creates parent directories for file databases', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-storage-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'nested', 'workspace.sqlite');

    const storage = openSqliteStorage({ databasePath });

    try {
      expect(existsSync(databasePath)).toBe(true);
    } finally {
      storage.close();
    }
  });

  it('rejects an empty database path', () => {
    expect(() => openSqliteStorage({ databasePath: '' })).toThrow('databasePath must not be empty');
  });
});

function isNativeSqliteAvailable(): boolean {
  try {
    const storage = openSqliteStorage({ databasePath: ':memory:' });
    storage.close();
    return true;
  } catch {
    return false;
  }
}
