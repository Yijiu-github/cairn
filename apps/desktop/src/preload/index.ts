// SPDX-License-Identifier: Apache-2.0
import { contextBridge, ipcRenderer } from 'electron';

import type { WorkspaceCoreMockSmokeResult } from '../main/workspace-core-client.js';
import type { WorkspaceCoreSidecarStatus } from '../main/workspace-core-sidecar.js';

export interface CairnDesktopBridge {
  readonly app: {
    readonly mode: 'workspace-core-preview';
    readonly name: 'Cairn Desktop';
  };
  readonly workspaceCore: {
    readonly getStatus: () => Promise<WorkspaceCoreSidecarStatus>;
    readonly runMockSmoke: () => Promise<WorkspaceCoreMockSmokeResult>;
  };
}

const bridge: CairnDesktopBridge = {
  app: {
    mode: 'workspace-core-preview',
    name: 'Cairn Desktop',
  },
  workspaceCore: {
    getStatus: () =>
      ipcRenderer.invoke('workspace-core:get-status') as Promise<WorkspaceCoreSidecarStatus>,
    runMockSmoke: () =>
      ipcRenderer.invoke('workspace-core:run-mock-smoke') as Promise<WorkspaceCoreMockSmokeResult>,
  },
};

contextBridge.exposeInMainWorld('cairnDesktop', bridge);
