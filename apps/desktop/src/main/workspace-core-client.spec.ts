// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { runWorkspaceCoreMockSmoke } from './workspace-core-client.js';

describe('workspace-core client', () => {
  it('runs the bounded mock smoke flow through fixed Workspace Core endpoints', async () => {
    const requests: { body?: unknown; method: string; url: string }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      const method = init?.method ?? 'GET';
      const requestUrl = toRequestUrl(url);
      requests.push({
        body: init?.body === undefined ? undefined : JSON.parse(toRequestBody(init.body)),
        method,
        url: requestUrl,
      });

      if (
        method === 'POST' &&
        requestUrl === 'http://127.0.0.1:51324/v1/workspaces/01J000000000000000000000W0/runs'
      ) {
        await Promise.resolve();
        return jsonResponse(202, {
          orchestrationRunId: 'run-1',
          status: 'queued',
        });
      }

      if (method === 'GET' && requestUrl === 'http://127.0.0.1:51324/v1/runs/run-1/tasks') {
        await Promise.resolve();
        return jsonResponse(200, {
          items: [{ taskId: 'task-1', status: 'ready', title: 'Desktop mock smoke' }],
          total: 1,
        });
      }

      if (method === 'POST' && requestUrl === 'http://127.0.0.1:51324/v1/tasks/task-1/agent-runs') {
        await Promise.resolve();
        return jsonResponse(201, {
          agentRunId: 'agent-run-1',
          status: 'submitted',
        });
      }

      if (
        method === 'POST' &&
        requestUrl === 'http://127.0.0.1:51324/v1/agent-runs/agent-run-1/drain-runtime'
      ) {
        await Promise.resolve();
        return jsonResponse(202, {
          agentRunId: 'agent-run-1',
          eventCount: 5,
        });
      }

      if (method === 'GET' && requestUrl === 'http://127.0.0.1:51324/v1/runs/run-1') {
        await Promise.resolve();
        return jsonResponse(200, {
          finalResponseRef: 'artifact-output-1',
          orchestrationRunId: 'run-1',
          status: 'succeeded',
        });
      }

      if (method === 'GET' && requestUrl === 'http://127.0.0.1:51324/v1/tasks/task-1') {
        await Promise.resolve();
        return jsonResponse(200, {
          status: 'succeeded',
          taskId: 'task-1',
        });
      }

      if (method === 'GET' && requestUrl === 'http://127.0.0.1:51324/v1/tasks/task-1/agent-runs') {
        await Promise.resolve();
        return jsonResponse(200, {
          items: [{ runId: 'agent-run-1', status: 'succeeded' }],
          total: 1,
        });
      }

      if (method === 'GET' && requestUrl === 'http://127.0.0.1:51324/v1/runs/run-1/artifacts') {
        await Promise.resolve();
        return jsonResponse(200, {
          items: [
            { artifactId: 'artifact-output-1', artifactRole: 'output' },
            { artifactId: 'artifact-input-1', artifactRole: 'input' },
          ],
          total: 2,
        });
      }

      if (
        method === 'GET' &&
        requestUrl === 'http://127.0.0.1:51324/v1/runs/run-1/trace?limit=50'
      ) {
        await Promise.resolve();
        return jsonResponse(200, {
          items: [
            { eventId: 'trace-1', eventType: 'run.queued' },
            { eventId: 'trace-2', eventType: 'run.succeeded' },
          ],
          total: 2,
        });
      }

      throw new Error(`Unexpected URL ${requestUrl}`);
    };

    const result = await runWorkspaceCoreMockSmoke({
      authToken: 'desktop-launch-token',
      baseUrl: 'http://127.0.0.1:51324',
      fetch: fetchImpl,
      workspaceId: '01J000000000000000000000W0',
    });

    expect(result).toEqual({
      agentRunStatuses: ['succeeded'],
      artifactCount: 2,
      artifactRoles: ['output', 'input'],
      finalResponseRef: 'artifact-output-1',
      runId: 'run-1',
      runStatus: 'succeeded',
      taskId: 'task-1',
      taskStatus: 'succeeded',
      traceCount: 2,
    });
    expect(requests.map((request) => `${request.method} ${request.url}`)).toEqual([
      'POST http://127.0.0.1:51324/v1/workspaces/01J000000000000000000000W0/runs',
      'GET http://127.0.0.1:51324/v1/runs/run-1/tasks',
      'POST http://127.0.0.1:51324/v1/tasks/task-1/agent-runs',
      'POST http://127.0.0.1:51324/v1/agent-runs/agent-run-1/drain-runtime',
      'GET http://127.0.0.1:51324/v1/runs/run-1',
      'GET http://127.0.0.1:51324/v1/tasks/task-1',
      'GET http://127.0.0.1:51324/v1/tasks/task-1/agent-runs',
      'GET http://127.0.0.1:51324/v1/runs/run-1/artifacts',
      'GET http://127.0.0.1:51324/v1/runs/run-1/trace?limit=50',
    ]);
    expect(requests[0]?.body).toEqual({
      originEventId: '01J000000000000000000000E0',
      task: {
        brief: 'Exercise the Desktop to Workspace Core mock runtime path.',
        taskKind: 'custom',
        title: 'Desktop mock smoke',
      },
    });
  });
});

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

const toRequestUrl = (url: RequestInfo | URL): string => {
  if (typeof url === 'string') {
    return url;
  }

  if (url instanceof URL) {
    return url.href;
  }

  return url.url;
};

const toRequestBody = (body: BodyInit | null): string => {
  if (typeof body === 'string') {
    return body;
  }

  throw new Error('Expected JSON string request body.');
};
