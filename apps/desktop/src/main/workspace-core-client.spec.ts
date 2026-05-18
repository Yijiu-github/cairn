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
  sourceRoot: '01J000000000000000000000S0',
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
          text: expect.stringMatching(/^text\/plain payload, \d+ chars$/u) as unknown,
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
    `/v1/workspaces/${ids.workspace}/source-roots`,
    `/v1/runs/${ids.run}`,
    `/v1/runs/${ids.run}/tasks`,
    `/v1/runs/${ids.run}/artifacts`,
    `/v1/runs/${ids.run}/trace`,
    `/v1/artifacts/${ids.artifact}/payload`,
  ]);
});

it('reads SourceRoot summaries without exposing local source metadata', async () => {
  const fetch = createWorkspaceCoreFetch({
    sourceRootError: 'Index failed in /Users/alice/private/project with sk-live-secret',
  });
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();
  const serialized = JSON.stringify(snapshot);

  expect(fetch.calls.map((call) => call.path)).toContain(
    `/v1/workspaces/${ids.workspace}/source-roots`,
  );
  expect(snapshot.sourceRoots).toEqual([
    {
      sourceRootId: ids.sourceRoot,
      displayName: 'Cairn Workspace',
      kind: 'local_directory',
      status: 'error',
      includeGlobCount: 2,
      excludeGlobCount: 3,
      hasLastIndexedAt: true,
      hasError: true,
      createdAt: '2026-05-18T00:00:00.000Z',
      updatedAt: '2026-05-18T00:04:00.000Z',
    },
  ]);
  expect(serialized).not.toContain('file:///Users/alice/private/project');
  expect(serialized).not.toContain('/Users/alice/private/project');
  expect(serialized).not.toContain('Index failed');
  expect(serialized).not.toContain('sk-live-secret');
  expect(serialized).not.toContain('metadata-token');
  expect(serialized).not.toContain('launch-token');
  expect(serialized).not.toContain('127.0.0.1');
  expect(serialized).not.toContain('45321');
});

it('returns SourceRoot summaries when the workspace has no runs', async () => {
  const fetch = createWorkspaceCoreFetch({ runCount: 0 });
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();

  expect(snapshot.runs).toEqual([]);
  expect(snapshot.selectedRun).toBeUndefined();
  expect(snapshot.sourceRoots).toHaveLength(1);
  expect(fetch.calls.map((call) => call.path)).toEqual([
    `/v1/workspaces/${ids.workspace}/runs`,
    `/v1/workspaces/${ids.workspace}/source-roots`,
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
    sourceRoots: [],
  });
  expect(snapshot.selectedRun).toBeUndefined();
  expect(fetch.calls).toHaveLength(0);
});

it('does not expose local artifact paths or raw payload references in renderer snapshots', async () => {
  const fetch = createWorkspaceCoreFetch({ artifactSensitivity: 'local_path' });
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

it('does not inline payload text for sensitive artifacts', async () => {
  const fetch = createWorkspaceCoreFetch({ artifactSensitivity: 'secret_risk' });
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();
  const artifact = snapshot.selectedRun?.artifacts[0];
  const serialized = JSON.stringify(snapshot);

  expect(artifact).toMatchObject({
    sensitivity: 'secret_risk',
    storage: 'redacted',
  });
  expect(artifact?.payloadPreview).toBeUndefined();
  expect(fetch.calls.map((call) => call.path)).not.toContain(
    `/v1/artifacts/${ids.artifact}/payload`,
  );
  expect(serialized).not.toContain('sk-live-secret');
  expect(serialized).not.toContain('/Users/alice/private/project/out.patch');
});

it('summarizes trace payload metadata without exposing inline payload values', async () => {
  const fetch = createWorkspaceCoreFetch({
    tracePayloadInline: {
      cwd: '/Users/alice/private/project',
      token: 'sk-live-secret',
      payloadRef: 'artifact-payload://workspace/run/artifact/out.patch',
    },
  });
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();
  const traceEvent = snapshot.selectedRun?.trace[0];
  const serialized = JSON.stringify(snapshot);

  expect(traceEvent).toMatchObject({
    eventType: 'task.started',
    payloadSummary: 'payload keys: 3 redacted',
  });
  expect(serialized).not.toContain('/Users/alice/private/project');
  expect(serialized).not.toContain('sk-live-secret');
  expect(serialized).not.toContain('artifact-payload://workspace/run/artifact/out.patch');
  expect(serialized).not.toContain('payloadRef');
  expect(serialized).not.toContain('token');
});

it('summarizes task failure reasons without exposing raw failure text', async () => {
  const fetch = createWorkspaceCoreFetch({
    taskFailureReason: 'Failed in /Users/alice/private/project with sk-live-secret',
    taskStatus: 'failed',
  });
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();
  const serialized = JSON.stringify(snapshot);

  expect(snapshot.selectedRun?.tasks[0]).toMatchObject({
    failureSummary: 'Failure reason captured by Workspace Core.',
    status: 'failed',
  });
  expect(serialized).not.toContain('/Users/alice/private/project');
  expect(serialized).not.toContain('sk-live-secret');
});

it('keeps artifact metadata when a payload preview request fails', async () => {
  const fetch = createWorkspaceCoreFetch({ failPayloadPreview: true });
  const client = new WorkspaceCoreReadClient({
    fetch: fetch.fetch,
    getConnection: () => createConnectedConnection(),
  });

  const snapshot = await client.readSnapshot();

  const artifact = snapshot.selectedRun?.artifacts[0];
  expect(artifact).toMatchObject({
    artifactId: ids.artifact,
  });
  expect(artifact?.payloadPreview).toBeUndefined();
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

interface WorkspaceCoreFetchOptions {
  readonly artifactSensitivity?: string;
  readonly artifactUriOrPath?: string;
  readonly failPayloadPreview?: boolean;
  readonly runCount?: number;
  readonly sourceRootError?: string;
  readonly taskFailureReason?: string;
  readonly taskStatus?: string;
  readonly tracePayloadInline?: Record<string, unknown>;
}

const createWorkspaceCoreFetch = (
  options: WorkspaceCoreFetchOptions = {},
): {
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
      ok: !(options.failPayloadPreview === true && parsed.pathname.endsWith('/payload')),
      status:
        options.failPayloadPreview === true && parsed.pathname.endsWith('/payload') ? 404 : 200,
      json: () => Promise.resolve(responseByPath(parsed.pathname, options)),
    });
  };

  return { calls, fetch };
};

const responseByPath = (path: string, options: WorkspaceCoreFetchOptions): unknown => {
  switch (path) {
    case `/v1/workspaces/${ids.workspace}/runs`:
      return {
        items: options.runCount === 0 ? [] : [apiRun()],
        total: options.runCount === 0 ? 0 : 1,
      };
    case `/v1/workspaces/${ids.workspace}/source-roots`:
      return {
        items: [apiSourceRoot(options)],
        total: 1,
      };
    case `/v1/runs/${ids.run}`:
      return apiRun();
    case `/v1/runs/${ids.run}/tasks`:
      return {
        items: [apiTask(options)],
        total: 1,
      };
    case `/v1/runs/${ids.run}/artifacts`:
      return {
        items: [apiArtifact(options)],
        total: 1,
      };
    case `/v1/runs/${ids.run}/trace`:
      return {
        items: [apiTraceEvent(options.tracePayloadInline)],
        total: 1,
      };
    case `/v1/artifacts/${ids.artifact}/payload`:
      return {
        artifactId: ids.artifact,
        mediaType: 'text/plain',
        text: 'Patch summary preview for /Users/alice/private/project/out.patch',
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

const apiTask = (options: WorkspaceCoreFetchOptions = {}) => ({
  taskId: ids.task,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  taskKind: 'edit',
  title: 'Apply patch',
  brief: 'Update the target module.',
  status: options.taskStatus ?? 'running',
  priority: 50,
  attempt: 1,
  idempotencyKey: 'task-key',
  dependsOnTaskIds: [],
  contextRefs: [],
  artifactRefs: [ids.artifact],
  ...(options.taskFailureReason === undefined ? {} : { failureReason: options.taskFailureReason }),
  createdAt: '2026-05-18T00:00:00.000Z',
  updatedAt: '2026-05-18T00:01:00.000Z',
});

const apiArtifact = (options: WorkspaceCoreFetchOptions = {}) => ({
  artifactId: ids.artifact,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  taskId: ids.task,
  runId: ids.agentRun,
  artifactRole: 'output',
  kind: 'text',
  formatVersion: 'text.v1',
  uriOrPath: options.artifactUriOrPath ?? 'artifact-payload://workspace/run/artifact/out.patch',
  contentType: 'text/plain',
  sizeBytes: 128,
  payloadRef: 'artifact-payload://workspace/run/artifact/out.patch',
  sensitivity: options.artifactSensitivity ?? 'none',
  producerType: 'agent',
  producerId: ids.agentRun,
  visibility: 'workspace',
  createdAt: '2026-05-18T00:02:00.000Z',
});

const apiTraceEvent = (payloadInline: Record<string, unknown> = { title: 'Apply patch' }) => ({
  traceEventId: ids.traceEvent,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  taskId: ids.task,
  runId: ids.agentRun,
  eventType: 'task.started',
  level: 'info',
  payloadInline,
  createdAt: '2026-05-18T00:03:00.000Z',
  traceId: ids.trace,
});

const apiSourceRoot = (options: WorkspaceCoreFetchOptions = {}) => ({
  sourceRootId: ids.sourceRoot,
  workspaceId: ids.workspace,
  kind: 'local_directory',
  displayName: 'Cairn Workspace',
  uri: 'file:///Users/alice/private/project',
  status: options.sourceRootError === undefined ? 'active' : 'error',
  includeGlobs: ['src/**', 'README.md'],
  excludeGlobs: ['node_modules/**', '.git/**', '.env*'],
  createdAt: '2026-05-18T00:00:00.000Z',
  updatedAt: '2026-05-18T00:04:00.000Z',
  lastIndexedAt: '2026-05-18T00:03:00.000Z',
  ...(options.sourceRootError === undefined ? {} : { error: options.sourceRootError }),
  metadata: {
    localPath: '/Users/alice/private/project',
    token: 'metadata-token',
  },
});
