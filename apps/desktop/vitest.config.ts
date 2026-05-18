// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@cairn/ui': path.resolve(here, '../../packages/ui/src/index.ts'),
      '@cairn/ui/cairn': path.resolve(here, '../../packages/ui/src/cairn/index.ts'),
      '@cairn/ui/data-display': path.resolve(here, '../../packages/ui/src/data-display/index.ts'),
      '@cairn/ui/feedback': path.resolve(here, '../../packages/ui/src/feedback/index.ts'),
      '@cairn/ui/primitives': path.resolve(here, '../../packages/ui/src/primitives/index.ts'),
      '@cairn/ui/tokens': path.resolve(here, '../../packages/ui/src/tokens/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    reporters: ['default'],
    typecheck: {
      enabled: false,
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.spec.ts', 'src/renderer/**'],
      reporter: ['text', 'json-summary'],
    },
  },
});
