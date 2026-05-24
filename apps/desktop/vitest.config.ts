// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.spec.mjs', 'src/**/*.spec.ts'],
    reporters: ['default'],
    typecheck: {
      enabled: false,
    },
  },
});
