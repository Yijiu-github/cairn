// SPDX-License-Identifier: Apache-2.0

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { openSqliteStorage } from '@cairn/storage/sqlite';

import { MockRuntimeGatewayPort } from '../runtime/mock-runtime-gateway-port.js';
import { createWorkspaceCoreContainer } from '../service/container.js';

import { SqliteApplicationRepository } from './sqlite-application-repository.js';

import type { WorkspaceCoreContainer } from '../service/container.js';
import type { EventId, OrchestrationRunId, WorkspaceId } from '@cairn/shared-contracts/schemas';

const ids = {
  workspace: '01J000000000000000000000W1' as WorkspaceId,
  event: '01J000000000000000000000E1' as EventId,
};

const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe.skipIf(!isNativeSqliteAvailable())('SqliteApplicationRepository', () => {
  it('persists run graph records across repository instances', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cairn-workspace-core-'));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, 'workspace.sqlite');
    let createdRunId: OrchestrationRunId;

    const first = openRepository(databasePath);

    try {
      const created = await first.container.orchestrationRuns.createSingleWorkerRun({
        workspaceId: ids.workspace,
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Persist task',
          brief: 'Verify SQLite persistence.',
        },
      });
      createdRunId = created.run.orchestrationRunId;

      expect(await first.container.repository.getRun(createdRunId)).toMatchObject({
        orchestrationRunId: created.run.orchestrationRunId,
        status: 'queued',
      });
    } finally {
      first.close();
    }

    const second = openRepository(databasePath);

    try {
      expect(await second.container.repository.getRun(createdRunId)).toMatchObject({
        orchestrationRunId: createdRunId,
        status: 'queued',
      });

      const tasks = await second.container.repository.listTasksByRun(createdRunId);
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        title: 'Persist task',
        status: 'ready',
      });
    } finally {
      second.close();
    }
  });
});

function openRepository(databasePath: string): {
  container: WorkspaceCoreContainer;
  close: () => void;
} {
  const storage = openSqliteStorage({ databasePath });
  const repository = new SqliteApplicationRepository(storage.db);
  repository.migrate();
  repository.ensureBootstrapWorkspace({
    workspaceId: ids.workspace,
    originEventId: ids.event,
  });

  return {
    container: createWorkspaceCoreContainer(repository, new MockRuntimeGatewayPort()),
    close: () => {
      storage.close();
    },
  };
}

function isNativeSqliteAvailable(): boolean {
  try {
    const storage = openSqliteStorage({ databasePath: ':memory:' });
    storage.close();
    return true;
  } catch {
    return false;
  }
}
