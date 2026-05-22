// SPDX-License-Identifier: Apache-2.0
import { z } from 'zod';

import {
  ArtifactId,
  artifactPayloadResponseSchema,
  OrchestrationRunId,
  RunReplaySource as RunReplaySourceSchema,
} from '@cairn/shared-contracts';

import type { ArtifactPayloadResponse, RunReplaySource } from '@cairn/shared-contracts';

export interface WorkspaceCoreInternalTrialResult {
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

export interface RunWorkspaceCoreInternalTrialOptions {
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

export interface GetWorkspaceCoreArtifactPayloadOptions {
  readonly artifactId: string;
  readonly authToken: string;
  readonly baseUrl: string;
  readonly fetch?: typeof fetch | undefined;
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
  readonly traceEventId: string;
}

const DEFAULT_WORKSPACE_ID = '01J000000000000000000000W0';
const DEFAULT_ORIGIN_EVENT_ID = '01J000000000000000000000E0';

const createRunResponseSchema = z.object({
  orchestrationRunId: z.string().min(1),
  status: z.string().min(1),
});

const taskResponseSchema = z.object({
  taskId: z.string().min(1),
  status: z.string().min(1),
});

const taskListResponseSchema = z.object({
  items: z.array(taskResponseSchema),
});

const submitAgentRunResponseSchema = z.object({
  agentRunId: z.string().min(1),
  status: z.string().min(1),
});

const agentRunResponseSchema = z.object({
  runId: z.string().min(1),
  status: z.string().min(1),
});

const agentRunListResponseSchema = z.object({
  items: z.array(agentRunResponseSchema),
});

const runResponseSchema = z.object({
  orchestrationRunId: z.string().min(1),
  status: z.string().min(1),
  finalResponseRef: z.string().min(1).optional(),
});

const artifactResponseSchema = z.object({
  artifactId: z.string().min(1),
  artifactRole: z.string().min(1),
});

const artifactListResponseSchema = z.object({
  items: z.array(artifactResponseSchema),
});

const traceResponseSchema = z.object({
  traceEventId: z.string().min(1),
});

const traceListResponseSchema = z.object({
  items: z.array(traceResponseSchema),
});

/**
 * Validates and normalizes a Desktop trial run id before main/preload code
 * forwards it to Workspace Core.
 */
export const parseWorkspaceCoreRunId = (runId: string): string => {
  const parsedRunId = OrchestrationRunId.safeParse(runId);
  if (!parsedRunId.success) {
    throw new Error('Invalid Workspace Core run id.');
  }

  return parsedRunId.data;
};

/**
 * Validates and normalizes a Desktop artifact id before main/preload code
 * forwards it to Workspace Core.
 */
export const parseWorkspaceCoreArtifactId = (artifactId: string): string => {
  const parsedArtifactId = ArtifactId.safeParse(artifactId);
  if (!parsedArtifactId.success) {
    throw new Error('Invalid Workspace Core artifact id.');
  }

  return parsedArtifactId.data;
};

export const runWorkspaceCoreInternalTrial = async (
  options: RunWorkspaceCoreInternalTrialOptions,
): Promise<WorkspaceCoreInternalTrialResult> => {
  const fetchImpl = options.fetch ?? fetch;
  const workspaceId = options.workspaceId ?? DEFAULT_WORKSPACE_ID;
  const originEventId = options.originEventId ?? DEFAULT_ORIGIN_EVENT_ID;

  const createdRun = await requestJson<CreateRunResponse>(
    fetchImpl,
    options,
    {
      body: {
        originEventId,
        task: {
          brief: 'Exercise the Cairn Desktop internal-trial run path.',
          taskKind: 'custom',
          title: 'Desktop internal trial',
        },
      },
      method: 'POST',
      path: `/v1/workspaces/${workspaceId}/runs`,
    },
    createRunResponseSchema,
  );
  const tasks = await requestJson<TaskListResponse>(
    fetchImpl,
    options,
    {
      method: 'GET',
      path: `/v1/runs/${createdRun.orchestrationRunId}/tasks`,
    },
    taskListResponseSchema,
  );
  const task = first(tasks.items, 'Workspace Core did not create a smoke task.');

  const submittedAgentRun = await requestJson<SubmitAgentRunResponse>(
    fetchImpl,
    options,
    {
      body: {
        model: 'default',
        prompt: 'Reply with exactly: Cairn internal trial ok',
        runtimeType: 'codex',
      },
      method: 'POST',
      path: `/v1/tasks/${task.taskId}/agent-runs`,
    },
    submitAgentRunResponseSchema,
  );

  await requestJson(
    fetchImpl,
    options,
    {
      body: {},
      method: 'POST',
      path: `/v1/agent-runs/${submittedAgentRun.agentRunId}/drain-runtime`,
    },
    z.object({
      agentRunId: z.string().min(1),
      eventCount: z.number().int().nonnegative(),
    }),
  );

  const [run, latestTask, agentRuns, artifacts, trace] = await Promise.all([
    requestJson<RunResponse>(
      fetchImpl,
      options,
      {
        method: 'GET',
        path: `/v1/runs/${createdRun.orchestrationRunId}`,
      },
      runResponseSchema,
    ),
    requestJson<TaskResponse>(
      fetchImpl,
      options,
      {
        method: 'GET',
        path: `/v1/tasks/${task.taskId}`,
      },
      taskResponseSchema,
    ),
    requestJson<AgentRunListResponse>(
      fetchImpl,
      options,
      {
        method: 'GET',
        path: `/v1/tasks/${task.taskId}/agent-runs`,
      },
      agentRunListResponseSchema,
    ),
    requestJson<ArtifactListResponse>(
      fetchImpl,
      options,
      {
        method: 'GET',
        path: `/v1/runs/${createdRun.orchestrationRunId}/artifacts`,
      },
      artifactListResponseSchema,
    ),
    requestJson<TraceListResponse>(
      fetchImpl,
      options,
      {
        method: 'GET',
        path: `/v1/runs/${createdRun.orchestrationRunId}/trace?limit=50`,
      },
      traceListResponseSchema,
    ),
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
  const runId = parseWorkspaceCoreRunId(options.runId);
  const payload = await requestJson(options.fetch ?? fetch, options, {
    method: 'GET',
    path: `/v1/runs/${runId}/replay-source`,
  });
  const parsed = RunReplaySourceSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Workspace Core returned an invalid replay source payload.');
  }

  return parsed.data;
};

export const getWorkspaceCoreArtifactPayload = async (
  options: GetWorkspaceCoreArtifactPayloadOptions,
): Promise<ArtifactPayloadResponse> => {
  const artifactId = parseWorkspaceCoreArtifactId(options.artifactId);

  const payload = await requestJson(options.fetch ?? fetch, options, {
    method: 'GET',
    path: `/v1/artifacts/${artifactId}/payload`,
  });
  const parsed = artifactPayloadResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `Workspace Core returned an invalid response payload for GET /v1/artifacts/${artifactId}/payload.`,
    );
  }

  return parsed.data;
};

type RequestMethod = 'GET' | 'POST';

interface RequestJsonOptions {
  readonly body?: unknown;
  readonly method: RequestMethod;
  readonly path: string;
}

const requestJson = async <T = unknown>(
  fetchImpl: typeof fetch,
  runtime: Pick<RunWorkspaceCoreInternalTrialOptions, 'authToken' | 'baseUrl'>,
  request: RequestJsonOptions,
  schema?: z.ZodType<T>,
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

  let response: Response;
  try {
    response = await fetchImpl(`${runtime.baseUrl}${request.path}`, init);
  } catch (error) {
    throw new Error(formatWorkspaceCoreTransportError(error));
  }

  if (!response.ok) {
    throw new Error(
      `Workspace Core request ${request.method} ${request.path} failed with ${response.status.toString()}.`,
    );
  }

  const payload: unknown = await response.json();
  if (schema === undefined) {
    return payload as T;
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `Workspace Core returned an invalid response payload for ${request.method} ${request.path}.`,
    );
  }

  return parsed.data;
};

function formatWorkspaceCoreTransportError(error: unknown): string {
  const message =
    error instanceof Error && error.message.trim().length > 0
      ? redactWorkspaceCoreClientMessage(error.message)
      : 'unknown transport error';

  return `Workspace Core request failed before receiving a response: ${message}`;
}

function redactWorkspaceCoreClientMessage(message: string): string {
  const redactedUrls = message.replace(/\bhttps?:\/\/[^\s"'<>]+/giu, '<redacted>');
  const redactedPaths = redactedUrls
    .replace(/(?:[A-Za-z]:)?\/(?:[^/\s]+\/)*[^/\s]+/gu, '<redacted>')
    .replace(/\\(?:[^\\\s]+\\)*[^\\\s]+/gu, '<redacted>');
  const redactedSecrets = redactedPaths
    .replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]+\b/giu, '$1 <redacted>')
    .replace(
      /\b([A-Z0-9_]*TOKEN[A-Z0-9_]*|[A-Z0-9_]{3,})=([^\s]+)/giu,
      (_match: string, key: string) => `${key}=<redacted>`,
    );

  return trimWorkspaceCoreClientMessage(redactedSecrets);
}

function trimWorkspaceCoreClientMessage(message: string): string {
  const normalized = message.trim();
  if (normalized.length <= 2000) {
    return normalized;
  }

  return normalized.slice(-2000);
}

const first = <T>(items: readonly T[], message: string): T => {
  const item = items[0];
  if (item === undefined) {
    throw new Error(message);
  }
  return item;
};
