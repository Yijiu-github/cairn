// SPDX-License-Identifier: Apache-2.0
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

describe('SQLite persistence schema', () => {
  test('generated migration defines five core tables', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const drizzleDir = path.join(here, '../../drizzle');
    const sqlFiles = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql'));
    expect(sqlFiles.length).toBeGreaterThan(0);
    const firstSql = sqlFiles[0];
    if (firstSql === undefined) {
      throw new Error('expected migration .sql under drizzle/');
    }
    const sql = readFileSync(path.join(drizzleDir, firstSql), 'utf8');
    expect(sql).toContain('PRAGMA foreign_keys = OFF');
    expect(sql).toContain('PRAGMA foreign_keys = ON');
    expect(sql).toContain('CREATE TABLE `workspaces`');
    expect(sql).toContain('CREATE TABLE `orchestration_runs`');
    expect(sql).toContain('CREATE TABLE `tasks`');
    expect(sql).toContain('CREATE TABLE `agent_runs`');
    expect(sql).toContain('CREATE TABLE `artifacts`');
  });
});
