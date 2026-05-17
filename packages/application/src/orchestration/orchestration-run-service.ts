// SPDX-License-Identifier: Apache-2.0

import { ApplicationError } from '../errors.js';

import { isAgentRunTerminal, isRunTerminal, isTaskTerminal } from './status.js';

import type { ApplicationRepository } from '../ports/run-repository.js';
import type { RuntimeGatewayPort } from '../ports/runtime-gateway-port.js';
import type { AdapterError, AdapterStreamEvent, ToolDescriptor } from '@cairn/runtime-gateway';
import type {
  AgentRun,
  AgentRunId,
  ArtifactId,
  ArtifactRef,
  BudgetHint,
  ConversationId,
  EventId,
  OrchestrationRun,
  OrchestrationRunId,
  MessageId,
  PlanningOutputId,
  StructuredError,
  Task,
  TaskId,
  TaskKind,
  TraceEvent,
  TraceEventId,
  TraceId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

export interface ApplicationClock {
  now(): Date;
}

export interface ApplicationIdFactory {
  agentRunId(): AgentRunId;
  orchestrationRunId(): OrchestrationRunId;
  planningOutputId(): PlanningOutputId;
  taskId(): TaskId;
  traceEventId(): TraceEventId;
  traceId(): TraceId;
}

export interface OrchestrationRunServiceDependencies {
  clock: ApplicationClock;
  ids: ApplicationIdFactory;
  repository: ApplicationRepository;
  runtimeGateway: RuntimeGatewayPort;
}

export interface CreateSingleWorkerRunInput {
  workspaceId: WorkspaceId;
  originEventId: EventId;
  conversationId?: ConversationId;
  task: {
    taskKind: TaskKind;
    title: string;
    brief: string;
    executionProfile?: string;
    priority?: number;
    contextRefs?: ArtifactId[];
    budgetHint?: BudgetHint;
  };
}

export interface CreateSingleWorkerRunResult {
  run: OrchestrationRun;
  task: Task;
}

export interface SubmitTaskToRuntimeInput {
  taskId: TaskId;
  runtimeType: string;
  model: string;
  inputs?: ArtifactRef[];
  tools?: ToolDescriptor[];
  timeoutMs?: number;
  options?: Record<string, unknown>;
}

export interface SubmitTaskToRuntimeResult {
  agentRun: AgentRun;
  providerRunId?: string;
}

export interface DrainAgentRunRuntimeInput {
  agentRunId: AgentRunId;
}

export interface DrainAgentRunRuntimeResult {
  agentRunId: AgentRunId;
  eventCount: number;
}

export interface PauseRunInput {
  runId: OrchestrationRunId;
  reason?: string;
}

export interface ResumeRunInput {
  runId: OrchestrationRunId;
}

export interface CancelRunInput {
  runId: OrchestrationRunId;
  reason?: string;
}

export interface RetryTaskInput {
  taskId: TaskId;
  reason?: string;
}

export interface RetryTaskResult {
  taskId: TaskId;
  newAttempt: number;
}

export interface RerunInput {
  runId: OrchestrationRunId;
  originEventId?: EventId;
  replan?: boolean;
  operatorNote?: string;
}

export interface InjectOperatorNoteInput {
  runId: OrchestrationRunId;
  note: string;
  visibility: 'public' | 'operator_only';
}

export interface InjectOperatorNoteResult {
  messageId: MessageId;
  traceEventId: TraceEventId;
}

const toIso = (date: Date): string => date.toISOString();

const toEventIso = (at: number): string => new Date(at).toISOString();

const toExecutionError = (error: AdapterError): StructuredError => ({
  layer: 'execution',
  code: error.code,
  message: error.message,
  retryable: error.retryable,
});

export class OrchestrationRunService {
  private readonly clock: ApplicationClock;
  private readonly ids: ApplicationIdFactory;
  private readonly repository: ApplicationRepository;
  private readonly runtimeGateway: RuntimeGatewayPort;

  constructor(dependencies: OrchestrationRunServiceDependencies) {
    this.clock = dependencies.clock;
    this.ids = dependencies.ids;
    this.repository = dependencies.repository;
    this.runtimeGateway = dependencies.runtimeGateway;
  }

  async createSingleWorkerRun(
    input: CreateSingleWorkerRunInput,
  ): Promise<CreateSingleWorkerRunResult> {
    const now = toIso(this.clock.now());
    const runId = this.ids.orchestrationRunId();
    const taskId = this.ids.taskId();
    const traceId = this.ids.traceId();

    const run: OrchestrationRun = {
      orchestrationRunId: runId,
      workspaceId: input.workspaceId,
      originEventId: input.originEventId,
      status: 'queued',
      executionMode: 'single_worker',
      hasPartialFailures: false,
      resultCompleteness: 'empty',
      completionLevel: 'full',
      traceId,
      createdAt: now,
      updatedAt: now,
      ...(input.conversationId === undefined ? {} : { conversationId: input.conversationId }),
    };

    const task: Task = {
      taskId,
      workspaceId: input.workspaceId,
      orchestrationRunId: runId,
      taskKind: input.task.taskKind,
      title: input.task.title,
      brief: input.task.brief,
      status: 'ready',
      priority: input.task.priority ?? 50,
      attempt: 0,
      idempotencyKey: `${taskId}:0`,
      dependsOnTaskIds: [],
      contextRefs: input.task.contextRefs ?? [],
      artifactRefs: [],
      createdAt: now,
      updatedAt: now,
      ...(input.task.executionProfile === undefined
        ? {}
        : { executionProfile: input.task.executionProfile }),
      ...(input.task.budgetHint === undefined ? {} : { budgetHint: input.task.budgetHint }),
    };

    await this.repository.createRunGraph({ run, tasks: [task] });
    await this.appendTrace(run, task, undefined, 'run.queued', 'info', {
      executionMode: run.executionMode,
    });

    return { run, task };
  }

  async submitTaskToRuntime(input: SubmitTaskToRuntimeInput): Promise<SubmitTaskToRuntimeResult> {
    const task = await this.requireTask(input.taskId);
    const run = await this.requireRun(task.orchestrationRunId);

    this.assertRunCanChange(run);
    this.assertTaskCanChange(task);

    if (task.status !== 'ready') {
      throw new ApplicationError('TASK_NOT_READY', `Task is not ready: ${task.taskId}`);
    }

    const now = toIso(this.clock.now());
    const plannedRun =
      run.status === 'queued' ? await this.updateRunStatus(run, 'planning', now) : run;

    const runningRun: OrchestrationRun = {
      ...plannedRun,
      status: 'running',
      startedAt: plannedRun.startedAt ?? now,
      updatedAt: now,
    };
    const dispatchedTask: Task = {
      ...task,
      status: 'dispatched',
      updatedAt: now,
    };
    const firstInputRef =
      input.inputs?.[0] === undefined ? undefined : (input.inputs[0].artifactId as ArtifactId);
    const agentRun: AgentRun = {
      runId: this.ids.agentRunId(),
      workspaceId: task.workspaceId,
      taskId: task.taskId,
      orchestrationRunId: task.orchestrationRunId,
      runtimeType: input.runtimeType,
      status: 'submitted',
      attempt: task.attempt,
      submittedAt: now,
      retryable: true,
      cancelable: true,
      traceId: run.traceId,
      createdAt: now,
      updatedAt: now,
      ...(input.model === '' ? {} : { runtimeModel: input.model }),
      ...(firstInputRef === undefined ? {} : { inputRef: firstInputRef }),
    };

    await this.repository.updateRun(runningRun);
    await this.repository.updateTask(dispatchedTask);
    await this.repository.createAgentRun(agentRun);
    await this.appendTrace(runningRun, dispatchedTask, agentRun, 'task.dispatched', 'info', {
      runtimeType: input.runtimeType,
    });

    const ack = await this.runtimeGateway.submit({
      runId: agentRun.runId,
      model: input.model,
      inputs: input.inputs ?? [],
      traceId: agentRun.traceId,
      ...(input.tools === undefined ? {} : { tools: input.tools }),
      ...(input.timeoutMs === undefined ? {} : { timeoutMs: input.timeoutMs }),
      ...(task.budgetHint === undefined ? {} : { budget: task.budgetHint }),
      ...(input.options === undefined ? {} : { options: input.options }),
    });

    if (!ack.accepted) {
      await this.failRejectedRuntimeSubmit(runningRun, dispatchedTask, agentRun, now);
      throw new ApplicationError('RUNTIME_REJECTED', `Runtime rejected run: ${agentRun.runId}`);
    }

    if (ack.providerRunId === undefined) {
      return { agentRun };
    }

    const acknowledgedAgentRun: AgentRun = {
      ...agentRun,
      providerRunId: ack.providerRunId,
      updatedAt: toIso(this.clock.now()),
    };
    await this.repository.updateAgentRun(acknowledgedAgentRun);
    return { agentRun: acknowledgedAgentRun, providerRunId: ack.providerRunId };
  }

  async drainAgentRunRuntime(
    input: DrainAgentRunRuntimeInput,
  ): Promise<DrainAgentRunRuntimeResult> {
    await this.requireAgentRun(input.agentRunId);

    let eventCount = 0;
    for await (const event of this.runtimeGateway.stream(input.agentRunId)) {
      await this.applyAdapterEvent(input.agentRunId, event);
      eventCount += 1;
    }

    return { agentRunId: input.agentRunId, eventCount };
  }

  async applyAdapterEvent(runId: AgentRunId, event: AdapterStreamEvent): Promise<void> {
    const agentRun = await this.requireAgentRun(runId);
    const task = await this.requireTask(agentRun.taskId);
    const run = await this.requireRun(agentRun.orchestrationRunId);

    this.assertRunCanChange(run);
    this.assertTaskCanChange(task);
    this.assertAgentRunCanChange(agentRun);

    switch (event.type) {
      case 'queued': {
        await this.applyQueuedEvent(run, task, agentRun, event.at);
        break;
      }
      case 'started': {
        await this.applyStartedEvent(run, task, agentRun, event);
        break;
      }
      case 'heartbeat': {
        await this.applyHeartbeatEvent(run, task, agentRun, event.at);
        break;
      }
      case 'artifact': {
        await this.applyArtifactEvent(run, task, agentRun, event);
        break;
      }
      case 'succeeded': {
        await this.applySucceededEvent(run, task, agentRun, event);
        break;
      }
      case 'failed': {
        await this.applyFailedEvent(run, task, agentRun, event);
        break;
      }
      case 'cancelled': {
        await this.applyCancelledEvent(run, task, agentRun, event);
        break;
      }
      case 'timeout': {
        await this.applyTimeoutEvent(run, task, agentRun, event.at);
        break;
      }
      case 'progress':
      case 'token':
      case 'tool_call':
      case 'tool_result': {
        await this.appendTrace(run, task, agentRun, `agent_run.${event.type}`, 'debug', {
          at: event.at,
        });
        break;
      }
    }
  }

  async pauseRun(input: PauseRunInput): Promise<OrchestrationRun> {
    const run = await this.requireRun(input.runId);
    if (run.status !== 'running') {
      throw new ApplicationError(
        'INVALID_RUN_STATE',
        `Run must be running to pause: ${run.orchestrationRunId}`,
      );
    }

    const now = toIso(this.clock.now());
    const pausedRun: OrchestrationRun = {
      ...run,
      status: 'paused',
      updatedAt: now,
    };
    await this.repository.updateRun(pausedRun);
    await this.appendTrace(pausedRun, undefined, undefined, 'run.paused', 'info', {
      ...(input.reason === undefined ? {} : { reason: input.reason }),
    });
    return pausedRun;
  }

  async resumeRun(input: ResumeRunInput): Promise<OrchestrationRun> {
    const run = await this.requireRun(input.runId);
    if (run.status !== 'paused') {
      throw new ApplicationError(
        'INVALID_RUN_STATE',
        `Run must be paused to resume: ${run.orchestrationRunId}`,
      );
    }

    const now = toIso(this.clock.now());
    const resumedRun: OrchestrationRun = {
      ...run,
      status: 'running',
      updatedAt: now,
    };
    await this.repository.updateRun(resumedRun);
    await this.appendTrace(resumedRun, undefined, undefined, 'run.resumed', 'info', {});
    return resumedRun;
  }

  async cancelRun(input: CancelRunInput): Promise<OrchestrationRun> {
    const run = await this.requireRun(input.runId);
    if (isRunTerminal(run.status)) {
      throw new ApplicationError(
        'ORCHESTRATION_RUN_TERMINAL',
        `OrchestrationRun is terminal: ${run.orchestrationRunId}`,
      );
    }

    const now = toIso(this.clock.now());
    const reason = input.reason ?? 'Operator cancelled the run.';
    const error: StructuredError = {
      layer: 'orchestration',
      code: 'CANCELLED_BY_OPERATOR',
      message: reason,
      retryable: false,
    };
    const cancelledRun: OrchestrationRun = {
      ...run,
      status: 'cancelled',
      resultCompleteness: 'empty',
      completionLevel: 'failed',
      finishedAt: now,
      error,
      updatedAt: now,
    };

    const tasks = await this.repository.listTasksByRun(run.orchestrationRunId);
    for (const task of tasks) {
      if (!isTaskTerminal(task.status)) {
        await this.repository.updateTask({
          ...task,
          status: 'cancelled',
          failureReason: reason,
          updatedAt: now,
        });
      }

      const agentRuns = await this.repository.listAgentRunsByTask(task.taskId);
      for (const agentRun of agentRuns) {
        if (!isAgentRunTerminal(agentRun.status)) {
          await this.runtimeGateway.cancel(agentRun.runId, reason);
          await this.repository.updateAgentRun({
            ...agentRun,
            status: 'cancelled',
            finishedAt: now,
            error,
            cancelable: false,
            updatedAt: now,
          });
        }
      }
    }

    await this.repository.updateRun(cancelledRun);
    await this.appendTrace(cancelledRun, undefined, undefined, 'run.cancelled', 'warn', {
      reason,
    });
    return cancelledRun;
  }

  async retryTask(input: RetryTaskInput): Promise<RetryTaskResult> {
    const task = await this.requireTask(input.taskId);
    const run = await this.requireRun(task.orchestrationRunId);
    this.assertRunCanChange(run);

    if (task.status !== 'failed') {
      throw new ApplicationError(
        'INVALID_TASK_STATE',
        `Task must be failed to retry: ${task.taskId}`,
      );
    }

    const now = toIso(this.clock.now());
    const newAttempt = task.attempt + 1;
    const retriedTask: Task = {
      ...task,
      status: 'ready',
      attempt: newAttempt,
      idempotencyKey: `${task.taskId}:${String(newAttempt)}`,
      updatedAt: now,
    };
    delete retriedTask.failureReason;

    await this.repository.updateTask(retriedTask);
    await this.appendTrace(run, retriedTask, undefined, 'task.retry_requested', 'info', {
      newAttempt,
      ...(input.reason === undefined ? {} : { reason: input.reason }),
    });
    return { taskId: task.taskId, newAttempt };
  }

  async rerun(input: RerunInput): Promise<OrchestrationRun> {
    const previousRun = await this.requireRun(input.runId);
    if (!isRunTerminal(previousRun.status)) {
      throw new ApplicationError(
        'INVALID_RUN_STATE',
        `Run must be terminal to rerun: ${previousRun.orchestrationRunId}`,
      );
    }

    const previousTasks = await this.repository.listTasksByRun(previousRun.orchestrationRunId);
    if (previousTasks.length !== 1) {
      throw new ApplicationError(
        'RERUN_UNSUPPORTED_GRAPH',
        `R1a rerun supports exactly one task: ${previousRun.orchestrationRunId}`,
      );
    }

    const previousTask = previousTasks[0];
    if (previousTask === undefined) {
      throw new ApplicationError(
        'RERUN_UNSUPPORTED_GRAPH',
        `R1a rerun supports exactly one task: ${previousRun.orchestrationRunId}`,
      );
    }

    const created = await this.createSingleWorkerRun({
      workspaceId: previousRun.workspaceId,
      originEventId: input.originEventId ?? previousRun.originEventId,
      ...(previousRun.conversationId === undefined
        ? {}
        : { conversationId: previousRun.conversationId }),
      task: {
        taskKind: previousTask.taskKind,
        title: previousTask.title,
        brief: this.buildRerunBrief(previousTask.brief, input.operatorNote),
        ...(previousTask.executionProfile === undefined
          ? {}
          : { executionProfile: previousTask.executionProfile }),
        priority: previousTask.priority,
        contextRefs: previousTask.contextRefs,
        ...(previousTask.budgetHint === undefined ? {} : { budgetHint: previousTask.budgetHint }),
      },
    });

    await this.appendTrace(created.run, created.task, undefined, 'run.rerun_created', 'info', {
      previousRunId: previousRun.orchestrationRunId,
      replan: input.replan ?? false,
      ...(input.operatorNote === undefined ? {} : { operatorNote: input.operatorNote }),
    });
    return created.run;
  }

  async injectOperatorNote(input: InjectOperatorNoteInput): Promise<InjectOperatorNoteResult> {
    const run = await this.requireRun(input.runId);
    const traceEventId = this.ids.traceEventId();
    const createdAt = toIso(this.clock.now());
    const event: TraceEvent = {
      traceEventId,
      workspaceId: run.workspaceId,
      orchestrationRunId: run.orchestrationRunId,
      eventType: 'operator.note',
      level: 'info',
      payloadInline: {
        note: input.note,
        visibility: input.visibility,
      },
      createdAt,
      traceId: run.traceId,
    };
    await this.repository.appendTraceEvent(event);
    return { messageId: `message:${traceEventId}` as MessageId, traceEventId };
  }

  private async applyQueuedEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    at: number,
  ): Promise<void> {
    const queuedAt = toEventIso(at);
    const updatedAgentRun: AgentRun = {
      ...agentRun,
      status: 'queued',
      queuedAt,
      updatedAt: queuedAt,
    };
    await this.repository.updateAgentRun(updatedAgentRun);
    await this.appendTrace(run, task, updatedAgentRun, 'agent_run.queued', 'info', { at });
  }

  private async applyStartedEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    event: Extract<AdapterStreamEvent, { type: 'started' }>,
  ): Promise<void> {
    const startedAt = toEventIso(event.at);
    const updatedAgentRun: AgentRun = {
      ...agentRun,
      status: 'running',
      startedAt,
      heartbeatAt: startedAt,
      updatedAt: startedAt,
      ...(event.providerRunId === undefined ? {} : { providerRunId: event.providerRunId }),
    };
    const updatedTask: Task = {
      ...task,
      status: 'running',
      updatedAt: startedAt,
    };
    const updatedRun: OrchestrationRun = {
      ...run,
      status: 'running',
      startedAt: run.startedAt ?? startedAt,
      updatedAt: startedAt,
    };
    await this.repository.updateRun(updatedRun);
    await this.repository.updateTask(updatedTask);
    await this.repository.updateAgentRun(updatedAgentRun);
    await this.appendTrace(updatedRun, updatedTask, updatedAgentRun, 'agent_run.started', 'info', {
      at: event.at,
    });
  }

  private async applyHeartbeatEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    at: number,
  ): Promise<void> {
    const heartbeatAt = toEventIso(at);
    const updatedAgentRun: AgentRun = {
      ...agentRun,
      heartbeatAt,
      updatedAt: heartbeatAt,
    };
    await this.repository.updateAgentRun(updatedAgentRun);
    await this.appendTrace(run, task, updatedAgentRun, 'agent_run.heartbeat', 'debug', { at });
  }

  private async applyArtifactEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    event: Extract<AdapterStreamEvent, { type: 'artifact' }>,
  ): Promise<void> {
    const artifactId = event.artifact.artifactRef.artifactId as ArtifactId;
    const artifactRefs = task.artifactRefs.includes(artifactId)
      ? task.artifactRefs
      : [...task.artifactRefs, artifactId];
    const updatedTask: Task = {
      ...task,
      artifactRefs,
      updatedAt: toEventIso(event.at),
    };
    await this.repository.updateTask(updatedTask);
    await this.appendTrace(run, updatedTask, agentRun, 'artifact.recorded', 'info', {
      artifactId,
      kind: event.artifact.kind,
      role: event.artifact.role,
    });
  }

  private async applySucceededEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    event: Extract<AdapterStreamEvent, { type: 'succeeded' }>,
  ): Promise<void> {
    const finishedAt = toEventIso(event.at);
    const outputRef = event.finalArtifactRef.artifactId as ArtifactId;
    const artifactRefs = task.artifactRefs.includes(outputRef)
      ? task.artifactRefs
      : [...task.artifactRefs, outputRef];
    const succeededAgentRun: AgentRun = {
      ...agentRun,
      status: 'succeeded',
      finishedAt,
      outputRef,
      cancelable: false,
      updatedAt: finishedAt,
    };
    const succeededTask: Task = {
      ...task,
      status: 'succeeded',
      artifactRefs,
      updatedAt: finishedAt,
    };
    const synthesizingRun: OrchestrationRun = {
      ...run,
      status: 'synthesizing',
      updatedAt: finishedAt,
    };
    const succeededRun: OrchestrationRun = {
      ...synthesizingRun,
      status: 'succeeded',
      finalResponseRef: outputRef,
      resultCompleteness: 'complete',
      completionLevel: 'full',
      finishedAt,
      updatedAt: finishedAt,
    };

    await this.repository.updateAgentRun(succeededAgentRun);
    await this.repository.updateTask(succeededTask);
    await this.repository.updateRun(synthesizingRun);
    await this.repository.updateRun(succeededRun);
    await this.appendTrace(
      succeededRun,
      succeededTask,
      succeededAgentRun,
      'run.succeeded',
      'info',
      {
        artifactId: outputRef,
      },
    );
  }

  private async applyFailedEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    event: Extract<AdapterStreamEvent, { type: 'failed' }>,
  ): Promise<void> {
    const finishedAt = toEventIso(event.at);
    const error = toExecutionError(event.error);
    const failedAgentRun: AgentRun = {
      ...agentRun,
      status: 'failed',
      finishedAt,
      error,
      cancelable: false,
      retryable: event.error.retryable,
      updatedAt: finishedAt,
    };
    const failedTask: Task = {
      ...task,
      status: 'failed',
      failureReason: event.error.message,
      updatedAt: finishedAt,
    };
    const failedRun: OrchestrationRun = {
      ...run,
      status: 'failed',
      hasPartialFailures: true,
      resultCompleteness: 'empty',
      completionLevel: 'failed',
      finishedAt,
      error,
      updatedAt: finishedAt,
    };
    await this.repository.updateAgentRun(failedAgentRun);
    await this.repository.updateTask(failedTask);
    await this.repository.updateRun(failedRun);
    await this.appendTrace(failedRun, failedTask, failedAgentRun, 'run.failed', 'error', {
      code: event.error.code,
      retryable: event.error.retryable,
    });
  }

  private async applyCancelledEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    event: Extract<AdapterStreamEvent, { type: 'cancelled' }>,
  ): Promise<void> {
    const finishedAt = toEventIso(event.at);
    const error: StructuredError = {
      layer: 'execution',
      code: 'CANCELLED_BY_USER',
      message: event.reason ?? 'Runtime cancelled the agent run.',
      retryable: false,
    };
    const cancelledAgentRun: AgentRun = {
      ...agentRun,
      status: 'cancelled',
      finishedAt,
      error,
      cancelable: false,
      updatedAt: finishedAt,
    };
    const cancelledTask: Task = {
      ...task,
      status: 'cancelled',
      failureReason: error.message,
      updatedAt: finishedAt,
    };
    const cancelledRun: OrchestrationRun = {
      ...run,
      status: 'cancelled',
      resultCompleteness: 'empty',
      completionLevel: 'failed',
      finishedAt,
      error,
      updatedAt: finishedAt,
    };
    await this.repository.updateAgentRun(cancelledAgentRun);
    await this.repository.updateTask(cancelledTask);
    await this.repository.updateRun(cancelledRun);
    await this.appendTrace(
      cancelledRun,
      cancelledTask,
      cancelledAgentRun,
      'run.cancelled',
      'warn',
      {
        reason: error.message,
      },
    );
  }

  private async applyTimeoutEvent(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    at: number,
  ): Promise<void> {
    const finishedAt = toEventIso(at);
    const error: StructuredError = {
      layer: 'execution',
      code: 'TIMEOUT',
      message: 'Runtime timed out.',
      retryable: true,
    };
    const timeoutAgentRun: AgentRun = {
      ...agentRun,
      status: 'timeout',
      timeoutAt: finishedAt,
      finishedAt,
      error,
      cancelable: false,
      updatedAt: finishedAt,
    };
    const failedTask: Task = {
      ...task,
      status: 'failed',
      failureReason: error.message,
      updatedAt: finishedAt,
    };
    const timeoutRun: OrchestrationRun = {
      ...run,
      status: 'timeout',
      hasPartialFailures: true,
      resultCompleteness: 'empty',
      completionLevel: 'failed',
      finishedAt,
      error,
      updatedAt: finishedAt,
    };
    await this.repository.updateAgentRun(timeoutAgentRun);
    await this.repository.updateTask(failedTask);
    await this.repository.updateRun(timeoutRun);
    await this.appendTrace(timeoutRun, failedTask, timeoutAgentRun, 'run.timeout', 'error', { at });
  }

  private async failRejectedRuntimeSubmit(
    run: OrchestrationRun,
    task: Task,
    agentRun: AgentRun,
    at: string,
  ): Promise<void> {
    const error: StructuredError = {
      layer: 'execution',
      code: 'RUNTIME_REJECTED',
      message: 'Runtime rejected the submitted agent run.',
      retryable: true,
    };
    await this.repository.updateAgentRun({
      ...agentRun,
      status: 'failed',
      finishedAt: at,
      error,
      cancelable: false,
      updatedAt: at,
    });
    await this.repository.updateTask({
      ...task,
      status: 'failed',
      failureReason: error.message,
      updatedAt: at,
    });
    await this.repository.updateRun({
      ...run,
      status: 'failed',
      hasPartialFailures: true,
      resultCompleteness: 'empty',
      completionLevel: 'failed',
      finishedAt: at,
      error,
      updatedAt: at,
    });
  }

  private async updateRunStatus(
    run: OrchestrationRun,
    status: OrchestrationRun['status'],
    updatedAt: string,
  ): Promise<OrchestrationRun> {
    const updatedRun: OrchestrationRun = {
      ...run,
      status,
      updatedAt,
    };
    await this.repository.updateRun(updatedRun);
    await this.appendTrace(updatedRun, undefined, undefined, `run.${status}`, 'info', {});
    return updatedRun;
  }

  private async requireRun(orchestrationRunId: OrchestrationRunId): Promise<OrchestrationRun> {
    const run = await this.repository.getRun(orchestrationRunId);
    if (run === undefined) {
      throw new ApplicationError(
        'MISSING_ORCHESTRATION_RUN',
        `Missing orchestration run: ${orchestrationRunId}`,
      );
    }
    return run;
  }

  private async requireTask(taskId: TaskId): Promise<Task> {
    const task = await this.repository.getTask(taskId);
    if (task === undefined) {
      throw new ApplicationError('MISSING_TASK', `Missing task: ${taskId}`);
    }
    return task;
  }

  private async requireAgentRun(runId: AgentRunId): Promise<AgentRun> {
    const agentRun = await this.repository.getAgentRun(runId);
    if (agentRun === undefined) {
      throw new ApplicationError('MISSING_AGENT_RUN', `Missing agent run: ${runId}`);
    }
    return agentRun;
  }

  private assertRunCanChange(run: OrchestrationRun): void {
    if (isRunTerminal(run.status)) {
      throw new ApplicationError(
        'ORCHESTRATION_RUN_TERMINAL',
        `OrchestrationRun is terminal: ${run.orchestrationRunId}`,
      );
    }
  }

  private assertTaskCanChange(task: Task): void {
    if (isTaskTerminal(task.status)) {
      throw new ApplicationError('TASK_TERMINAL', `Task is terminal: ${task.taskId}`);
    }
  }

  private assertAgentRunCanChange(agentRun: AgentRun): void {
    if (isAgentRunTerminal(agentRun.status)) {
      throw new ApplicationError('AGENT_RUN_TERMINAL', `AgentRun is terminal: ${agentRun.runId}`);
    }
  }

  private buildRerunBrief(brief: string, operatorNote: string | undefined): string {
    if (operatorNote === undefined || operatorNote.trim() === '') {
      return brief;
    }

    return `${brief}\n\nOperator note: ${operatorNote}`;
  }

  private async appendTrace(
    run: OrchestrationRun,
    task: Task | undefined,
    agentRun: AgentRun | undefined,
    eventType: string,
    level: TraceEvent['level'],
    payloadInline: Record<string, unknown>,
  ): Promise<void> {
    const createdAt = toIso(this.clock.now());
    const event: TraceEvent = {
      traceEventId: this.ids.traceEventId(),
      workspaceId: run.workspaceId,
      orchestrationRunId: run.orchestrationRunId,
      eventType,
      level,
      payloadInline,
      createdAt,
      traceId: run.traceId,
      ...(task === undefined ? {} : { taskId: task.taskId }),
      ...(agentRun === undefined ? {} : { runId: agentRun.runId }),
    };
    await this.repository.appendTraceEvent(event);
  }
}
