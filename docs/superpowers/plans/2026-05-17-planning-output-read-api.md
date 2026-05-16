# Planning Output Read API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only Workspace Core API for retrieving an existing PlanningOutput by OrchestrationRun id.

**Architecture:** Shared contracts declare `GET /v1/runs/:runId/planning-output`. Workspace Core implements the route by reading the existing application repository; it does not create PlanningOutput, run the real Planner, or add UI/Desktop/Web code.

**Tech Stack:** TypeScript ESM, Zod, ts-rest contracts, Fastify route tests, Vitest.

---

## Scope Check

In scope:

- Add `getPlanningOutput` to `runContract`.
- Add contract tests for the route path and operation exposure.
- Add Workspace Core route `GET /v1/runs/:runId/planning-output`.
- Add route tests for invalid run id, missing run/planning output, and successful read.
- Update `docs/STATUS.md` and `CHANGELOG.md` if needed.

Out of scope:

- Do not implement a real Planner.
- Do not add write/start/complete/block/fail HTTP routes.
- Do not create Desktop or Web app code.
- Do not change PlanningOutput schema or persistence.

## File Structure

Modify these files:

- `packages/shared_contracts/src/contracts/run.contract.ts`
  - Adds the read endpoint to the public contract.
- `packages/shared_contracts/src/contracts/index.spec.ts`
  - Verifies operation exposure and path.
- `apps/workspace-core/src/service/app.ts`
  - Adds read-only route.
- `apps/workspace-core/src/service/app.spec.ts`
  - Tests success and error responses.
- `CHANGELOG.md`
  - Records the read API.

## Task 1: Shared Contract Endpoint

**Files:**

- Modify: `packages/shared_contracts/src/contracts/run.contract.ts`
- Modify: `packages/shared_contracts/src/contracts/index.spec.ts`

- [ ] **Step 1: Import PlanningOutput**

In `packages/shared_contracts/src/contracts/run.contract.ts`, add:

```ts
import { PlanningOutput } from '../schemas/planning-output.js';
```

near the other schema imports.

- [ ] **Step 2: Add contract operation**

In `runContract`, add this after `getRun` and before `startRun`:

```ts
    getPlanningOutput: {
      method: 'GET',
      path: '/runs/:runId/planning-output',
      pathParams: z.object({ runId: OrchestrationRunId }),
      summary: 'Get the PlanningOutput attached to a run',
      responses: {
        200: PlanningOutput,
        ...commonErrorResponses,
      },
    },
```

- [ ] **Step 3: Update contract tests**

In `packages/shared_contracts/src/contracts/index.spec.ts`, add `'getPlanningOutput'` to the `expected` array in `runContract exposes the full read path set`.

Add this test near the trace endpoint test:

```ts
it('getPlanningOutput path is the run planning output endpoint', () => {
  expect(runContract.getPlanningOutput.method).toBe('GET');
  expect(runContract.getPlanningOutput.path).toBe('/v1/runs/:runId/planning-output');
});
```

- [ ] **Step 4: Verify contracts**

Run:

```bash
pnpm --filter @cairn/shared-contracts test -- index.spec.ts
pnpm --filter @cairn/shared-contracts typecheck
```

Expected: both commands exit `0`.

- [ ] **Step 5: Commit contract**

Run:

```bash
git add packages/shared_contracts/src/contracts/run.contract.ts packages/shared_contracts/src/contracts/index.spec.ts
git commit -m "feat(contracts): 增加规划输出读取接口 / add planning output read endpoint"
```

Expected: commit succeeds.

## Task 2: Workspace Core Route

**Files:**

- Modify: `apps/workspace-core/src/service/app.ts`
- Modify: `apps/workspace-core/src/service/app.spec.ts`

- [ ] **Step 1: Add route tests**

In `apps/workspace-core/src/service/app.spec.ts`, add a test after `creates and reads a single-worker run`:

```ts
it('reads a PlanningOutput attached to a run', async () => {
  const container = createDefaultWorkspaceCoreContainer();
  const app = await createWorkspaceCoreApp({ container, logger: false });

  try {
    const createResponse = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ids.workspace}/runs`,
      payload: {
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'Plan task',
          brief: 'Create a planning output.',
        },
      },
    });
    const run = createResponse.json<{ orchestrationRunId: string }>();
    const output = await container.planningOutputs.startPlanning({
      runId: run.orchestrationRunId as never,
    });
    await container.planningOutputs.completePlanning({
      planningOutputId: output.planningOutputId,
      actionTree: [
        {
          actionId: 'inspect',
          title: 'Inspect repository',
          intent: 'Find relevant files.',
          status: 'ready',
          dependsOnActionIds: [],
        },
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/runs/${run.orchestrationRunId}/planning-output`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      planningOutputId: output.planningOutputId,
      orchestrationRunId: run.orchestrationRunId,
      status: 'ready',
      actionTree: [{ actionId: 'inspect' }],
    });
  } finally {
    await app.close();
  }
});
```

Add a missing response test after that:

```ts
it('returns 404 when a run has no PlanningOutput', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const createResponse = await app.inject({
      method: 'POST',
      url: `/v1/workspaces/${ids.workspace}/runs`,
      payload: {
        originEventId: ids.event,
        task: {
          taskKind: 'edit',
          title: 'No planning output',
          brief: 'Keep the run queued.',
        },
      },
    });
    const run = createResponse.json<{ orchestrationRunId: string }>();

    const response = await app.inject({
      method: 'GET',
      url: `/v1/runs/${run.orchestrationRunId}/planning-output`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  } finally {
    await app.close();
  }
});
```

Add an invalid id test:

```ts
it('returns 400 for invalid PlanningOutput route run ids', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/runs/not-a-ulid/planning-output',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'BAD_REQUEST' } });
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 2: Run route test and verify failure**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
```

Expected: fail because route is not implemented yet.

- [ ] **Step 3: Implement route**

In `apps/workspace-core/src/service/app.ts`, add this after `GET /v1/runs/:runId` and before `GET /v1/runs/:runId/tasks`:

```ts
app.get('/v1/runs/:runId/planning-output', async (request, reply) => {
  const runId = OrchestrationRunId.safeParse((request.params as Record<string, unknown>)['runId']);
  if (!runId.success) {
    return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
  }

  const run = await options.container.repository.getRun(runId.data);
  if (run === undefined) {
    return reply.code(404).send(toApiError('NOT_FOUND', 'Run not found.'));
  }

  const planningOutput = await options.container.repository.getPlanningOutputByRun(runId.data);
  if (planningOutput === undefined) {
    return reply.code(404).send(toApiError('NOT_FOUND', 'Planning output not found.'));
  }

  return reply.send(planningOutput);
});
```

- [ ] **Step 4: Verify workspace-core**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
pnpm --filter @cairn/workspace-core typecheck
```

Expected: both commands exit `0`.

- [ ] **Step 5: Commit route**

Run:

```bash
git add apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts
git commit -m "feat(workspace-core): 增加规划输出读取接口 / add planning output read route"
```

Expected: commit succeeds.

## Task 3: Changelog and Verification

**Files:**

- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update changelog**

Under `[Unreleased]` → `### Added`, add:

```md
- **Planning Output API**：新增 `GET /v1/runs/:runId/planning-output` 只读接口，供 UI / Desktop Shell 查看现有 PlanningOutput。
```

- [ ] **Step 2: Run focused verification**

Run:

```bash
pnpm --filter @cairn/shared-contracts test -- index.spec.ts
pnpm --filter @cairn/shared-contracts typecheck
pnpm --filter @cairn/workspace-core test -- app.spec.ts
pnpm --filter @cairn/workspace-core typecheck
pnpm exec markdownlint-cli2 CHANGELOG.md docs/superpowers/plans/2026-05-17-planning-output-read-api.md
pnpm exec prettier --check packages/shared_contracts/src/contracts/run.contract.ts packages/shared_contracts/src/contracts/index.spec.ts apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts CHANGELOG.md docs/superpowers/plans/2026-05-17-planning-output-read-api.md
git diff --check
```

Expected: all commands exit `0`.

- [ ] **Step 3: Commit changelog and plan**

Run:

```bash
git add CHANGELOG.md docs/superpowers/plans/2026-05-17-planning-output-read-api.md
git commit -m "docs(planning): 记录规划输出读取接口 / document planning output read api"
```

Expected: commit succeeds.
