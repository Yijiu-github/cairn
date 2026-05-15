import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@cairn/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
      '@cairn/ui/cairn': fileURLToPath(
        new URL('../../packages/ui/src/cairn/index.ts', import.meta.url),
      ),
      '@cairn/ui/data-display': fileURLToPath(
        new URL('../../packages/ui/src/data-display/index.ts', import.meta.url),
      ),
      '@cairn/ui/feedback': fileURLToPath(
        new URL('../../packages/ui/src/feedback/index.ts', import.meta.url),
      ),
      '@cairn/ui/primitives': fileURLToPath(
        new URL('../../packages/ui/src/primitives/index.ts', import.meta.url),
      ),
      '@cairn/ui/tokens': fileURLToPath(
        new URL('../../packages/ui/src/tokens/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
  },
});
