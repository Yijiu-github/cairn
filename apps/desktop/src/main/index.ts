// SPDX-License-Identifier: Apache-2.0
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { is } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell } from 'electron';

import { runWorkspaceCoreMockSmoke } from './workspace-core-client.js';
import {
  WorkspaceCoreSidecarManager,
  createWorkspaceCoreSidecarConfig,
} from './workspace-core-sidecar.js';

// Electron main process is the platform boundary. The repository-wide config
// package does not exist yet, so the desktop entry point keeps these two direct
// process reads local to window bootstrap only.
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const rendererDevServerUrl = process.env['ELECTRON_RENDERER_URL'];
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const mainProcessEnv = process.env;

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
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
    },
    width: 1280,
  });

  window.on('ready-to-show', () => {
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

await app.whenReady();

app.setAppUserModelId('io.cairn.app');

const workspaceCoreAuthToken = randomBytes(32).toString('hex');
const workspaceCoreSidecar = new WorkspaceCoreSidecarManager(
  createWorkspaceCoreSidecarConfig({
    authToken: workspaceCoreAuthToken,
    baseEnv: mainProcessEnv,
    nodeExecutable: resolveNodeExecutable(),
    port: await findFreeLoopbackPort(),
    repoRoot: join(__dirname, '../../../..'),
    userDataPath: app.getPath('userData'),
  }),
);
registerWorkspaceCoreIpcHandlers(workspaceCoreSidecar, workspaceCoreAuthToken);
const initialWorkspaceCoreStatus = await workspaceCoreSidecar.start();
if (initialWorkspaceCoreStatus.state !== 'healthy') {
  console.error('Workspace Core sidecar failed to become healthy.', {
    baseUrl: initialWorkspaceCoreStatus.baseUrl,
    lastError: initialWorkspaceCoreStatus.lastError,
    pid: initialWorkspaceCoreStatus.pid,
    state: initialWorkspaceCoreStatus.state,
  });
}

createMainWindow();

app.on('before-quit', () => {
  void workspaceCoreSidecar.stop();
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
        server.close(() => {
          resolve(port);
        });
        return;
      }

      server.close(() => {
        reject(new Error('Failed to allocate a Workspace Core sidecar port.'));
      });
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
