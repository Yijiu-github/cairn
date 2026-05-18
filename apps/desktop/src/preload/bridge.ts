// SPDX-License-Identifier: Apache-2.0

import type { WorkspaceCoreConnectionView } from '../shared/workspace-core-connection.js';
import type { WorkspaceCoreReadSnapshot } from '../shared/workspace-core-data.js';

export interface CairnDesktopBridge {
  readonly app: {
    readonly mode: 'static-preview';
    readonly name: 'Cairn Desktop';
  };
  readonly sidecar: {
    readonly getConnectionStatus: () => Promise<WorkspaceCoreConnectionView>;
    readonly restart: () => Promise<WorkspaceCoreConnectionView>;
  };
  readonly workspace: {
    readonly readSnapshot: () => Promise<WorkspaceCoreReadSnapshot>;
  };
}

export type CairnDesktopSidecarInvoke = (
  channel: 'cairn:sidecar:get-connection-status' | 'cairn:sidecar:restart',
) => Promise<WorkspaceCoreConnectionView>;

export type CairnDesktopWorkspaceInvoke = (
  channel: 'cairn:workspace:read-snapshot',
) => Promise<WorkspaceCoreReadSnapshot>;

export const createCairnDesktopBridge = (
  sidecarInvoke: CairnDesktopSidecarInvoke,
  workspaceInvoke: CairnDesktopWorkspaceInvoke,
): CairnDesktopBridge => ({
  app: {
    mode: 'static-preview',
    name: 'Cairn Desktop',
  },
  sidecar: {
    getConnectionStatus: async () => await sidecarInvoke('cairn:sidecar:get-connection-status'),
    restart: async () => await sidecarInvoke('cairn:sidecar:restart'),
  },
  workspace: {
    readSnapshot: async () => await workspaceInvoke('cairn:workspace:read-snapshot'),
  },
});
