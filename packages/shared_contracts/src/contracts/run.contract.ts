// SPDX-License-Identifier: Apache-2.0
/**
 * OrchestrationRun / Task / AgentRun / Artifact / TraceEvent 查询 + 创建契约。
 *
 * 操作类动作（cancel / retry / pause / resume / inject note）放在 operator.contract.ts。
 *
 * 路径前缀：/v1
 */

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { AgentRun, AgentRunStatus } from '../schemas/agent-run.js';
import { Artifact } from '../schemas/artifact.js';
import { BudgetHint, PaginationQuery, Paginated } from '../schemas/common.js';
import {
  WorkspaceId,
  OrchestrationRunId,
  TaskId,
  AgentRunId,
  ArtifactId,
  EventId,
} from '../schemas/ids.js';
import {
  OrchestrationRun,
  OrchestrationRunStatus,
  ExecutionMode,
} from '../schemas/orchestration-run.js';
import { Task, TaskKind, TaskStatus } from '../schemas/task.js';
import { TraceEvent } from '../schemas/trace-event.js';

import { commonErrorResponses } from './_common.js';

const c = initContract();

// ---------------------------------------------------------------------------
// 入参 / 出参
// ---------------------------------------------------------------------------

const ListRunsQuery = PaginationQuery.extend({
  status: OrchestrationRunStatus.optional(),
  executionMode: ExecutionMode.optional(),
  conversationId: z.string().optional(),
});

const StartRunTaskBody = z.object({
  taskKind: TaskKind.default('custom'),
  title: z.string().min(1).max(200),
  brief: z.string().min(1),
  executionProfile: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  contextRefs: z.array(ArtifactId).optional(),
  budgetHint: BudgetHint.optional(),
});

export const StartRunBody = z.object({
  /** 触发该 run 的 event id（必须是已写入 DB 的 Event） */
  originEventId: EventId,
  /** 可选：限定要使用的 runtime profile / model 偏好 */
  executionProfile: z.string().optional(),
  /** 可选：调用方提示的执行模式（最终由 supervisor 决定） */
  preferredMode: ExecutionMode.optional(),
  /** R1 workspace-core 骨架先以 single-worker task 作为最小闭环。 */
  task: StartRunTaskBody.optional(),
});
export type StartRunBody = z.infer<typeof StartRunBody>;

const ListTraceEventsQuery = PaginationQuery.extend({
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  /** 仅返回某一类 event_type 前缀，如 "run." / "task." */
  eventTypePrefix: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const runContract = c.router(
  {
    // --- OrchestrationRun ---
    listRuns: {
      method: 'GET',
      path: '/workspaces/:workspaceId/runs',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      query: ListRunsQuery,
      summary: 'List orchestration runs in a workspace',
      responses: {
        200: Paginated(OrchestrationRun),
        ...commonErrorResponses,
      },
    },

    getRun: {
      method: 'GET',
      path: '/runs/:runId',
      pathParams: z.object({ runId: OrchestrationRunId }),
      summary: 'Get a single orchestration run',
      responses: {
        200: OrchestrationRun,
        ...commonErrorResponses,
      },
    },

    startRun: {
      method: 'POST',
      path: '/workspaces/:workspaceId/runs',
      pathParams: z.object({ workspaceId: WorkspaceId }),
      body: StartRunBody,
      summary: 'Start a new orchestration run',
      responses: {
        202: OrchestrationRun,
        ...commonErrorResponses,
      },
    },

    // --- Task ---
    listTasks: {
      method: 'GET',
      path: '/runs/:runId/tasks',
      pathParams: z.object({ runId: OrchestrationRunId }),
      query: PaginationQuery.extend({ status: TaskStatus.optional() }),
      summary: 'List tasks for a run',
      responses: {
        200: Paginated(Task),
        ...commonErrorResponses,
      },
    },

    getTask: {
      method: 'GET',
      path: '/tasks/:taskId',
      pathParams: z.object({ taskId: TaskId }),
      summary: 'Get a single task',
      responses: {
        200: Task,
        ...commonErrorResponses,
      },
    },

    // --- AgentRun ---
    listAgentRuns: {
      method: 'GET',
      path: '/tasks/:taskId/agent-runs',
      pathParams: z.object({ taskId: TaskId }),
      query: PaginationQuery.extend({ status: AgentRunStatus.optional() }),
      summary: 'List agent runs for a task (across attempts)',
      responses: {
        200: Paginated(AgentRun),
        ...commonErrorResponses,
      },
    },

    getAgentRun: {
      method: 'GET',
      path: '/agent-runs/:agentRunId',
      pathParams: z.object({ agentRunId: AgentRunId }),
      summary: 'Get a single agent run',
      responses: {
        200: AgentRun,
        ...commonErrorResponses,
      },
    },

    // --- Artifact ---
    listArtifacts: {
      method: 'GET',
      path: '/runs/:runId/artifacts',
      pathParams: z.object({ runId: OrchestrationRunId }),
      query: PaginationQuery,
      summary: 'List artifacts produced in a run',
      responses: {
        200: Paginated(Artifact),
        ...commonErrorResponses,
      },
    },

    getArtifact: {
      method: 'GET',
      path: '/artifacts/:artifactId',
      pathParams: z.object({ artifactId: ArtifactId }),
      summary: 'Get artifact metadata (content fetched separately)',
      responses: {
        200: Artifact,
        ...commonErrorResponses,
      },
    },

    // --- TraceEvent ---
    listTraceEvents: {
      method: 'GET',
      path: '/runs/:runId/trace',
      pathParams: z.object({ runId: OrchestrationRunId }),
      query: ListTraceEventsQuery,
      summary: 'List trace events for a run (replay source)',
      responses: {
        200: Paginated(TraceEvent),
        ...commonErrorResponses,
      },
    },
  },
  { pathPrefix: '/v1' },
);
