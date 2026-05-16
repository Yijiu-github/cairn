// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { InMemoryApplicationRepository } from '../testing/memory-run-repository.js';

import { PlanningOutputService } from './planning-output-service.js';

import type { ApplicationClock, ApplicationIdFactory } from './orchestration-run-service.js';
import type {
  ContextPackId,
  OrchestrationRun,
  OrchestrationRunId,
  PlanningActionNode,
  PlanningBlockedReason,
  PlanningOutput,
  PlanningOutputId,
  StructuredError,
  TaskId,
  TraceEventId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

const ids = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0' as WorkspaceId,
  run: '01HZZZZZZZZZZZZZZZZZZZZZR0' as OrchestrationRunId,
  planningOutput: '01HZZZZZZZZZZZZZZZZZZZZZP0' as PlanningOutputId,
  task: '01HZZZZZZZZZZZZZZZZZZZZZT0' as TaskId,
  trace: '01HZZZZZZZZZZZZZZZZZZZZZX0' as TraceEventId,
  contextPack: '01HZZZZZZZZZZZZZZZZZZZZZC0' as ContextPackId,
};

const clock: ApplicationClock = {
  now: () => new Date('2026-05-14T01:00:00.000Z'),
};

const createIds = (): ApplicationIdFactory => ({
  agentRunId: () => {
    throw new Error('Unexpected agentRunId request');
  },
  orchestrationRunId: () => {
    throw new Error('Unexpected orchestrationRunId request');
  },
  planningOutputId: () => ids.planningOutput,
  taskId: () => {
    throw new Error('Unexpected taskId request');
  },
  traceEventId: () => ids.trace,
  traceId: () => ids.trace as never,
});

const createRunFixture = (overrides: Partial<OrchestrationRun> = {}): OrchestrationRun => ({
  orchestrationRunId: ids.run,
  workspaceId: ids.workspace,
  originEventId: '01HZZZZZZZZZZZZZZZZZZZZZE0' as never,
  status: 'running',
  executionMode: 'single_worker',
  hasPartialFailures: false,
  resultCompleteness: 'empty',
  completionLevel: 'full',
  traceId: ids.trace as never,
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

const createPlanningOutputFixture = (overrides: Partial<PlanningOutput> = {}): PlanningOutput => ({
  planningOutputId: ids.planningOutput,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  status: 'pending',
  actionTree: [],
  preconditions: [],
  contextPackRefs: [],
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

const createAction = (overrides: Partial<PlanningActionNode> = {}): PlanningActionNode => ({
  actionId: 'action-1',
  title: 'Inspect repository',
  intent: 'Confirm the plan',
  status: 'ready',
  dependsOnActionIds: [],
  ...overrides,
});

const createService = () => {
  const repository = new InMemoryApplicationRepository();
  const service = new PlanningOutputService({ clock, ids: createIds(), repository });
  return { repository, service };
};

describe('PlanningOutputService', () => {
  it('starts planning for a non-terminal run', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({ run: createRunFixture(), tasks: [] });

    const result = await service.startPlanning({
      runId: ids.run,
      contextPackRefs: [ids.contextPack],
    });

    expect(result).toMatchObject({
      planningOutputId: ids.planningOutput,
      workspaceId: ids.workspace,
      orchestrationRunId: ids.run,
      status: 'pending',
      contextPackRefs: [ids.contextPack],
    });
    await expect(repository.getPlanningOutput(ids.planningOutput)).resolves.toMatchObject({
      planningOutputId: ids.planningOutput,
      orchestrationRunId: ids.run,
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: 'planning',
      plannerOutputRef: ids.planningOutput,
      updatedAt: '2026-05-14T01:00:00.000Z',
    });
    expect(repository.listTraceEvents()).toMatchObject([
      {
        eventType: 'run.planning_started',
      },
    ]);
  });

  it('rejects duplicate planning starts', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ plannerOutputRef: ids.planningOutput }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture());

    await expect(service.startPlanning({ runId: ids.run })).rejects.toMatchObject({
      code: 'PLANNING_OUTPUT_ALREADY_EXISTS',
    });
  });

  it('completes planning and validates action dependencies', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'planning', plannerOutputRef: ids.planningOutput }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture());

    const actionTree: PlanningActionNode[] = [
      createAction(),
      createAction({
        actionId: 'action-2',
        title: 'Apply patch',
        intent: 'Make changes',
        status: 'planned',
        dependsOnActionIds: ['action-1'],
      }),
    ];

    const updated = await service.completePlanning({
      planningOutputId: ids.planningOutput,
      actionTree,
      preconditions: [
        {
          description: 'Repository exists',
          status: 'satisfied',
          evidenceRefs: [],
        },
      ],
      contextPackRefs: [ids.contextPack],
    });

    expect(updated).toMatchObject({
      status: 'ready',
      actionTree,
      preconditions: [
        {
          description: 'Repository exists',
          status: 'satisfied',
        },
      ],
      contextPackRefs: [ids.contextPack],
    });
    await expect(repository.getPlanningOutput(ids.planningOutput)).resolves.toMatchObject({
      status: 'ready',
      actionTree,
    });
    expect(repository.listTraceEvents()).toMatchObject([
      {
        eventType: 'run.planning_completed',
      },
    ]);
  });

  it('blocks planning with a blocked reason', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'planning', plannerOutputRef: ids.planningOutput }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture());

    const blockedReason: PlanningBlockedReason = {
      scope: 'run',
      code: 'needs_review',
      message: 'Needs operator review.',
    };

    const updated = await service.blockPlanning({
      planningOutputId: ids.planningOutput,
      blockedReason,
    });

    expect(updated).toMatchObject({
      status: 'blocked',
      blockedReason,
    });
    expect(repository.listTraceEvents()).toMatchObject([
      {
        eventType: 'run.planning_blocked',
      },
    ]);
  });

  it('fails planning and updates the run to failed', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'planning', plannerOutputRef: ids.planningOutput }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture());

    const error: StructuredError = {
      layer: 'execution',
      code: 'PLANNER_FAILED',
      message: 'Planner crashed.',
      retryable: true,
    };

    const updated = await service.failPlanning({
      planningOutputId: ids.planningOutput,
      error,
    });

    expect(updated).toMatchObject({
      status: 'failed',
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: 'failed',
      hasPartialFailures: true,
      resultCompleteness: 'empty',
      completionLevel: 'failed',
      error,
    });
    expect(repository.listTraceEvents()).toMatchObject([
      {
        eventType: 'run.planning_failed',
      },
    ]);
  });

  it('rejects terminal planning outputs', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'planning', plannerOutputRef: ids.planningOutput }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture({ status: 'ready' }));

    await expect(
      service.completePlanning({
        planningOutputId: ids.planningOutput,
      }),
    ).rejects.toMatchObject({
      code: 'PLANNING_OUTPUT_TERMINAL',
    });
  });

  it('rejects orphan planning output updates', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'planning' }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture());

    await expect(
      service.completePlanning({
        planningOutputId: ids.planningOutput,
      }),
    ).rejects.toMatchObject({
      code: 'PLANNING_OUTPUT_RUN_MISMATCH',
    });
  });

  it('rejects terminal run planning updates', async () => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'succeeded', plannerOutputRef: ids.planningOutput }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture());

    await expect(
      service.completePlanning({
        planningOutputId: ids.planningOutput,
      }),
    ).rejects.toMatchObject({
      code: 'ORCHESTRATION_RUN_TERMINAL',
    });
  });

  it.each([
    {
      name: 'missing dependency',
      actionTree: [createAction({ dependsOnActionIds: ['missing-action'] })],
    },
    {
      name: 'self dependency',
      actionTree: [createAction({ dependsOnActionIds: ['action-1'] })],
    },
    {
      name: 'dependency cycle',
      actionTree: [
        createAction({ actionId: 'action-1', dependsOnActionIds: ['action-2'] }),
        createAction({ actionId: 'action-2', dependsOnActionIds: ['action-1'] }),
      ],
    },
    {
      name: 'duplicate actionId',
      actionTree: [
        createAction({ actionId: 'action-1' }),
        createAction({ actionId: 'action-1', title: 'Duplicate action' }),
      ],
    },
    {
      name: 'missing parentActionId',
      actionTree: [createAction({ parentActionId: 'missing-parent' })],
    },
  ])('rejects invalid action tree with $name', async ({ actionTree }) => {
    const { repository, service } = createService();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'planning', plannerOutputRef: ids.planningOutput }),
      tasks: [],
    });
    await repository.createPlanningOutput(createPlanningOutputFixture());

    await expect(
      service.completePlanning({
        planningOutputId: ids.planningOutput,
        actionTree,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_PLANNING_OUTPUT',
    });
  });
});
