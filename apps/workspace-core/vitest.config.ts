// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@cairn/application': path.resolve(here, '../../packages/application/src'),
      '@cairn/application/testing': path.resolve(
        here,
        '../../packages/application/src/testing/index.ts',
      ),
      '@cairn/runtime-gateway': path.resolve(here, '../../packages/runtime_gateway/src'),
      '@cairn/storage': path.resolve(here, '../../packages/storage/src'),
      '@cairn/storage/sqlite': path.resolve(here, '../../packages/storage/src/sqlite/index.ts'),
      '@cairn/domain': path.resolve(here, '../../packages/domain/src'),
      '@cairn/domain/schema': path.resolve(here, '../../packages/domain/src/schema/index.ts'),
      '@cairn/shared-contracts': path.resolve(here, '../../packages/shared_contracts/src'),
      '@cairn/shared-contracts/contracts': path.resolve(
        here,
        '../../packages/shared_contracts/src/contracts/index.ts',
      ),
      '@cairn/shared-contracts/schemas': path.resolve(
        here,
        '../../packages/shared_contracts/src/schemas/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    typecheck: {
      enabled: false,
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/index.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
});
