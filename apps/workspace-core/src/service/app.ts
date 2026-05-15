// SPDX-License-Identifier: Apache-2.0

import sensible from '@fastify/sensible';
import Fastify from 'fastify';

import { StartRunBody } from '@cairn/shared-contracts/contracts';
import { OrchestrationRunId, TaskId, WorkspaceId } from '@cairn/shared-contracts/schemas';

import type { WorkspaceCoreContainer } from './container.js';
import type { CreateSingleWorkerRunInput } from '@cairn/application';
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
