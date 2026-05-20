// SPDX-License-Identifier: Apache-2.0
import { OrchestrationRunId } from '@cairn/shared-contracts';

import type { RunReplaySource } from '@cairn/shared-contracts';

export interface WorkspaceCoreMockSmokeResult {
  readonly runId: string;
  readonly runStatus: string;
  readonly taskId: string;
  readonly taskStatus: string;
  readonly agentRunStatuses: readonly string[];
  readonly artifactCount: number;
  readonly artifactRoles: readonly string[];
  readonly traceCount: number;
  readonly finalResponseRef?: string | undefined;
}

export interface RunWorkspaceCoreMockSmokeOptions {
  readonly authToken: string;
  readonly baseUrl: string;
  readonly fetch?: typeof fetch | undefined;
  readonly workspaceId?: string | undefined;
  readonly originEventId?: string | undefined;
}

export interface GetWorkspaceCoreRunReplaySourceOptions {
  readonly authToken: string;
  readonly baseUrl: string;
  readonly fetch?: typeof fetch | undefined;
  readonly runId: string;
}

interface CreateRunResponse {
  readonly orchestrationRunId: string;
  readonly status: string;
}

interface TaskListResponse {
  readonly items: readonly TaskResponse[];
}

interface TaskResponse {
  readonly taskId: string;
  readonly status: string;
}

interface SubmitAgentRunResponse {
  readonly agentRunId: string;
  readonly status: string;
}

interface AgentRunListResponse {
  readonly items: readonly AgentRunResponse[];
}

interface AgentRunResponse {
  readonly runId: string;
  readonly status: string;
}

interface RunResponse {
  readonly orchestrationRunId: string;
  readonly status: string;
  readonly finalResponseRef?: string | undefined;
}

interface ArtifactListResponse {
  readonly items: readonly ArtifactResponse[];
}

interface ArtifactResponse {
  readonly artifactId: string;
  readonly artifactRole: string;
}

interface TraceListResponse {
  readonly items: readonly TraceResponse[];
}

interface TraceResponse {
  readonly eventId: string;
}

const DEFAULT_WORKSPACE_ID = '01J000000000000000000000W0';
const DEFAULT_ORIGIN_EVENT_ID = '01J000000000000000000000E0';

export const runWorkspaceCoreMockSmoke = async (
  options: RunWorkspaceCoreMockSmokeOptions,
): Promise<WorkspaceCoreMockSmokeResult> => {
  const fetchImpl = options.fetch ?? fetch;
  const workspaceId = options.workspaceId ?? DEFAULT_WORKSPACE_ID;
  const originEventId = options.originEventId ?? DEFAULT_ORIGIN_EVENT_ID;

  const createdRun = await requestJson<CreateRunResponse>(fetchImpl, options, {
    body: {
      originEventId,
      task: {
        brief: 'Exercise the Desktop to Workspace Core mock runtime path.',
        taskKind: 'custom',
        title: 'Desktop mock smoke',
      },
    },
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/runs`,
  });
  const tasks = await requestJson<TaskListResponse>(fetchImpl, options, {
    method: 'GET',
    path: `/v1/runs/${createdRun.orchestrationRunId}/tasks`,
  });
  const task = first(tasks.items, 'Workspace Core did not create a smoke task.');

  const submittedAgentRun = await requestJson<SubmitAgentRunResponse>(fetchImpl, options, {
    body: {
      model: 'default',
      prompt: 'Run the Cairn Desktop mock smoke path.',
      runtimeType: 'codex',
    },
    method: 'POST',
    path: `/v1/tasks/${task.taskId}/agent-runs`,
  });

  await requestJson(fetchImpl, options, {
    body: {},
    method: 'POST',
    path: `/v1/agent-runs/${submittedAgentRun.agentRunId}/drain-runtime`,
  });

  const [run, latestTask, agentRuns, artifacts, trace] = await Promise.all([
    requestJson<RunResponse>(fetchImpl, options, {
      method: 'GET',
      path: `/v1/runs/${createdRun.orchestrationRunId}`,
    }),
    requestJson<TaskResponse>(fetchImpl, options, {
      method: 'GET',
      path: `/v1/tasks/${task.taskId}`,
    }),
    requestJson<AgentRunListResponse>(fetchImpl, options, {
      method: 'GET',
      path: `/v1/tasks/${task.taskId}/agent-runs`,
    }),
    requestJson<ArtifactListResponse>(fetchImpl, options, {
      method: 'GET',
      path: `/v1/runs/${createdRun.orchestrationRunId}/artifacts`,
    }),
    requestJson<TraceListResponse>(fetchImpl, options, {
      method: 'GET',
      path: `/v1/runs/${createdRun.orchestrationRunId}/trace?limit=50`,
    }),
  ]);

  return {
    agentRunStatuses: agentRuns.items.map((agentRun) => agentRun.status),
    artifactCount: artifacts.items.length,
    artifactRoles: artifacts.items.map((artifact) => artifact.artifactRole),
    ...(run.finalResponseRef === undefined ? {} : { finalResponseRef: run.finalResponseRef }),
    runId: run.orchestrationRunId,
    runStatus: run.status,
    taskId: latestTask.taskId,
    taskStatus: latestTask.status,
    traceCount: trace.items.length,
  };
};

export const getWorkspaceCoreRunReplaySource = async (
  options: GetWorkspaceCoreRunReplaySourceOptions,
): Promise<RunReplaySource> => {
  const runId = OrchestrationRunId.safeParse(options.runId);
  if (!runId.success) {
    throw new Error('Invalid Workspace Core run id.');
  }

  return requestJson<RunReplaySource>(options.fetch ?? fetch, options, {
    method: 'GET',
    path: `/v1/runs/${runId.data}/replay-source`,
  });
};

type RequestMethod = 'GET' | 'POST';

interface RequestJsonOptions {
  readonly body?: unknown;
  readonly method: RequestMethod;
  readonly path: string;
}

const requestJson = async <T = unknown>(
  fetchImpl: typeof fetch,
  runtime: Pick<RunWorkspaceCoreMockSmokeOptions, 'authToken' | 'baseUrl'>,
  request: RequestJsonOptions,
): Promise<T> => {
  const init: RequestInit = {
    headers: {
      authorization: `Bearer ${runtime.authToken}`,
      ...(request.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    method: request.method,
  };
  if (request.body !== undefined) {
    init.body = JSON.stringify(request.body);
  }

  const response = await fetchImpl(`${runtime.baseUrl}${request.path}`, init);

  if (!response.ok) {
    throw new Error(
      `Workspace Core request ${request.method} ${request.path} failed with ${response.status.toString()}.`,
    );
  }

  return (await response.json()) as T;
};

const first = <T>(items: readonly T[], message: string): T => {
  const item = items[0];
  if (item === undefined) {
    throw new Error(message);
  }
  return item;
};
