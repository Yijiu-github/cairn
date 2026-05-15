// SPDX-License-Identifier: Apache-2.0
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

describe('SQLite persistence schema', () => {
  test('generated migrations define the core collaboration tables', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const drizzleDir = path.join(here, '../../drizzle');
    const sqlFiles = readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));
    expect(sqlFiles.length).toBeGreaterThan(0);
    const sql = sqlFiles
      .map((file) => readFileSync(path.join(drizzleDir, file), 'utf8'))
      .join('\n');
    expect(sql).toMatch(/PRAGMA foreign_keys\s*=\s*OFF/i);
    expect(sql).toMatch(/PRAGMA foreign_keys\s*=\s*ON/i);
    expect(sql).toContain('CREATE TABLE `workspaces`');
    expect(sql).toContain('CREATE TABLE `conversations`');
    expect(sql).toContain('CREATE TABLE `events`');
    expect(sql).toContain('CREATE TABLE `messages`');
    expect(sql).toContain('CREATE TABLE `orchestration_runs`');
    expect(sql).toContain('CREATE TABLE `tasks`');
    expect(sql).toContain('CREATE TABLE `agent_runs`');
    expect(sql).toContain('CREATE TABLE `artifacts`');
    expect(sql).toContain('CREATE TABLE `trace_events`');
    expect(sql).toContain('CREATE TABLE `source_roots`');
    expect(sql).toContain('CREATE TABLE `code_index_snapshots`');
    expect(sql).toContain('CREATE TABLE `context_packs`');
  });
});
