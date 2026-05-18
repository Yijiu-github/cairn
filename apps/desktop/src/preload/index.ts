// SPDX-License-Identifier: Apache-2.0
import { contextBridge, ipcRenderer } from 'electron';

import { workspaceCoreConnectionViewSchema } from '../shared/workspace-core-connection.js';

import { createCairnDesktopBridge } from './bridge.js';

const bridge = createCairnDesktopBridge(async (channel) =>
  workspaceCoreConnectionViewSchema.parse(await ipcRenderer.invoke(channel)),
);

contextBridge.exposeInMainWorld('cairnDesktop', bridge);
