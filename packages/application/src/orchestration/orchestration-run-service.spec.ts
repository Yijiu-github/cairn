// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { createAdapterError } from '@cairn/runtime-gateway';

import { InMemoryApplicationRepository } from '../testing/memory-run-repository.js';

import { OrchestrationRunService } from './orchestration-run-service.js';

import type { ArtifactStorePort, WriteArtifactPayloadInput } from '../ports/artifact-store-port.js';
import type { RuntimeGatewayPort } from '../ports/runtime-gateway-port.js';
import type {
  AdapterCancelAck,
  AdapterStreamEvent,
  AdapterSubmitAck,
  AdapterSubmitRequest,
} from '@cairn/runtime-gateway';
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
  readonly cancelled: { runId: AgentRunId; reason?: string }[] = [];
  events: AdapterStreamEvent[];
  submitError?: Error;
  cancelError?: Error;
  cancelAckOverride?: AdapterCancelAck;

  constructor(
    private readonly ack?: AdapterSubmitAck,
    events: AdapterStreamEvent[] = [
      { type: 'queued', at: Date.parse('2026-05-14T01:00:01.000Z') },
      {
        type: 'started',
        at: Date.parse('2026-05-14T01:00:02.000Z'),
        providerRunId: 'provider:stream',
      },
      {
        type: 'succeeded',
        at: Date.parse('2026-05-14T01:00:03.000Z'),
        finalArtifactRef: { artifactId: ids.artifact },
      },
    ],
  ) {
    this.events = events;
  }

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    this.requests.push(request);
    if (this.submitError !== undefined) {
      return Promise.reject(this.submitError);
    }
    return Promise.resolve(
      this.ack ?? { runId: request.runId, accepted: true, providerRunId: 'provider:1' },
    );
  }

  stream(_runId: AgentRunId): AsyncIterable<AdapterStreamEvent> {
    const events = this.events;
    return {
      async *[Symbol.asyncIterator]() {
        await Promise.resolve();
        for (const event of events) {
          yield event;
        }
      },
    };
  }

  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck> {
    this.cancelled.push(reason === undefined ? { runId } : { runId, reason });
    if (this.cancelError !== undefined) {
      return Promise.reject(this.cancelError);
    }
    if (this.cancelAckOverride !== undefined) {
      return Promise.resolve(this.cancelAckOverride);
    }
    return Promise.resolve(
      reason === undefined ? { runId, cancelled: true } : { runId, cancelled: true, reason },
    );
  }
}

const createHarness = (
  generatedIds: Partial<{
    runIds: OrchestrationRunId[];
    taskIds: TaskId[];
    agentRunIds: AgentRunId[];
    artifactIds: ArtifactId[];
    traceEventIds: TraceEventId[];
  }> = {},
): {
  artifactStore: RecordingArtifactStore;
  repository: InMemoryApplicationRepository;
  runtimeGateway: RecordingRuntimeGateway;
  service: OrchestrationControlHarnessService;
} => {
  let traceSequence = 0;
  const runIds = [...(generatedIds.runIds ?? [ids.run])];
  const taskIds = [...(generatedIds.taskIds ?? [ids.task])];
  const agentRunIds = [...(generatedIds.agentRunIds ?? [ids.agentRun])];
  const artifactIds = [...(generatedIds.artifactIds ?? [ids.artifact])];
  const traceEventIds = [...(generatedIds.traceEventIds ?? [])];
  const artifactStore = new RecordingArtifactStore();
  const repository = new InMemoryApplicationRepository();
  const runtimeGateway = new RecordingRuntimeGateway();
  const service = new OrchestrationRunService({
    artifactStore,
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
      artifactId: () => {
        const id = artifactIds.shift();
        if (id === undefined) {
          throw new Error('No generated artifact id available');
        }
        return id;
      },
      planningOutputId: () => {
        throw new Error('No generated planning output id available');
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
  return { artifactStore, repository, runtimeGateway, service };
};

class RecordingArtifactStore implements ArtifactStorePort {
  readonly writes: WriteArtifactPayloadInput[] = [];

  writeText(input: WriteArtifactPayloadInput): Promise<{
    payloadRef: string;
    byteLength: number;
    truncated: boolean;
  }> {
    const bytes = new TextEncoder().encode(input.text);
    const truncated = bytes.byteLength > input.maxBytes;
    const text = truncated ? new TextDecoder().decode(bytes.slice(0, input.maxBytes)) : input.text;
    const stored = { ...input, text };
    this.writes.push(stored);
    return Promise.resolve({
      payloadRef: `artifact-payload://${input.workspaceId}/${input.orchestrationRunId}/${input.artifactId}/${input.filename}`,
      byteLength: new TextEncoder().encode(text).byteLength,
      truncated,
    });
  }

  readText(payloadRef: string): Promise<{
    mediaType: 'text/plain' | 'application/json';
    text: string;
    truncated: boolean;
  }> {
    const write = this.writes.find((candidate) =>
      payloadRef.endsWith(`/${candidate.artifactId}/${candidate.filename}`),
    );
    if (write === undefined) {
      throw new Error(`Unknown payload ref: ${payloadRef}`);
    }
    return Promise.resolve({
      mediaType: write.mediaType,
      text: write.text,
      truncated: false,
    });
  }
}

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

  it('creates an input artifact before submitting a ready task to runtime', async () => {
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

    await service.submitTaskToRuntime({
      taskId: task.taskId,
      runtimeType: 'mock',
      model: 'mock-model',
      prompt: 'Please update the target module.',
    });

    const artifacts = await repository.listArtifactsByRun(ids.run);
    expect(artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactId: ids.artifact,
          title: 'Runtime input',
          artifactRole: 'input',
          kind: 'log',
          payloadRef: expect.stringMatching(/^artifact-payload:\/\//),
          sensitivity: 'none',
        }),
      ]),
    );
    expect(runtimeGateway.requests[0]?.inputs).toEqual([{ artifactId: ids.artifact }]);
  });

  it('marks runtime submit transport errors as failed durable state', async () => {
    const { repository, runtimeGateway, service } = createHarness();
    runtimeGateway.submitError = new Error('Runtime transport unavailable.');
    const { task } = await service.createSingleWorkerRun({
      workspaceId: ids.workspace,
      originEventId: ids.event,
      task: {
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update the target module.',
      },
    });

    await expect(
      service.submitTaskToRuntime({
        taskId: task.taskId,
        runtimeType: 'mock',
        model: 'mock-model',
        prompt: 'Please update the target module.',
      }),
    ).rejects.toMatchObject({ code: 'RUNTIME_UNAVAILABLE' });

    await expect(repository.getAgentRun(ids.agentRun)).resolves.toMatchObject({
      status: 'failed',
      error: {
        code: 'RUNTIME_UNAVAILABLE',
      },
    });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({ status: 'failed' });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({ status: 'failed' });
  });

  it('drains runtime events into application state', async () => {
    const { repository, service } = await createRunAndSubmit();

    const drained = await service.drainAgentRunRuntime({ agentRunId: ids.agentRun });

    expect(drained.eventCount).toBe(3);
    await expect(repository.getAgentRun(ids.agentRun)).resolves.toMatchObject({
      status: 'succeeded',
      providerRunId: 'provider:stream',
      outputRef: ids.artifact,
    });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({
      status: 'succeeded',
      artifactRefs: [ids.artifact],
    });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: 'succeeded',
      finalResponseRef: ids.artifact,
    });
  });

  it('drains runtime output into artifact metadata and trace events', async () => {
    const { repository, runtimeGateway, service } = createHarness({
      artifactIds: [
        '01HZZZZZZZZZZZZZZZZZZZZFIN' as ArtifactId,
        '01HZZZZZZZZZZZZZZZZZZZZOUT' as ArtifactId,
      ],
    });
    runtimeGateway.events = [
      { type: 'queued', at: Date.parse('2026-05-14T01:00:01.000Z') },
      { type: 'started', at: Date.parse('2026-05-14T01:00:02.000Z') },
      { type: 'token', at: Date.parse('2026-05-14T01:00:02.500Z'), delta: 'hello' },
      {
        type: 'succeeded',
        at: Date.parse('2026-05-14T01:00:03.000Z'),
        finalArtifactRef: { artifactId: ids.artifact },
      },
    ];
    const { task } = await service.createSingleWorkerRun({
      workspaceId: ids.workspace,
      originEventId: ids.event,
      task: {
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update the target module.',
      },
    });

    const submitted = await service.submitTaskToRuntime({
      taskId: task.taskId,
      runtimeType: 'mock',
      model: 'mock-model',
      prompt: 'Please update the target module.',
    });
    await service.drainAgentRunRuntime({ agentRunId: submitted.agentRun.runId });

    const artifacts = await repository.listArtifactsByRun(ids.run);
    expect(artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactId: '01HZZZZZZZZZZZZZZZZZZZZOUT',
          title: 'Runtime output',
          artifactRole: 'output',
          kind: 'log',
          payloadRef: expect.stringMatching(/^artifact-payload:\/\//),
          sensitivity: 'none',
        }),
      ]),
    );
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({
      artifactRefs: ['01HZZZZZZZZZZZZZZZZZZZZOUT'],
    });
    const traceEvents = await repository.listTraceEventsByRun(ids.run);
    expect(traceEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(['agent_run.started', 'agent_run.succeeded', 'artifact.created']),
    );
  });

  it('keeps direct token events buffered for a later success event', async () => {
    const { repository, service } = createHarness({
      artifactIds: [ids.artifact, '01HZZZZZZZZZZZZZZZZZZZZOUT' as ArtifactId],
    });
    const { task } = await service.createSingleWorkerRun({
      workspaceId: ids.workspace,
      originEventId: ids.event,
      task: {
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update the target module.',
      },
    });
    const { agentRun } = await service.submitTaskToRuntime({
      taskId: task.taskId,
      runtimeType: 'mock',
      model: 'mock-model',
      prompt: 'Please update the target module.',
    });
    await service.applyAdapterEvent(agentRun.runId, {
      type: 'token',
      at: Date.parse('2026-05-14T01:00:02.500Z'),
      delta: 'hello',
    });
    await service.applyAdapterEvent(agentRun.runId, {
      type: 'succeeded',
      at: Date.parse('2026-05-14T01:00:03.000Z'),
      finalArtifactRef: { artifactId: ids.artifact },
    });

    await expect(repository.listArtifactsByRun(ids.run)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Runtime output',
          artifactRole: 'output',
        }),
      ]),
    );
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      finalResponseRef: '01HZZZZZZZZZZZZZZZZZZZZOUT',
    });
  });

  it('keeps the adapter final artifact when no token output was buffered', async () => {
    const { repository, service } = await createRunAndSubmit();

    await service.applyAdapterEvent(ids.agentRun, {
      type: 'succeeded',
      at: Date.parse('2026-05-14T01:00:03.000Z'),
      finalArtifactRef: { artifactId: ids.artifact },
    });

    await expect(repository.listArtifactsByRun(ids.run)).resolves.toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ title: 'Runtime output', artifactRole: 'output' }),
      ]),
    );
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      finalResponseRef: ids.artifact,
    });
  });

  it('clears token buffers after failed terminal events', async () => {
    const { repository, service } = await createRunAndSubmit();

    await service.applyAdapterEvent(ids.agentRun, {
      type: 'token',
      at: Date.parse('2026-05-14T01:00:02.500Z'),
      delta: 'stale output',
    });
    await service.applyAdapterEvent(ids.agentRun, {
      type: 'failed',
      at: Date.parse('2026-05-14T01:00:03.000Z'),
      error: createAdapterError('MODEL_UNAVAILABLE', 'Model is unavailable.', true),
    });

    await expect(repository.listArtifactsByRun(ids.run)).resolves.toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ title: 'Runtime output', artifactRole: 'output' }),
      ]),
    );
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

  it('records cancel request and acknowledgement traces before local cancellation completes', async () => {
    const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> =
      createHarness();
    await repository.createRunGraph({ run: createRunFixture(), tasks: [createTaskFixture()] });
    await repository.createAgentRun(createAgentRunFixture());

    const cancelled = await service.cancelRun({ runId: ids.run, reason: 'Operator stopped it.' });

    expect(runtimeGateway.cancelled).toEqual([
      { runId: ids.agentRun, reason: 'Operator stopped it.' },
    ]);
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
    expect(repository.listTraceEvents()).toEqual([
      expect.objectContaining({
        eventType: 'agent_run.cancel_requested',
        level: 'info',
        payloadInline: {
          reason: 'Operator stopped it.',
          agentRunId: ids.agentRun,
        },
      }),
      expect.objectContaining({
        eventType: 'agent_run.cancel_acknowledged',
        level: 'info',
        payloadInline: {
          reason: 'Operator stopped it.',
          agentRunId: ids.agentRun,
        },
      }),
      expect.objectContaining({
        eventType: 'run.cancelled',
        level: 'warn',
        payloadInline: {
          reason: 'Operator stopped it.',
        },
      }),
    ]);
  });

  it('keeps cancel flow local and records dispatch failure evidence when runtime cancel throws', async () => {
    const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> =
      createHarness();
    runtimeGateway.cancelError = new Error('runtime cancel unavailable');
    await repository.createRunGraph({ run: createRunFixture(), tasks: [createTaskFixture()] });
    await repository.createAgentRun(createAgentRunFixture());

    await expect(
      service.cancelRun({ runId: ids.run, reason: 'Operator stopped it.' }),
    ).resolves.toMatchObject({ status: 'cancelled' });
    await expect(repository.getRun(ids.run)).resolves.toMatchObject({
      status: 'cancelled',
    });
    await expect(repository.getTask(ids.task)).resolves.toMatchObject({
      status: 'cancelled',
    });
    await expect(repository.getAgentRun(ids.agentRun)).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(repository.listTraceEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'agent_run.cancel_requested',
          level: 'info',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: ids.agentRun,
          },
        }),
        expect.objectContaining({
          eventType: 'agent_run.cancel_dispatch_failed',
          level: 'warn',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: ids.agentRun,
            message: 'runtime cancel unavailable',
          },
        }),
        expect.objectContaining({ eventType: 'run.cancelled', level: 'warn' }),
      ]),
    );
  });

  it('records a warning trace when runtime cancel is not acknowledged', async () => {
    const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> =
      createHarness();
    runtimeGateway.cancelAckOverride = {
      runId: ids.agentRun,
      cancelled: false,
      reason: 'already_terminal',
    };
    await repository.createRunGraph({ run: createRunFixture(), tasks: [createTaskFixture()] });
    await repository.createAgentRun(createAgentRunFixture());

    await service.cancelRun({ runId: ids.run, reason: 'Operator stopped it.' });
    expect(repository.listTraceEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'agent_run.cancel_requested',
          level: 'info',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: ids.agentRun,
          },
        }),
        expect.objectContaining({
          eventType: 'agent_run.cancel_not_acknowledged',
          level: 'warn',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: ids.agentRun,
            runtimeReason: 'already_terminal',
          },
        }),
      ]),
    );
  });

  it('does not dispatch runtime cancel or agent-run cancel traces for terminal AgentRuns', async () => {
    const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> =
      createHarness();
    await repository.createRunGraph({ run: createRunFixture(), tasks: [createTaskFixture()] });
    await repository.createAgentRun(
      createAgentRunFixture({
        status: 'succeeded',
        finishedAt: '2026-05-14T00:01:00.000Z',
        cancelable: false,
      }),
    );

    await service.cancelRun({ runId: ids.run, reason: 'Operator stopped it.' });

    expect(runtimeGateway.cancelled).toEqual([]);
    expect(repository.listTraceEvents().map((event) => event.eventType)).toEqual(['run.cancelled']);
  });

  it('retries a failed task in a non-terminal run with previous and new attempt evidence', async () => {
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
        expect.objectContaining({
          eventType: 'task.retry_requested',
          level: 'info',
          payloadInline: {
            previousAttempt: 1,
            newAttempt: 2,
            reason: 'Try again.',
          },
        }),
      ]),
    );
  });

  it('creates a queued single-worker rerun with previous run and task evidence', async () => {
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
        expect.objectContaining({
          eventType: 'run.rerun_created',
          level: 'info',
          payloadInline: {
            previousRunId: ids.run,
            previousTaskId: ids.task,
            replan: true,
            operatorNote: 'Please use the latest context.',
          },
        }),
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
