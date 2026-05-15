// SPDX-License-Identifier: Apache-2.0
/**
 * SQLite migration runner.
 *
 * 迁移文件由 `@cairn/domain` 的 Drizzle schema 生成；storage 负责在运行时找到
 * 这些 SQL 并执行，后续 PostgreSQL 也会走同一层抽象。
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';

import type { CairnSqliteDatabase } from './connection.js';

export interface SqliteMigrationOptions {
  migrationsFolder?: string;
}

interface PackageJsonShape {
  name?: unknown;
}

interface DrizzleJournalShape {
  entries?: unknown;
}

interface DrizzleJournalEntry {
  tag: string;
  when: number;
}

const DOMAIN_PACKAGE_NAME = '@cairn/domain';
const MIGRATIONS_TABLE = '__drizzle_migrations';

export function runSqliteMigrations(db: CairnSqliteDatabase, options: SqliteMigrationOptions = {}) {
  const migrationsFolder = options.migrationsFolder ?? getDomainMigrationsFolder();
  runDomainSqlMigrations(db, migrationsFolder);
}

export function getDomainMigrationsFolder(): string {
  const domainPackageRoot = resolveDomainPackageRoot();
  const migrationsFolder = path.join(domainPackageRoot, 'drizzle');

  if (!existsSync(migrationsFolder)) {
    throw new Error(`Cannot find Drizzle migrations folder: ${migrationsFolder}`);
  }

  return migrationsFolder;
}

function resolveDomainPackageRoot(): string {
  try {
    const domainEntryUrl = import.meta.resolve(DOMAIN_PACKAGE_NAME);
    const domainEntryPath = fileURLToPath(domainEntryUrl);
    return findPackageRoot(path.dirname(domainEntryPath), DOMAIN_PACKAGE_NAME);
  } catch {
    return findMonorepoPackageRoot(
      path.dirname(fileURLToPath(import.meta.url)),
      DOMAIN_PACKAGE_NAME,
    );
  }
}

function findPackageRoot(startDirectory: string, packageName: string): string {
  let current = startDirectory;

  for (;;) {
    const packageJsonPath = path.join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonShape;
      if (packageJson.name === packageName) {
        return current;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Cannot find package root for ${packageName} from ${startDirectory}`);
    }

    current = parent;
  }
}

function findMonorepoPackageRoot(startDirectory: string, packageName: string): string {
  let current = startDirectory;

  for (;;) {
    const candidate = path.join(current, 'packages', 'domain');
    const packageJsonPath = path.join(candidate, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonShape;
      if (packageJson.name === packageName) {
        return candidate;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(
        `Cannot find monorepo package root for ${packageName} from ${startDirectory}`,
      );
    }

    current = parent;
  }
}

function runDomainSqlMigrations(db: CairnSqliteDatabase, migrationsFolder: string): void {
  ensureMigrationsTable(db);

  const lastAppliedMigration = getLastAppliedMigration(db);

  for (const migration of readMigrationJournal(migrationsFolder)) {
    if (lastAppliedMigration !== undefined && lastAppliedMigration >= migration.when) {
      continue;
    }

    const migrationPath = path.join(migrationsFolder, `${migration.tag}.sql`);
    const migrationSql = readFileSync(migrationPath, 'utf8');

    // 根因：better-sqlite3 v12 拒绝单次 prepare 多条 SQL，而 Drizzle breakpoint 仍可能把 PRAGMA 与 DDL 放在同一片段。
    // 修复要点：执行前再拆成单条 statement，保留 Drizzle journal 语义，避免重复迁移。
    for (const statement of splitMigrationStatements(migrationSql)) {
      db.run(sql.raw(statement));
    }

    recordAppliedMigration(db, {
      hash: createHash('sha256').update(migrationSql).digest('hex'),
      when: migration.when,
    });
  }
}

function ensureMigrationsTable(db: CairnSqliteDatabase): void {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(MIGRATIONS_TABLE)} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);
}

function getLastAppliedMigration(db: CairnSqliteDatabase): number | undefined {
  const rows = db.values<[number, string, number]>(
    sql`
      SELECT id, hash, created_at
      FROM ${sql.identifier(MIGRATIONS_TABLE)}
      ORDER BY created_at DESC
      LIMIT 1
    `,
  );

  return rows[0] === undefined ? undefined : rows[0][2];
}

function recordAppliedMigration(
  db: CairnSqliteDatabase,
  migration: {
    hash: string;
    when: number;
  },
): void {
  db.run(sql`
    INSERT INTO ${sql.identifier(MIGRATIONS_TABLE)} ("hash", "created_at")
    VALUES (${migration.hash}, ${migration.when})
  `);
}

function readMigrationJournal(migrationsFolder: string): DrizzleJournalEntry[] {
  const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as DrizzleJournalShape;

  if (!Array.isArray(journal.entries)) {
    throw new Error(`Invalid Drizzle migration journal: ${journalPath}`);
  }

  return journal.entries.map((entry) => {
    if (!isDrizzleJournalEntry(entry)) {
      throw new Error(`Invalid Drizzle migration journal entry in ${journalPath}`);
    }

    return entry;
  });
}

function isDrizzleJournalEntry(entry: unknown): entry is DrizzleJournalEntry {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }

  const candidate = entry as Partial<Record<keyof DrizzleJournalEntry, unknown>>;
  return typeof candidate.tag === 'string' && typeof candidate.when === 'number';
}

function splitMigrationStatements(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let quotedBy: "'" | '"' | '`' | undefined;
  let inLineComment = false;
  let inBlockComment = false;
  const normalizedSql = sql.replaceAll('--> statement-breakpoint', '\n');

  for (let index = 0; index < normalizedSql.length; index += 1) {
    const character = normalizedSql[index] ?? '';
    const nextCharacter = normalizedSql[index + 1];

    currentStatement += character;

    if (inLineComment) {
      if (character === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (character === '*' && nextCharacter === '/') {
        currentStatement += nextCharacter;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (quotedBy !== undefined) {
      if (character === quotedBy) {
        if (nextCharacter === quotedBy) {
          currentStatement += nextCharacter;
          index += 1;
        } else {
          quotedBy = undefined;
        }
      }
      continue;
    }

    if (character === '-' && nextCharacter === '-') {
      currentStatement += nextCharacter;
      index += 1;
      inLineComment = true;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      currentStatement += nextCharacter;
      index += 1;
      inBlockComment = true;
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quotedBy = character;
      continue;
    }

    if (character === ';') {
      const statement = currentStatement.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      currentStatement = '';
    }
  }

  const finalStatement = currentStatement.trim();
  if (finalStatement.length > 0) {
    statements.push(finalStatement);
  }

  return statements;
}
