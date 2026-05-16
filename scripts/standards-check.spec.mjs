import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

import {
  checkPackagePublicApi,
  checkSourceFile,
  discoverWorkspacePackages,
  formatDiagnostics,
  main,
} from './standards-check.mjs';

const writeJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const writeText = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
};

test('discoverWorkspacePackages finds workspace packages', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cairn-standards-'));

  try {
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify(
        {
          name: 'cairn-root',
          private: true,
        },
        null,
        2,
      ),
    );

    await Promise.all([
      writeJson(path.join(root, 'packages/application/package.json'), {
        name: '@cairn/application',
        exports: {
          '.': './src/index.ts',
          './testing': './src/testing/index.ts',
        },
      }),
      writeText(path.join(root, 'packages/application/src/index.ts'), 'export const value = 1;\n'),
      writeText(
        path.join(root, 'packages/application/src/testing/index.ts'),
        'export const testingValue = 1;\n',
      ),
    ]);

    const packages = await discoverWorkspacePackages(root);
    const applicationPackage = packages.get('@cairn/application');

    assert.ok(applicationPackage);
    assert.equal(applicationPackage.name, '@cairn/application');
    assert.equal(applicationPackage.relativeDirectory, 'packages/application');
    assert.deepEqual(applicationPackage.exportedSubpaths, new Set(['.', './testing']));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('checkSourceFile reports boundaries and export issues', () => {
  const packageByName = new Map([
    [
      '@cairn/application',
      {
        name: '@cairn/application',
        relativeDirectory: 'packages/application',
        exportedSubpaths: new Set(['.']),
      },
    ],
    [
      '@cairn/storage',
      {
        name: '@cairn/storage',
        relativeDirectory: 'packages/storage',
        exportedSubpaths: new Set(['.']),
      },
    ],
  ]);

  assert.deepEqual(
    checkSourceFile({
      relativeFilePath: 'packages/application/src/service.ts',
      sourceText: [
        "import { value } from '@cairn/storage';",
        "import helper from '@cairn/storage/internal/helper';",
        "import { thing } from '../../packages/storage/src/private';",
      ].join('\n'),
      packageByName,
    }),
    [
      {
        code: 'module_boundary_violation',
        file: 'packages/application/src/service.ts',
        message: 'packages/application must not import @cairn/storage.',
        detail: '@cairn/storage',
      },
      {
        code: 'cross_package_internal_import',
        file: 'packages/application/src/service.ts',
        message: 'Do not import another package internal implementation.',
        detail: '@cairn/storage/internal/helper',
      },
      {
        code: 'cross_package_relative_import',
        file: 'packages/application/src/service.ts',
        message: 'Use @cairn/* package exports instead of relative imports into packages/.',
        detail: '../../packages/storage/src/private',
      },
    ],
  );
});

test('checkSourceFile reports non-exported package subpaths', () => {
  const packageByName = new Map([
    [
      '@cairn/shared-contracts',
      {
        name: '@cairn/shared-contracts',
        relativeDirectory: 'packages/shared_contracts',
        exportedSubpaths: new Set(['.']),
      },
    ],
  ]);

  assert.deepEqual(
    checkSourceFile({
      relativeFilePath: 'packages/application/src/service.ts',
      sourceText: "import { hidden } from '@cairn/shared-contracts/src/contracts/run.contract';",
      packageByName,
    }),
    [
      {
        code: 'non_exported_package_subpath',
        file: 'packages/application/src/service.ts',
        message: 'Import @cairn/shared-contracts through package.json exports.',
        detail: '@cairn/shared-contracts/src/contracts/run.contract',
      },
    ],
  );
});

test('checkPackagePublicApi detects missing export targets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cairn-standards-'));

  try {
    await writeJson(path.join(root, 'packages/application/package.json'), {
      name: '@cairn/application',
      exports: {
        '.': './src/index.ts',
        './testing': './src/testing/index.ts',
      },
    });
    await writeText(
      path.join(root, 'packages/application/src/index.ts'),
      'export const value = 1;\n',
    );

    const packages = await discoverWorkspacePackages(root);
    const applicationPackage = packages.get('@cairn/application');

    assert.ok(applicationPackage);
    assert.deepEqual(await checkPackagePublicApi(root, applicationPackage), [
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

test('checkPackagePublicApi accepts array export fallbacks when one target exists', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cairn-standards-'));

  try {
    await writeJson(path.join(root, 'packages/application/package.json'), {
      name: '@cairn/application',
      exports: {
        '.': ['./src/missing.ts', './src/index.ts'],
      },
    });
    await writeText(
      path.join(root, 'packages/application/src/index.ts'),
      'export const value = 1;\n',
    );

    const packages = await discoverWorkspacePackages(root);
    const applicationPackage = packages.get('@cairn/application');

    assert.ok(applicationPackage);
    assert.deepEqual(await checkPackagePublicApi(root, applicationPackage), []);
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

test('main returns zero for a clean repository', async () => {
  const originalCwd = process.cwd();
  const root = await mkdtemp(path.join(os.tmpdir(), 'cairn-standards-'));

  try {
    await writeJson(path.join(root, 'packages/application/package.json'), {
      name: '@cairn/application',
      exports: {
        '.': './src/index.ts',
      },
    });
    await writeText(
      path.join(root, 'packages/application/src/index.ts'),
      'export const value = 1;\n',
    );

    process.chdir(root);
    assert.equal(await main(), 0);
  } finally {
    process.chdir(originalCwd);
    await rm(root, { recursive: true, force: true });
  }
});
