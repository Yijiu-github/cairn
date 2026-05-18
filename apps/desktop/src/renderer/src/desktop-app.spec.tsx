// SPDX-License-Identifier: Apache-2.0
import { expect, it } from 'vitest';

import {
  mapWorkspaceCoreConnectionToRuntimeView,
  mapWorkspaceCoreConnectionToStatusBadge,
} from '../../shared/workspace-core-connection.js';

it('maps connected workspace core status into ready runtime copy', () => {
  const connection = {
    detail: 'Workspace Core sidecar is connected.',
    mode: 'development' as const,
    state: 'connected' as const,
    updatedAt: '2026-05-18T10:00:00.000Z',
  };

  expect(mapWorkspaceCoreConnectionToStatusBadge(connection)).toMatchObject({
    label: 'Workspace Core',
    metadata: 'connected',
    tone: 'success',
  });
  expect(mapWorkspaceCoreConnectionToRuntimeView(connection)).toMatchObject({
    runtimeLabel: 'Workspace Core',
    status: 'ready',
  });
});
