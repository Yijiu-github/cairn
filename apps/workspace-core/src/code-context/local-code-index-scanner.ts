// SPDX-License-Identifier: Apache-2.0

import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CodeContextScannerFile, CodeContextScannerPort } from '@cairn/application';
import type { SourceRoot } from '@cairn/shared-contracts/schemas';

const MAX_FILE_BYTES = 1024 * 1024;
const DEFAULT_EXCLUDE_PATTERNS = [
  '.git/**',
  '.env*',
  '**/.env*',
  '**/*.key',
  '**/*.pem',
  '**/*.p12',
  '**/*.pfx',
  '**/*.sqlite',
  '**/*.sqlite3',
  '**/*.db',
  'node_modules/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.turbo/**',
];

const LANGUAGE_BY_EXTENSION = new Map<string, string>([
  ['.cjs', 'javascript'],
  ['.css', 'css'],
  ['.cts', 'typescript'],
  ['.html', 'html'],
  ['.js', 'javascript'],
  ['.json', 'json'],
  ['.jsx', 'javascript'],
  ['.md', 'markdown'],
  ['.mjs', 'javascript'],
  ['.mts', 'typescript'],
  ['.sql', 'sql'],
  ['.ts', 'typescript'],
  ['.tsx', 'typescript'],
  ['.yaml', 'yaml'],
  ['.yml', 'yaml'],
]);

export class LocalCodeIndexScanner implements CodeContextScannerPort {
  scan(sourceRoot: SourceRoot): Promise<CodeContextScannerFile[]> {
    if (sourceRoot.kind !== 'local_directory') {
      throw new Error(`Unsupported SourceRoot kind for local scanner: ${sourceRoot.kind}`);
    }

    const rootPath = toLocalPath(sourceRoot.uri);
    const files = scanDirectory(rootPath, sourceRoot.includeGlobs, sourceRoot.excludeGlobs);
    return Promise.resolve(files);
  }
}

const toLocalPath = (uri: string): string => {
  if (uri.startsWith('file://')) {
    return fileURLToPath(uri);
  }

  return path.resolve(uri);
};

const scanDirectory = (
  rootPath: string,
  includeGlobs: string[],
  excludeGlobs: string[],
): CodeContextScannerFile[] => {
  const rootStats = statSync(rootPath);
  if (!rootStats.isDirectory()) {
    throw new Error(`SourceRoot is not a directory: ${rootPath}`);
  }

  const files: CodeContextScannerFile[] = [];
  const excludes = [...DEFAULT_EXCLUDE_PATTERNS, ...excludeGlobs];

  walkDirectory(rootPath, rootPath, includeGlobs, excludes, files);
  return files.sort((a, b) => a.path.localeCompare(b.path));
};

const walkDirectory = (
  rootPath: string,
  directory: string,
  includeGlobs: string[],
  excludeGlobs: string[],
  files: CodeContextScannerFile[],
): void => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = toPortablePath(path.relative(rootPath, absolutePath));

    if (matchesAny(relativePath, excludeGlobs)) {
      continue;
    }

    if (entry.isDirectory()) {
      walkDirectory(rootPath, absolutePath, includeGlobs, excludeGlobs, files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (includeGlobs.length > 0 && !matchesAny(relativePath, includeGlobs)) {
      continue;
    }

    const stats = lstatSync(absolutePath);
    if (stats.size > MAX_FILE_BYTES) {
      continue;
    }

    const language = guessLanguage(relativePath);
    files.push({
      path: relativePath,
      sizeBytes: stats.size,
      mtimeMs: Math.trunc(stats.mtimeMs),
      digest: `sha256:${createHash('sha256').update(readFileSync(absolutePath)).digest('hex')}`,
      ...(language === undefined ? {} : { language }),
    });
  }
};

const toPortablePath = (value: string): string => value.split(path.sep).join('/');

const matchesAny = (relativePath: string, patterns: string[]): boolean =>
  patterns.some((pattern) => matchesGlob(relativePath, pattern));

const matchesGlob = (relativePath: string, pattern: string): boolean => {
  const normalized = toPortablePath(pattern).replace(/^\.\//, '');

  if (normalized.endsWith('/**')) {
    const prefix = normalized.slice(0, -3);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  }

  if (normalized.startsWith('**/')) {
    const suffix = normalized.slice(3);
    return relativePath === suffix || relativePath.endsWith(`/${suffix}`);
  }

  if (normalized.includes('*')) {
    return globToRegex(normalized).test(relativePath);
  }

  return relativePath === normalized || relativePath.startsWith(`${normalized}/`);
};

const globToRegex = (pattern: string): RegExp => {
  const escaped = pattern
    .replaceAll('\\', '/')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replaceAll('**', '.*')
    .replaceAll('*', '[^/]*');
  return new RegExp(`^${escaped}$`);
};

const guessLanguage = (relativePath: string): string | undefined =>
  LANGUAGE_BY_EXTENSION.get(path.extname(relativePath).toLowerCase());
