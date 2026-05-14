// SPDX-License-Identifier: Apache-2.0
/**
 * SQLite migration runner.
 *
 * 迁移文件由 `@cairn/domain` 的 Drizzle schema 生成；storage 负责在运行时找到
 * 这些 SQL 并执行，后续 PostgreSQL 也会走同一层抽象。
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import type { CairnSqliteDatabase } from './connection.js';

export interface SqliteMigrationOptions {
  migrationsFolder?: string;
}

interface PackageJsonShape {
  name?: unknown;
}

const DOMAIN_PACKAGE_NAME = '@cairn/domain';

export function runSqliteMigrations(db: CairnSqliteDatabase, options: SqliteMigrationOptions = {}) {
  const migrationsFolder = options.migrationsFolder ?? getDomainMigrationsFolder();
  migrate(db, { migrationsFolder });
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
