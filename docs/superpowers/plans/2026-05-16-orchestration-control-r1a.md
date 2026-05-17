# Orchestration Control R1a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the minimal Workspace Core operator control plane for pause, resume, cancel, retry task, rerun, and operator note.

**Architecture:** Reuse the existing `operatorContract` routes and keep all state-machine decisions in `OrchestrationRunService`. Workspace Core routes only parse HTTP params/body and map application errors to HTTP status codes. R1a uses TraceEvent for observability and keeps runtime cancellation, AgentRun retry, protected approvals, Desktop/Web UI, and Message persistence out of scope.

**Tech Stack:** TypeScript ESM, Zod, Fastify `app.inject`, Vitest, existing in-memory application repository, existing workspace-core container.

---

## Scope Check

This plan implements `docs/superpowers/specs/2026-05-16-orchestration-control-r1a-design.md`.

In scope:

- Export reusable operator request body schemas from `@cairn/shared-contracts`.
- Add application service methods for pause/resume/cancel/retry/rerun/operator note.
- Add Workspace Core HTTP routes for the six R1a actions.
- Add targeted application and workspace-core tests.
- Update project status and changelog.

Out of scope:

- Do not implement `retryAgentRun` route behavior.
- Do not implement `approveOrReject` route behavior.
- Do not call Runtime Gateway cancel/kill.
- Do not add Message persistence for operator note.
- Do not create or modify `apps/desktop` or `apps/web`.
- Do not add dependencies or alter CI/check scripts.

## File Structure

Modify these files:

- `packages/shared_contracts/src/contracts/operator.contract.ts`
  - Export body schemas as named constants so routes do not duplicate Zod definitions.
  - Keep route paths and response shapes unchanged.
- `packages/shared_contracts/src/contracts/index.ts`
  - Re-export the new operator body schemas.
- `packages/application/src/errors.ts`
  - Add invalid-state and unsupported-rerun error codes.
- `packages/application/src/orchestration/orchestration-run-service.ts`
  - Add R1a input/result types and service methods.
  - Keep state transition validation here.
- `packages/application/src/orchestration/orchestration-run-service.spec.ts`
  - Add focused tests for R1a service behavior.
- `apps/workspace-core/src/service/app.ts`
  - Add six operator routes and application error mapping.
- `apps/workspace-core/src/service/app.spec.ts`
  - Add route tests using `app.inject`.
- `docs/STATUS.md`
  - Move operator control R1a from missing capability to baseline capability while keeping real runtime cancellation incomplete.
- `CHANGELOG.md`
  - Record Orchestration Control R1a.

Do not create new app/package directories.

## Task 1: Export Operator Body Schemas

**Files:**

- Modify: `packages/shared_contracts/src/contracts/operator.contract.ts`
- Modify: `packages/shared_contracts/src/contracts/index.ts`

- [ ] **Step 1: Export named body schemas**

In `packages/shared_contracts/src/contracts/operator.contract.ts`, replace the unexported schema declarations near the top with this exact block:

```ts
export const OperatorReasonBody = z.object({ reason: z.string().max(1000).optional() });

export const OperatorRerunBody = z.object({
  /** 原始 event；省略时使用当前 run 的 origin_event_id */
  originEventId: EventId.optional(),
  /** 是否强制 replan（在新 run 内重做规划） */
  replan: z.boolean().default(false),
  /** operator 注入的补充上下文（可选） */
  operatorNote: z.string().max(4000).optional(),
});

export const OperatorNoteBody = z.object({
  /**
   * 接管说明 / 上下文。
   * 写为 message + trace event，不改变 run 状态。
   */
  note: z.string().min(1).max(4000),
  /** 仅 operator 可见还是公开 */
  visibility: z.enum(['public', 'operator_only']).default('operator_only'),
});

export const OperatorApproveRejectBody = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(1000).optional(),
});
```

Then update the router definitions in the same file:

```ts
body: OperatorReasonBody,
```

for `pauseRun`, `cancelRun`, `retryTask`, and `retryAgentRun`.

Use this for `rerun`:

```ts
body: OperatorRerunBody,
```

Use this for `injectNote`:

```ts
body: OperatorNoteBody,
```

Use this for `approveOrReject`:

```ts
body: OperatorApproveRejectBody,
```

- [ ] **Step 2: Re-export schemas from the contracts barrel**

In `packages/shared_contracts/src/contracts/index.ts`, replace:

```ts
export { operatorContract } from './operator.contract.js';
```

with:

```ts
export {
  operatorContract,
  OperatorApproveRejectBody,
  OperatorNoteBody,
  OperatorReasonBody,
  OperatorRerunBody,
} from './operator.contract.js';
```

- [ ] **Step 3: Run shared contracts tests**

Run:

```bash
pnpm --filter @cairn/shared-contracts test
```

Expected: command exits `0` and existing contract/schema tests pass.

- [ ] **Step 4: Commit schema exports**

Run:

```bash
git add packages/shared_contracts/src/contracts/operator.contract.ts packages/shared_contracts/src/contracts/index.ts
git commit -m "feat(contracts): 导出接管动作请求体 / export operator action bodies"
```

Expected: commit succeeds.

## Task 2: Add Application Control Service Tests

**Files:**

- Modify: `packages/application/src/orchestration/orchestration-run-service.spec.ts`

- [ ] **Step 1: Extend test ids**

In `packages/application/src/orchestration/orchestration-run-service.spec.ts`, add these imports to the existing shared-contracts type import:

```ts
  AgentRun,
  OrchestrationRun,
  Task,
```

Add these ids to the `ids` object:

```ts
  rerun: '01HZZZZZZZZZZZZZZZZZZZZRR1' as OrchestrationRunId,
  rerunTask: '01HZZZZZZZZZZZZZZZZZZZZTT1' as TaskId,
  noteTrace: '01HZZZZZZZZZZZZZZZZZZZZZN1' as TraceEventId,
```

- [ ] **Step 2: Make the harness support custom generated ids**

Replace the existing `createHarness` function with this version:

```ts
const createHarness = (
  generatedIds: Partial<{
    runIds: OrchestrationRunId[];
    taskIds: TaskId[];
    agentRunIds: AgentRunId[];
    traceEventIds: TraceEventId[];
  }> = {},
) => {
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
  });
  return { repository, runtimeGateway, service };
};
```

- [ ] **Step 3: Add repository seeding helpers**

After `createRunAndSubmit`, add these helpers:

```ts
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
```

- [ ] **Step 4: Add pause and resume failing tests**

Before the closing `});` of `describe('OrchestrationRunService', ...)`, add:

```ts
it('pauses and resumes a running orchestration run', async () => {
  const { repository, service } = createHarness();
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
    expect.arrayContaining([expect.objectContaining({ eventType: 'run.resumed', level: 'info' })]),
  );
});

it('rejects pause when the run is not running', async () => {
  const { repository, service } = createHarness();
  await repository.createRunGraph({
    run: createRunFixture({ status: 'queued' }),
    tasks: [createTaskFixture({ status: 'ready' })],
  });

  await expect(service.pauseRun({ runId: ids.run })).rejects.toMatchObject({
    code: 'INVALID_RUN_STATE',
  });
  await expect(repository.getRun(ids.run)).resolves.toMatchObject({ status: 'queued' });
});
```

- [ ] **Step 5: Add cancel failing test**

Append this test:

```ts
it('cancels an active run and its non-terminal task and agent run', async () => {
  const { repository, service } = createHarness();
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
```

- [ ] **Step 6: Add retry task failing tests**

Append these tests:

```ts
it('retries a failed task in a non-terminal run', async () => {
  const { repository, service } = createHarness();
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
  const { repository, service } = createHarness();
  await repository.createRunGraph({
    run: createRunFixture({ status: 'failed' }),
    tasks: [createTaskFixture({ status: 'failed' })],
  });

  await expect(service.retryTask({ taskId: ids.task })).rejects.toMatchObject({
    code: 'ORCHESTRATION_RUN_TERMINAL',
  });
});
```

- [ ] **Step 7: Add rerun failing tests**

Append these tests:

```ts
it('creates a queued single-worker rerun from a terminal single-task run', async () => {
  const { repository, service } = createHarness({
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
        budgetHint: { maxOutputTokens: 1000 },
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
    budgetHint: { maxOutputTokens: 1000 },
    brief: 'Update the target module.\n\nOperator note: Please use the latest context.',
  });
  expect(repository.listTraceEvents()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ eventType: 'run.rerun_created', level: 'info' }),
    ]),
  );
});

it('rejects rerun for a non-terminal run', async () => {
  const { repository, service } = createHarness();
  await repository.createRunGraph({ run: createRunFixture({ status: 'running' }), tasks: [] });

  await expect(service.rerun({ runId: ids.run })).rejects.toMatchObject({
    code: 'INVALID_RUN_STATE',
  });
});
```

- [ ] **Step 8: Add operator note failing test**

Append this test:

```ts
it('injects an operator note without changing terminal run state', async () => {
  const { repository, service } = createHarness({ traceEventIds: [ids.noteTrace] });
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
```

- [ ] **Step 9: Run application tests and verify they fail**

Run:

```bash
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
```

Expected: command fails with TypeScript/test errors for missing service methods and error codes, including `pauseRun`, `resumeRun`, `cancelRun`, `retryTask`, `rerun`, or `injectOperatorNote`.

Do not commit failing tests by themselves unless the implementation is delegated to another worker immediately on the same branch.

## Task 3: Implement Application Control Service

**Files:**

- Modify: `packages/application/src/errors.ts`
- Modify: `packages/application/src/orchestration/orchestration-run-service.ts`

- [ ] **Step 1: Add application error codes**

In `packages/application/src/errors.ts`, extend `ApplicationErrorCode` with these members:

```ts
  | 'INVALID_RUN_STATE'
  | 'INVALID_TASK_STATE'
  | 'RERUN_UNSUPPORTED_GRAPH'
```

Keep the union alphabetized with the surrounding style if the file has been sorted by a formatter.

- [ ] **Step 2: Add service input/result interfaces**

In `packages/application/src/orchestration/orchestration-run-service.ts`, add `MessageId` to the shared-contracts type import.

After `SubmitTaskToRuntimeResult`, add:

```ts
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
```

- [ ] **Step 3: Add public control methods**

Inside the `OrchestrationRunService` class, after `applyAdapterEvent`, add these methods:

```ts
  async pauseRun(input: PauseRunInput): Promise<OrchestrationRun> {
    const run = await this.requireRun(input.runId);
    if (run.status !== 'running') {
      throw new ApplicationError(
        'INVALID_RUN_STATE',
        `Run must be running to pause: ${run.orchestrationRunId}`,
      );
    }

    const now = toIso(this.clock.now());
    const pausedRun: OrchestrationRun = { ...run, status: 'paused', updatedAt: now };
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
    const resumedRun: OrchestrationRun = { ...run, status: 'running', updatedAt: now };
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
    await this.appendTrace(cancelledRun, undefined, undefined, 'run.cancelled', 'warn', { reason });
    return cancelledRun;
  }

  async retryTask(input: RetryTaskInput): Promise<RetryTaskResult> {
    const task = await this.requireTask(input.taskId);
    const run = await this.requireRun(task.orchestrationRunId);
    this.assertRunCanChange(run);

    if (task.status !== 'failed') {
      throw new ApplicationError('INVALID_TASK_STATE', `Task must be failed to retry: ${task.taskId}`);
    }

    const now = toIso(this.clock.now());
    const newAttempt = task.attempt + 1;
    const retriedTask: Task = {
      ...task,
      status: 'ready',
      attempt: newAttempt,
      idempotencyKey: `${task.taskId}:${newAttempt}`,
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
      ...(previousRun.conversationId === undefined ? {} : { conversationId: previousRun.conversationId }),
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
```

- [ ] **Step 4: Add rerun brief helper**

Near the existing private helper methods, before `appendTrace`, add:

```ts
  private buildRerunBrief(brief: string, operatorNote: string | undefined): string {
    if (operatorNote === undefined || operatorNote.trim() === '') {
      return brief;
    }

    return `${brief}\n\nOperator note: ${operatorNote}`;
  }
```

- [ ] **Step 5: Format the long retry error line if needed**

If Prettier does not wrap the `INVALID_TASK_STATE` throw cleanly, replace that block with:

```ts
if (task.status !== 'failed') {
  throw new ApplicationError('INVALID_TASK_STATE', `Task must be failed to retry: ${task.taskId}`);
}
```

- [ ] **Step 6: Run application tests**

Run:

```bash
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
```

Expected: command exits `0`.

- [ ] **Step 7: Commit application service**

Run:

```bash
git add packages/application/src/errors.ts packages/application/src/orchestration/orchestration-run-service.ts packages/application/src/orchestration/orchestration-run-service.spec.ts
git commit -m "feat(application): 实现编排接管控制 / implement orchestration controls"
```

Expected: commit succeeds.

## Task 4: Add Workspace Core Operator Routes Tests

**Files:**

- Modify: `apps/workspace-core/src/service/app.spec.ts`

- [ ] **Step 1: Add route test helper**

In `apps/workspace-core/src/service/app.spec.ts`, after `createScanner`, add:

```ts
const createSubmittedRun = async (app: Awaited<ReturnType<typeof createWorkspaceCoreApp>>) => {
  const createResponse = await app.inject({
    method: 'POST',
    url: `/v1/workspaces/${ids.workspace}/runs`,
    payload: {
      originEventId: ids.event,
      task: {
        taskKind: 'edit',
        title: 'Apply patch',
        brief: 'Update the target module.',
      },
    },
  });
  const run = createResponse.json<{ orchestrationRunId: string }>();
  const tasksResponse = await app.inject({
    method: 'GET',
    url: `/v1/runs/${run.orchestrationRunId}/tasks`,
  });
  const task = first(tasksResponse.json<{ items: { taskId: string }[] }>().items);
  await app.inject({ method: 'POST', url: `/v1/tasks/${task.taskId}/agent-runs` });
  return { runId: run.orchestrationRunId, taskId: task.taskId };
};
```

- [ ] **Step 2: Add pause/resume route failing test**

Before the closing `});` of `describe('workspace-core app', ...)`, add:

```ts
it('pauses and resumes a run through operator routes', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const { runId } = await createSubmittedRun(app);

    const pauseResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/pause`,
      payload: { reason: 'Review before continuing.' },
    });

    expect(pauseResponse.statusCode).toBe(200);
    expect(pauseResponse.json()).toMatchObject({ orchestrationRunId: runId, status: 'paused' });

    const resumeResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/resume`,
      payload: {},
    });

    expect(resumeResponse.statusCode).toBe(200);
    expect(resumeResponse.json()).toMatchObject({ orchestrationRunId: runId, status: 'running' });
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 3: Add cancel and invalid-state route failing tests**

Append these tests:

```ts
it('cancels a run through the operator route', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const { runId } = await createSubmittedRun(app);

    const cancelResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/cancel`,
      payload: { reason: 'Operator stopped it.' },
    });

    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.json()).toMatchObject({
      orchestrationRunId: runId,
      status: 'cancelled',
      error: { code: 'CANCELLED_BY_OPERATOR' },
    });
  } finally {
    await app.close();
  }
});

it('maps invalid operator state transitions to 409', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const createResponse = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ids.workspace}/runs`,
      payload: { originEventId: ids.event },
    });
    const run = createResponse.json<{ orchestrationRunId: string }>();

    const response = await app.inject({
      method: 'POST',
      url: `/v1/runs/${run.orchestrationRunId}/pause`,
      payload: {},
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: 'INVALID_RUN_STATE' } });
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 4: Add retry, rerun, and note route failing tests**

Append this test:

```ts
it('supports retry task, rerun, and operator notes through operator routes', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const { runId, taskId } = await createSubmittedRun(app);
    await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/cancel`,
      payload: { reason: 'Stop before retry route check.' },
    });

    const noteResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/notes`,
      payload: { note: 'Keep this context for later.', visibility: 'operator_only' },
    });
    expect(noteResponse.statusCode).toBe(201);
    expect(noteResponse.json()).toMatchObject({
      messageId: expect.stringContaining('message:') as unknown,
      traceEventId: expect.any(String) as unknown,
    });

    const rerunResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/rerun`,
      payload: { operatorNote: 'Try the narrower approach.', replan: true },
    });
    expect(rerunResponse.statusCode).toBe(202);
    const rerun = rerunResponse.json<{ orchestrationRunId: string; status: string }>();
    expect(rerun).toMatchObject({ status: 'queued' });

    const retryResponse = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${taskId}/retry`,
      payload: {},
    });
    expect(retryResponse.statusCode).toBe(409);
    expect(retryResponse.json()).toMatchObject({ error: { code: 'ORCHESTRATION_RUN_TERMINAL' } });
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 5: Add validation and missing-resource failing tests**

Append these tests:

```ts
it('returns 400 for invalid operator route ids and bodies', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const invalidIdResponse = await app.inject({
      method: 'POST',
      url: '/v1/runs/not-a-ulid/pause',
      payload: {},
    });
    expect(invalidIdResponse.statusCode).toBe(400);

    const { runId } = await createSubmittedRun(app);
    const invalidBodyResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/notes`,
      payload: { note: '' },
    });
    expect(invalidBodyResponse.statusCode).toBe(400);
  } finally {
    await app.close();
  }
});

it('returns 404 for missing operator route resources', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/runs/01HZZZZZZZZZZZZZZZZZZZZZZ9/pause',
      payload: {},
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 6: Run workspace-core app tests and verify they fail**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
```

Expected: command fails because operator routes do not exist yet or return 404.

## Task 5: Implement Workspace Core Operator Routes

**Files:**

- Modify: `apps/workspace-core/src/service/app.ts`

- [ ] **Step 1: Import operator body schemas**

In `apps/workspace-core/src/service/app.ts`, replace:

```ts
import { StartRunBody } from '@cairn/shared-contracts/contracts';
```

with:

```ts
import {
  OperatorNoteBody,
  OperatorReasonBody,
  OperatorRerunBody,
  StartRunBody,
} from '@cairn/shared-contracts/contracts';
```

- [ ] **Step 2: Add application error HTTP mapper**

After `isApplicationError`, add:

```ts
const toApplicationHttpStatus = (error: ApplicationError): 404 | 409 | 500 => {
  switch (error.code) {
    case 'MISSING_AGENT_RUN':
    case 'MISSING_ORCHESTRATION_RUN':
    case 'MISSING_TASK':
    case 'SOURCE_ROOT_NOT_FOUND': {
      return 404;
    }
    case 'AGENT_RUN_TERMINAL':
    case 'INVALID_RUN_STATE':
    case 'INVALID_TASK_STATE':
    case 'ORCHESTRATION_RUN_TERMINAL':
    case 'RERUN_UNSUPPORTED_GRAPH':
    case 'TASK_NOT_READY':
    case 'TASK_TERMINAL': {
      return 409;
    }
    case 'RUNTIME_REJECTED': {
      return 500;
    }
  }
};

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
```

- [ ] **Step 3: Add operator action route helpers**

After the existing `app.get('/v1/tasks/:taskId/agent-runs', ...)` route and before `app.post('/v1/tasks/:taskId/agent-runs', ...)`, add:

```ts
app.post('/v1/runs/:runId/pause', async (request, reply) => {
  const runId = OrchestrationRunId.safeParse((request.params as Record<string, unknown>)['runId']);
  const body = OperatorReasonBody.safeParse(request.body ?? {});

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
  const runId = OrchestrationRunId.safeParse((request.params as Record<string, unknown>)['runId']);

  if (!runId.success) {
    return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
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
  const runId = OrchestrationRunId.safeParse((request.params as Record<string, unknown>)['runId']);
  const body = OperatorReasonBody.safeParse(request.body ?? {});

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
  const body = OperatorReasonBody.safeParse(request.body ?? {});

  if (!taskId.success) {
    return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid task id.', taskId.error.issues));
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
  const runId = OrchestrationRunId.safeParse((request.params as Record<string, unknown>)['runId']);
  const body = OperatorRerunBody.safeParse(request.body ?? {});

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
      ...(body.data.originEventId === undefined ? {} : { originEventId: body.data.originEventId }),
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
  const runId = OrchestrationRunId.safeParse((request.params as Record<string, unknown>)['runId']);
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
```

- [ ] **Step 4: Run workspace-core route tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
```

Expected: command exits `0`.

- [ ] **Step 5: Commit workspace-core routes**

Run:

```bash
git add apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts
git commit -m "feat(workspace-core): 暴露编排接管路由 / expose orchestration control routes"
```

Expected: commit succeeds.

## Task 6: Update Documentation and Run Final Verification

**Files:**

- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update status current capabilities**

In `docs/STATUS.md`, in `### Workspace Core`, add this bullet after the R1 run/task/agent-run HTTP bullet:

```md
- Orchestration Control R1a API：pause / resume / cancel run、retry task、rerun、operator note 的最小 HTTP 接管面；取消仍是 application state change，尚未调用真实 runtime kill。
```

- [ ] **Step 2: Update status completed capabilities**

In `docs/STATUS.md`, in `## 4. R1 已完成能力`, add this bullet after the `@cairn/workspace-core` bullet:

```md
- Orchestration Control R1a：`@cairn/application` 与 `@cairn/workspace-core` 支持最小 operator control plane，覆盖 pause / resume / cancel / retry task / rerun / operator note。
```

- [ ] **Step 3: Update status missing capabilities**

In `docs/STATUS.md`, in `## 5. R1 未完成能力`, replace:

```md
- retry / rerun / cancel 的完整 workspace-core API 与 UI。
```

with:

```md
- 真实 Runtime Gateway cancellation / kill、AgentRun retry、protected step approve/reject 与 operator control UI。
```

- [ ] **Step 4: Update changelog**

In `CHANGELOG.md`, under `[Unreleased]` → `### Added`, add:

```md
- **Orchestration Control R1a**：新增 application 与 workspace-core 最小接管控制面，覆盖 pause / resume / cancel run、retry task、rerun 与 operator note，并写入 TraceEvent。
```

- [ ] **Step 5: Run focused verification**

Run:

```bash
pnpm --filter @cairn/shared-contracts test
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
pnpm --filter @cairn/workspace-core test -- app.spec.ts
pnpm exec markdownlint-cli2 docs/STATUS.md CHANGELOG.md docs/superpowers/specs/2026-05-16-orchestration-control-r1a-design.md docs/superpowers/plans/2026-05-16-orchestration-control-r1a.md
pnpm exec prettier --check packages/shared_contracts/src/contracts/operator.contract.ts packages/shared_contracts/src/contracts/index.ts packages/application/src/errors.ts packages/application/src/orchestration/orchestration-run-service.ts packages/application/src/orchestration/orchestration-run-service.spec.ts apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts docs/STATUS.md CHANGELOG.md docs/superpowers/plans/2026-05-16-orchestration-control-r1a.md
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 6: Run broad verification**

Run:

```bash
pnpm run check
pnpm test
```

Expected: both commands exit `0`.

- [ ] **Step 7: Commit docs and final verification updates**

Run:

```bash
git add docs/STATUS.md CHANGELOG.md docs/superpowers/plans/2026-05-16-orchestration-control-r1a.md
git commit -m "docs(orchestration): 记录控制面 R1a 计划 / document control plane R1a plan"
```

Expected: commit succeeds.

## Implementation Notes

- If TypeScript reports that `delete retriedTask.failureReason` is unsafe, construct the object with destructuring instead:

```ts
const { failureReason: _failureReason, ...taskWithoutFailure } = task;
const retriedTask: Task = {
  ...taskWithoutFailure,
  status: 'ready',
  attempt: newAttempt,
  idempotencyKey: `${task.taskId}:${newAttempt}`,
  updatedAt: now,
};
```

- If `exactOptionalPropertyTypes` rejects passing optional fields as `undefined`, use conditional spreads exactly as shown in this plan.
- Keep `retryAgentRun` and `approveOrReject` unimplemented in Workspace Core routes for R1a, even though the contract already declares them.
- Do not update `docs/design/state-machines.md` unless implementation reveals a real mismatch. The R1a conservative retry rule is already captured in the design spec.
