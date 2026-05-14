// SPDX-License-Identifier: Apache-2.0
/**
 * SQLite 连接封装。
 *
 * 本地工作区的数据库是用户数据目录内的单文件。这里集中设置 PRAGMA，
 * 避免 Workspace Core / repository 层到处散落 SQLite 专属语句。
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import * as schema from '@cairn/domain/schema';

export type CairnSqliteDatabase = BetterSQLite3Database<typeof schema>;

export interface SqlitePragmaOptions {
  /** WAL 只适用于文件数据库；`:memory:` 会自动跳过。 */
  enableWal?: boolean;
  busyTimeoutMs?: number;
}

export interface OpenSqliteStorageOptions {
  /** 文件路径或 `:memory:`。 */
  databasePath: string;
  readonly?: boolean;
  fileMustExist?: boolean;
  applyPragmas?: boolean;
  pragmas?: SqlitePragmaOptions;
}

export interface SqliteStorage {
  db: CairnSqliteDatabase;
  client: Database.Database;
  close: () => void;
}

const MEMORY_DATABASE = ':memory:';
const DEFAULT_BUSY_TIMEOUT_MS = 5000;

export function openSqliteStorage(options: OpenSqliteStorageOptions): SqliteStorage {
  if (options.databasePath.length === 0) {
    throw new Error('databasePath must not be empty');
  }

  ensureDatabaseDirectory(options.databasePath);

  const client = new Database(options.databasePath, {
    readonly: options.readonly ?? false,
    fileMustExist: options.fileMustExist ?? false,
  });

  if (options.applyPragmas !== false && options.readonly !== true) {
    const pragmaOptions: SqlitePragmaOptions = {
      enableWal: options.databasePath !== MEMORY_DATABASE && (options.pragmas?.enableWal ?? true),
    };
    if (options.pragmas?.busyTimeoutMs !== undefined) {
      pragmaOptions.busyTimeoutMs = options.pragmas.busyTimeoutMs;
    }
    applySqlitePragmas(client, pragmaOptions);
  }

  return {
    db: drizzle(client, { schema }),
    client,
    close: () => {
      client.close();
    },
  };
}

export function applySqlitePragmas(client: Database.Database, options: SqlitePragmaOptions = {}) {
  const busyTimeoutMs = options.busyTimeoutMs ?? DEFAULT_BUSY_TIMEOUT_MS;

  client.pragma('foreign_keys = ON');
  client.pragma(`busy_timeout = ${busyTimeoutMs.toString()}`);

  if (options.enableWal === true) {
    client.pragma('journal_mode = WAL');
    client.pragma('synchronous = NORMAL');
  }
}

function ensureDatabaseDirectory(databasePath: string) {
  if (databasePath === MEMORY_DATABASE) {
    return;
  }

  const directory = path.dirname(databasePath);
  if (directory === '.' || directory.length === 0) {
    return;
  }

  mkdirSync(directory, { recursive: true });
}
