// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { createMockRuntimeAdapter } from '@cairn/runtime-gateway/adapters/mock';

import { MockRuntimeGatewayPort } from '../runtime/mock-runtime-gateway-port.js';
import { RuntimeAdapterGatewayPort } from '../runtime/runtime-adapter-gateway-port.js';

import { createWorkspaceCoreApp } from './app.js';
import { createDefaultWorkspaceCoreContainer } from './container.js';

import type { CodeContextScannerPort } from '@cairn/application';

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

const createScanner = (): CodeContextScannerPort => ({
  scan: () =>
    Promise.resolve([
      {
        path: 'packages/application/src/index.ts',
        sizeBytes: 128,
        mtimeMs: 1_768_000_000_000,
        digest: 'sha256:index',
        language: 'typescript',
      },
      {
        path: 'README.md',
        sizeBytes: 256,
        mtimeMs: 1_768_000_000_001,
        digest: 'sha256:readme',
        language: 'markdown',
      },
    ]),
});

const createSubmittedRun = async (app: Awaited<ReturnType<typeof createWorkspaceCoreApp>>) => {
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
  const run = createResponse.json<{ orchestrationRunId: string }>();

  const tasksResponse = await app.inject({
    method: 'GET',
    url: `/v1/runs/${run.orchestrationRunId}/tasks`,
  });
  const task = first(tasksResponse.json<{ items: { taskId: string }[] }>().items);

  await app.inject({
    method: 'POST',
    url: `/v1/tasks/${task.taskId}/agent-runs`,
    payload: { runtimeType: 'codex', model: 'default', prompt: 'Say hello.' },
  });

  return { runId: run.orchestrationRunId, taskId: task.taskId };
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
        payload: { runtimeType: 'codex', model: 'default', prompt: 'Say hello.' },
      });

      expect(submitResponse.statusCode).toBe(201);
      expect(submitResponse.json()).toMatchObject({
        agentRunId: expect.any(String) as unknown,
        taskId: task.taskId,
        status: 'submitted',
        providerRunId: expect.stringContaining('mock:') as unknown,
      });
    } finally {
      await app.close();
    }
  });

  it('lists workspace runs with pagination and filtering', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/runs`,
        payload: {
          originEventId: ids.event,
          task: {
            taskKind: 'edit',
            title: 'First run',
            brief: 'First run brief.',
          },
        },
      });
      await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/runs`,
        payload: {
          originEventId: '01HZZZZZZZZZZZZZZZZZZZZZE1',
          task: {
            taskKind: 'edit',
            title: 'Second run',
            brief: 'Second run brief.',
          },
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/workspaces/${ids.workspace}/runs?limit=1&status=queued`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ total: 2, items: [{ status: 'queued' }] });
    } finally {
      await app.close();
    }
  });

  it('drains submitted AgentRun runtime events into terminal state', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId, taskId } = await createSubmittedRun(app);
      const agentRunsResponse = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${taskId}/agent-runs`,
      });
      const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

      const drainResponse = await app.inject({
        method: 'POST',
        url: `/v1/agent-runs/${agentRun.runId}/drain-runtime`,
        payload: {},
      });

      expect(drainResponse.statusCode).toBe(202);
      expect(drainResponse.json()).toMatchObject({
        agentRunId: agentRun.runId,
      });

      const runResponse = await app.inject({ method: 'GET', url: `/v1/runs/${runId}` });
      expect(runResponse.json()).toMatchObject({
        orchestrationRunId: runId,
        status: 'succeeded',
        finalResponseRef: expect.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/) as unknown,
      });
    } finally {
      await app.close();
    }
  });

  it('drains runtime events through a RuntimeAdapter-backed gateway port', async () => {
    const runtimeAdapter = createMockRuntimeAdapter({ clock: () => 1_715_654_400_000 });
    await runtimeAdapter.init({
      workdir: '/tmp/cairn-runtime-adapter-gateway-test',
      config: {},
      secrets: {
        async get() {
          await Promise.resolve();
          return undefined;
        },
      },
      logger: {
        debug() {
          return;
        },
        info() {
          return;
        },
        warn() {
          return;
        },
        error() {
          return;
        },
      },
    });
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer({
        runtimeGateway: new RuntimeAdapterGatewayPort(runtimeAdapter),
      }),
      logger: false,
    });

    try {
      const { runId, taskId } = await createSubmittedRun(app);
      const agentRunsResponse = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${taskId}/agent-runs`,
      });
      const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

      const drainResponse = await app.inject({
        method: 'POST',
        url: `/v1/agent-runs/${agentRun.runId}/drain-runtime`,
        payload: {},
      });

      expect(drainResponse.statusCode).toBe(202);
      expect(drainResponse.json()).toMatchObject({
        agentRunId: agentRun.runId,
        eventCount: 5,
      });

      const runResponse = await app.inject({ method: 'GET', url: `/v1/runs/${runId}` });
      expect(runResponse.json()).toMatchObject({
        orchestrationRunId: runId,
        status: 'succeeded',
      });
    } finally {
      await app.close();
      await runtimeAdapter.shutdown();
    }
  });

  it('lists TraceEvents for replay after runtime drain', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId, taskId } = await createSubmittedRun(app);
      const agentRunsResponse = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${taskId}/agent-runs`,
      });
      const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

      await app.inject({
        method: 'POST',
        url: `/v1/agent-runs/${agentRun.runId}/drain-runtime`,
        payload: {},
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/runs/${runId}/trace?eventTypePrefix=run.&limit=50`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ items: { eventType: string }[] }>();
      expect(body.items.map((event) => event.eventType)).toEqual([
        'run.queued',
        'run.planning',
        'run.succeeded',
      ]);
    } finally {
      await app.close();
    }
  });

  it('returns 404 when parent run or task is missing for list routes', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const missingRunResponse = await app.inject({
        method: 'GET',
        url: '/v1/runs/01HZZZZZZZZZZZZZZZZZZZZZF1/tasks',
      });
      expect(missingRunResponse.statusCode).toBe(404);

      const missingTaskResponse = await app.inject({
        method: 'GET',
        url: '/v1/tasks/01HZZZZZZZZZZZZZZZZZZZZZF2/agent-runs',
      });
      expect(missingTaskResponse.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('reads task and agent run resources', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { taskId } = await createSubmittedRun(app);

      const taskResponse = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${taskId}`,
      });
      expect(taskResponse.statusCode).toBe(200);
      expect(taskResponse.json()).toMatchObject({ taskId });

      const agentRunsResponse = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${taskId}/agent-runs`,
      });
      const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

      const agentRunResponse = await app.inject({
        method: 'GET',
        url: `/v1/agent-runs/${agentRun.runId}`,
      });
      expect(agentRunResponse.statusCode).toBe(200);
      expect(agentRunResponse.json()).toMatchObject({ runId: agentRun.runId });
    } finally {
      await app.close();
    }
  });

  it('lists input Artifact metadata after runtime submit', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId } = await createSubmittedRun(app);

      const response = await app.inject({
        method: 'GET',
        url: `/v1/runs/${runId}/artifacts`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{
        total: number;
        items: { artifactRole: string; payloadRef: string; sensitivity: string }[];
      }>();
      expect(body.total).toBe(1);
      expect(body.items[0]).toMatchObject({
        artifactRole: 'input',
        payloadRef: expect.stringMatching(/^artifact-payload:\/\//u) as unknown,
        sensitivity: 'none',
      });
    } finally {
      await app.close();
    }
  });

  it('sanitizes artifact metadata responses', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId } = await createSubmittedRun(app);
      const artifactsResponse = await app.inject({
        method: 'GET',
        url: `/v1/runs/${runId}/artifacts`,
      });
      const artifact = first(artifactsResponse.json<{ items: { artifactId: string }[] }>().items);

      const response = await app.inject({
        method: 'GET',
        url: `/v1/artifacts/${artifact.artifactId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        artifactId: artifact.artifactId,
        uriOrPath: expect.stringMatching(/^artifact-payload:\/\//u) as unknown,
      });
      expect(JSON.stringify(response.json())).not.toContain('/Users/');
    } finally {
      await app.close();
    }
  });

  it('reads bounded Artifact payload text without exposing a local file path', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId } = await createSubmittedRun(app);
      const artifactsResponse = await app.inject({
        method: 'GET',
        url: `/v1/runs/${runId}/artifacts`,
      });
      const artifact = first(
        artifactsResponse.json<{ items: { artifactId: string; payloadRef?: string }[] }>().items,
      );

      const response = await app.inject({
        method: 'GET',
        url: `/v1/artifacts/${artifact.artifactId}/payload`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        artifactId: artifact.artifactId,
        mediaType: 'application/json',
        truncated: false,
      });
      expect(response.json<{ text: string }>().text).toContain('Say hello.');
      expect(JSON.stringify(response.json())).not.toContain('/Users/');
    } finally {
      await app.close();
    }
  });

  it('returns 404 for missing Artifact metadata', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/artifacts/01HZZZZZZZZZZZZZZZZZZZZZF9',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
    } finally {
      await app.close();
    }
  });

  it('returns a dedicated error when Artifact payload is missing', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/artifacts/01HZZZZZZZZZZZZZZZZZZZZZF9/payload',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: { code: 'ARTIFACT_PAYLOAD_NOT_FOUND' },
      });
    } finally {
      await app.close();
    }
  });

  it('returns 400 for invalid Artifact and Trace route ids', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const invalidTraceResponse = await app.inject({
        method: 'GET',
        url: '/v1/runs/not-a-ulid/trace',
      });
      expect(invalidTraceResponse.statusCode).toBe(400);

      const invalidArtifactListResponse = await app.inject({
        method: 'GET',
        url: '/v1/runs/not-a-ulid/artifacts',
      });
      expect(invalidArtifactListResponse.statusCode).toBe(400);

      const invalidArtifactResponse = await app.inject({
        method: 'GET',
        url: '/v1/artifacts/not-a-ulid',
      });
      expect(invalidArtifactResponse.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('reads a PlanningOutput attached to a run', async () => {
    const container = createDefaultWorkspaceCoreContainer();
    const app = await createWorkspaceCoreApp({ container, logger: false });

    try {
      const createResponse = await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/runs`,
        payload: {
          originEventId: ids.event,
          task: {
            taskKind: 'edit',
            title: 'Plan task',
            brief: 'Create a planning output.',
          },
        },
      });
      const run = createResponse.json<{ orchestrationRunId: string }>();
      const output = await container.planningOutputs.startPlanning({
        runId: run.orchestrationRunId as never,
      });
      await container.planningOutputs.completePlanning({
        planningOutputId: output.planningOutputId,
        actionTree: [
          {
            actionId: 'inspect',
            title: 'Inspect repository',
            intent: 'Find relevant files.',
            status: 'ready',
            dependsOnActionIds: [],
          },
        ],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/runs/${run.orchestrationRunId}/planning-output`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        planningOutputId: output.planningOutputId,
        orchestrationRunId: run.orchestrationRunId,
        status: 'ready',
        actionTree: [{ actionId: 'inspect' }],
      });
    } finally {
      await app.close();
    }
  });

  it('returns 404 when a run has no PlanningOutput', async () => {
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
            title: 'No planning output',
            brief: 'Keep the run queued.',
          },
        },
      });
      const run = createResponse.json<{ orchestrationRunId: string }>();

      const response = await app.inject({
        method: 'GET',
        url: `/v1/runs/${run.orchestrationRunId}/planning-output`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
    } finally {
      await app.close();
    }
  });

  it('returns 400 for invalid PlanningOutput route run ids', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/runs/not-a-ulid/planning-output',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ error: { code: 'BAD_REQUEST' } });
    } finally {
      await app.close();
    }
  });

  it('registers SourceRoots and creates ContextPack manifests', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer({ codeContextScanner: createScanner() }),
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

      const reindexResponse = await app.inject({
        method: 'POST',
        url: `/v1/source-roots/${sourceRoot.sourceRootId}/reindex`,
        payload: {},
      });

      expect(reindexResponse.statusCode).toBe(202);
      expect(reindexResponse.json()).toMatchObject({
        sourceRoot: {
          sourceRootId: sourceRoot.sourceRootId,
          status: 'active',
        },
        snapshot: {
          status: 'ready',
          fileCount: 2,
        },
        files: expect.arrayContaining([
          expect.objectContaining({
            path: 'packages/application/src/index.ts',
            language: 'typescript',
          }),
        ]) as unknown,
      });

      const indexResponse = await app.inject({
        method: 'GET',
        url: `/v1/source-roots/${sourceRoot.sourceRootId}/index`,
      });

      expect(indexResponse.statusCode).toBe(200);
      expect(indexResponse.json()).toMatchObject({
        latestSnapshot: {
          status: 'ready',
          fileCount: 2,
        },
        files: expect.arrayContaining([
          expect.objectContaining({
            path: 'packages/application/src/index.ts',
          }),
        ]) as unknown,
      });

      const searchResponse = await app.inject({
        method: 'GET',
        url: `/v1/code-search?workspaceId=${ids.workspace}&pathContains=application&language=typescript`,
      });

      expect(searchResponse.statusCode).toBe(200);
      expect(searchResponse.json()).toMatchObject({
        items: [
          {
            sourceRootId: sourceRoot.sourceRootId,
            path: 'packages/application/src/index.ts',
            language: 'typescript',
          },
        ],
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

      const searchContextPackResponse = await app.inject({
        method: 'POST',
        url: `/v1/workspaces/${ids.workspace}/context-packs/from-code-search`,
        payload: {
          createdFor: {
            type: 'task',
            taskId: task.taskId,
          },
          query: 'Find application code.',
          search: {
            pathContains: 'application',
            language: 'typescript',
            limit: 10,
          },
          excerpt: {
            startLine: 1,
            endLine: 80,
          },
        },
      });

      expect(searchContextPackResponse.statusCode).toBe(201);
      expect(searchContextPackResponse.json()).toMatchObject({
        workspaceId: ids.workspace,
        sourceRootIds: [sourceRoot.sourceRootId],
        query: 'Find application code.',
        tokenEstimate: 32,
        items: [
          {
            kind: 'file_excerpt',
            sourceRootId: sourceRoot.sourceRootId,
            path: 'packages/application/src/index.ts',
            startLine: 1,
            endLine: 80,
            digest: 'sha256:index',
            confidence: 'extracted',
          },
        ],
      });
    } finally {
      await app.close();
    }
  });

  it('pauses and resumes a run through operator routes', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId } = await createSubmittedRun(app);

      const pauseResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/pause`,
        payload: { reason: 'Review before continuing.' },
      });

      expect(pauseResponse.statusCode).toBe(200);
      expect(pauseResponse.json()).toMatchObject({
        orchestrationRunId: runId,
        status: 'paused',
      });

      const resumeResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/resume`,
        payload: {},
      });

      expect(resumeResponse.statusCode).toBe(200);
      expect(resumeResponse.json()).toMatchObject({
        orchestrationRunId: runId,
        status: 'running',
      });
    } finally {
      await app.close();
    }
  });

  it('cancels a run through the operator route', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId } = await createSubmittedRun(app);

      const cancelResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/cancel`,
        payload: { reason: 'Operator stopped it.' },
      });

      expect(cancelResponse.statusCode).toBe(200);
      expect(cancelResponse.json()).toMatchObject({
        orchestrationRunId: runId,
        status: 'cancelled',
        error: { code: 'CANCELLED_BY_OPERATOR' },
      });
    } finally {
      await app.close();
    }
  });

  it('dispatches runtime cancel when cancelling a submitted run through the operator route', async () => {
    const runtimeGateway = new MockRuntimeGatewayPort();
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer({ runtimeGateway }),
      logger: false,
    });

    try {
      const { runId, taskId } = await createSubmittedRun(app);
      const agentRunsResponse = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${taskId}/agent-runs`,
      });
      const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

      const cancelResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/cancel`,
        payload: { reason: 'Operator stopped it.' },
      });

      expect(cancelResponse.statusCode).toBe(200);
      expect(runtimeGateway.cancelled).toEqual([
        { runId: agentRun.runId, reason: 'Operator stopped it.' },
      ]);
    } finally {
      await app.close();
    }
  });

  it('maps invalid operator state transitions to 409', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId } = await createSubmittedRun(app);

      await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/pause`,
        payload: {},
      });

      const response = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/pause`,
        payload: {},
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({
        error: { code: 'CONFLICT' },
      });
    } finally {
      await app.close();
    }
  });

  it('supports retry task, rerun, and operator notes through operator routes', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const { runId, taskId } = await createSubmittedRun(app);

      await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/cancel`,
        payload: { reason: 'Stop before retry route check.' },
      });

      const noteResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/notes`,
        payload: { note: 'Keep this context for later.', visibility: 'operator_only' },
      });
      expect(noteResponse.statusCode).toBe(201);
      expect(noteResponse.json()).toMatchObject({
        messageId: expect.stringContaining('message:') as unknown,
        traceEventId: expect.any(String) as unknown,
      });

      const rerunResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/rerun`,
        payload: { operatorNote: 'Try the narrower approach.', replan: true },
      });
      expect(rerunResponse.statusCode).toBe(202);
      expect(rerunResponse.json()).toMatchObject({
        status: 'queued',
      });

      const retryResponse = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${taskId}/retry`,
        payload: {},
      });
      expect(retryResponse.statusCode).toBe(409);
      expect(retryResponse.json()).toMatchObject({
        error: { code: 'CONFLICT' },
      });
    } finally {
      await app.close();
    }
  });

  it('returns 400 for invalid operator route ids and bodies', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const invalidIdResponse = await app.inject({
        method: 'POST',
        url: '/v1/runs/not-a-ulid/pause',
        payload: {},
      });
      expect(invalidIdResponse.statusCode).toBe(400);

      const { runId } = await createSubmittedRun(app);
      const invalidBodyResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/notes`,
        payload: { note: '' },
      });
      expect(invalidBodyResponse.statusCode).toBe(400);

      const missingBodyResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/cancel`,
      });
      expect(missingBodyResponse.statusCode).toBe(400);

      const malformedResumeBodyResponse = await app.inject({
        method: 'POST',
        url: `/v1/runs/${runId}/resume`,
        payload: [],
      });
      expect(malformedResumeBodyResponse.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('returns 404 for missing operator route resources', async () => {
    const app = await createWorkspaceCoreApp({
      container: createDefaultWorkspaceCoreContainer(),
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/runs/01HZZZZZZZZZZZZZZZZZZZZZZ9/pause',
        payload: {},
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: { code: 'NOT_FOUND' },
      });
    } finally {
      await app.close();
    }
  });
});
