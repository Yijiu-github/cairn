// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';

import { WorkspaceCoreReadClient } from './workspace-core-client.js';

import type {
  WorkspaceCoreReadClientConnection,
  WorkspaceCoreReadClientFetch,
} from './workspace-core-client.js';

const ids = {
  workspace: '01J000000000000000000000W0',
  event: '01J000000000000000000000E0',
  run: '01J000000000000000000000R0',
  task: '01J000000000000000000000T0',
  artifact: '01J000000000000000000000A0',
  agentRun: '01J000000000000000000000G0',
  trace: '01J000000000000000000000Z0',
  traceEvent: '01J000000000000000000000V0',
  planningOutput: '01J000000000000000000000P0',
};

it('lists workspace runs with bearer auth from the connected sidecar', async () => {
  const fetch = createWorkspaceCoreFetch();
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  await client.readSnapshot();

  expect(fetch.calls[0]).toMatchObject({
    authorization: 'Bearer launch-token',
    method: 'GET',
    url: `http://127.0.0.1:45321/v1/workspaces/${ids.workspace}/runs`,
  });
});

it('reads the first run detail, tasks, artifacts, trace, and artifact payload preview', async () => {
  const fetch = createWorkspaceCoreFetch();
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();

  expect(snapshot.connection).toMatchObject({
    state: 'connected',
  });
  expect(snapshot.runs).toHaveLength(1);
  expect(snapshot.selectedRun).toMatchObject({
    runId: ids.run,
    status: 'running',
    tasks: [
      {
        taskId: ids.task,
        status: 'running',
        title: 'Apply patch',
      },
    ],
    artifacts: [
      {
        artifactId: ids.artifact,
        label: 'output text',
        storage: 'redacted',
        payloadPreview: {
          mediaType: 'text/plain',
          text: 'Patch summary preview',
          truncated: false,
        },
      },
    ],
    trace: [
      {
        traceEventId: ids.traceEvent,
        eventType: 'task.started',
        level: 'info',
      },
    ],
  });
  expect(fetch.calls.map((call) => call.path)).toEqual([
    `/v1/workspaces/${ids.workspace}/runs`,
    `/v1/runs/${ids.run}`,
    `/v1/runs/${ids.run}/tasks`,
    `/v1/runs/${ids.run}/artifacts`,
    `/v1/runs/${ids.run}/trace`,
    `/v1/artifacts/${ids.artifact}/payload`,
  ]);
});

it('returns a disconnected snapshot without issuing HTTP requests when sidecar is not connected', async () => {
  const fetch = createWorkspaceCoreFetch();
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => ({
      authenticated: false,
      detail: 'Workspace Core sidecar stopped.',
      mode: 'development',
      state: 'disconnected',
      updatedAt: '2026-05-18T00:00:00.000Z',
    }),
  });

  const snapshot = await client.readSnapshot();

  expect(snapshot).toMatchObject({
    connection: {
      detail: 'Workspace Core sidecar stopped.',
      state: 'disconnected',
    },
    runs: [],
  });
  expect(snapshot.selectedRun).toBeUndefined();
  expect(fetch.calls).toHaveLength(0);
});

it('does not expose local artifact paths or raw payload references in renderer snapshots', async () => {
  const fetch = createWorkspaceCoreFetch();
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();
  const serialized = JSON.stringify(snapshot);

  expect(snapshot.selectedRun?.artifacts[0]).toMatchObject({
    storage: 'redacted',
  });
  expect(serialized).not.toContain('/Users/alice/private/project/out.patch');
  expect(serialized).not.toContain('artifact-payload://workspace/run/artifact/out.patch');
  expect(serialized).not.toContain('launch-token');
  expect(serialized).not.toContain('127.0.0.1');
  expect(serialized).not.toContain('45321');
});

interface FetchCall {
  readonly authorization?: string;
  readonly method: string;
  readonly path: string;
  readonly url: string;
}

const createConnectedConnection = (): WorkspaceCoreReadClientConnection => ({
  authenticated: true,
  baseUrl: 'http://127.0.0.1:45321',
  detail: 'Workspace Core sidecar is connected.',
  host: '127.0.0.1',
  mode: 'development',
  port: 45_321,
  state: 'connected',
  token: 'launch-token',
  updatedAt: '2026-05-18T00:00:00.000Z',
});

const createWorkspaceCoreFetch = (): {
  readonly calls: FetchCall[];
  readonly fetch: WorkspaceCoreReadClientFetch;
} => {
  const calls: FetchCall[] = [];
  const fetch: WorkspaceCoreReadClientFetch = (input, init) => {
    const url = String(input);
    const parsed = new URL(url);
    const method = init?.method ?? 'GET';
    const authorization = init?.headers?.authorization;
    calls.push({
      ...(authorization === undefined ? {} : { authorization }),
      method,
      path: parsed.pathname,
      url,
    });

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseByPath(parsed.pathname)),
    });
  };

  return { calls, fetch };
};

const responseByPath = (path: string): unknown => {
  switch (path) {
    case `/v1/workspaces/${ids.workspace}/runs`:
      return {
        items: [apiRun()],
        total: 1,
      };
    case `/v1/runs/${ids.run}`:
      return apiRun();
    case `/v1/runs/${ids.run}/tasks`:
      return {
        items: [apiTask()],
        total: 1,
      };
    case `/v1/runs/${ids.run}/artifacts`:
      return {
        items: [apiArtifact()],
        total: 1,
      };
    case `/v1/runs/${ids.run}/trace`:
      return {
        items: [apiTraceEvent()],
        total: 1,
      };
    case `/v1/artifacts/${ids.artifact}/payload`:
      return {
        artifactId: ids.artifact,
        mediaType: 'text/plain',
        text: 'Patch summary preview',
        truncated: false,
      };
    default:
      throw new Error(`Unexpected path: ${path}`);
  }
};

const apiRun = () => ({
  orchestrationRunId: ids.run,
  workspaceId: ids.workspace,
  originEventId: ids.event,
  status: 'running',
  executionMode: 'single_worker',
  plannerOutputRef: ids.planningOutput,
  hasPartialFailures: false,
  resultCompleteness: 'partial',
  completionLevel: 'draft',
  traceId: ids.trace,
  createdAt: '2026-05-18T00:00:00.000Z',
  updatedAt: '2026-05-18T00:01:00.000Z',
});

const apiTask = () => ({
  taskId: ids.task,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  taskKind: 'edit',
  title: 'Apply patch',
  brief: 'Update the target module.',
  status: 'running',
  priority: 50,
  attempt: 1,
  idempotencyKey: 'task-key',
  dependsOnTaskIds: [],
  contextRefs: [],
  artifactRefs: [ids.artifact],
  createdAt: '2026-05-18T00:00:00.000Z',
  updatedAt: '2026-05-18T00:01:00.000Z',
});

const apiArtifact = () => ({
  artifactId: ids.artifact,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  taskId: ids.task,
  runId: ids.agentRun,
  artifactRole: 'output',
  kind: 'text',
  formatVersion: 'text.v1',
  uriOrPath: '/Users/alice/private/project/out.patch',
  contentType: 'text/plain',
  sizeBytes: 128,
  payloadRef: 'artifact-payload://workspace/run/artifact/out.patch',
  sensitivity: 'local_path',
  producerType: 'agent',
  producerId: ids.agentRun,
  visibility: 'workspace',
  createdAt: '2026-05-18T00:02:00.000Z',
});

const apiTraceEvent = () => ({
  traceEventId: ids.traceEvent,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  taskId: ids.task,
  runId: ids.agentRun,
  eventType: 'task.started',
  level: 'info',
  payloadInline: {
    title: 'Apply patch',
  },
  createdAt: '2026-05-18T00:03:00.000Z',
  traceId: ids.trace,
});
