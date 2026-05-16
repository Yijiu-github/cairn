// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath, URL } from 'node:url';

import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

const repoRelative = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    esbuild: {
      jsx: 'automatic',
    },
    resolve: {
      alias: {
        '@cairn/ui': repoRelative('packages/ui/src/index.ts'),
        '@cairn/ui/cairn': repoRelative('packages/ui/src/cairn/index.ts'),
        '@cairn/ui/data-display': repoRelative('packages/ui/src/data-display/index.ts'),
        '@cairn/ui/feedback': repoRelative('packages/ui/src/feedback/index.ts'),
        '@cairn/ui/primitives': repoRelative('packages/ui/src/primitives/index.ts'),
        '@cairn/ui/tokens': repoRelative('packages/ui/src/tokens/index.ts'),
      },
    },
  },
});
