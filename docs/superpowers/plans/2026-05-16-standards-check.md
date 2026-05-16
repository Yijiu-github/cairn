# Standards Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-blocking `pnpm run standards:check` command that catches Cairn module-boundary and public API drift before these rules move into CI.

**Architecture:** Implement one root-level Node ESM CLI under `scripts/standards-check.mjs`, with pure functions exported for Node built-in tests in `scripts/standards-check.spec.mjs`. The CLI scans source files and package metadata, reports deterministic diagnostics, exits non-zero when violations exist, and remains outside `pnpm run check` until Phase 3.

**Tech Stack:** Node.js built-ins (`node:fs`, `node:path`, `node:process`, `node:test`), JavaScript ESM, pnpm scripts, markdownlint-cli2, Prettier.

---

## Scope Check

This plan implements Phase 2 from `docs/engineering/standards-automation.md`.

In scope:

- Add `pnpm run standards:check`.
- Add tests for the standards-check rule engine.
- Add a small root `scripts/standards-check.mjs` CLI.
- Update engineering docs and changelog to record Phase 2 as non-blocking.

Out of scope:

- Do not add `standards:check` to `pnpm run check`.
- Do not modify CI.
- Do not add dependencies.
- Do not change ESLint, TypeScript config, package structure, or app code.
- Do not implement a full Markdown link checker; keep it as a future candidate.

## File Structure

Create or modify these files:

- Create `scripts/standards-check.mjs`
  - Owns the CLI entrypoint and pure scanning/checking functions.
  - Uses only Node built-ins.
  - Exports functions for tests.
- Create `scripts/standards-check.spec.mjs`
  - Uses Node built-in `node:test`.
  - Creates temporary fixture repos and verifies diagnostics without touching the real repo.
- Modify `package.json`
  - Adds `standards:check`.
  - Adds `standards:check:test`.
  - Does not modify `check`.
- Modify `docs/engineering/standards-automation.md`
  - Records Phase 2 command as implemented and still non-blocking.
- Modify `CHANGELOG.md`
  - Records the new command under `[Unreleased]`.

## Task 1: Add Standards Check Tests

**Files:**

- Create: `scripts/standards-check.spec.mjs`
- Future implementation imported from: `scripts/standards-check.mjs`

- [ ] **Step 1: Create the `scripts` directory if needed**

Run:

```bash
mkdir -p scripts
```

Expected: command exits with status `0`.

- [ ] **Step 2: Write failing tests**

Create `scripts/standards-check.spec.mjs` with:

```js
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  checkPackagePublicApi,
  checkSourceFile,
  discoverWorkspacePackages,
  formatDiagnostics,
} from './standards-check.mjs';

const createTempRepo = async () => {
  return await mkdtemp(path.join(tmpdir(), 'cairn-standards-check-'));
};

const writeJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const writeText = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
};

test('discoverWorkspacePackages maps current packages and apps by package name', async () => {
  const root = await createTempRepo();

  try {
    await writeJson(path.join(root, 'packages/shared_contracts/package.json'), {
      name: '@cairn/shared-contracts',
      exports: {
        '.': {
          import: './src/index.ts',
        },
        './contracts': {
          import: './src/contracts/index.ts',
        },
      },
    });
    await writeJson(path.join(root, 'apps/workspace-core/package.json'), {
      name: '@cairn/workspace-core',
      exports: {
        '.': {
          import: './src/index.ts',
        },
      },
    });

    const packages = await discoverWorkspacePackages(root);

    assert.equal(
      packages.get('@cairn/shared-contracts')?.relativeDirectory,
      'packages/shared_contracts',
    );
    assert.equal(packages.get('@cairn/workspace-core')?.relativeDirectory, 'apps/workspace-core');
    assert.deepEqual(
      packages.get('@cairn/shared-contracts')?.exportedSubpaths,
      new Set(['.', './contracts']),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('checkSourceFile reports cross-package relative imports into packages', () => {
  const diagnostics = checkSourceFile({
    relativeFilePath: 'apps/workspace-core/src/route.ts',
    sourceText:
      "import { runContract } from '../../../packages/shared_contracts/src/contracts/index.ts';\n",
    packageByName: new Map(),
  });

  assert.deepEqual(diagnostics, [
    {
      code: 'cross_package_relative_import',
      file: 'apps/workspace-core/src/route.ts',
      message: 'Use @cairn/* package exports instead of relative imports into packages/.',
      detail: '../../../packages/shared_contracts/src/contracts/index.ts',
    },
  ]);
});

test('checkSourceFile reports cross-package internal imports', () => {
  const diagnostics = checkSourceFile({
    relativeFilePath: 'packages/storage/src/repository.ts',
    sourceText: "import { privateHelper } from '@cairn/application/internal/private-helper';\n",
    packageByName: new Map([
      [
        '@cairn/application',
        {
          name: '@cairn/application',
          relativeDirectory: 'packages/application',
          exportedSubpaths: new Set(['.', './testing']),
        },
      ],
    ]),
  });

  assert.deepEqual(diagnostics, [
    {
      code: 'cross_package_internal_import',
      file: 'packages/storage/src/repository.ts',
      message: 'Do not import another package internal implementation.',
      detail: '@cairn/application/internal/private-helper',
    },
  ]);
});

test('checkSourceFile reports module boundary violations', () => {
  const diagnostics = checkSourceFile({
    relativeFilePath: 'packages/ui/src/view.tsx',
    sourceText: "import { createSqliteStorage } from '@cairn/storage/sqlite';\n",
    packageByName: new Map([
      [
        '@cairn/storage',
        {
          name: '@cairn/storage',
          relativeDirectory: 'packages/storage',
          exportedSubpaths: new Set(['.', './sqlite']),
        },
      ],
    ]),
  });

  assert.deepEqual(diagnostics, [
    {
      code: 'module_boundary_violation',
      file: 'packages/ui/src/view.tsx',
      message: 'packages/ui must not import @cairn/storage.',
      detail: '@cairn/storage/sqlite',
    },
  ]);
});

test('checkSourceFile allows documented package exports', () => {
  const diagnostics = checkSourceFile({
    relativeFilePath: 'packages/application/src/service.ts',
    sourceText: [
      "import { runContract } from '@cairn/shared-contracts/contracts';",
      "import { RuntimeAdapter } from '@cairn/runtime-gateway';",
      '',
    ].join('\n'),
    packageByName: new Map([
      [
        '@cairn/shared-contracts',
        {
          name: '@cairn/shared-contracts',
          relativeDirectory: 'packages/shared_contracts',
          exportedSubpaths: new Set(['.', './contracts']),
        },
      ],
      [
        '@cairn/runtime-gateway',
        {
          name: '@cairn/runtime-gateway',
          relativeDirectory: 'packages/runtime_gateway',
          exportedSubpaths: new Set(['.']),
        },
      ],
    ]),
  });

  assert.deepEqual(diagnostics, []);
});

test('checkSourceFile reports non-exported @cairn subpath imports', () => {
  const diagnostics = checkSourceFile({
    relativeFilePath: 'packages/application/src/service.ts',
    sourceText: "import { hidden } from '@cairn/shared-contracts/src/contracts/run.contract';\n",
    packageByName: new Map([
      [
        '@cairn/shared-contracts',
        {
          name: '@cairn/shared-contracts',
          relativeDirectory: 'packages/shared_contracts',
          exportedSubpaths: new Set(['.', './contracts']),
        },
      ],
    ]),
  });

  assert.deepEqual(diagnostics, [
    {
      code: 'non_exported_package_subpath',
      file: 'packages/application/src/service.ts',
      message: 'Import @cairn/shared-contracts through package.json exports.',
      detail: '@cairn/shared-contracts/src/contracts/run.contract',
    },
  ]);
});

test('checkPackagePublicApi reports package exports without source files', async () => {
  const root = await createTempRepo();

  try {
    await writeJson(path.join(root, 'packages/application/package.json'), {
      name: '@cairn/application',
      exports: {
        '.': {
          import: './src/index.ts',
        },
        './testing': {
          import: './src/testing/index.ts',
        },
      },
    });
    await writeText(
      path.join(root, 'packages/application/src/index.ts'),
      'export const value = 1;\n',
    );

    const packages = await discoverWorkspacePackages(root);
    const applicationPackage = packages.get('@cairn/application');
    assert.ok(applicationPackage);

    const diagnostics = await checkPackagePublicApi(root, applicationPackage);

    assert.deepEqual(diagnostics, [
      {
        code: 'missing_public_export_target',
        file: 'packages/application/package.json',
        message: 'package.json exports points to a missing source file.',
        detail: './testing -> ./src/testing/index.ts',
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('formatDiagnostics is deterministic and readable', () => {
  const diagnostics = [
    {
      code: 'module_boundary_violation',
      file: 'packages/ui/src/view.tsx',
      message: 'packages/ui must not import @cairn/storage.',
      detail: '@cairn/storage/sqlite',
    },
    {
      code: 'cross_package_internal_import',
      file: 'packages/storage/src/repository.ts',
      message: 'Do not import another package internal implementation.',
      detail: '@cairn/application/internal/private-helper',
    },
  ];

  assert.equal(
    formatDiagnostics(diagnostics),
    [
      'standards:check found 2 violation(s):',
      '',
      'cross_package_internal_import',
      '  file: packages/storage/src/repository.ts',
      '  rule: Do not import another package internal implementation.',
      '  detail: @cairn/application/internal/private-helper',
      '',
      'module_boundary_violation',
      '  file: packages/ui/src/view.tsx',
      '  rule: packages/ui must not import @cairn/storage.',
      '  detail: @cairn/storage/sqlite',
      '',
    ].join('\n'),
  );
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
node --test scripts/standards-check.spec.mjs
```

Expected: FAIL with an import/module-not-found error for `./standards-check.mjs`.

- [ ] **Step 4: Commit Task 1**

Run:

```bash
git add scripts/standards-check.spec.mjs
git commit -m "test(standards): 添加规范检查测试 / add standards check tests"
```

Expected: commit succeeds.

## Task 2: Implement Standards Check Core And CLI

**Files:**

- Create: `scripts/standards-check.mjs`
- Test: `scripts/standards-check.spec.mjs`

- [ ] **Step 1: Create `standards-check.mjs` implementation**

Create `scripts/standards-check.mjs` with:

```js
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.turbo',
  '.vite',
  'coverage',
  'dist',
  'build',
  'node_modules',
]);

const MODULE_RULES = {
  'apps/ui-preview': {
    forbidden: [
      '@cairn/application',
      '@cairn/domain',
      '@cairn/runtime-gateway',
      '@cairn/shared-contracts',
      '@cairn/storage',
    ],
  },
  'apps/workspace-core': {
    forbidden: [],
  },
  'packages/application': {
    forbidden: ['@cairn/storage'],
  },
  'packages/domain': {
    forbidden: [
      '@cairn/application',
      '@cairn/runtime-gateway',
      '@cairn/shared-contracts',
      '@cairn/storage',
    ],
  },
  'packages/runtime_gateway': {
    forbidden: ['@cairn/application', '@cairn/domain', '@cairn/storage'],
  },
  'packages/shared_contracts': {
    forbidden: [
      '@cairn/application',
      '@cairn/domain',
      '@cairn/runtime-gateway',
      '@cairn/storage',
      '@cairn/ui',
    ],
  },
  'packages/storage': {
    forbidden: ['@cairn/application', '@cairn/runtime-gateway'],
  },
  'packages/ui': {
    forbidden: ['@cairn/application', '@cairn/domain', '@cairn/runtime-gateway', '@cairn/storage'],
  },
};

const IMPORT_SPECIFIER_PATTERN =
  /\bimport\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|\bexport\s+(?:type\s+)?[^'"]*?\s+from\s+['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const normalizePath = (value) => value.split(path.sep).join('/');

const isIgnoredDirectory = (directoryName) => IGNORED_DIRECTORIES.has(directoryName);

const isSourceFile = (filePath) => SOURCE_EXTENSIONS.has(path.extname(filePath));

const readJsonFile = async (filePath) => {
  const text = await readFile(filePath, 'utf8');
  return JSON.parse(text);
};

const isRecord = (value) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const extractExportTarget = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  if (typeof value.import === 'string') {
    return value.import;
  }

  if (typeof value.types === 'string') {
    return value.types;
  }

  return undefined;
};

const extractExportedSubpaths = (packageJson) => {
  const exportsField = packageJson.exports;

  if (typeof exportsField === 'string') {
    return new Set(['.']);
  }

  if (!isRecord(exportsField)) {
    return new Set(['.']);
  }

  return new Set(Object.keys(exportsField));
};

const getPackageName = (packageJson) => {
  return typeof packageJson.name === 'string' ? packageJson.name : undefined;
};

const getOwningModule = (relativeFilePath) => {
  const normalized = normalizePath(relativeFilePath);
  const parts = normalized.split('/');

  if (parts.length < 2) {
    return undefined;
  }

  if (parts[0] !== 'apps' && parts[0] !== 'packages') {
    return undefined;
  }

  return `${parts[0]}/${parts[1]}`;
};

const getCairnPackageName = (specifier, packageByName) => {
  const sortedNames = [...packageByName.keys()].sort((left, right) => right.length - left.length);
  return sortedNames.find(
    (packageName) => specifier === packageName || specifier.startsWith(`${packageName}/`),
  );
};

const getSubpath = (specifier, packageName) => {
  if (specifier === packageName) {
    return '.';
  }

  return `.${specifier.slice(packageName.length)}`;
};

const getImportSpecifiers = (sourceText) => {
  const specifiers = [];

  for (const match of sourceText.matchAll(IMPORT_SPECIFIER_PATTERN)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    if (specifier !== undefined) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
};

const isAllowedExportedSubpath = (specifier, workspacePackage) => {
  const subpath = getSubpath(specifier, workspacePackage.name);

  if (workspacePackage.exportedSubpaths.has(subpath)) {
    return true;
  }

  return [...workspacePackage.exportedSubpaths].some((exportedSubpath) => {
    if (!exportedSubpath.endsWith('/*')) {
      return false;
    }

    const prefix = exportedSubpath.slice(0, -1);
    return subpath.startsWith(prefix);
  });
};

export const discoverWorkspacePackages = async (rootDirectory) => {
  const packageByName = new Map();

  for (const workspaceRoot of ['apps', 'packages']) {
    const absoluteWorkspaceRoot = path.join(rootDirectory, workspaceRoot);
    if (!existsSync(absoluteWorkspaceRoot)) {
      continue;
    }

    const entries = await readdir(absoluteWorkspaceRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const relativeDirectory = `${workspaceRoot}/${entry.name}`;
      const packageJsonPath = path.join(rootDirectory, relativeDirectory, 'package.json');
      if (!existsSync(packageJsonPath)) {
        continue;
      }

      const packageJson = await readJsonFile(packageJsonPath);
      if (!isRecord(packageJson)) {
        continue;
      }

      const name = getPackageName(packageJson);
      if (name === undefined) {
        continue;
      }

      packageByName.set(name, {
        name,
        relativeDirectory,
        exportedSubpaths: extractExportedSubpaths(packageJson),
      });
    }
  }

  return packageByName;
};

export const checkSourceFile = ({ relativeFilePath, sourceText, packageByName }) => {
  const diagnostics = [];
  const owningModule = getOwningModule(relativeFilePath);
  const rule = owningModule === undefined ? undefined : MODULE_RULES[owningModule];

  for (const specifier of getImportSpecifiers(sourceText)) {
    if (specifier.startsWith('.') && specifier.includes('/packages/')) {
      diagnostics.push({
        code: 'cross_package_relative_import',
        file: relativeFilePath,
        message: 'Use @cairn/* package exports instead of relative imports into packages/.',
        detail: specifier,
      });
      continue;
    }

    const packageName = getCairnPackageName(specifier, packageByName);
    if (packageName === undefined) {
      continue;
    }

    if (specifier.includes('/internal/')) {
      diagnostics.push({
        code: 'cross_package_internal_import',
        file: relativeFilePath,
        message: 'Do not import another package internal implementation.',
        detail: specifier,
      });
      continue;
    }

    const workspacePackage = packageByName.get(packageName);
    if (workspacePackage !== undefined && !isAllowedExportedSubpath(specifier, workspacePackage)) {
      diagnostics.push({
        code: 'non_exported_package_subpath',
        file: relativeFilePath,
        message: `Import ${packageName} through package.json exports.`,
        detail: specifier,
      });
      continue;
    }

    if (
      rule?.forbidden.some(
        (forbiddenPackage) =>
          specifier === forbiddenPackage || specifier.startsWith(`${forbiddenPackage}/`),
      ) === true
    ) {
      diagnostics.push({
        code: 'module_boundary_violation',
        file: relativeFilePath,
        message: `${owningModule} must not import ${packageName}.`,
        detail: specifier,
      });
    }
  }

  return diagnostics;
};

const collectSourceFiles = async (rootDirectory, relativeDirectory = '.') => {
  const absoluteDirectory = path.join(rootDirectory, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (isIgnoredDirectory(entry.name)) {
        continue;
      }

      files.push(
        ...(await collectSourceFiles(rootDirectory, path.join(relativeDirectory, entry.name))),
      );
      continue;
    }

    const relativeFilePath = normalizePath(path.join(relativeDirectory, entry.name));
    if (isSourceFile(relativeFilePath)) {
      files.push(relativeFilePath);
    }
  }

  return files.sort();
};

export const checkPackagePublicApi = async (rootDirectory, workspacePackage) => {
  const packageJsonPath = path.join(
    rootDirectory,
    workspacePackage.relativeDirectory,
    'package.json',
  );
  const packageJson = await readJsonFile(packageJsonPath);

  if (!isRecord(packageJson) || !isRecord(packageJson.exports)) {
    return [];
  }

  const diagnostics = [];

  for (const [subpath, exportValue] of Object.entries(packageJson.exports)) {
    const target = extractExportTarget(exportValue);
    if (target === undefined) {
      continue;
    }

    const absoluteTarget = path.join(rootDirectory, workspacePackage.relativeDirectory, target);
    if (!existsSync(absoluteTarget)) {
      diagnostics.push({
        code: 'missing_public_export_target',
        file: `${workspacePackage.relativeDirectory}/package.json`,
        message: 'package.json exports points to a missing source file.',
        detail: `${subpath} -> ${target}`,
      });
    }
  }

  return diagnostics;
};

export const runStandardsCheck = async (rootDirectory) => {
  const packageByName = await discoverWorkspacePackages(rootDirectory);
  const sourceFiles = await collectSourceFiles(rootDirectory);
  const diagnostics = [];

  for (const relativeFilePath of sourceFiles) {
    const sourceText = await readFile(path.join(rootDirectory, relativeFilePath), 'utf8');
    diagnostics.push(
      ...checkSourceFile({
        relativeFilePath,
        sourceText,
        packageByName,
      }),
    );
  }

  for (const workspacePackage of packageByName.values()) {
    diagnostics.push(...(await checkPackagePublicApi(rootDirectory, workspacePackage)));
  }

  return diagnostics.sort((left, right) => {
    return `${left.code}:${left.file}:${left.detail}`.localeCompare(
      `${right.code}:${right.file}:${right.detail}`,
    );
  });
};

export const formatDiagnostics = (diagnostics) => {
  if (diagnostics.length === 0) {
    return 'standards:check passed with 0 violation(s).';
  }

  const lines = [`standards:check found ${diagnostics.length} violation(s):`, ''];

  for (const diagnostic of [...diagnostics].sort((left, right) => {
    return `${left.code}:${left.file}:${left.detail}`.localeCompare(
      `${right.code}:${right.file}:${right.detail}`,
    );
  })) {
    lines.push(diagnostic.code);
    lines.push(`  file: ${diagnostic.file}`);
    lines.push(`  rule: ${diagnostic.message}`);
    lines.push(`  detail: ${diagnostic.detail}`);
    lines.push('');
  }

  return lines.join('\n');
};

const main = async () => {
  const diagnostics = await runStandardsCheck(process.cwd());
  const output = formatDiagnostics(diagnostics);

  if (diagnostics.length === 0) {
    process.stdout.write(`${output}\n`);
    return;
  }

  process.stderr.write(`${output}\n`);
  process.exitCode = 1;
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
```

- [ ] **Step 2: Run tests**

Run:

```bash
node --test scripts/standards-check.spec.mjs
```

Expected: PASS. Node test output reports all tests passing.

- [ ] **Step 3: Run the CLI against the real repo**

Run:

```bash
node scripts/standards-check.mjs
```

Expected: PASS with:

```text
standards:check passed with 0 violation(s).
```

- [ ] **Step 4: Format and validate**

Run:

```bash
pnpm exec prettier --write scripts/standards-check.mjs scripts/standards-check.spec.mjs
pnpm exec eslint scripts/standards-check.mjs scripts/standards-check.spec.mjs
pnpm exec prettier --check scripts/standards-check.mjs scripts/standards-check.spec.mjs
```

Expected: all commands exit with status `0`.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add scripts/standards-check.mjs scripts/standards-check.spec.mjs
git commit -m "feat(standards): 实现非阻塞规范检查 / implement non-blocking standards check"
```

Expected: commit succeeds.

## Task 3: Wire Package Scripts Without CI Integration

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add root scripts**

Modify `package.json` in the root `scripts` object. Add these two entries under the `//—— 校验 ——` section after `format:check`:

```json
"standards:check": "node scripts/standards-check.mjs",
"standards:check:test": "node --test scripts/standards-check.spec.mjs",
```

Do not change this line:

```json
"check": "pnpm run typecheck && pnpm run lint && pnpm run docs:lint && pnpm run format:check",
```

- [ ] **Step 2: Verify package JSON formatting**

Run:

```bash
pnpm exec prettier --write package.json
pnpm exec prettier --check package.json
```

Expected: Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 3: Run the new scripts**

Run:

```bash
pnpm run standards:check:test
pnpm run standards:check
```

Expected:

- `pnpm run standards:check:test` exits with status `0`.
- `pnpm run standards:check` prints `standards:check passed with 0 violation(s).`.

- [ ] **Step 4: Confirm `pnpm run check` does not include standards check**

Run:

```bash
node -e "const pkg=require('./package.json'); if (pkg.scripts.check.includes('standards:check')) process.exit(1);"
```

Expected: command exits with status `0`.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add package.json
git commit -m "chore(standards): 接入规范检查脚本 / wire standards check scripts"
```

Expected: commit succeeds.

## Task 4: Document Phase 2 Command

**Files:**

- Modify: `docs/engineering/standards-automation.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update `standards-automation.md`**

Modify `docs/engineering/standards-automation.md`:

1. In section 3, change:

```markdown
目标命令：
```

to:

```markdown
当前命令：
```

1. Keep the command block:

```bash
pnpm run standards:check
```

1. Replace:

```markdown
初期非阻塞，不纳入 `pnpm run check`。
```

with:

```markdown
当前仍为非阻塞命令，不纳入 `pnpm run check`，也不接入 CI。
```

1. Replace the first-batch checklist with:

```markdown
当前检查：

1. 禁止跨包相对导入 `../../packages/*`。
2. 禁止跨包导入 `src/internal/*`。
3. 检查 `@cairn/*` import 是否符合 `module-boundaries.md`。
4. 检查 package `exports` 是否指向存在的源码入口。
5. 检查 `@cairn/*` import 是否通过 package `exports` 暴露。
```

1. Keep the candidate follow-up checks for Markdown links and review-gate surface labels.

- [ ] **Step 2: Update `CHANGELOG.md`**

Under `[Unreleased]` → `Added`, add:

```markdown
- 新增非阻塞 `pnpm run standards:check`，用于检查跨包相对导入、internal 导入、模块边界与 package exports 漂移
```

Under `[Unreleased]` → `Changed`, add:

```markdown
- `standards-automation.md` 更新 Phase 2 状态，明确 `standards:check` 暂不纳入 `pnpm run check` 或 CI
```

- [ ] **Step 3: Format and validate docs**

Run:

```bash
pnpm exec prettier --write docs/engineering/standards-automation.md CHANGELOG.md
pnpm exec markdownlint-cli2 docs/engineering/standards-automation.md CHANGELOG.md
pnpm exec prettier --check docs/engineering/standards-automation.md CHANGELOG.md
```

Expected: markdownlint reports `0 error(s)` and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 4: Commit Task 4**

Run:

```bash
git add docs/engineering/standards-automation.md CHANGELOG.md
git commit -m "docs(standards): 记录规范检查命令 / document standards check command"
```

Expected: commit succeeds.

## Task 5: Final Verification

**Files:**

- Check all files modified by this plan.

- [ ] **Step 1: Run standards check verification**

Run:

```bash
pnpm run standards:check:test
pnpm run standards:check
```

Expected:

- `pnpm run standards:check:test` exits with status `0`.
- `pnpm run standards:check` prints `standards:check passed with 0 violation(s).`.

- [ ] **Step 2: Run repository verification**

Run:

```bash
pnpm run docs:lint
pnpm run format:check
pnpm run lint
git diff --check
```

Expected:

- `pnpm run docs:lint` reports `Summary: 0 error(s)`.
- `pnpm run format:check` reports `All matched files use Prettier code style!`.
- `pnpm run lint` exits with status `0`.
- `git diff --check` prints no output and exits with status `0`.

- [ ] **Step 3: Verify `pnpm run check` remains unchanged**

Run:

```bash
node -e "const pkg=require('./package.json'); if (pkg.scripts.check.includes('standards:check')) process.exit(1); console.log(pkg.scripts.check)"
```

Expected output:

```text
pnpm run typecheck && pnpm run lint && pnpm run docs:lint && pnpm run format:check
```

- [ ] **Step 4: Verify working tree and commits**

Run:

```bash
git status --short --branch
git log --oneline --decorate --max-count=10
```

Expected: working tree clean. Recent commits include Tasks 1-4.

## Self-Review Checklist

- Spec coverage: Tasks implement a non-blocking `standards:check`, tests, package scripts, docs, changelog, and final validation.
- Scope control: Plan does not add `standards:check` to `pnpm run check`, CI, ESLint, TypeScript config, package structure, or app code.
- Exact paths: Every file path is explicit.
- No placeholders: All planned code and doc changes are specified inline.
- TDD: Task 1 writes failing tests before Task 2 implementation.
- Verification: Final task runs standards-check tests, standards-check, docs lint, format check, lint, and diff check.
