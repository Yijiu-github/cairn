// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from 'vitest';

import { RunReplaySource as RunReplaySourceSchema } from '@cairn/shared-contracts';

import {
  getWorkspaceCoreArtifactPayload,
  getWorkspaceCoreRunReplaySource,
  parseWorkspaceCoreArtifactId,
  parseWorkspaceCoreRunId,
  runWorkspaceCoreInternalTrial,
} from './workspace-core-client.js';

import type { RunReplaySource } from '@cairn/shared-contracts';

describe('workspace-core client', () => {
  it('runs the Desktop internal-trial flow through fixed Workspace Core endpoints', async () => {
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
          items: [{ taskId: 'task-1', status: 'ready', title: 'Desktop internal trial' }],
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
            { traceEventId: 'trace-1', eventType: 'run.queued' },
            { traceEventId: 'trace-2', eventType: 'run.succeeded' },
          ],
          total: 2,
        });
      }

      throw new Error(`Unexpected URL ${requestUrl}`);
    };

    const result = await runWorkspaceCoreInternalTrial({
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
        brief: 'Exercise the Cairn Desktop internal-trial run path.',
        taskKind: 'custom',
        title: 'Desktop internal trial',
      },
    });
    expect(requests[2]?.body).toEqual({
      model: 'default',
      prompt: 'Reply with exactly: Cairn internal trial ok',
      runtimeType: 'codex',
    });
  });

  it('reads run replay source through the fixed Workspace Core endpoint', async () => {
    const requests: { authorization?: string | undefined; method: string; url: string }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      const requestUrl = toRequestUrl(url);
      requests.push({
        authorization:
          init?.headers instanceof Headers
            ? (init.headers.get('authorization') ?? undefined)
            : (init?.headers as Record<string, string> | undefined)?.['authorization'],
        method: init?.method ?? 'GET',
        url: requestUrl,
      });

      if (
        requestUrl === 'http://127.0.0.1:51324/v1/runs/01J000000000000000000000R0/replay-source'
      ) {
        await Promise.resolve();
        return jsonResponse(200, createRunReplaySourceFixture());
      }

      throw new Error(`Unexpected URL ${requestUrl}`);
    };

    const result = await getWorkspaceCoreRunReplaySource({
      authToken: 'desktop-launch-token',
      baseUrl: 'http://127.0.0.1:51324',
      fetch: fetchImpl,
      runId: '01J000000000000000000000R0',
    });

    expect(result.inspector).toMatchObject({
      status: 'running',
      taskCount: 1,
      traceEventCount: 1,
    });
    expect(requests).toEqual([
      {
        authorization: 'Bearer desktop-launch-token',
        method: 'GET',
        url: 'http://127.0.0.1:51324/v1/runs/01J000000000000000000000R0/replay-source',
      },
    ]);
  });

  it('requests replay evidence without leaking auth details into the response shape', async () => {
    const fetchImpl: typeof fetch = (url, init) => {
      const requestUrl = toRequestUrl(url);

      expect(requestUrl).toBe(
        'http://127.0.0.1:51324/v1/runs/01J000000000000000000000R0/replay-source',
      );
      expect(init?.method).toBe('GET');
      expect(init?.headers).toMatchObject({
        authorization: 'Bearer desktop-launch-token',
      });

      return Promise.resolve(
        jsonResponse(
          200,
          createRunReplaySourceFixture({
            agentRuns: [
              {
                attempt: 0,
                cancelable: false,
                createdAt: '2026-05-20T00:00:00.000Z',
                finishedAt: '2026-05-20T00:00:01.000Z',
                orchestrationRunId: '01J000000000000000000000R0',
                retryable: false,
                runId: '01J000000000000000000000A0',
                runtimeType: 'codex',
                status: 'succeeded',
                taskId: '01J000000000000000000000K0',
                traceId: '01J000000000000000000000T0',
                updatedAt: '2026-05-20T00:00:01.000Z',
                workspaceId: '01J000000000000000000000W0',
              },
            ],
            inspector: {
              agentRunCount: 1,
              artifactCount: 1,
              errorEventCount: 0,
              status: 'succeeded',
              taskCount: 1,
              traceEventCount: 2,
              warningEventCount: 0,
            },
            run: {
              createdAt: '2026-05-20T00:00:00.000Z',
              completionLevel: 'full',
              executionMode: 'single_worker',
              finishedAt: '2026-05-20T00:00:01.000Z',
              hasPartialFailures: false,
              orchestrationRunId: '01J000000000000000000000R0',
              originEventId: '01J000000000000000000000E0',
              resultCompleteness: 'complete',
              status: 'succeeded',
              traceId: '01J000000000000000000000T0',
              updatedAt: '2026-05-20T00:00:01.000Z',
              workspaceId: '01J000000000000000000000W0',
            },
            tasks: [
              {
                attempt: 0,
                artifactRefs: [],
                brief: 'Desktop internal-trial replay fixture',
                contextRefs: [],
                createdAt: '2026-05-20T00:00:00.000Z',
                dependsOnTaskIds: [],
                idempotencyKey: 'run-detail-key',
                orchestrationRunId: '01J000000000000000000000R0',
                priority: 50,
                status: 'succeeded',
                taskId: '01J000000000000000000000K0',
                taskKind: 'custom',
                title: 'Desktop internal-trial replay fixture',
                updatedAt: '2026-05-20T00:00:01.000Z',
                workspaceId: '01J000000000000000000000W0',
              },
            ],
            traceEvents: [
              {
                createdAt: '2026-05-20T00:00:00.000Z',
                eventType: 'run.succeeded',
                level: 'info',
                orchestrationRunId: '01J000000000000000000000R0',
                payloadInline: {},
                traceEventId: '01J000000000000000000000V1',
                traceId: '01J000000000000000000000T0',
                workspaceId: '01J000000000000000000000W0',
              },
            ],
          }),
        ),
      );
    };

    const replaySource = await getWorkspaceCoreRunReplaySource({
      authToken: 'desktop-launch-token',
      baseUrl: 'http://127.0.0.1:51324',
      fetch: fetchImpl,
      runId: '01J000000000000000000000R0',
    });

    expect(replaySource).toMatchObject({
      inspector: {
        status: 'succeeded',
        traceEventCount: 2,
      },
      run: {
        orchestrationRunId: '01J000000000000000000000R0',
      },
    });
    expect(JSON.stringify(replaySource)).not.toContain('desktop-launch-token');
    expect(JSON.stringify(replaySource)).not.toContain('http://127.0.0.1:51324');
  });

  it('rejects invalid replay source run ids before calling Workspace Core', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      getWorkspaceCoreRunReplaySource({
        authToken: 'desktop-launch-token',
        baseUrl: 'http://127.0.0.1:51324',
        fetch: fetchImpl,
        runId: '../not-a-run',
      }),
    ).rejects.toThrow('Invalid Workspace Core run id.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects malformed replay-source payloads before returning them across Desktop bridge', async () => {
    const fetchImpl: typeof fetch = () =>
      Promise.resolve(
        jsonResponse(200, {
          run: {
            orchestrationRunId: '01J000000000000000000000R0',
          },
        }),
      );

    await expect(
      getWorkspaceCoreRunReplaySource({
        authToken: 'desktop-launch-token',
        baseUrl: 'http://127.0.0.1:51324',
        fetch: fetchImpl,
        runId: '01J000000000000000000000R0',
      }),
    ).rejects.toThrow('Workspace Core returned an invalid replay source payload.');
  });

  it('reads bounded artifact payload text through the fixed Workspace Core endpoint', async () => {
    const requests: { authorization?: string | undefined; method: string; url: string }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      const requestUrl = toRequestUrl(url);
      requests.push({
        authorization:
          init?.headers instanceof Headers
            ? (init.headers.get('authorization') ?? undefined)
            : (init?.headers as Record<string, string> | undefined)?.['authorization'],
        method: init?.method ?? 'GET',
        url: requestUrl,
      });

      if (requestUrl === 'http://127.0.0.1:51324/v1/artifacts/01J000000000000000000000F0/payload') {
        await Promise.resolve();
        return jsonResponse(200, {
          artifactId: '01J000000000000000000000F0',
          mediaType: 'text/plain',
          text: 'Cairn internal trial ok',
          truncated: false,
        });
      }

      throw new Error(`Unexpected URL ${requestUrl}`);
    };

    const result = await getWorkspaceCoreArtifactPayload({
      artifactId: '01J000000000000000000000F0',
      authToken: 'desktop-launch-token',
      baseUrl: 'http://127.0.0.1:51324',
      fetch: fetchImpl,
    });

    expect(result).toEqual({
      artifactId: '01J000000000000000000000F0',
      mediaType: 'text/plain',
      text: 'Cairn internal trial ok',
      truncated: false,
    });
    expect(requests).toEqual([
      {
        authorization: 'Bearer desktop-launch-token',
        method: 'GET',
        url: 'http://127.0.0.1:51324/v1/artifacts/01J000000000000000000000F0/payload',
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('desktop-launch-token');
    expect(JSON.stringify(result)).not.toContain('http://127.0.0.1:51324');
  });

  it('rejects invalid artifact ids before calling Workspace Core for payload text', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      getWorkspaceCoreArtifactPayload({
        artifactId: '../not-an-artifact',
        authToken: 'desktop-launch-token',
        baseUrl: 'http://127.0.0.1:51324',
        fetch: fetchImpl,
      }),
    ).rejects.toThrow('Invalid Workspace Core artifact id.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects malformed artifact payload responses before returning them across Desktop bridge', async () => {
    const fetchImpl: typeof fetch = () =>
      Promise.resolve(
        jsonResponse(200, {
          artifactId: '01J000000000000000000000F0',
          text: 'missing mediaType and truncated',
        }),
      );

    await expect(
      getWorkspaceCoreArtifactPayload({
        artifactId: '01J000000000000000000000F0',
        authToken: 'desktop-launch-token',
        baseUrl: 'http://127.0.0.1:51324',
        fetch: fetchImpl,
      }),
    ).rejects.toThrow(
      'Workspace Core returned an invalid response payload for GET /v1/artifacts/01J000000000000000000000F0/payload.',
    );
  });

  it('rejects malformed internal-trial list payloads before returning them across Desktop bridge', async () => {
    const fetchImpl: typeof fetch = async (url, init) => {
      const requestUrl = toRequestUrl(url);

      if (
        init?.method === 'POST' &&
        requestUrl === 'http://127.0.0.1:51324/v1/workspaces/01J000000000000000000000W0/runs'
      ) {
        await Promise.resolve();
        return jsonResponse(202, {
          orchestrationRunId: 'run-1',
          status: 'queued',
        });
      }

      if (requestUrl === 'http://127.0.0.1:51324/v1/runs/run-1/tasks') {
        await Promise.resolve();
        return jsonResponse(200, { items: [{ status: 'ready' }], total: 1 });
      }

      throw new Error(`Unexpected URL ${requestUrl}`);
    };

    await expect(
      runWorkspaceCoreInternalTrial({
        authToken: 'desktop-launch-token',
        baseUrl: 'http://127.0.0.1:51324',
        fetch: fetchImpl,
        workspaceId: '01J000000000000000000000W0',
      }),
    ).rejects.toThrow(
      'Workspace Core returned an invalid response payload for GET /v1/runs/run-1/tasks.',
    );
  });

  it('normalizes valid run ids', () => {
    expect(parseWorkspaceCoreRunId('01J000000000000000000000R0')).toBe(
      '01J000000000000000000000R0',
    );
  });

  it('normalizes valid artifact ids', () => {
    expect(parseWorkspaceCoreArtifactId('01J000000000000000000000F0')).toBe(
      '01J000000000000000000000F0',
    );
  });
});

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

function createRunReplaySourceFixture(overrides: Record<string, unknown> = {}): RunReplaySource {
  return RunReplaySourceSchema.parse({
    agentRuns: [
      {
        attempt: 0,
        cancelable: false,
        createdAt: '2026-05-20T00:00:00.000Z',
        orchestrationRunId: '01J000000000000000000000R0',
        retryable: false,
        runId: '01J000000000000000000000A0',
        runtimeType: 'codex',
        status: 'running',
        taskId: '01J000000000000000000000K0',
        traceId: '01J000000000000000000000T0',
        updatedAt: '2026-05-20T00:00:00.000Z',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    artifacts: [
      {
        artifactId: '01J000000000000000000000F0',
        artifactRole: 'output',
        createdAt: '2026-05-20T00:00:00.000Z',
        formatVersion: '1',
        kind: 'text',
        producerType: 'agent',
        sensitivity: 'none',
        uriOrPath: 'artifact-payload://redacted',
        visibility: 'debug',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    inspector: {
      agentRunCount: 1,
      artifactCount: 1,
      errorEventCount: 0,
      status: 'running',
      taskCount: 1,
      traceEventCount: 1,
      warningEventCount: 0,
    },
    run: {
      createdAt: '2026-05-20T00:00:00.000Z',
      completionLevel: 'failed',
      executionMode: 'single_worker',
      hasPartialFailures: false,
      orchestrationRunId: '01J000000000000000000000R0',
      originEventId: '01J000000000000000000000E0',
      resultCompleteness: 'empty',
      status: 'running',
      traceId: '01J000000000000000000000T0',
      updatedAt: '2026-05-20T00:00:00.000Z',
      workspaceId: '01J000000000000000000000W0',
    },
    tasks: [
      {
        attempt: 0,
        artifactRefs: [],
        brief: 'Desktop internal-trial replay fixture',
        contextRefs: [],
        createdAt: '2026-05-20T00:00:00.000Z',
        dependsOnTaskIds: [],
        idempotencyKey: 'run-detail-key',
        orchestrationRunId: '01J000000000000000000000R0',
        priority: 50,
        status: 'running',
        taskId: '01J000000000000000000000K0',
        taskKind: 'custom',
        title: 'Desktop internal-trial replay fixture',
        updatedAt: '2026-05-20T00:00:00.000Z',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    traceEvents: [
      {
        createdAt: '2026-05-20T00:00:00.000Z',
        eventType: 'run.queued',
        level: 'info',
        orchestrationRunId: '01J000000000000000000000R0',
        payloadInline: {},
        traceEventId: '01J000000000000000000000V0',
        traceId: '01J000000000000000000000T0',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    ...overrides,
  });
}

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
