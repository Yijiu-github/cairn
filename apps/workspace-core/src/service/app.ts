// SPDX-License-Identifier: Apache-2.0

import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { z } from 'zod';

import {
  OperatorNoteBody,
  OperatorReasonBody,
  OperatorRerunBody,
  StartRunBody,
} from '@cairn/shared-contracts/contracts';
import {
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
import type { FastifyInstance } from 'fastify';
import type { ZodError } from 'zod';

export interface CreateWorkspaceCoreAppOptions {
  container: WorkspaceCoreContainer;
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

const toApplicationHttpStatus = (error: ApplicationError): 404 | 409 | 500 => {
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
  }

  return 500;
};

const ResumeRunBody = z.object({});

const toApplicationHttpCode = (
  status: 404 | 409 | 500,
): 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR' => {
  if (status === 404) {
    return 'NOT_FOUND';
  }

  if (status === 409) {
    return 'CONFLICT';
  }

  return 'INTERNAL_ERROR';
};

export const createWorkspaceCoreApp = async (
  options: CreateWorkspaceCoreAppOptions,
): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  await app.register(sensible);

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

  app.get('/v1/runs/:runId/tasks', async (request, reply) => {
    const runId = OrchestrationRunId.safeParse(
      (request.params as Record<string, unknown>)['runId'],
    );
    if (!runId.success) {
      return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
    }

    const tasks = await options.container.repository.listTasksByRun(runId.data);
    return reply.send({ items: tasks });
  });

  app.get('/v1/tasks/:taskId/agent-runs', async (request, reply) => {
    const taskId = TaskId.safeParse((request.params as Record<string, unknown>)['taskId']);
    if (!taskId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid task id.', taskId.error.issues));
    }

    const agentRuns = await options.container.repository.listAgentRunsByTask(taskId.data);
    return reply.send({ items: agentRuns });
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
    const body = ResumeRunBody.safeParse(request.body);

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
    if (!taskId.success) {
      return reply
        .code(400)
        .send(toApiError('BAD_REQUEST', 'Invalid task id.', taskId.error.issues));
    }

    const submitted = await options.container.orchestrationRuns.submitTaskToRuntime({
      taskId: taskId.data,
      runtimeType: 'mock',
      model: 'mock-model',
    });

    return reply.code(202).send(submitted.agentRun);
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
