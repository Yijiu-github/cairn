// SPDX-License-Identifier: Apache-2.0
import { join } from 'node:path';

import { is } from '@electron-toolkit/utils';
import { app, BrowserWindow, shell } from 'electron';

// Electron main process is the platform boundary. The repository-wide config
// package does not exist yet, so the desktop entry point keeps these two direct
// process reads local to window bootstrap only.
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const rendererDevServerUrl = process.env['ELECTRON_RENDERER_URL'];

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

createMainWindow();

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
