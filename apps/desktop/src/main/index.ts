// SPDX-License-Identifier: Apache-2.0
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { is } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell } from 'electron';

import {
  bootstrapDesktopMain,
  writeDesktopSmokeSignalFile,
  writeWorkspaceCoreDiagnosticFile,
} from './workspace-core-bootstrap.js';
import { runWorkspaceCoreMockSmoke } from './workspace-core-client.js';
import {
  WorkspaceCoreSidecarManager,
  createWorkspaceCoreSidecarConfig,
} from './workspace-core-sidecar.js';

import type { WriteDesktopSmokeSignalFileOptions } from './workspace-core-bootstrap.js';
import type { WorkspaceCoreSidecarStatus } from './workspace-core-sidecar.js';

type DesktopSmokeSignalEvent = WriteDesktopSmokeSignalFileOptions['event'];

// Electron main process is the platform boundary. The repository-wide config
// package does not exist yet, so the desktop entry point keeps these two direct
// process reads local to window bootstrap only.
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const rendererDevServerUrl = process.env['ELECTRON_RENDERER_URL'];
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const mainProcessEnv = process.env;
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const desktopWindowSmokeSignalPath = process.env['CAIRN_DESKTOP_WINDOW_SMOKE_SIGNAL_PATH'];

writeDesktopSmokeSignal('main-process-loaded');

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    backgroundColor: '#eef3f8',
    height: 900,
    minHeight: 720,
    minWidth: 1040,
    show: false,
    title: 'Cairn',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: true,
    },
    width: 1280,
  });

  writeDesktopSmokeSignal('main-window-created');

  window.on('ready-to-show', () => {
    writeDesktopSmokeSignal('main-window-ready-to-show');
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (is.dev && rendererDevServerUrl !== undefined) {
    void window.loadURL(rendererDevServerUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

function writeDesktopSmokeSignal(event: DesktopSmokeSignalEvent): void {
  if (desktopWindowSmokeSignalPath === undefined) {
    return;
  }

  void writeDesktopSmokeSignalFile({
    event,
    path: desktopWindowSmokeSignalPath,
  }).catch((error: unknown) => {
    console.error('Desktop smoke signal write failed.', {
      error: error instanceof Error ? error.message : 'unknown error',
      path: desktopWindowSmokeSignalPath,
    });
  });
}

function registerWorkspaceCoreIpcHandlers(
  workspaceCoreSidecar: WorkspaceCoreSidecarManager,
  workspaceCoreAuthToken: string,
): void {
  ipcMain.handle('workspace-core:get-status', async () => {
    return workspaceCoreSidecar.checkHealth();
  });

  ipcMain.handle('workspace-core:run-mock-smoke', async () => {
    const status =
      workspaceCoreSidecar.getStatus().state === 'healthy'
        ? workspaceCoreSidecar.getStatus()
        : await workspaceCoreSidecar.start();

    if (status.state !== 'healthy') {
      throw new Error(status.lastError ?? 'Workspace Core sidecar is not healthy.');
    }

    return runWorkspaceCoreMockSmoke({
      authToken: workspaceCoreAuthToken,
      baseUrl: status.baseUrl,
    });
  });
}

function reportWorkspaceCoreStartupFailure(status: WorkspaceCoreSidecarStatus): void {
  console.error('Workspace Core sidecar failed to become healthy.', {
    baseUrl: status.baseUrl,
    lastError: status.lastError,
    pid: status.pid,
    state: status.state,
  });
}

app.setAppUserModelId('io.cairn.app');

let workspaceCoreSidecar: WorkspaceCoreSidecarManager | undefined;

// Electron's app readiness can stall when the main ESM module is held open by
// top-level await. Keep startup detached so module evaluation can finish first.
// eslint-disable-next-line unicorn/prefer-top-level-await
void startDesktopMain();

async function startDesktopMain(): Promise<void> {
  try {
    await app.whenReady();
    writeDesktopSmokeSignal('main-process-after-app-ready');

    const workspaceCoreAuthToken = randomBytes(32).toString('hex');
    const workspaceCorePort = await findFreeLoopbackPort();
    writeDesktopSmokeSignal('main-process-after-port-allocation');

    const sidecar = new WorkspaceCoreSidecarManager(
      createWorkspaceCoreSidecarConfig({
        authToken: workspaceCoreAuthToken,
        baseEnv: mainProcessEnv,
        nodeExecutable: resolveNodeExecutable(),
        port: workspaceCorePort,
        repoRoot: join(__dirname, '../../../..'),
        userDataPath: app.getPath('userData'),
      }),
    );
    workspaceCoreSidecar = sidecar;

    bootstrapDesktopMain({
      createMainWindow,
      registerWorkspaceCoreIpcHandlers: () => {
        registerWorkspaceCoreIpcHandlers(sidecar, workspaceCoreAuthToken);
      },
      reportWorkspaceCoreStartupFailure,
      startWorkspaceCoreSidecar: () => sidecar.start(),
      writeWorkspaceCoreDiagnostic: (status) =>
        writeWorkspaceCoreDiagnosticFile({
          status,
          userDataPath: app.getPath('userData'),
        }),
    });
    writeDesktopSmokeSignal('main-process-after-bootstrap');
  } catch (error) {
    console.error('Desktop main startup failed.', {
      error: error instanceof Error ? error.message : 'unknown error',
    });
  }
}

app.on('before-quit', () => {
  void workspaceCoreSidecar?.stop();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  // eslint-disable-next-line no-restricted-globals
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function findFreeLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once('error', (error) => {
      reject(error);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        const port = address.port;
        server.close();
        resolve(port);
        return;
      }

      server.close();
      reject(new Error('Failed to allocate a Workspace Core sidecar port.'));
    });
  });
}

function resolveNodeExecutable(): string | undefined {
  const candidates = [
    mainProcessEnv['CAIRN_DESKTOP_NODE_EXECUTABLE'],
    '/opt/homebrew/bin/node',
    '/usr/local/bin/node',
  ];

  return candidates.find((candidate) => candidate !== undefined && existsSync(candidate));
}
