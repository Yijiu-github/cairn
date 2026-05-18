// SPDX-License-Identifier: Apache-2.0
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cwd, env, platform } from 'node:process';

import { is } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell } from 'electron';

import { sanitizeWorkspaceCoreConnection } from '../shared/workspace-core-connection.js';

import { WorkspaceCoreSidecarManager } from './workspace-core-sidecar.js';

const rendererDevServerUrl = env['ELECTRON_RENDERER_URL'];

const sidecarFetch = async (
  input: string | URL,
  init?: {
    readonly headers?: Record<string, string>;
    readonly signal?: AbortSignal;
  },
) => {
  const response = await fetch(input, init);
  return {
    ok: response.ok,
    status: response.status,
  };
};

const sidecarManager = new WorkspaceCoreSidecarManager({
  databasePath:
    env['CAIRN_WORKSPACE_CORE_DB_PATH'] ?? join(tmpdir(), 'cairn-workspace-core.sqlite'),
  fetch: sidecarFetch,
  mode: is.dev ? 'development' : 'packaged',
  workspaceRootDir: cwd(),
});

ipcMain.handle('cairn:sidecar:get-connection-status', () => {
  const snapshot = sidecarManager.getStatus();
  return sanitizeWorkspaceCoreConnection(snapshot);
});

ipcMain.handle('cairn:sidecar:restart', async () => {
  const snapshot = await sidecarManager.restart();
  return sanitizeWorkspaceCoreConnection(snapshot);
});

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

await app.whenReady();

app.setAppUserModelId('io.cairn.app');

void sidecarManager.start();

createMainWindow();

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    void sidecarManager.stop();
    app.quit();
  }
});

app.on('before-quit', () => {
  void sidecarManager.stop();
});
