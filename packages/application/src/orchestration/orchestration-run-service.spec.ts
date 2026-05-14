// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { createAdapterError } from '@cairn/runtime-gateway';

import { InMemoryApplicationRepository } from '../testing/memory-run-repository.js';

import { OrchestrationRunService } from './orchestration-run-service.js';

import type { RuntimeGatewayPort } from '../ports/runtime-gateway-port.js';
import type { AdapterSubmitAck, AdapterSubmitRequest } from '@cairn/runtime-gateway';
import type {
  AgentRunId,
  ArtifactId,
  EventId,
  OrchestrationRunId,
  TaskId,
  TraceEventId,
  TraceId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

const ids = {
  workspace: '01HZZZZZZZZZZZZZZZZZZZZZW0' as WorkspaceId,
  event: '01HZZZZZZZZZZZZZZZZZZZZZE0' as EventId,
  run: '01HZZZZZZZZZZZZZZZZZZZZZR0' as OrchestrationRunId,
  task: '01HZZZZZZZZZZZZZZZZZZZZZT0' as TaskId,
  agentRun: '01HZZZZZZZZZZZZZZZZZZZZZA0' as AgentRunId,
  artifact: '01HZZZZZZZZZZZZZZZZZZZZZF0' as ArtifactId,
  trace: '01HZZZZZZZZZZZZZZZZZZZZZX0' as TraceId,
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

const createHarness = () => {
  let traceSequence = 0;
  const repository = new InMemoryApplicationRepository();
  const runtimeGateway = new RecordingRuntimeGateway();
  const service = new OrchestrationRunService({
    repository,
    runtimeGateway,
    clock: { now: () => new Date('2026-05-14T01:00:00.000Z') },
    ids: {
      orchestrationRunId: () => ids.run,
      taskId: () => ids.task,
      agentRunId: () => ids.agentRun,
      traceId: () => ids.trace,
      traceEventId: () =>
        `01HZZZZZZZZZZZZZZZZZZZZZ${(traceSequence++).toString(16).toUpperCase()}` as TraceEventId,
    },
  });
  return { repository, runtimeGateway, service };
};

const createRunAndSubmit = async () => {
  const harness = createHarness();
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
});
