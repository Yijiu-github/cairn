// SPDX-License-Identifier: Apache-2.0

import type { WorkspaceCoreConnectionView } from '../shared/workspace-core-connection.js';

export interface CairnDesktopBridge {
  readonly app: {
    readonly mode: 'static-preview';
    readonly name: 'Cairn Desktop';
  };
  readonly sidecar: {
    readonly getConnectionStatus: () => Promise<WorkspaceCoreConnectionView>;
    readonly restart: () => Promise<WorkspaceCoreConnectionView>;
  };
}

export type CairnDesktopInvoke = (
  channel: 'cairn:sidecar:get-connection-status' | 'cairn:sidecar:restart',
) => Promise<WorkspaceCoreConnectionView>;

export const createCairnDesktopBridge = (invoke: CairnDesktopInvoke): CairnDesktopBridge => ({
  app: {
    mode: 'static-preview',
    name: 'Cairn Desktop',
  },
  sidecar: {
    getConnectionStatus: async () => await invoke('cairn:sidecar:get-connection-status'),
    restart: async () => await invoke('cairn:sidecar:restart'),
  },
});
