// SPDX-License-Identifier: Apache-2.0
import { expect, it } from 'vitest';

import { createCairnDesktopBridge } from './bridge.js';

it('exposes only the sidecar status and restart allowlist', async () => {
  const bridge = createCairnDesktopBridge(
    (channel) =>
      Promise.resolve({
        detail: `response for ${channel}`,
        mode: 'development',
        state: 'connected',
        updatedAt: '2026-05-18T10:00:00.000Z',
      }),
    () =>
      Promise.resolve({
        connection: {
          detail: 'Workspace Core sidecar is connected.',
          mode: 'development',
          state: 'connected',
          updatedAt: '2026-05-18T10:00:00.000Z',
        },
        runs: [],
        updatedAt: '2026-05-18T10:00:00.000Z',
      }),
  );

  expect(Object.keys(bridge)).toEqual(['app', 'sidecar', 'workspace']);
  expect(Object.keys(bridge.sidecar)).toEqual(['getConnectionStatus', 'restart']);
  expect(Object.keys(bridge.workspace)).toEqual(['readSnapshot']);

  await expect(bridge.sidecar.getConnectionStatus()).resolves.toMatchObject({
    detail: 'response for cairn:sidecar:get-connection-status',
  });
  await expect(bridge.workspace.readSnapshot()).resolves.toMatchObject({
    connection: {
      state: 'connected',
    },
    runs: [],
  });
});
