// SPDX-License-Identifier: Apache-2.0
import { setTimeout as delay } from 'node:timers/promises';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BootstrapDesktopMainOptions } from './workspace-core-bootstrap.js';

const desktopHarness = vi.hoisted(() => {
  let resolveWhenReady: (() => void) | undefined;
  const whenReady = new Promise<void>((resolve) => {
    resolveWhenReady = resolve;
  });

  return {
    app: {
      getPath: vi.fn((name: string) => `/tmp/${name}`),
      on: vi.fn(),
      quit: vi.fn(),
      setAppUserModelId: vi.fn(),
      whenReady: vi.fn(() => whenReady),
    },
    bootstrapDesktopMain: vi.fn((_: BootstrapDesktopMainOptions) => ({
      sidecarStartup: Promise.resolve({
        baseUrl: 'http://127.0.0.1:4321',
        state: 'healthy' as const,
      }),
    })),
    ipcMain: {
      handle: vi.fn(),
    },
    releaseWhenReady: () => {
      resolveWhenReady?.();
    },
  };
});

vi.mock('electron', () => ({
  BrowserWindow: class {
    public static getAllWindows(): unknown[] {
      return [];
    }

    public readonly webContents = {
      setWindowOpenHandler: vi.fn(),
    };

    public constructor() {
      return;
    }

    public loadFile(): void {
      return;
    }

    public loadURL(): void {
      return;
    }

    public on(): void {
      return;
    }
  },
  app: desktopHarness.app,
  ipcMain: desktopHarness.ipcMain,
  shell: {
    openExternal: vi.fn(),
  },
}));

vi.mock('@electron-toolkit/utils', () => ({
  is: {
    dev: true,
  },
}));

vi.mock('./workspace-core-bootstrap.js', () => ({
  bootstrapDesktopMain: desktopHarness.bootstrapDesktopMain,
  writeDesktopSmokeSignalFile: vi.fn(),
  writeWorkspaceCoreDiagnosticFile: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('desktop main startup', () => {
  it('finishes module evaluation before app readiness resolves', async () => {
    const mainModule = import('./index.js');

    await expect(
      Promise.race([mainModule.then(() => 'resolved'), delay(100).then(() => 'pending')]),
    ).resolves.toBe('resolved');

    expect(desktopHarness.app.setAppUserModelId).toHaveBeenCalledWith('io.cairn.app');
    expect(desktopHarness.bootstrapDesktopMain).not.toHaveBeenCalled();

    desktopHarness.releaseWhenReady();
    await waitFor(() => desktopHarness.bootstrapDesktopMain.mock.calls.length === 1);

    expect(desktopHarness.bootstrapDesktopMain).toHaveBeenCalledTimes(1);
    const bootstrapOptions = desktopHarness.bootstrapDesktopMain.mock.calls[0]?.[0];
    expect(bootstrapOptions).toBeDefined();
    bootstrapOptions?.registerWorkspaceCoreIpcHandlers();

    expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
      'workspace-core:get-status',
      expect.any(Function),
    );
    expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
      'workspace-core:run-mock-smoke',
      expect.any(Function),
    );
    expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
      'workspace-core:get-run-replay-source',
      expect.any(Function),
    );
  });
});

async function waitFor(assertion: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (assertion()) {
      return;
    }

    await delay(10);
  }

  throw new Error('Timed out waiting for desktop main startup.');
}
