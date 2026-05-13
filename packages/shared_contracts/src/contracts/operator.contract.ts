// SPDX-License-Identifier: Apache-2.0
/**
 * Operator 接管动作契约。
 *
 * 覆盖 docs/design/state-machines.md §5「operator 接管动作矩阵」中的所有动作：
 *   - pause / resume / cancel run
 *   - retry task / retry agent_run
 *   - rerun (基于同一请求新建一轮 run)
 *   - inject operator note
 *   - approve / reject protected step
 *
 * 路径前缀：/v1
 */

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { OrchestrationRun } from '../schemas/orchestration-run.js';
import {
  OrchestrationRunId,
  TaskId,
  AgentRunId,
  EventId,
} from '../schemas/ids.js';
import { commonErrorResponses } from './_common.js';

const c = initContract();

const ReasonBody = z.object({ reason: z.string().max(1000).optional() });

const RerunBody = z.object({
  /** 原始 event；省略时使用当前 run 的 origin_event_id */
  originEventId: EventId.optional(),
  /** 是否强制 replan（在新 run 内重做规划） */
  replan: z.boolean().default(false),
  /** operator 注入的补充上下文（可选） */
  operatorNote: z.string().max(4000).optional(),
});

const OperatorNoteBody = z.object({
  /**
   * 接管说明 / 上下文。
   * 写为 message + trace event，不改变 run 状态。
   */
  note: z.string().min(1).max(4000),
  /** 仅 operator 可见还是公开 */
  visibility: z.enum(['public', 'operator_only']).default('operator_only'),
});

const ApproveRejectBody = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(1000).optional(),
});

export const operatorContract = c.router(
  {
    pauseRun: {
      method: 'POST',
      path: '/runs/:runId/pause',
      pathParams: z.object({ runId: OrchestrationRunId }),
      body: ReasonBody,
      summary: 'Pause a running orchestration run',
      responses: { 200: OrchestrationRun, ...commonErrorResponses },
    },

    resumeRun: {
      method: 'POST',
      path: '/runs/:runId/resume',
      pathParams: z.object({ runId: OrchestrationRunId }),
      body: z.object({}).optional(),
      summary: 'Resume a paused run',
      responses: { 200: OrchestrationRun, ...commonErrorResponses },
    },

    cancelRun: {
      method: 'POST',
      path: '/runs/:runId/cancel',
      pathParams: z.object({ runId: OrchestrationRunId }),
      body: ReasonBody,
      summary: 'Cancel a run (best-effort)',
      responses: { 200: OrchestrationRun, ...commonErrorResponses },
    },

    retryTask: {
      method: 'POST',
      path: '/tasks/:taskId/retry',
      pathParams: z.object({ taskId: TaskId }),
      body: ReasonBody,
      summary: 'Retry a failed task within the same run (attempt+1)',
      responses: { 202: z.object({ taskId: TaskId, newAttempt: z.number().int() }), ...commonErrorResponses },
    },

    retryAgentRun: {
      method: 'POST',
      path: '/agent-runs/:agentRunId/retry',
      pathParams: z.object({ agentRunId: AgentRunId }),
      body: ReasonBody,
      summary: 'Retry a failed/lost agent run (creates new AgentRun, attempt+1)',
      responses: {
        202: z.object({ taskId: TaskId, newAgentRunId: AgentRunId }),
        ...commonErrorResponses,
      },
    },

    rerun: {
      method: 'POST',
      path: '/runs/:runId/rerun',
      pathParams: z.object({ runId: OrchestrationRunId }),
      body: RerunBody,
      summary: 'Start a new OrchestrationRun based on the same origin event',
      responses: { 202: OrchestrationRun, ...commonErrorResponses },
    },

    injectNote: {
      method: 'POST',
      path: '/runs/:runId/notes',
      pathParams: z.object({ runId: OrchestrationRunId }),
      body: OperatorNoteBody,
      summary: 'Inject an operator note (does not change run state)',
      responses: {
        201: z.object({ messageId: z.string(), traceEventId: z.string() }),
        ...commonErrorResponses,
      },
    },

    approveOrReject: {
      method: 'POST',
      path: '/tasks/:taskId/approval',
      pathParams: z.object({ taskId: TaskId }),
      body: ApproveRejectBody,
      summary: 'Approve or reject a task awaiting operator decision',
      responses: { 200: z.object({ taskId: TaskId, status: z.string() }), ...commonErrorResponses },
    },
  },
  { pathPrefix: '/v1' },
);
