# Codex Runtime Drain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the smallest real-runtime execution path by allowing Workspace Core to submit an AgentRun, drain its runtime stream, and apply AdapterStreamEvent updates back into application state.

**Architecture:** Extend the application runtime gateway port from submit-only to submit / stream / cancel. Keep `submitTaskToRuntime` deterministic and non-blocking, then add an explicit `drainAgentRunRuntime` application method that consumes the stream and calls the existing `applyAdapterEvent`. Workspace Core keeps mock runtime as the default, adds a RuntimeAdapter-backed gateway adapter, and adds a route for explicit draining; this avoids introducing a background scheduler in this slice.

**Tech Stack:** TypeScript ESM, Vitest, Fastify route tests, existing RuntimeAdapter / Codex process primitives.

---

## Scope Check

In scope:

- Extend `RuntimeGatewayPort` with `stream` and `cancel`.
- Update mock / test runtime gateway ports.
- Add `drainAgentRunRuntime` to `OrchestrationRunService`.
- Add Workspace Core runtime gateway wrapper around `RuntimeAdapter`.
- Add an explicit Workspace Core drain route for submitted AgentRuns.
- Add tests with deterministic mock stream events.
- Update `CHANGELOG.md`.

Out of scope:

- Do not run Codex CLI during automated tests.
- Do not add background worker scheduling.
- Do not create Desktop / Web code.
- Do not implement artifact file content persistence.
- Do not change RuntimeAdapter protocol shape.
- Do not make mock runtime non-deterministic.

## File Structure

Modify these files:

- `packages/application/src/ports/runtime-gateway-port.ts`
  - Adds `stream` and `cancel` methods to the application port.
- `packages/application/src/orchestration/orchestration-run-service.ts`
  - Adds `drainAgentRunRuntime` and runtime cancel delegation.
- `packages/application/src/orchestration/orchestration-run-service.spec.ts`
  - Tests stream draining and cancel delegation.
- `apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts`
  - Returns deterministic stream events.
- `apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts`
  - New adapter from `RuntimeAdapter` to `RuntimeGatewayPort`.
- `apps/workspace-core/src/service/container.ts`
  - Allows injecting a runtime gateway and keeps mock default.
- `apps/workspace-core/src/service/app.ts`
  - Adds explicit drain route.
- `apps/workspace-core/src/service/app.spec.ts`
  - Tests explicit drain route reaches terminal run state with mock runtime.
- `CHANGELOG.md`
  - Records the runtime drain slice.

## Task 1: Application Runtime Port and Drain

**Files:**

- Modify: `packages/application/src/ports/runtime-gateway-port.ts`
- Modify: `packages/application/src/orchestration/orchestration-run-service.ts`
- Modify: `packages/application/src/orchestration/orchestration-run-service.spec.ts`

- [x] **Step 1: Extend test gateway first**

In `packages/application/src/orchestration/orchestration-run-service.spec.ts`, update imports from `@cairn/runtime-gateway` to include `AdapterCancelAck` and `AdapterStreamEvent`.

Update `RecordingRuntimeGateway` to implement stream and cancel:

```ts
class RecordingRuntimeGateway implements RuntimeGatewayPort {
  readonly requests: AdapterSubmitRequest[] = [];
  readonly cancelled: { runId: AgentRunId; reason?: string }[] = [];

  constructor(
    private readonly ack?: AdapterSubmitAck,
    private readonly events: readonly AdapterStreamEvent[] = [
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
  ) {}

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    this.requests.push(request);
    return Promise.resolve(
      this.ack ?? { runId: request.runId, accepted: true, providerRunId: 'provider:1' },
    );
  }

  async *stream(_runId: AgentRunId): AsyncIterable<AdapterStreamEvent> {
    for (const event of this.events) {
      yield event;
    }
  }

  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck> {
    this.cancelled.push(reason === undefined ? { runId } : { runId, reason });
    return Promise.resolve(
      reason === undefined ? { runId, cancelled: true } : { runId, cancelled: true, reason },
    );
  }
}
```

- [x] **Step 2: Add failing drain test**

Add this test after `submits a ready task to the runtime gateway and records an AgentRun`:

```ts
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
```

- [x] **Step 3: Add failing cancel delegation test**

Add this expectation to `cancels an active run and its non-terminal task and agent run` after `cancelRun`:

```ts
expect(runtimeGateway.cancelled).toEqual([{ runId: ids.agentRun, reason: 'Operator stopped it.' }]);
```

- [x] **Step 4: Run application test and verify failure**

Run:

```bash
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
```

Expected: fail because the port and service method do not exist yet.

- [x] **Step 5: Extend RuntimeGatewayPort**

In `packages/application/src/ports/runtime-gateway-port.ts`, replace the import with:

```ts
import type {
  AdapterCancelAck,
  AdapterStreamEvent,
  AdapterSubmitAck,
  AdapterSubmitRequest,
} from '@cairn/runtime-gateway';
import type { AgentRunId } from '@cairn/shared-contracts/schemas';
```

Then change the interface to:

```ts
export interface RuntimeGatewayPort {
  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck>;
  stream(runId: AgentRunId): AsyncIterable<AdapterStreamEvent>;
  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck>;
}
```

- [x] **Step 6: Add drain method to service**

In `packages/application/src/orchestration/orchestration-run-service.ts`, add near the submit result interfaces:

```ts
export interface DrainAgentRunRuntimeInput {
  agentRunId: AgentRunId;
}

export interface DrainAgentRunRuntimeResult {
  agentRunId: AgentRunId;
  eventCount: number;
}
```

Add this public method after `submitTaskToRuntime`:

```ts
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
```

- [x] **Step 7: Delegate cancel to runtime gateway**

In `cancelRun`, inside the non-terminal `agentRun` branch and before `updateAgentRun`, add:

```ts
await this.runtimeGateway.cancel(agentRun.runId, reason);
```

- [x] **Step 8: Verify application**

Run:

```bash
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
pnpm --filter @cairn/application typecheck
```

Expected: both commands exit `0`.

- [x] **Step 9: Commit application slice**

Run:

```bash
git add packages/application/src/ports/runtime-gateway-port.ts packages/application/src/orchestration/orchestration-run-service.ts packages/application/src/orchestration/orchestration-run-service.spec.ts
git commit -m "feat(application): 消费运行时事件流 / consume runtime event streams"
```

Expected: commit succeeds.

## Task 2: Workspace Core Runtime Gateway Wrapper

**Files:**

- Modify: `apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts`
- Create: `apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts`
- Modify: `apps/workspace-core/src/service/container.ts`

- [x] **Step 1: Update mock runtime gateway**

In `apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts`, update imports to include `AdapterCancelAck`, `AdapterStreamEvent`, `ArtifactRef`, and `AgentRunId`.

Replace the class with:

```ts
export class MockRuntimeGatewayPort implements RuntimeGatewayPort {
  readonly submissions: AdapterSubmitRequest[] = [];
  readonly cancelled: { runId: AgentRunId; reason?: string }[] = [];

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    this.submissions.push(request);
    return Promise.resolve({
      runId: request.runId,
      accepted: true,
      providerRunId: `mock:${request.runId}`,
    });
  }

  async *stream(runId: AgentRunId): AsyncIterable<AdapterStreamEvent> {
    const finalArtifactRef: ArtifactRef = { artifactId: `artifact:${runId}` };
    yield { type: 'queued', at: Date.parse('2026-05-14T01:00:01.000Z') };
    yield {
      type: 'started',
      at: Date.parse('2026-05-14T01:00:02.000Z'),
      providerRunId: `mock:${runId}`,
    };
    yield { type: 'heartbeat', at: Date.parse('2026-05-14T01:00:02.500Z') };
    yield { type: 'succeeded', at: Date.parse('2026-05-14T01:00:03.000Z'), finalArtifactRef };
  }

  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck> {
    this.cancelled.push(reason === undefined ? { runId } : { runId, reason });
    return Promise.resolve(
      reason === undefined ? { runId, cancelled: true } : { runId, cancelled: true, reason },
    );
  }
}
```

- [x] **Step 2: Create RuntimeAdapter gateway wrapper**

Create `apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts`:

```ts
// SPDX-License-Identifier: Apache-2.0

import type { RuntimeGatewayPort } from '@cairn/application';
import type {
  AdapterCancelAck,
  AdapterStreamEvent,
  AdapterSubmitAck,
  AdapterSubmitRequest,
  RuntimeAdapter,
} from '@cairn/runtime-gateway';
import type { AgentRunId } from '@cairn/shared-contracts/schemas';

export class RuntimeAdapterGatewayPort implements RuntimeGatewayPort {
  constructor(private readonly adapter: RuntimeAdapter) {}

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    return this.adapter.submit(request);
  }

  stream(runId: AgentRunId): AsyncIterable<AdapterStreamEvent> {
    return this.adapter.stream(runId);
  }

  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck> {
    return this.adapter.cancel(runId, reason);
  }
}
```

- [x] **Step 3: Allow runtime gateway injection in default container**

In `apps/workspace-core/src/service/container.ts`, add `runtimeGateway?: RuntimeGatewayPort;` to `CreateDefaultWorkspaceCoreContainerOptions`.

Use `options.runtimeGateway ?? new MockRuntimeGatewayPort()` in all default container paths instead of creating a mock inline.

- [x] **Step 4: Verify workspace-core types**

Run:

```bash
pnpm --filter @cairn/workspace-core typecheck
```

Expected: command exits `0`.

- [x] **Step 5: Commit wrapper slice**

Run:

```bash
git add apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts apps/workspace-core/src/service/container.ts
git commit -m "feat(workspace-core): 增加运行时网关适配器 / add runtime gateway adapter"
```

Expected: commit succeeds.

## Task 3: Explicit Workspace Core Drain Route

**Files:**

- Modify: `apps/workspace-core/src/service/app.ts`
- Modify: `apps/workspace-core/src/service/app.spec.ts`

- [x] **Step 1: Add route test**

In `apps/workspace-core/src/service/app.spec.ts`, add this test after `creates and reads a single-worker run`:

```ts
it('drains submitted AgentRun runtime events into terminal state', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const { runId, taskId } = await createSubmittedRun(app);
    const agentRunsResponse = await app.inject({
      method: 'GET',
      url: `/v1/tasks/${taskId}/agent-runs`,
    });
    const agentRun = first(agentRunsResponse.json<{ items: { runId: string }[] }>().items);

    const drainResponse = await app.inject({
      method: 'POST',
      url: `/v1/agent-runs/${agentRun.runId}/drain-runtime`,
      payload: {},
    });

    expect(drainResponse.statusCode).toBe(202);
    expect(drainResponse.json()).toMatchObject({
      agentRunId: agentRun.runId,
      eventCount: 4,
    });

    const runResponse = await app.inject({ method: 'GET', url: `/v1/runs/${runId}` });
    expect(runResponse.json()).toMatchObject({
      orchestrationRunId: runId,
      status: 'succeeded',
      finalResponseRef: expect.stringContaining('artifact:') as unknown,
    });
  } finally {
    await app.close();
  }
});
```

- [x] **Step 2: Run test and verify failure**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
```

Expected: fail because the drain route does not exist yet.

- [x] **Step 3: Implement route**

In `apps/workspace-core/src/service/app.ts`, import `AgentRunId` from `@cairn/shared-contracts/schemas`.

Add this route before `POST /v1/tasks/:taskId/agent-runs`:

```ts
app.post('/v1/agent-runs/:agentRunId/drain-runtime', async (request, reply) => {
  const agentRunId = AgentRunId.safeParse(
    (request.params as Record<string, unknown>)['agentRunId'],
  );
  if (!agentRunId.success) {
    return reply
      .code(400)
      .send(toApiError('BAD_REQUEST', 'Invalid agent run id.', agentRunId.error.issues));
  }

  try {
    const result = await options.container.orchestrationRuns.drainAgentRunRuntime({
      agentRunId: agentRunId.data,
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
```

- [x] **Step 4: Verify workspace-core**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
pnpm --filter @cairn/workspace-core typecheck
```

Expected: both commands exit `0`.

- [x] **Step 5: Commit route slice**

Run:

```bash
git add apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts
git commit -m "feat(workspace-core): 增加运行时事件流落库路由 / add runtime stream drain route"
```

Expected: commit succeeds.

## Task 4: Docs and Final Verification

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/plans/2026-05-17-codex-runtime-drain.md`

- [x] **Step 1: Update changelog**

Under `[Unreleased]` → `### Added`, after the UI Preview Planning Output entry, add:

```md
- **Runtime Drain Slice**：新增显式 runtime stream drain 路径，Workspace Core 可把 submitted AgentRun 的 AdapterStreamEvent 应用回 run/task/agent-run 状态，为 Codex CLI 真实闭环铺路。
```

- [x] **Step 2: Run focused verification**

Run:

```bash
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
pnpm --filter @cairn/application typecheck
pnpm --filter @cairn/workspace-core test -- app.spec.ts
pnpm --filter @cairn/workspace-core typecheck
pnpm exec markdownlint-cli2 CHANGELOG.md docs/superpowers/plans/2026-05-17-codex-runtime-drain.md
pnpm exec prettier --check packages/application/src/ports/runtime-gateway-port.ts packages/application/src/orchestration/orchestration-run-service.ts packages/application/src/orchestration/orchestration-run-service.spec.ts apps/workspace-core/src/runtime/mock-runtime-gateway-port.ts apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts apps/workspace-core/src/service/container.ts apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts CHANGELOG.md docs/superpowers/plans/2026-05-17-codex-runtime-drain.md
git diff --check
```

Expected: all commands exit `0`.

- [x] **Step 3: Commit docs**

Run:

```bash
git add CHANGELOG.md docs/superpowers/plans/2026-05-17-codex-runtime-drain.md
git commit -m "docs(runtime): 记录运行时事件流落库 / document runtime stream drain"
```

Expected: commit succeeds.
