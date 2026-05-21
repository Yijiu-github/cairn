// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import config from '../electron.vite.config.js';

import type { Plugin } from 'vite';

interface ExternalizedBuildConfig {
  readonly build?: {
    readonly rollupOptions?: {
      readonly external?: readonly unknown[];
    };
  };
}

function resolveExternalizedDeps(plugin: Plugin | undefined): readonly unknown[] {
  const configHook = plugin?.config;
  if (configHook === undefined) {
    return [];
  }

  const buildConfig =
    typeof configHook === 'function'
      ? (configHook({}, { command: 'build', isPreview: false, mode: 'test' }) as
          | ExternalizedBuildConfig
          | undefined)
      : ((configHook.handler({}, { command: 'build', isPreview: false, mode: 'test' }) as
          | ExternalizedBuildConfig
          | undefined) ?? undefined);

  return buildConfig?.build?.rollupOptions?.external ?? [];
}

function isExternalized(entry: unknown, packageId: string): boolean {
  if (typeof entry === 'string') {
    return entry === packageId;
  }

  return entry instanceof RegExp ? entry.test(packageId) : false;
}

describe('desktop electron-vite config', () => {
  it('keeps @cairn/shared-contracts bundled for main and preload so Electron does not load raw workspace TypeScript', () => {
    const desktopConfig = config as {
      readonly main?: {
        readonly plugins?: readonly Plugin[];
      };
      readonly preload?: {
        readonly plugins?: readonly Plugin[];
      };
    };
    const mainExternal = resolveExternalizedDeps(desktopConfig.main?.plugins?.[0]);
    const preloadExternal = resolveExternalizedDeps(desktopConfig.preload?.plugins?.[0]);

    expect(mainExternal.some((entry) => isExternalized(entry, '@cairn/shared-contracts'))).toBe(
      false,
    );
    expect(
      mainExternal.some((entry) => isExternalized(entry, '@cairn/shared-contracts/schemas')),
    ).toBe(false);
    expect(preloadExternal.some((entry) => isExternalized(entry, '@cairn/shared-contracts'))).toBe(
      false,
    );
    expect(
      preloadExternal.some((entry) => isExternalized(entry, '@cairn/shared-contracts/schemas')),
    ).toBe(false);
  });

  it('emits a non-ESM preload entry for sandboxed Electron windows', () => {
    const desktopConfig = config as {
      readonly preload?: {
        readonly build?: {
          readonly rollupOptions?: {
            readonly output?: {
              readonly entryFileNames?: string;
              readonly format?: string;
            };
          };
        };
      };
    };

    expect(desktopConfig.preload?.build?.rollupOptions?.output).toEqual(
      expect.objectContaining({
        entryFileNames: 'index.js',
        format: 'cjs',
      }),
    );
  });
});
