// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    typecheck: {
      enabled: false, // typecheck 由 `pnpm typecheck` 单独跑（更快）
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/index.ts', 'src/**/_common.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
});
