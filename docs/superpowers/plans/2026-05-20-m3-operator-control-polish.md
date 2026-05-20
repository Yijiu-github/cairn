# M3 Operator Control Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make operator cancel, retry, and rerun evidence explainable through TraceEvent and replay-source without changing the R1a state machine.

**Architecture:** Keep Workspace Core routes and shared contracts stable. Add evidence-only TraceEvent payloads in `@cairn/application`, then prove Workspace Core replay-source can expose those traces for Run Inspector consumers.

**Tech Stack:** TypeScript strict ESM, Vitest, Fastify inject tests, existing `TraceEvent.payloadInline`, pnpm workspace filters.

---

## File Structure

- Modify: `packages/application/src/orchestration/orchestration-run-service.ts`
  - Emit cancel request / acknowledgement evidence around `runtimeGateway.cancel()`.
  - Add `previousAttempt` to retry trace payload.
  - Add `previousTaskId` to rerun trace payload.
- Modify: `packages/application/src/orchestration/orchestration-run-service.spec.ts`
  - Prove cancel trace sequence and payloads.
  - Prove runtime cancel warning payloads.
  - Prove terminal AgentRun skip behavior.
  - Prove retry/rerun recovery evidence payloads.
- Modify: `apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts`
  - Add test-only cancel ack and cancel error controls to the existing mock gateway.
- Modify: `apps/workspace-core/src/service/app.spec.ts`
  - Prove cancel route evidence appears in `GET /v1/runs/:runId/replay-source`.
  - Prove runtime cancel warnings are readable through replay-source.
- Modify: `docs/design/state-machines.md`
  - Document cancel trace sequence and retry/rerun payload evidence.
- Modify: `docs/STATUS.md`
  - Update current Workspace Core and R1 completed status for M3 operator evidence polish.
- Modify: `CHANGELOG.md`
  - Add an Unreleased entry for M3 operator control evidence polish.

No shared contract file changes are required because `TraceEventType` is an open string and `payloadInline` already accepts structured records.

---

### Task 1: Application Trace Evidence

**Files:**

- Modify: `packages/application/src/orchestration/orchestration-run-service.spec.ts`
- Modify: `packages/application/src/orchestration/orchestration-run-service.ts`

- [ ] **Step 1: Write failing application tests**

In `packages/application/src/orchestration/orchestration-run-service.spec.ts`, replace the existing cancel / retry / rerun tests from `it('cancels an active run and its non-terminal task and agent run'` through `it('creates a queued single-worker rerun from a terminal single-task run'` with this block:

```ts
it('records cancel request and acknowledgement traces before local cancellation completes', async () => {
  const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> = createHarness();
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
  const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> = createHarness();
  runtimeGateway.cancelError = new Error('runtime cancel unavailable');
  await repository.createRunGraph({ run: createRunFixture(), tasks: [createTaskFixture()] });
  await repository.createAgentRun(createAgentRunFixture());

  await expect(
    service.cancelRun({ runId: ids.run, reason: 'Operator stopped it.' }),
  ).resolves.toMatchObject({ status: 'cancelled' });

  await expect(repository.getRun(ids.run)).resolves.toMatchObject({ status: 'cancelled' });
  await expect(repository.getTask(ids.task)).resolves.toMatchObject({ status: 'cancelled' });
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
  const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> = createHarness();
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
  const { repository, runtimeGateway, service }: ReturnType<typeof createHarness> = createHarness();
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
```

- [ ] **Step 2: Run the application test and verify it fails**

Run:

```bash
pnpm --filter @cairn/application test -- src/orchestration/orchestration-run-service.spec.ts
```

Expected: FAIL with missing `agent_run.cancel_requested`, missing `agent_run.cancel_acknowledged`, missing `previousAttempt`, missing `previousTaskId`, or mismatched cancel warning payloads.

- [ ] **Step 3: Implement minimal application evidence changes**

In `packages/application/src/orchestration/orchestration-run-service.ts`, update the non-terminal AgentRun cancel block inside `cancelRun()` to:

```ts
if (!isAgentRunTerminal(agentRun.status)) {
  await this.appendTrace(cancelledRun, task, agentRun, 'agent_run.cancel_requested', 'info', {
    reason,
    agentRunId: agentRun.runId,
  });

  try {
    const cancelAck = await this.runtimeGateway.cancel(agentRun.runId, reason);
    if (cancelAck.cancelled) {
      await this.appendTrace(
        cancelledRun,
        task,
        agentRun,
        'agent_run.cancel_acknowledged',
        'info',
        {
          reason,
          agentRunId: agentRun.runId,
        },
      );
    } else {
      await this.appendTrace(
        cancelledRun,
        task,
        agentRun,
        'agent_run.cancel_not_acknowledged',
        'warn',
        {
          reason,
          agentRunId: agentRun.runId,
          runtimeReason: cancelAck.reason ?? 'cancel_not_acknowledged',
        },
      );
    }
  } catch (cancelError) {
    await this.appendTrace(
      cancelledRun,
      task,
      agentRun,
      'agent_run.cancel_dispatch_failed',
      'warn',
      {
        reason,
        agentRunId: agentRun.runId,
        message: this.toErrorMessage(cancelError),
      },
    );
  }

  await this.repository.updateAgentRun({
    ...agentRun,
    status: 'cancelled',
    finishedAt: now,
    error,
    cancelable: false,
    updatedAt: now,
  });
}
```

In the same file, update the attempt calculation and `task.retry_requested` payload inside `retryTask()` to:

```ts
const now = toIso(this.clock.now());
const previousAttempt = task.attempt;
const newAttempt = previousAttempt + 1;
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
  previousAttempt,
  newAttempt,
  ...(input.reason === undefined ? {} : { reason: input.reason }),
});
```

In the same file, update the `run.rerun_created` trace payload inside `rerun()` to:

```ts
await this.appendTrace(created.run, created.task, undefined, 'run.rerun_created', 'info', {
  previousRunId: previousRun.orchestrationRunId,
  previousTaskId: previousTask.taskId,
  replan: input.replan ?? false,
  ...(input.operatorNote === undefined ? {} : { operatorNote: input.operatorNote }),
});
```

- [ ] **Step 4: Run the application test and verify it passes**

Run:

```bash
pnpm --filter @cairn/application test -- src/orchestration/orchestration-run-service.spec.ts
```

Expected: PASS for `orchestration-run-service.spec.ts`.

- [ ] **Step 5: Commit application evidence changes**

Run:

```bash
git add packages/application/src/orchestration/orchestration-run-service.ts packages/application/src/orchestration/orchestration-run-service.spec.ts
git commit -m "feat(application): 补齐接管控制证据 / complete operator control evidence"
```

---

### Task 2: Workspace Core Replay Evidence

**Files:**

- Modify: `apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts`
- Modify: `apps/workspace-core/src/service/app.spec.ts`

- [ ] **Step 1: Write failing Workspace Core replay tests**

In `apps/workspace-core/src/service/app.spec.ts`, add this import near the existing type import:

```ts
import type { AgentRunId } from '@cairn/shared-contracts/schemas';
```

After the `createSubmittedRun` helper, add replay response test types:

```ts
type ReplayTraceEvent = {
  eventType: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  payloadInline?: Record<string, unknown>;
};

type ReplaySourceResponse = {
  traceEvents: ReplayTraceEvent[];
  inspector: {
    status: string;
    warningEventCount: number;
  };
};
```

Replace the existing test named `sends runtime cancel through the runtime gateway when cancelling an active run` with:

```ts
it('exposes acknowledged operator cancel evidence through replay source', async () => {
  const runtimeGateway = new MockRuntimeGatewayPort();
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer({ runtimeGateway }),
    logger: false,
  });

  try {
    const { runId, taskId } = await createSubmittedRun(app);
    const agentRunsResponse = await app.inject({
      method: 'GET',
      url: `/v1/tasks/${taskId}/agent-runs`,
    });
    const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

    const cancelResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/cancel`,
      payload: { reason: 'Operator stopped it.' },
    });
    expect(cancelResponse.statusCode).toBe(200);
    expect(runtimeGateway.cancelled).toEqual([
      { runId: agentRun.runId, reason: 'Operator stopped it.' },
    ]);

    const replayResponse = await app.inject({
      method: 'GET',
      url: `/v1/runs/${runId}/replay-source`,
    });
    expect(replayResponse.statusCode).toBe(200);
    const replay = replayResponse.json<ReplaySourceResponse>();

    expect(replay.traceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'agent_run.cancel_requested',
          level: 'info',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: agentRun.runId,
          },
        }),
        expect.objectContaining({
          eventType: 'agent_run.cancel_acknowledged',
          level: 'info',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: agentRun.runId,
          },
        }),
        expect.objectContaining({
          eventType: 'run.cancelled',
          level: 'warn',
          payloadInline: { reason: 'Operator stopped it.' },
        }),
      ]),
    );
    expect(replay.inspector).toMatchObject({
      status: 'cancelled',
      warningEventCount: 1,
    });
  } finally {
    await app.close();
  }
});
```

After that test, add two warning evidence tests:

```ts
it('exposes runtime cancel not-acknowledged evidence through replay source', async () => {
  const runtimeGateway = new MockRuntimeGatewayPort();
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer({ runtimeGateway }),
    logger: false,
  });

  try {
    const { runId, taskId } = await createSubmittedRun(app);
    const agentRunsResponse = await app.inject({
      method: 'GET',
      url: `/v1/tasks/${taskId}/agent-runs`,
    });
    const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);
    runtimeGateway.cancelAckOverride = {
      runId: agentRun.runId as AgentRunId,
      cancelled: false,
      reason: 'already_terminal',
    };

    const cancelResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/cancel`,
      payload: { reason: 'Operator stopped it.' },
    });
    expect(cancelResponse.statusCode).toBe(200);

    const replayResponse = await app.inject({
      method: 'GET',
      url: `/v1/runs/${runId}/replay-source`,
    });
    expect(replayResponse.statusCode).toBe(200);
    const replay = replayResponse.json<ReplaySourceResponse>();

    expect(replay.traceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'agent_run.cancel_not_acknowledged',
          level: 'warn',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: agentRun.runId,
            runtimeReason: 'already_terminal',
          },
        }),
        expect.objectContaining({ eventType: 'run.cancelled', level: 'warn' }),
      ]),
    );
    expect(replay.inspector).toMatchObject({
      status: 'cancelled',
      warningEventCount: 2,
    });
  } finally {
    await app.close();
  }
});

it('exposes runtime cancel dispatch failure evidence through replay source', async () => {
  const runtimeGateway = new MockRuntimeGatewayPort();
  runtimeGateway.cancelError = new Error('runtime cancel unavailable');
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer({ runtimeGateway }),
    logger: false,
  });

  try {
    const { runId, taskId } = await createSubmittedRun(app);
    const agentRunsResponse = await app.inject({
      method: 'GET',
      url: `/v1/tasks/${taskId}/agent-runs`,
    });
    const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

    const cancelResponse = await app.inject({
      method: 'POST',
      url: `/v1/runs/${runId}/cancel`,
      payload: { reason: 'Operator stopped it.' },
    });
    expect(cancelResponse.statusCode).toBe(200);

    const replayResponse = await app.inject({
      method: 'GET',
      url: `/v1/runs/${runId}/replay-source`,
    });
    expect(replayResponse.statusCode).toBe(200);
    const replay = replayResponse.json<ReplaySourceResponse>();

    expect(replay.traceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'agent_run.cancel_dispatch_failed',
          level: 'warn',
          payloadInline: {
            reason: 'Operator stopped it.',
            agentRunId: agentRun.runId,
            message: 'runtime cancel unavailable',
          },
        }),
        expect.objectContaining({ eventType: 'run.cancelled', level: 'warn' }),
      ]),
    );
    expect(replay.inspector).toMatchObject({
      status: 'cancelled',
      warningEventCount: 2,
    });
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 2: Run the Workspace Core test and verify it fails**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts
```

Expected: FAIL because `MockRuntimeGatewayPort` has no `cancelAckOverride` / `cancelError`, or replay-source lacks the new cancel trace events.

- [ ] **Step 3: Add mock cancel controls**

In `apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts`, add properties to `MockRuntimeGatewayPort` and update `cancel()`:

```ts
export class MockRuntimeGatewayPort implements RuntimeGatewayPort {
  readonly submissions: AdapterSubmitRequest[] = [];
  readonly cancelled: { runId: AgentRunId; reason?: string }[] = [];
  cancelAckOverride?: AdapterCancelAck;
  cancelError?: Error;

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    this.submissions.push(request);
    return Promise.resolve({
      runId: request.runId,
      accepted: true,
      providerRunId: `mock:${request.runId}`,
    });
  }

  // Keep the existing stream() implementation unchanged.

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
```

- [ ] **Step 4: Run the Workspace Core test and verify it passes**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts
```

Expected: PASS for `app.spec.ts`.

- [ ] **Step 5: Commit Workspace Core replay tests**

Run:

```bash
git add apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts apps/workspace-core/src/service/app.spec.ts
git commit -m "test(workspace-core): 覆盖接管回放证据 / cover operator replay evidence"
```

---

### Task 3: Documentation Sync

**Files:**

- Modify: `docs/design/state-machines.md`
- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update state machine evidence documentation**

In `docs/design/state-machines.md`, insert this section after the operator action effect table in §5:

```md
### 5.1 Operator cancel evidence

Operator cancel 是本地状态收束动作，同时对 runtime cancel 进行 best-effort 派发。对每个非终态 AgentRun，Workspace Core 必须写入以下 TraceEvent：

| EventType                           | Level  | 触发时机                    | payload                                 |
| ----------------------------------- | ------ | --------------------------- | --------------------------------------- |
| `agent_run.cancel_requested`        | `info` | 调用 Runtime Gateway 前     | `reason`、`agentRunId`                  |
| `agent_run.cancel_acknowledged`     | `info` | runtime 返回 `cancelled`    | `reason`、`agentRunId`                  |
| `agent_run.cancel_not_acknowledged` | `warn` | runtime 返回未确认取消      | `reason`、`agentRunId`、`runtimeReason` |
| `agent_run.cancel_dispatch_failed`  | `warn` | runtime cancel 派发抛错     | `reason`、`agentRunId`、`message`       |
| `run.cancelled`                     | `warn` | 本地 run 收束为 `cancelled` | `reason`                                |

runtime cancel 失败或未确认不阻止本地 run / task / agent-run 进入 `cancelled`。终态 AgentRun 不再派发 runtime cancel，也不写 agent-run cancel evidence。

Retry / rerun 恢复证据必须保持语义分离：

- `task.retry_requested`：payload 包含 `previousAttempt`、`newAttempt`，以及可选 `reason`。
- `run.rerun_created`：payload 包含 `previousRunId`、`previousTaskId`、`replan`，以及可选 `operatorNote`。
```

- [ ] **Step 2: Update status documentation**

In `docs/STATUS.md`, update the Workspace Core bullet for Orchestration Control R1a from:

```md
- Orchestration Control R1a API：pause / resume / cancel run、retry task、rerun、operator note 的最小 HTTP 接管面。
```

to:

```md
- Orchestration Control R1a/M3 evidence API：pause / resume / cancel run、retry task、rerun、operator note 的最小 HTTP 接管面；cancel / retry / rerun 已补齐 TraceEvent evidence，并可通过 run trace / replay-source 读取。
```

Update the R1 completed bullet from:

```md
- Orchestration Control R1a：`@cairn/application` 与 `@cairn/workspace-core` 支持最小 operator control plane，覆盖 pause / resume / cancel / retry task / rerun 与 operator note。
```

to:

```md
- Orchestration Control R1a/M3 evidence：`@cairn/application` 与 `@cairn/workspace-core` 支持最小 operator control plane，覆盖 pause / resume / cancel / retry task / rerun 与 operator note；取消链路记录 runtime requested / acknowledged / warning evidence，retry / rerun 记录最小恢复证据。
```

Add a change history row at the top of §8:

```md
| 2026-05-20 | 更新 M3 Operator Control evidence polish 状态 |
```

- [ ] **Step 3: Update changelog**

In `CHANGELOG.md`, under `## [Unreleased]` → `### Added`, add:

```md
- **M3 Operator Control evidence polish**：补齐 operator cancel 的 runtime requested / acknowledged / not-acknowledged / dispatch-failed TraceEvent 证据，并为 retry / rerun trace 增加最小恢复路径 payload。
```

- [ ] **Step 4: Run documentation checks**

Run:

```bash
pnpm exec markdownlint-cli2 docs/design/state-machines.md docs/STATUS.md CHANGELOG.md
pnpm exec prettier --check docs/design/state-machines.md docs/STATUS.md CHANGELOG.md
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit documentation updates**

Run:

```bash
git add docs/design/state-machines.md docs/STATUS.md CHANGELOG.md
git commit -m "docs(operator): 同步 M3 接管证据状态 / sync M3 operator evidence status"
```

---

### Task 4: Full Verification And Integration Check

**Files:**

- Verify: full repository

- [ ] **Step 1: Run targeted tests**

Run:

```bash
pnpm --filter @cairn/application test -- src/orchestration/orchestration-run-service.spec.ts
pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts
```

Expected: both commands exit 0.

- [ ] **Step 2: Run full repository checks**

Run:

```bash
pnpm run check
pnpm test
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Inspect git history and status**

Run:

```bash
git status --short --branch
git log --oneline --decorate --max-count=8
```

Expected:

- Working tree has no unstaged implementation changes.
- Branch is `develop`.
- Latest commits include the M3 design spec, application evidence, Workspace Core replay evidence, and docs sync commits.

- [ ] **Step 4: Prepare completion summary**

Report:

```md
Implemented M3 Operator Control evidence polish.

Verification:

- `pnpm --filter @cairn/application test -- src/orchestration/orchestration-run-service.spec.ts`
- `pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts`
- `pnpm run check`
- `pnpm test`
- `git diff --check`

Key changes:

- Cancel evidence now records requested / acknowledged / not-acknowledged / dispatch-failed trace events.
- Runtime cancel failures remain best-effort and do not block local cancellation.
- Retry trace includes previous/new attempt evidence.
- Rerun trace includes previous run/task evidence.
- Replay-source exposes operator cancel evidence for Inspector consumers.
```

---

## Self-Review Checklist

- Spec coverage: Task 1 covers application evidence, Task 2 covers replay-source evidence, Task 3 covers docs sync, Task 4 covers verification.
- Product boundary: no Desktop UI, no Handoff Queue, no approve/reject, no scheduler, no schema migration, no new Runtime Adapter capability, no `apps/web`.
- Contract boundary: shared contracts remain stable because `TraceEventType` and `payloadInline` are intentionally extensible.
- State semantics: cancel remains best-effort against runtime and terminal objects are not revived.
- Test strategy: targeted package tests run before full repository checks.
