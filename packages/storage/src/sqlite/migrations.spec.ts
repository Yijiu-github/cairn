// SPDX-License-Identifier: Apache-2.0
import { existsSync } from 'node:fs';

import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { workspaces } from '@cairn/domain/schema';

import { openSqliteStorage } from './connection.js';
import { getDomainMigrationsFolder, runSqliteMigrations } from './migrations.js';

describe('SQLite migrations', () => {
  it('finds the domain Drizzle migrations folder', () => {
    expect(existsSync(getDomainMigrationsFolder())).toBe(true);
  });

  it.skipIf(!isNativeSqliteAvailable())(
    'runs domain migrations against an in-memory database',
    () => {
      const storage = openSqliteStorage({ databasePath: ':memory:' });

      try {
        runSqliteMigrations(storage.db);

        const tableNames = storage.client
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
          .all()
          .map((row) => (row as { name: string }).name);

        expect(tableNames).toContain('workspaces');
        expect(tableNames).toContain('trace_events');
        expect(storage.db.select({ total: count() }).from(workspaces).get()?.total).toBe(0);
      } finally {
        storage.close();
      }
    },
  );

  it.skipIf(!isNativeSqliteAvailable())('keeps domain migrations idempotent', () => {
    const storage = openSqliteStorage({ databasePath: ':memory:' });

    try {
      runSqliteMigrations(storage.db);
      expect(() => {
        runSqliteMigrations(storage.db);
      }).not.toThrow();
    } finally {
      storage.close();
    }
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
