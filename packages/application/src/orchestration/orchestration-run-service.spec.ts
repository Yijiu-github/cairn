// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { createAdapterError } from '@cairn/runtime-gateway';

import { InMemoryApplicationRepository } from '../testing/memory-run-repository.js';

import { OrchestrationRunService } from './orchestration-run-service.js';

import type { RuntimeGatewayPort } from '../ports/runtime-gateway-port.js';
import type { AdapterSubmitAck, AdapterSubmitRequest } from '@cairn/runtime-gateway';
import type {
  AgentRun,
  AgentRunId,
  ArtifactId,
  EventId,
  OrchestrationRun,
  OrchestrationRunId,
  Task,
  TaskId,
  TraceEventId,
  TraceId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

type OrchestrationControlHarnessService = OrchestrationRunService & {
  pauseRun(input: { runId: OrchestrationRunId; reason?: string }): Promise<OrchestrationRun>;
  resumeRun(input: { runId: OrchestrationRunId }): Promise<OrchestrationRun>;
  cancelRun(input: { runId: OrchestrationRunId; reason?: string }): Promise<OrchestrationRun>;
  retryTask(input: { taskId: TaskId; reason?: string }): Promise<{
    taskId: TaskId;
    newAttempt: number;
  }>;
  rerun(input: {
    runId: OrchestrationRunId;
    originEventId?: EventId;
    replan?: boolean;
    operatorNote?: string;
  }): Promise<OrchestrationRun>;
  injectOperatorNote(input: {
    runId: OrchestrationRunId;
    note: string;
    visibility: 'operator_only' | 'public';
  }): Promise<{ messageId: string; traceEventId: TraceEventId }>;
};

const ids = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0' as WorkspaceId,
  event: '01HZZZZZZZZZZZZZZZZZZZZZE0' as EventId,
  run: '01HZZZZZZZZZZZZZZZZZZZZZR0' as OrchestrationRunId,
  task: '01HZZZZZZZZZZZZZZZZZZZZZT0' as TaskId,
  agentRun: '01HZZZZZZZZZZZZZZZZZZZZZA0' as AgentRunId,
  artifact: '01HZZZZZZZZZZZZZZZZZZZZZF0' as ArtifactId,
  trace: '01HZZZZZZZZZZZZZZZZZZZZZX0' as TraceId,
  rerun: '01HZZZZZZZZZZZZZZZZZZZZRR1' as OrchestrationRunId,
  rerunTask: '01HZZZZZZZZZZZZZZZZZZZZTT1' as TaskId,
  noteTrace: '01HZZZZZZZZZZZZZZZZZZZZZN1' as TraceEventId,
};

class RecordingRuntimeGateway implements RuntimeGatewayPort {
  readonly requests: AdapterSubmitRequest[] = [];

  constructor(private readonly ack?: AdapterSubmitAck) {}

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    this.requests.push(request);
    return Promise.resolve(
      this.ack ?? { runId: request.runId, accepted: true, providerRunId: 'provider:1' },
    );
  }
}

const createHarness = (
  generatedIds: Partial<{
    runIds: OrchestrationRunId[];
    taskIds: TaskId[];
    agentRunIds: AgentRunId[];
    traceEventIds: TraceEventId[];
  }> = {},
): {
  repository: InMemoryApplicationRepository;
  runtimeGateway: RecordingRuntimeGateway;
  service: OrchestrationControlHarnessService;
} => {
  let traceSequence = 0;
  const runIds = [...(generatedIds.runIds ?? [ids.run])];
  const taskIds = [...(generatedIds.taskIds ?? [ids.task])];
  const agentRunIds = [...(generatedIds.agentRunIds ?? [ids.agentRun])];
  const traceEventIds = [...(generatedIds.traceEventIds ?? [])];
  const repository = new InMemoryApplicationRepository();
  const runtimeGateway = new RecordingRuntimeGateway();
  const service = new OrchestrationRunService({
    repository,
    runtimeGateway,
    clock: { now: () => new Date('2026-05-14T01:00:00.000Z') },
    ids: {
      orchestrationRunId: () => {
        const id = runIds.shift();
        if (id === undefined) {
          throw new Error('No generated run id available');
        }
        return id;
      },
      taskId: () => {
        const id = taskIds.shift();
        if (id === undefined) {
          throw new Error('No generated task id available');
        }
        return id;
      },
      agentRunId: () => {
        const id = agentRunIds.shift();
        if (id === undefined) {
          throw new Error('No generated agent run id available');
        }
        return id;
      },
      traceId: () => ids.trace,
      traceEventId: () => {
        const fixedId = traceEventIds.shift();
        if (fixedId !== undefined) {
          return fixedId;
        }
        return `01HZZZZZZZZZZZZZZZZZZZZZ${(traceSequence++).toString(16).toUpperCase()}` as TraceEventId;
      },
    },
  }) as OrchestrationControlHarnessService;
  return { repository, runtimeGateway, service };
};

const createRunAndSubmit = async () => {
  const harness: ReturnType<typeof createHarness> = createHarness();
  const created = await harness.service.createSingleWorkerRun({
    workspaceId: ids.workspace,
    originEventId: ids.event,
    task: {
      taskKind: 'edit',
      title: 'Apply patch',
      brief: 'Update the target module.',
    },
  });
  const submitted = await harness.service.submitTaskToRuntime({
    taskId: created.task.taskId,
    runtimeType: 'mock',
    model: 'mock-model',
    inputs: [{ artifactId: ids.artifact }],
  });
  return { ...harness, created, submitted };
};

const createRunFixture = (overrides: Partial<OrchestrationRun> = {}): OrchestrationRun => ({
  orchestrationRunId: ids.run,
  workspaceId: ids.workspace,
  originEventId: ids.event,
  status: 'running',
  executionMode: 'single_worker',
  hasPartialFailures: false,
  resultCompleteness: 'empty',
  completionLevel: 'full',
  traceId: ids.trace,
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

const createTaskFixture = (overrides: Partial<Task> = {}): Task => ({
  taskId: ids.task,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.run,
  taskKind: 'edit',
  title: 'Apply patch',
  brief: 'Update the target module.',
  status: 'running',
  priority: 50,
  attempt: 0,
  idempotencyKey: `${ids.task}:0`,
  dependsOnTaskIds: [],
  contextRefs: [],
  artifactRefs: [],
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

const createAgentRunFixture = (overrides: Partial<AgentRun> = {}): AgentRun => ({
  runId: ids.agentRun,
  workspaceId: ids.workspace,
  taskId: ids.task,
  orchestrationRunId: ids.run,
  runtimeType: 'mock',
  status: 'running',
  attempt: 0,
  submittedAt: '2026-05-14T00:00:00.000Z',
  retryable: true,
  cancelable: true,
  traceId: ids.trace,
  createdAt: '2026-05-14T00:00:00.000Z',
  updatedAt: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

describe('OrchestrationRunService', () => {
  it('creates a queued single-worker run with one ready task', async () => {
    const { repository, service } = createHarness();

    const result = await service.createSingleWorkerRun({
      workspaceId: ids.workspace,
      originEventId: ids.event,
      task: {
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update the target module.',
      },
    });

    await expect(repository.getRun(result.run.orchestrationRunId)).resolves.toMatchObject({
      status: 'queued',
      executionMode: 'single_worker',
      traceId: ids.trace,
    });
    await expect(repository.getTask(result.task.taskId)).resolves.toMatchObject({
      status: 'ready',
      attempt: 0,
      idempotencyKey: `${ids.task}:0`,
    });
  });

  it('submits a ready task to the runtime gateway and records an AgentRun', async () => {
    const { repository, runtimeGateway, service } = createHarness();
    const { task } = await service.createSingleWorkerRun({
      workspaceId: ids.workspace,
      originEventId: ids.event,
      task: {
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update the target module.',
      },
    });

    const result = await service.submitTaskToRuntime({
      taskId: task.taskId,
      runtimeType: 'mock',
      model: 'mock-model',
      inputs: [{ artifactId: ids.artifact }],
    });

    expect(runtimeGateway.requests).toHaveLength(1);
    expect(runtimeGateway.requests[0]).toMatchObject({
      runId: ids.agentRun,
      model: 'mock-model',
      traceId: ids.trace,
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({ status: 'running' });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({ status: 'dispatched' });
    expect(result.agentRun).toMatchObject({
      status: 'submitted',
      providerRunId: 'provider:1',
    });
  });

  it('maps queued, started, and succeeded events into terminal run state', async () => {
    const { repository, service } = await createRunAndSubmit();

    await service.applyAdapterEvent(ids.agentRun, {
      type: 'queued',
      at: Date.parse('2026-05-14T01:00:01.000Z'),
    });
    await service.applyAdapterEvent(ids.agentRun, {
      type: 'started',
      at: Date.parse('2026-05-14T01:00:02.000Z'),
      providerRunId: 'provider:2',
    });
    await service.applyAdapterEvent(ids.agentRun, {
      type: 'succeeded',
      at: Date.parse('2026-05-14T01:00:03.000Z'),
      finalArtifactRef: { artifactId: ids.artifact },
    });

    await expect(repository.getAgentRun(ids.agentRun)).resolves.toMatchObject({
      status: 'succeeded',
      providerRunId: 'provider:2',
      outputRef: ids.artifact,
    });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({
      status: 'succeeded',
      artifactRefs: [ids.artifact],
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: 'succeeded',
      finalResponseRef: ids.artifact,
      resultCompleteness: 'complete',
      completionLevel: 'full',
    });
  });

  it('maps failed adapter events into layered execution errors', async () => {
    const { repository, service } = await createRunAndSubmit();

    await service.applyAdapterEvent(ids.agentRun, {
      type: 'failed',
      at: Date.parse('2026-05-14T01:00:03.000Z'),
      error: createAdapterError('MODEL_UNAVAILABLE', 'Model is unavailable.', true),
    });

    await expect(repository.getAgentRun(ids.agentRun)).resolves.toMatchObject({
      status: 'failed',
      error: {
        layer: 'execution',
        code: 'MODEL_UNAVAILABLE',
        retryable: true,
      },
    });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({
      status: 'failed',
      failureReason: 'Model is unavailable.',
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: 'failed',
      completionLevel: 'failed',
      hasPartialFailures: true,
    });
  });

  it.each([
    ['cancelled', { type: 'cancelled' as const, at: Date.parse('2026-05-14T01:00:03.000Z') }],
    ['timeout', { type: 'timeout' as const, at: Date.parse('2026-05-14T01:00:03.000Z') }],
  ])('maps %s events into run terminal state', async (expectedStatus, event) => {
    const { repository, service } = await createRunAndSubmit();

    await service.applyAdapterEvent(ids.agentRun, event);

    await expect(repository.getAgentRun(ids.agentRun)).resolves.toMatchObject({
      status: expectedStatus,
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: expectedStatus,
      completionLevel: 'failed',
    });
  });

  it('rejects adapter events after an AgentRun reaches a terminal state', async () => {
    const { repository, service } = await createRunAndSubmit();
    await service.applyAdapterEvent(ids.agentRun, {
      type: 'succeeded',
      at: Date.parse('2026-05-14T01:00:03.000Z'),
      finalArtifactRef: { artifactId: ids.artifact },
    });

    await expect(
      service.applyAdapterEvent(ids.agentRun, {
        type: 'heartbeat',
        at: Date.parse('2026-05-14T01:00:04.000Z'),
      }),
    ).rejects.toMatchObject({ code: 'ORCHESTRATION_RUN_TERMINAL' });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({ status: 'succeeded' });
  });

  it('pauses and resumes a running orchestration run', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness();
    await repository.createRunGraph({ run: createRunFixture(), tasks: [createTaskFixture()] });

    const paused = await service.pauseRun({ runId: ids.run, reason: 'Operator is reviewing.' });

    expect(paused).toMatchObject({ status: 'paused', updatedAt: '2026-05-14T01:00:00.000Z' });
    expect(repository.listTraceEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'run.paused',
          level: 'info',
          payloadInline: { reason: 'Operator is reviewing.' },
        }),
      ]),
    );

    const resumed = await service.resumeRun({ runId: ids.run });

    expect(resumed).toMatchObject({ status: 'running', updatedAt: '2026-05-14T01:00:00.000Z' });
    expect(repository.listTraceEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'run.resumed', level: 'info' }),
      ]),
    );
  });

  it('rejects pause when the run is not running', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'queued' }),
      tasks: [createTaskFixture({ status: 'ready' })],
    });

    await expect(service.pauseRun({ runId: ids.run })).rejects.toMatchObject({
      code: 'INVALID_RUN_STATE',
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({ status: 'queued' });
  });

  it('cancels an active run and its non-terminal task and agent run', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness();
    await repository.createRunGraph({ run: createRunFixture(), tasks: [createTaskFixture()] });
    await repository.createAgentRun(createAgentRunFixture());

    const cancelled = await service.cancelRun({ runId: ids.run, reason: 'Operator stopped it.' });

    expect(cancelled).toMatchObject({
      status: 'cancelled',
      finishedAt: '2026-05-14T01:00:00.000Z',
      completionLevel: 'failed',
      resultCompleteness: 'empty',
      error: {
        layer: 'orchestration',
        code: 'CANCELLED_BY_OPERATOR',
        message: 'Operator stopped it.',
        retryable: false,
      },
    });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({
      status: 'cancelled',
      failureReason: 'Operator stopped it.',
    });
    await expect(repository.getAgentRun(ids.agentRun)).resolves.toMatchObject({
      status: 'cancelled',
      cancelable: false,
    });
    expect(repository.listTraceEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'run.cancelled', level: 'warn' }),
      ]),
    );
  });

  it('retries a failed task in a non-terminal run', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'running' }),
      tasks: [
        createTaskFixture({
          status: 'failed',
          attempt: 1,
          idempotencyKey: `${ids.task}:1`,
          failureReason: 'Model failed.',
        }),
      ],
    });

    const result = await service.retryTask({ taskId: ids.task, reason: 'Try again.' });

    expect(result).toEqual({ taskId: ids.task, newAttempt: 2 });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({
      status: 'ready',
      attempt: 2,
      idempotencyKey: `${ids.task}:2`,
    });
    const task = await repository.getTask(ids.task);
    expect(task).not.toHaveProperty('failureReason');
    expect(repository.listTraceEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'task.retry_requested', level: 'info' }),
      ]),
    );
  });

  it('rejects retry task when the parent run is terminal', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness();
    await repository.createRunGraph({
      run: createRunFixture({ status: 'failed' }),
      tasks: [createTaskFixture({ status: 'failed' })],
    });

    await expect(service.retryTask({ taskId: ids.task })).rejects.toMatchObject({
      code: 'ORCHESTRATION_RUN_TERMINAL',
    });
  });

  it('creates a queued single-worker rerun from a terminal single-task run', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness({
      runIds: [ids.rerun],
      taskIds: [ids.rerunTask],
    });
    await repository.createRunGraph({
      run: createRunFixture({ status: 'failed', finishedAt: '2026-05-14T00:05:00.000Z' }),
      tasks: [
        createTaskFixture({
          status: 'failed',
          executionProfile: 'mock-profile',
          contextRefs: [ids.artifact],
          budgetHint: { maxTokens: 1000 },
        }),
      ],
    });

    const rerun = await service.rerun({
      runId: ids.run,
      replan: true,
      operatorNote: 'Please use the latest context.',
    });

    expect(rerun).toMatchObject({
      orchestrationRunId: ids.rerun,
      originEventId: ids.event,
      status: 'queued',
      executionMode: 'single_worker',
    });
    const tasks = await repository.listTasksByRun(ids.rerun);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      taskId: ids.rerunTask,
      status: 'ready',
      attempt: 0,
      executionProfile: 'mock-profile',
      contextRefs: [ids.artifact],
      budgetHint: { maxTokens: 1000 },
      brief: 'Update the target module.\n\nOperator note: Please use the latest context.',
    });
    expect(repository.listTraceEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'run.rerun_created', level: 'info' }),
      ]),
    );
  });

  it('rejects rerun for a non-terminal run', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness();
    await repository.createRunGraph({ run: createRunFixture({ status: 'running' }), tasks: [] });

    await expect(service.rerun({ runId: ids.run })).rejects.toMatchObject({
      code: 'INVALID_RUN_STATE',
    });
  });

  it('injects an operator note without changing terminal run state', async () => {
    const { repository, service }: ReturnType<typeof createHarness> = createHarness({
      traceEventIds: [ids.noteTrace],
    });
    await repository.createRunGraph({
      run: createRunFixture({ status: 'succeeded', finishedAt: '2026-05-14T00:05:00.000Z' }),
      tasks: [createTaskFixture({ status: 'succeeded' })],
    });

    const result = await service.injectOperatorNote({
      runId: ids.run,
      note: 'Remember to inspect the patch manually.',
      visibility: 'operator_only',
    });

    expect(result).toEqual({ messageId: `message:${ids.noteTrace}`, traceEventId: ids.noteTrace });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: 'succeeded',
      updatedAt: '2026-05-14T00:00:00.000Z',
    });
    expect(repository.listTraceEvents()).toEqual([
      expect.objectContaining({
        traceEventId: ids.noteTrace,
        eventType: 'operator.note',
        payloadInline: {
          note: 'Remember to inspect the patch manually.',
          visibility: 'operator_only',
        },
      }),
    ]);
  });
});
