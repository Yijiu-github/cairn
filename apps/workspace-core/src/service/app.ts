// SPDX-License-Identifier: Apache-2.0

import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { z } from 'zod';

import {
  OperatorNoteBody,
  OperatorReasonBody,
  OperatorRerunBody,
  StartRunBody,
  SubmitTaskToRuntimeBody,
} from '@cairn/shared-contracts/contracts';
import {
  ArtifactId,
  CodeSearchQuery,
  ContextPackCreate,
  ContextPackFromCodeSearchCreate,
  AgentRunId,
  OrchestrationRunId,
  SourceRootCreate,
  SourceRootId,
  TaskId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

import type { WorkspaceCoreContainer } from './container.js';
import type { ApplicationError, CreateSingleWorkerRunInput } from '@cairn/application';
import type { Artifact } from '@cairn/shared-contracts/schemas';
import type { FastifyInstance } from 'fastify';
import type { ZodError } from 'zod';

export interface CreateWorkspaceCoreAppOptions {
  container: WorkspaceCoreContainer;
  authToken?: string;
  logger?: boolean;
}

type ParsedStartRunTask = NonNullable<StartRunBody['task']>;
type ApplicationStartRunTask = CreateSingleWorkerRunInput['task'];

const toApiError = (code: string, message: string, issues?: ZodError['issues']) => ({
  error: {
    code,
    message,
    ...(issues === undefined
      ? {}
      : {
          issues: issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        }),
  },
});

const isApplicationError = (error: unknown): error is ApplicationError =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  'code' in error &&
  (error as { name?: unknown }).name === 'ApplicationError';

const toApplicationHttpStatus = (error: ApplicationError): 404 | 409 | 500 | 503 => {
  const code = error.code as string;

  switch (code) {
    case 'MISSING_AGENT_RUN':
    case 'MISSING_ORCHESTRATION_RUN':
    case 'MISSING_TASK':
    case 'PLANNING_OUTPUT_NOT_FOUND':
    case 'SOURCE_ROOT_NOT_FOUND': {
      return 404;
    }
    case 'AGENT_RUN_TERMINAL':
    case 'INVALID_RUN_STATE':
    case 'INVALID_PLANNING_OUTPUT':
    case 'INVALID_TASK_STATE':
    case 'ORCHESTRATION_RUN_TERMINAL':
    case 'PLANNING_OUTPUT_ALREADY_EXISTS':
    case 'PLANNING_OUTPUT_RUN_MISMATCH':
    case 'PLANNING_OUTPUT_TERMINAL':
    case 'RERUN_UNSUPPORTED_GRAPH':
    case 'TASK_NOT_READY':
    case 'TASK_TERMINAL': {
      return 409;
    }
    case 'RUNTIME_REJECTED': {
      return 500;
    }
    case 'RUNTIME_UNAVAILABLE': {
      return 503;
    }
  }

  return 500;
};

const ResumeRunBody = z.object({});
const ListRunsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  status: z
    .enum([
      'queued',
      'planning',
      'running',
      'synthesizing',
      'paused',
      'succeeded',
      'failed',
      'cancelled',
      'timeout',
    ])
    .optional(),
  executionMode: z.enum(['direct_answer', 'single_worker', 'multi_worker']).optional(),
  conversationId: z.string().optional(),
});
const ListTasksQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  status: z
    .enum([
      'pending',
      'ready',
      'dispatched',
      'running',
      'succeeded',
      'failed',
      'skipped',
      'cancelled',
    ])
    .optional(),
});
const ListAgentRunsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  status: z
    .enum(['submitted', 'queued', 'running', 'succeeded', 'failed', 'cancelled', 'timeout', 'lost'])
    .optional(),
});
const ListTraceEventsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  eventTypePrefix: z.string().optional(),
});

const ListArtifactsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

const paginateItems = <T>(items: T[], limit: number) => ({
  items: items.slice(0, limit),
  nextCursor: items.length > limit ? String(limit) : undefined,
  total: items.length,
});

const sanitizeArtifactForResponse = (artifact: Artifact): Artifact => ({
  artifactId: artifact.artifactId,
  workspaceId: artifact.workspaceId,
  ...(artifact.orchestrationRunId === undefined
    ? {}
    : { orchestrationRunId: artifact.orchestrationRunId }),
  ...(artifact.taskId === undefined ? {} : { taskId: artifact.taskId }),
  ...(artifact.runId === undefined ? {} : { runId: artifact.runId }),
  artifactRole: artifact.artifactRole,
  kind: artifact.kind,
  formatVersion: artifact.formatVersion,
  uriOrPath: artifact.payloadRef ?? 'artifact-payload://redacted',
  ...(artifact.contentType === undefined ? {} : { contentType: artifact.contentType }),
  ...(artifact.sizeBytes === undefined ? {} : { sizeBytes: artifact.sizeBytes }),
  ...(artifact.payloadRef === undefined ? {} : { payloadRef: artifact.payloadRef }),
  sensitivity: artifact.sensitivity,
  producerType: artifact.producerType,
  ...(artifact.producerId === undefined ? {} : { producerId: artifact.producerId }),
  visibility: artifact.visibility,
  createdAt: artifact.createdAt,
});

const toApplicationHttpCode = (
  status: 404 | 409 | 500 | 503,
): 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR' | 'UNAVAILABLE' => {
  if (status === 404) {
    return 'NOT_FOUND';
  }

  if (status === 409) {
    return 'CONFLICT';
  }

  if (status === 503) {
    return 'UNAVAILABLE';
  }

  return 'INTERNAL_ERROR';
};

const toArtifactPayloadHttpStatus = (error: unknown): 404 | 413 | 415 => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (code === 'ARTIFACT_PAYLOAD_STORAGE_ERROR') {
      return 415;
    }
    if (code === 'ARTIFACT_PAYLOAD_TOO_LARGE') {
      return 413;
    }

    if (code === 'ARTIFACT_PAYLOAD_UNSUPPORTED_MEDIA') {
      return 415;
    }
  }

  return 404;
};

export const createWorkspaceCoreApp = async (
  options: CreateWorkspaceCoreAppOptions,
): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  await app.register(sensible);

  const authToken = options.authToken;
  if (authToken !== undefined) {
    app.addHook('onRequest', async (request, reply) => {
      const authorization = request.headers.authorization;
      if (authorization === `Bearer ${authToken}`) {
        return;
      }

      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid workspace-core bearer token.',
        },
      });
    });
  }

  app.get('/health', () => ({
    ok: true,
    service: 'workspace-core',
  }));

  app.post('/v1/workspaces/:workspaceId/runs', async (request, reply) => {
    const params = WorkspaceId.safeParse(
      (request.params as Record<string, unknown>)['workspaceId'],
    );
    const body = StartRunBody.safeParse(request.body);

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid workspace id.', params.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid start run body.', body.error.issues));
    }

    const task: ApplicationStartRunTask =
      body.data.task === undefined
        ? {
            taskKind: 'custom',
            title: 'Run task',
            brief: 'Created by workspace-core minimal API.',
          }
        : toApplicationTask(body.data.task);

    const created = await options.container.orchestrationRuns.createSingleWorkerRun({
      workspaceId: params.data,
      originEventId: body.data.originEventId,
      task,
    });

    return reply.code(202).send(created.run);
  });

  app.get('/v1/workspaces/:workspaceId/runs', async (request, reply) => {
    const params = WorkspaceId.safeParse(
      (request.params as Record<string, unknown>)['workspaceId'],
    );
    const query = ListRunsQuery.safeParse(request.query);

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid workspace id.', params.error.issues));
    }

    if (!query.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid list runs query.', query.error.issues));
    }

    const runs = await options.container.repository.listRunsByWorkspace(params.data);
    const filteredRuns = runs.filter((run) => {
      if (query.data.status !== undefined && run.status !== query.data.status) {
        return false;
      }
      if (
        query.data.executionMode !== undefined &&
        run.executionMode !== query.data.executionMode
      ) {
        return false;
      }
      if (
        query.data.conversationId !== undefined &&
        run.conversationId !== query.data.conversationId
      ) {
        return false;
      }
      return true;
    });

    return reply.send(paginateItems(filteredRuns, query.data.limit));
  });

  app.post('/v1/workspaces/:workspaceId/source-roots', async (request, reply) => {
    const params = WorkspaceId.safeParse(
      (request.params as Record<string, unknown>)['workspaceId'],
    );
    const body = SourceRootCreate.safeParse(request.body);

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid workspace id.', params.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid source root body.', body.error.issues));
    }

    const created = await options.container.codeContext.registerSourceRoot({
      workspaceId: params.data,
      sourceRoot: body.data,
    });

    return reply.code(201).send(created.sourceRoot);
  });

  app.get('/v1/workspaces/:workspaceId/source-roots', async (request, reply) => {
    const params = WorkspaceId.safeParse(
      (request.params as Record<string, unknown>)['workspaceId'],
    );

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid workspace id.', params.error.issues));
    }

    const items = await options.container.codeContext.listSourceRoots({ workspaceId: params.data });
    return reply.send({ items });
  });

  app.post('/v1/source-roots/:sourceRootId/reindex', async (request, reply) => {
    const params = SourceRootId.safeParse(
      (request.params as Record<string, unknown>)['sourceRootId'],
    );

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid source root id.', params.error.issues));
    }

    try {
      const result = await options.container.codeContext.reindexSourceRoot({
        sourceRootId: params.data,
      });
      return await reply.code(202).send(result);
    } catch (error) {
      if (isApplicationError(error) && error.code === 'SOURCE_ROOT_NOT_FOUND') {
        return reply.code(404).send(toApiError('NOT_FOUND', error.message));
      }

      throw error;
    }
  });

  app.get('/v1/source-roots/:sourceRootId/index', async (request, reply) => {
    const params = SourceRootId.safeParse(
      (request.params as Record<string, unknown>)['sourceRootId'],
    );

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid source root id.', params.error.issues));
    }

    try {
      const result = await options.container.codeContext.getSourceRootIndex({
        sourceRootId: params.data,
      });
      return await reply.send(result);
    } catch (error) {
      if (isApplicationError(error) && error.code === 'SOURCE_ROOT_NOT_FOUND') {
        return reply.code(404).send(toApiError('NOT_FOUND', error.message));
      }

      throw error;
    }
  });

  app.get('/v1/code-search', async (request, reply) => {
    const query = CodeSearchQuery.safeParse(request.query);

    if (!query.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid code search query.', query.error.issues));
    }

    try {
      const result = await options.container.codeContext.searchCodeIndex(query.data);
      return await reply.send(result);
    } catch (error) {
      if (isApplicationError(error) && error.code === 'SOURCE_ROOT_NOT_FOUND') {
        return reply.code(404).send(toApiError('NOT_FOUND', error.message));
      }

      throw error;
    }
  });

  app.post('/v1/workspaces/:workspaceId/context-packs', async (request, reply) => {
    const params = WorkspaceId.safeParse(
      (request.params as Record<string, unknown>)['workspaceId'],
    );
    const body = ContextPackCreate.safeParse(request.body);

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid workspace id.', params.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid context pack body.', body.error.issues));
    }

    const manifest = await options.container.codeContext.createContextPack({
      workspaceId: params.data,
      contextPack: body.data,
    });

    return reply.code(201).send(manifest);
  });

  app.post('/v1/workspaces/:workspaceId/context-packs/from-code-search', async (request, reply) => {
    const params = WorkspaceId.safeParse(
      (request.params as Record<string, unknown>)['workspaceId'],
    );
    const body = ContextPackFromCodeSearchCreate.safeParse(request.body);

    if (!params.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid workspace id.', params.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid context pack body.', body.error.issues));
    }

    try {
      const manifest = await options.container.codeContext.createContextPackFromCodeSearch({
        workspaceId: params.data,
        contextPack: body.data,
      });

      return await reply.code(201).send(manifest);
    } catch (error) {
      if (isApplicationError(error) && error.code === 'SOURCE_ROOT_NOT_FOUND') {
        return reply.code(404).send(toApiError('NOT_FOUND', error.message));
      }

      throw error;
    }
  });

  app.get('/v1/runs/:runId', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    const run = await options.container.repository.getRun(runId.data);
    if (run === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Run not found.'));
    }

    return reply.send(run);
  });

  app.get('/v1/runs/:runId/artifacts', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    const run = await options.container.repository.getRun(runId.data);
    if (run === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Run not found.'));
    }

    const query = ListArtifactsQuery.safeParse(request.query);
    if (!query.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid artifact list query.', query.error.issues));
    }

    const artifacts = await options.container.repository.listArtifactsByRun(runId.data);
    const sanitizedArtifacts = artifacts.map((artifact) => sanitizeArtifactForResponse(artifact));
    return reply.send(paginateItems(sanitizedArtifacts, query.data.limit));
  });

  app.get('/v1/runs/:runId/planning-output', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    const run = await options.container.repository.getRun(runId.data);
    if (run === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Run not found.'));
    }

    const planningOutput = await options.container.repository.getPlanningOutputByRun(runId.data);
    if (planningOutput === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Planning output not found.'));
    }

    return reply.send(planningOutput);
  });

  app.get('/v1/runs/:runId/trace', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    const run = await options.container.repository.getRun(runId.data);
    if (run === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Run not found.'));
    }

    const query = ListTraceEventsQuery.safeParse(request.query);
    if (!query.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid trace query.', query.error.issues));
    }

    const traceEvents = await options.container.repository.listTraceEventsByRun(runId.data);
    const filteredTraceEvents = traceEvents.filter((event) => {
      if (query.data.level !== undefined && event.level !== query.data.level) {
        return false;
      }
      if (
        query.data.eventTypePrefix !== undefined &&
        !event.eventType.startsWith(query.data.eventTypePrefix)
      ) {
        return false;
      }
      return true;
    });
    return reply.send(paginateItems(filteredTraceEvents, query.data.limit));
  });

  app.get('/v1/runs/:runId/tasks', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    const run = await options.container.repository.getRun(runId.data);
    if (run === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Run not found.'));
    }

    const query = ListTasksQuery.safeParse(request.query);
    if (!query.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid task list query.', query.error.issues));
    }

    const tasks = await options.container.repository.listTasksByRun(runId.data);
    const filteredTasks = tasks.filter((task) =>
      query.data.status === undefined ? true : task.status === query.data.status,
    );
    return reply.send(paginateItems(filteredTasks, query.data.limit));
  });

  app.get('/v1/tasks/:taskId', async (request, reply) => {
    const taskId = TaskId.safeParse((request.params as Record<string, unknown>)['taskId']);
    if (!taskId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid task id.', taskId.error.issues));
    }

    const task = await options.container.repository.getTask(taskId.data);
    if (task === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Task not found.'));
    }

    return reply.send(task);
  });

  app.get('/v1/tasks/:taskId/agent-runs', async (request, reply) => {
    const taskId = TaskId.safeParse((request.params as Record<string, unknown>)['taskId']);
    if (!taskId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid task id.', taskId.error.issues));
    }

    const task = await options.container.repository.getTask(taskId.data);
    if (task === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Task not found.'));
    }

    const query = ListAgentRunsQuery.safeParse(request.query);
    if (!query.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid agent run list query.', query.error.issues));
    }

    const agentRuns = await options.container.repository.listAgentRunsByTask(taskId.data);
    const filteredAgentRuns = agentRuns.filter((agentRun) =>
      query.data.status === undefined ? true : agentRun.status === query.data.status,
    );
    return reply.send(paginateItems(filteredAgentRuns, query.data.limit));
  });

  app.get('/v1/agent-runs/:agentRunId', async (request, reply) => {
    const agentRunId = AgentRunId.safeParse(
      (request.params as Record<string, unknown>)['agentRunId'],
    );
    if (!agentRunId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid agent run id.', agentRunId.error.issues));
    }

    const agentRun = await options.container.repository.getAgentRun(agentRunId.data);
    if (agentRun === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Agent run not found.'));
    }

    return reply.send(agentRun);
  });

  app.get('/v1/artifacts/:artifactId', async (request, reply) => {
    const artifactId = ArtifactId.safeParse(
      (request.params as Record<string, unknown>)['artifactId'],
    );
    if (!artifactId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid artifact id.', artifactId.error.issues));
    }

    const artifact = await options.container.repository.getArtifact(artifactId.data);
    if (artifact === undefined) {
      return reply.code(404).send(toApiError('NOT_FOUND', 'Artifact not found.'));
    }

    return reply.send(sanitizeArtifactForResponse(artifact));
  });

  app.get('/v1/artifacts/:artifactId/payload', async (request, reply) => {
    const artifactId = ArtifactId.safeParse(
      (request.params as Record<string, unknown>)['artifactId'],
    );
    if (!artifactId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid artifact id.', artifactId.error.issues));
    }

    const artifact = await options.container.repository.getArtifact(artifactId.data);
    if (artifact?.payloadRef === undefined) {
      return reply
        .code(404)
        .send(toApiError('ARTIFACT_PAYLOAD_NOT_FOUND', 'Artifact payload not found.'));
    }

    try {
      const payload = await options.container.artifactStore.readText(artifact.payloadRef);
      return await reply.send({
        artifactId: artifactId.data,
        ...payload,
      });
    } catch (error) {
      const status = toArtifactPayloadHttpStatus(error);
      const code =
        status === 413
          ? 'ARTIFACT_PAYLOAD_TOO_LARGE'
          : status === 415
            ? 'ARTIFACT_PAYLOAD_UNSUPPORTED_MEDIA'
            : 'ARTIFACT_PAYLOAD_NOT_FOUND';
      const message =
        status === 413
          ? 'Artifact payload is too large to inline.'
          : status === 415
            ? 'Artifact payload media type is unsupported.'
            : 'Artifact payload not found.';
      return reply.code(status).send(toApiError(code, message));
    }
  });

  app.post('/v1/runs/:runId/pause', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    const body = OperatorReasonBody.safeParse(request.body);

    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid pause body.', body.error.issues));
    }

    try {
      const run = await options.container.orchestrationRuns.pauseRun({
        runId: runId.data,
        ...(body.data.reason === undefined ? {} : { reason: body.data.reason }),
      });
      return await reply.send(run);
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  app.post('/v1/runs/:runId/resume', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    const body =
      request.body === undefined
        ? { success: true as const, data: undefined }
        : ResumeRunBody.safeParse(request.body);

    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid resume body.', body.error.issues));
    }

    try {
      const run = await options.container.orchestrationRuns.resumeRun({ runId: runId.data });
      return await reply.send(run);
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  app.post('/v1/runs/:runId/cancel', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    const body = OperatorReasonBody.safeParse(request.body);

    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid cancel body.', body.error.issues));
    }

    try {
      const run = await options.container.orchestrationRuns.cancelRun({
        runId: runId.data,
        ...(body.data.reason === undefined ? {} : { reason: body.data.reason }),
      });
      return await reply.send(run);
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  app.post('/v1/tasks/:taskId/retry', async (request, reply) => {
    const taskId = TaskId.safeParse((request.params as Record<string, unknown>)['taskId']);
    const body = OperatorReasonBody.safeParse(request.body);

    if (!taskId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid task id.', taskId.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid retry body.', body.error.issues));
    }

    try {
      const result = await options.container.orchestrationRuns.retryTask({
        taskId: taskId.data,
        ...(body.data.reason === undefined ? {} : { reason: body.data.reason }),
      });
      return await reply.code(202).send(result);
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  app.post('/v1/runs/:runId/rerun', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    const body = OperatorRerunBody.safeParse(request.body);

    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid rerun body.', body.error.issues));
    }

    try {
      const run = await options.container.orchestrationRuns.rerun({
        runId: runId.data,
        ...(body.data.originEventId === undefined
          ? {}
          : { originEventId: body.data.originEventId }),
        replan: body.data.replan,
        ...(body.data.operatorNote === undefined ? {} : { operatorNote: body.data.operatorNote }),
      });
      return await reply.code(202).send(run);
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  app.post('/v1/runs/:runId/notes', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    const body = OperatorNoteBody.safeParse(request.body);

    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid operator note body.', body.error.issues));
    }

    try {
      const result = await options.container.orchestrationRuns.injectOperatorNote({
        runId: runId.data,
        note: body.data.note,
        visibility: body.data.visibility,
      });
      return await reply.code(201).send(result);
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  app.post('/v1/agent-runs/:agentRunId/drain-runtime', async (request, reply) => {
    const agentRunId = AgentRunId.safeParse(
      (request.params as Record<string, unknown>)['agentRunId'],
    );
    if (!agentRunId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid agent run id.', agentRunId.error.issues));
    }

    try {
      const result = await options.container.orchestrationRuns.drainAgentRunRuntime({
        agentRunId: agentRunId.data,
      });
      return await reply.code(202).send(result);
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  app.post('/v1/tasks/:taskId/agent-runs', async (request, reply) => {
    const taskId = TaskId.safeParse((request.params as Record<string, unknown>)['taskId']);
    const body = SubmitTaskToRuntimeBody.safeParse(request.body);
    if (!taskId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid task id.', taskId.error.issues));
    }

    if (!body.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid submit runtime body.', body.error.issues));
    }

    try {
      const submitted = await options.container.orchestrationRuns.submitTaskToRuntime({
        taskId: taskId.data,
        runtimeType: body.data.runtimeType,
        model: body.data.model,
        prompt: body.data.prompt,
        ...(body.data.timeoutMs === undefined ? {} : { timeoutMs: body.data.timeoutMs }),
        ...(body.data.options === undefined ? {} : { options: body.data.options }),
      });

      return await reply.code(201).send({
        agentRunId: submitted.agentRun.runId,
        taskId: submitted.agentRun.taskId,
        orchestrationRunId: submitted.agentRun.orchestrationRunId,
        status: submitted.agentRun.status,
        ...(submitted.providerRunId === undefined
          ? {}
          : { providerRunId: submitted.providerRunId }),
      });
    } catch (error) {
      if (isApplicationError(error)) {
        const status = toApplicationHttpStatus(error);
        return reply.code(status).send(toApiError(toApplicationHttpCode(status), error.message));
      }

      throw error;
    }
  });

  return app;
};

const toApplicationTask = (task: ParsedStartRunTask): ApplicationStartRunTask => ({
  taskKind: task.taskKind,
  title: task.title,
  brief: task.brief,
  ...(task.executionProfile === undefined ? {} : { executionProfile: task.executionProfile }),
  ...(task.priority === undefined ? {} : { priority: task.priority }),
  ...(task.contextRefs === undefined ? {} : { contextRefs: task.contextRefs }),
  ...(task.budgetHint === undefined ? {} : { budgetHint: task.budgetHint }),
});
