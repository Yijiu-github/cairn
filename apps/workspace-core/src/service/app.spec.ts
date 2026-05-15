// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { createWorkspaceCoreApp } from './app.js';
import { createDefaultWorkspaceCoreContainer } from './container.js';

const ids = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0',
  event: '01HZZZZZZZZZZZZZZZZZZZZZE0',
};

const first = <T>(items: T[]): T => {
  const item = items[0];
  if (item === undefined) {
    throw new Error('Expected at least one item');
  }
  return item;
};

describe('workspace-core app', () => {
  it('serves health status', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const response = await app.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        ok: true,
        service: 'workspace-core',
      });
    } finally {
      await app.close();
    }
  });

  it('creates and reads a single-worker run', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const createResponse = await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/runs`,
        payload: {
          originEventId: ids.event,
          task: {
            taskKind: 'edit',
            title: 'Apply patch',
            brief: 'Update the target module.',
          },
        },
      });

      expect(createResponse.statusCode).toBe(202);
      const created = createResponse.json<{ orchestrationRunId: string; status: string }>();
      expect(created.status).toBe('queued');

      const getResponse = await app.inject({
        method: 'GET',
        url: `/v1/runs/${created.orchestrationRunId}`,
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.json()).toMatchObject({
        orchestrationRunId: created.orchestrationRunId,
        status: 'queued',
      });

      const tasksResponse = await app.inject({
        method: 'GET',
        url: `/v1/runs/${created.orchestrationRunId}/tasks`,
      });

      expect(tasksResponse.statusCode).toBe(200);
      const tasks = tasksResponse.json<{
        items: { taskId: string; title: string; status: string }[];
      }>();
      expect(tasks).toMatchObject({
        items: [{ title: 'Apply patch', status: 'ready' }],
      });
      const task = first(tasks.items);

      const submitResponse = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.taskId}/agent-runs`,
      });

      expect(submitResponse.statusCode).toBe(202);
      expect(submitResponse.json()).toMatchObject({
        taskId: task.taskId,
        status: 'submitted',
        providerRunId: expect.stringContaining('mock:') as unknown,
      });
    } finally {
      await app.close();
    }
  });

  it('registers SourceRoots and creates ContextPack manifests', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const sourceRootResponse = await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/source-roots`,
        payload: {
          displayName: 'Cairn',
          uri: 'file:///G:/Code/cairn',
          excludeGlobs: ['node_modules/**'],
        },
      });

      expect(sourceRootResponse.statusCode).toBe(201);
      const sourceRoot = sourceRootResponse.json<{ sourceRootId: string; status: string }>();
      expect(sourceRoot.status).toBe('active');

      const listResponse = await app.inject({
        method: 'GET',
        url: `/v1/workspaces/${ids.workspace}/source-roots`,
      });

      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json()).toMatchObject({
        items: [{ sourceRootId: sourceRoot.sourceRootId, displayName: 'Cairn' }],
      });

      const runResponse = await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/runs`,
        payload: {
          originEventId: ids.event,
          task: {
            taskKind: 'edit',
            title: 'Apply patch',
            brief: 'Update the target module.',
          },
        },
      });
      const run = runResponse.json<{ orchestrationRunId: string }>();
      const tasksResponse = await app.inject({
        method: 'GET',
        url: `/v1/runs/${run.orchestrationRunId}/tasks`,
      });
      const task = first(tasksResponse.json<{ items: { taskId: string }[] }>().items);

      const contextPackResponse = await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/context-packs`,
        payload: {
          sourceRootIds: [sourceRoot.sourceRootId],
          createdFor: {
            type: 'task',
            taskId: task.taskId,
          },
          query: 'Find persistence code.',
          items: [
            {
              kind: 'user_note',
              reason: 'Operator selected this repo before scanner output exists.',
            },
          ],
        },
      });

      expect(contextPackResponse.statusCode).toBe(201);
      expect(contextPackResponse.json()).toMatchObject({
        workspaceId: ids.workspace,
        sourceRootIds: [sourceRoot.sourceRootId],
        query: 'Find persistence code.',
      });
    } finally {
      await app.close();
    }
  });
});
