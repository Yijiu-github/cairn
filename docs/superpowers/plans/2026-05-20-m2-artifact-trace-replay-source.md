# M2 Artifact / Trace Replay Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Inspector-ready Run Replay Source API and minimally harden local Artifact payload writes.

**Architecture:** Add shared-contract schemas for `RunReplayInspector` and `RunReplaySource`, then expose a Workspace Core aggregation endpoint at `GET /v1/runs/:runId/replay-source` using existing repository reads. Keep artifact payload content lazy-loaded through the existing payload API, and harden `LocalArtifactStore.writeText()` with same-directory temp writes followed by rename.

**Tech Stack:** TypeScript strict ESM, Zod, ts-rest contracts, Fastify route tests, Vitest, Node `fs/promises`, pnpm/Turborepo.

---

## Scope Check

This plan implements the approved spec at
`docs/superpowers/specs/2026-05-20-m2-artifact-trace-replay-source-design.md`.

In scope:

- `RunReplayInspector` and `RunReplaySource` schemas.
- `GET /v1/runs/:runId/replay-source` contract and Workspace Core route.
- Replay source aggregation from existing run/task/agent-run/artifact/trace repository methods.
- Local artifact payload atomic write hardening.
- Documentation status/changelog/design updates.

Out of scope:

- Desktop UI, Replay UI, or Browser validation.
- Artifact export/download API.
- Retention deletion.
- Hash/checksum fields or schema migration.
- Second runtime adapter.
- `apps/web`.
- RuntimeAdapter execution behavior changes.

## File Map

- Create: `packages/shared_contracts/src/schemas/run-replay-source.ts`
  - New schema file for replay source response objects.
- Create: `packages/shared_contracts/src/schemas/run-replay-source.spec.ts`
  - New schema tests.
- Modify: `packages/shared_contracts/src/schemas/index.ts`
  - Export the new schema.
- Modify: `packages/shared_contracts/src/contracts/run.contract.ts`
  - Add `getRunReplaySource`.
- Modify: `packages/shared_contracts/src/contracts/index.spec.ts`
  - Assert route presence and path.
- Modify: `apps/workspace-core/src/service/app.ts`
  - Add route, artifact sanitization reuse, inspector derivation helpers.
- Modify: `apps/workspace-core/src/service/app.spec.ts`
  - Add replay source success and error route tests.
- Modify: `apps/workspace-core/src/artifacts/local-artifact-store.ts`
  - Switch text writes to same-directory temp write then rename.
- Modify: `apps/workspace-core/src/artifacts/local-artifact-store.spec.ts`
  - Add atomic write and unsafe payload ref tests.
- Modify: `docs/design/r1-codex-e2e-artifact-trace.md`
  - Document replay source and atomic payload boundary.
- Modify: `docs/STATUS.md`
  - Update M2 status without overclaiming export/hash/retention/UI.
- Modify: `CHANGELOG.md`
  - Add M2 replay source and artifact store hardening entry.

---

## Task 1: Shared Replay Source Contract

**Files:**

- Create: `packages/shared_contracts/src/schemas/run-replay-source.ts`
- Create: `packages/shared_contracts/src/schemas/run-replay-source.spec.ts`
- Modify: `packages/shared_contracts/src/schemas/index.ts`
- Modify: `packages/shared_contracts/src/contracts/run.contract.ts`
- Modify: `packages/shared_contracts/src/contracts/index.spec.ts`

- [ ] **Step 1: Create the failing schema test**

Create `packages/shared_contracts/src/schemas/run-replay-source.spec.ts`:

```ts
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { RunReplayInspector, RunReplaySource } from './run-replay-source.js';

const now = '2026-05-20T00:00:00.000Z';

const run = {
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  workspaceId: VALID_ULIDS.workspace,
  originEventId: VALID_ULIDS.event,
  status: 'succeeded' as const,
  executionMode: 'single_worker' as const,
  finalResponseRef: VALID_ULIDS.artifact,
  hasPartialFailures: false,
  resultCompleteness: 'complete' as const,
  completionLevel: 'fully_done' as const,
  startedAt: now,
  finishedAt: '2026-05-20T00:00:02.000Z',
  traceId: VALID_ULIDS.traceId,
  createdAt: now,
  updatedAt: '2026-05-20T00:00:02.000Z',
};

const task = {
  taskId: VALID_ULIDS.task,
  workspaceId: VALID_ULIDS.workspace,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  taskKind: 'edit' as const,
  title: 'Apply patch',
  brief: 'Update the target module.',
  status: 'succeeded' as const,
  priority: 50,
  attempt: 0,
  idempotencyKey: `${VALID_ULIDS.task}:0`,
  dependsOnTaskIds: [],
  contextRefs: [],
  artifactRefs: [VALID_ULIDS.artifact],
  createdAt: now,
  updatedAt: '2026-05-20T00:00:02.000Z',
};

const agentRun = {
  runId: VALID_ULIDS.agentRun,
  workspaceId: VALID_ULIDS.workspace,
  taskId: VALID_ULIDS.task,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  runtimeType: 'codex',
  runtimeModel: 'default',
  status: 'succeeded' as const,
  attempt: 0,
  startedAt: now,
  finishedAt: '2026-05-20T00:00:02.000Z',
  retryable: false,
  cancelable: false,
  outputRef: VALID_ULIDS.artifact,
  traceId: VALID_ULIDS.traceId,
  createdAt: now,
  updatedAt: '2026-05-20T00:00:02.000Z',
};

const artifact = {
  artifactId: VALID_ULIDS.artifact,
  workspaceId: VALID_ULIDS.workspace,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  taskId: VALID_ULIDS.task,
  runId: VALID_ULIDS.agentRun,
  artifactRole: 'output' as const,
  kind: 'text' as const,
  formatVersion: 'text.v1',
  uriOrPath: 'artifact-payload://workspace/run/artifact/final-response.txt',
  contentType: 'text/plain',
  sizeBytes: 24,
  payloadRef: 'artifact-payload://workspace/run/artifact/final-response.txt',
  sensitivity: 'none' as const,
  producerType: 'agent' as const,
  producerId: VALID_ULIDS.agentRun,
  visibility: 'public' as const,
  createdAt: '2026-05-20T00:00:02.000Z',
};

const traceEvent = {
  traceEventId: VALID_ULIDS.traceEvent,
  workspaceId: VALID_ULIDS.workspace,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  taskId: VALID_ULIDS.task,
  runId: VALID_ULIDS.agentRun,
  eventType: 'run.succeeded',
  level: 'info' as const,
  payloadInline: { artifactId: VALID_ULIDS.artifact },
  createdAt: '2026-05-20T00:00:02.000Z',
  traceId: VALID_ULIDS.traceId,
};

describe('RunReplayInspector', () => {
  it('accepts inspector summary fields used by Run Detail', () => {
    const parsed = RunReplayInspector.parse({
      status: 'succeeded',
      taskCount: 1,
      agentRunCount: 1,
      artifactCount: 1,
      traceEventCount: 1,
      errorEventCount: 0,
      warningEventCount: 0,
      finalArtifactId: VALID_ULIDS.artifact,
      startedAt: now,
      completedAt: '2026-05-20T00:00:02.000Z',
      durationMs: 2000,
    });

    expect(parsed.durationMs).toBe(2000);
  });
});

describe('RunReplaySource', () => {
  it('accepts an Inspector-ready replay source snapshot', () => {
    const parsed = RunReplaySource.parse({
      run,
      tasks: [task],
      agentRuns: [agentRun],
      artifacts: [artifact],
      traceEvents: [traceEvent],
      inspector: {
        status: 'succeeded',
        taskCount: 1,
        agentRunCount: 1,
        artifactCount: 1,
        traceEventCount: 1,
        errorEventCount: 0,
        warningEventCount: 0,
        finalArtifactId: VALID_ULIDS.artifact,
        startedAt: now,
        completedAt: '2026-05-20T00:00:02.000Z',
        durationMs: 2000,
      },
    });

    expect(parsed.artifacts[0]?.payloadRef).toMatch(/^artifact-payload:\/\//u);
  });
});
```

- [ ] **Step 2: Run the schema test and verify it fails**

Run:

```bash
pnpm --filter @cairn/shared-contracts test -- src/schemas/run-replay-source.spec.ts
```

Expected: fails because `./run-replay-source.js` does not exist.

- [ ] **Step 3: Add the replay source schema**

Create `packages/shared_contracts/src/schemas/run-replay-source.ts`:

```ts
// SPDX-License-Identifier: Apache-2.0
/**
 * RunReplaySource：Run Detail Inspector 的只读证据包。
 *
 * Replay 仅表示从 TraceEvent / Artifact 重建 UI 视图，不表示重新执行 runtime。
 */

import { z } from 'zod';

import { AgentRun } from './agent-run.js';
import { Artifact } from './artifact.js';
import { Iso8601 } from './common.js';
import { ArtifactId, TraceEventId } from './ids.js';
import { OrchestrationRun, OrchestrationRunStatus } from './orchestration-run.js';
import { Task } from './task.js';
import { TraceEvent } from './trace-event.js';

export const RunReplayInspector = z.object({
  status: OrchestrationRunStatus,
  taskCount: z.number().int().nonnegative(),
  agentRunCount: z.number().int().nonnegative(),
  artifactCount: z.number().int().nonnegative(),
  traceEventCount: z.number().int().nonnegative(),
  errorEventCount: z.number().int().nonnegative(),
  warningEventCount: z.number().int().nonnegative(),
  finalArtifactId: ArtifactId.optional(),
  firstFailureEventId: TraceEventId.optional(),
  firstFailureEventType: z.string().min(1).optional(),
  startedAt: Iso8601.optional(),
  completedAt: Iso8601.optional(),
  durationMs: z.number().int().nonnegative().optional(),
});
export type RunReplayInspector = z.infer<typeof RunReplayInspector>;

export const RunReplaySource = z.object({
  run: OrchestrationRun,
  tasks: z.array(Task),
  agentRuns: z.array(AgentRun),
  artifacts: z.array(Artifact),
  traceEvents: z.array(TraceEvent),
  inspector: RunReplayInspector,
});
export type RunReplaySource = z.infer<typeof RunReplaySource>;
```

- [ ] **Step 4: Export the new schema**

Add this line to `packages/shared_contracts/src/schemas/index.ts`:

```ts
export * from './run-replay-source.js';
```

- [ ] **Step 5: Add the contract test**

Modify `packages/shared_contracts/src/contracts/index.spec.ts`.

Add `getRunReplaySource` to the expected `runContract` operation list:

```ts
      'getRunReplaySource',
```

Add this test inside `describe('runContract', () => { ... })`:

```ts
it('getRunReplaySource path is the Inspector-ready replay source endpoint', () => {
  expect(runContract.getRunReplaySource.method).toBe('GET');
  expect(runContract.getRunReplaySource.path).toBe('/v1/runs/:runId/replay-source');
});
```

- [ ] **Step 6: Run the contract test and verify it fails**

Run:

```bash
pnpm --filter @cairn/shared-contracts test -- src/contracts/index.spec.ts
```

Expected: fails because `runContract.getRunReplaySource` is not defined.

- [ ] **Step 7: Add the contract route**

Modify `packages/shared_contracts/src/contracts/run.contract.ts`.

Add this import:

```ts
import { RunReplaySource } from '../schemas/run-replay-source.js';
```

Add this route after `getRun` and before `getPlanningOutput`:

```ts
    getRunReplaySource: {
      method: 'GET',
      path: '/runs/:runId/replay-source',
      pathParams: z.object({ runId: OrchestrationRunId }),
      summary: 'Get an Inspector-ready replay source for a run',
      responses: {
        200: RunReplaySource,
        ...commonErrorResponses,
      },
    },
```

- [ ] **Step 8: Run shared contract focused tests**

Run:

```bash
pnpm --filter @cairn/shared-contracts test -- src/schemas/run-replay-source.spec.ts src/contracts/index.spec.ts
```

Expected: both test files pass.

- [ ] **Step 9: Commit shared contract changes**

Run:

```bash
git add packages/shared_contracts/src/schemas/run-replay-source.ts \
  packages/shared_contracts/src/schemas/run-replay-source.spec.ts \
  packages/shared_contracts/src/schemas/index.ts \
  packages/shared_contracts/src/contracts/run.contract.ts \
  packages/shared_contracts/src/contracts/index.spec.ts
git commit -m "feat(contracts): 新增 run replay source 契约 / add run replay source contract"
```

Expected: one commit containing only shared-contract changes.

---

## Task 2: Workspace Core Replay Source Endpoint

**Files:**

- Modify: `apps/workspace-core/src/service/app.ts`
- Modify: `apps/workspace-core/src/service/app.spec.ts`

- [ ] **Step 1: Add the failing success route test**

In `apps/workspace-core/src/service/app.spec.ts`, add this test near the existing artifact / trace read tests:

```ts
it('returns an Inspector-ready replay source after runtime drain', async () => {
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

    const response = await app.inject({
      method: 'GET',
      url: `/v1/runs/${runId}/replay-source`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      run: { orchestrationRunId: string; status: string; finalResponseRef?: string };
      tasks: { taskId: string }[];
      agentRuns: { runId: string; taskId: string; outputRef?: string }[];
      artifacts: { artifactId: string; uriOrPath: string; payloadRef?: string }[];
      traceEvents: { traceEventId: string; eventType: string; level: string; createdAt: string }[];
      inspector: {
        status: string;
        taskCount: number;
        agentRunCount: number;
        artifactCount: number;
        traceEventCount: number;
        errorEventCount: number;
        warningEventCount: number;
        finalArtifactId?: string;
        startedAt?: string;
        completedAt?: string;
        durationMs?: number;
      };
    }>();

    expect(body.run).toMatchObject({
      orchestrationRunId: runId,
      status: 'succeeded',
    });
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0]).toMatchObject({ taskId });
    expect(body.agentRuns).toEqual([expect.objectContaining({ runId: agentRun.runId, taskId })]);
    expect(body.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactId: body.run.finalResponseRef,
          uriOrPath: expect.stringMatching(/^artifact-payload:\/\//u) as unknown,
          payloadRef: expect.stringMatching(/^artifact-payload:\/\//u) as unknown,
        }),
      ]),
    );
    expect(body.traceEvents.map((event) => event.eventType)).toContain('run.succeeded');
    expect(body.traceEvents.map((event) => event.createdAt)).toEqual(
      body.traceEvents.map((event) => event.createdAt).toSorted(),
    );
    expect(body.inspector).toMatchObject({
      status: 'succeeded',
      taskCount: 1,
      agentRunCount: 1,
      artifactCount: body.artifacts.length,
      traceEventCount: body.traceEvents.length,
      errorEventCount: 0,
      warningEventCount: 0,
      finalArtifactId: body.run.finalResponseRef,
    });
    expect(body.inspector.durationMs).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(body)).not.toContain('/Users/');
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 2: Add failing error route tests**

In `apps/workspace-core/src/service/app.spec.ts`, add:

```ts
it('returns 400 for invalid replay source run ids', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/runs/not-a-ulid/replay-source',
    });

    expect(response.statusCode).toBe(400);
  } finally {
    await app.close();
  }
});

it('returns 404 when replay source run is missing', async () => {
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer(),
    logger: false,
  });

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/runs/01HZZZZZZZZZZZZZZZZZZZZZF1/replay-source',
    });

    expect(response.statusCode).toBe(404);
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts
```

Expected: replay source tests fail with 404 because the route does not exist.

- [ ] **Step 4: Add app imports and helper types**

Modify `apps/workspace-core/src/service/app.ts`.

Add `TraceEventId` to the existing schema value imports:

```ts
  TraceEventId,
```

Replace the existing single-line Artifact type import:

```ts
import type { Artifact } from '@cairn/shared-contracts/schemas';
```

with this multiline type import:

```ts
import type {
  AgentRun,
  Artifact,
  OrchestrationRun,
  RunReplayInspector,
  Task,
  TraceEvent,
} from '@cairn/shared-contracts/schemas';
```

- [ ] **Step 5: Add inspector derivation helpers**

In `apps/workspace-core/src/service/app.ts`, place these helpers near `sanitizeArtifactForResponse`:

```ts
const isFailureTraceEvent = (event: TraceEvent): boolean =>
  event.level === 'error' ||
  event.eventType.endsWith('.failed') ||
  event.eventType.endsWith('.timeout') ||
  event.eventType.endsWith('.cancelled');

const toEpochMillis = (iso: string | undefined): number | undefined => {
  if (iso === undefined) {
    return undefined;
  }

  const time = Date.parse(iso);
  return Number.isNaN(time) ? undefined : time;
};

const maybeDurationMs = (
  startedAt: string | undefined,
  completedAt: string | undefined,
): number | undefined => {
  const started = toEpochMillis(startedAt);
  const completed = toEpochMillis(completedAt);

  if (started === undefined || completed === undefined || completed < started) {
    return undefined;
  }

  return completed - started;
};

const createRunReplayInspector = (
  run: OrchestrationRun,
  tasks: readonly Task[],
  agentRuns: readonly AgentRun[],
  artifacts: readonly Artifact[],
  traceEvents: readonly TraceEvent[],
): RunReplayInspector => {
  const firstFailure = traceEvents.find(isFailureTraceEvent);
  const fallbackFinalArtifact = artifacts.find((artifact) => artifact.artifactRole === 'output');
  const finalArtifactId = run.finalResponseRef ?? fallbackFinalArtifact?.artifactId;
  const startedAt = run.startedAt ?? traceEvents[0]?.createdAt;
  const isTerminalRun = (['succeeded', 'failed', 'cancelled', 'timeout'] as const).includes(
    run.status,
  );
  const completedAt = run.finishedAt ?? (isTerminalRun ? traceEvents.at(-1)?.createdAt : undefined);
  const durationMs = maybeDurationMs(startedAt, completedAt);

  return {
    status: run.status,
    taskCount: tasks.length,
    agentRunCount: agentRuns.length,
    artifactCount: artifacts.length,
    traceEventCount: traceEvents.length,
    errorEventCount: traceEvents.filter((event) => event.level === 'error').length,
    warningEventCount: traceEvents.filter((event) => event.level === 'warn').length,
    ...(finalArtifactId === undefined ? {} : { finalArtifactId }),
    ...(firstFailure === undefined
      ? {}
      : {
          firstFailureEventId: firstFailure.traceEventId as TraceEventId,
          firstFailureEventType: firstFailure.eventType,
        }),
    ...(startedAt === undefined ? {} : { startedAt }),
    ...(completedAt === undefined ? {} : { completedAt }),
    ...(durationMs === undefined ? {} : { durationMs }),
  };
};
```

- [ ] **Step 6: Add the replay source route**

In `apps/workspace-core/src/service/app.ts`, add this route after `GET /v1/runs/:runId` and before `GET /v1/runs/:runId/artifacts`:

```ts
app.get('/v1/runs/:runId/replay-source', async (request, reply) => {
  const runId = OrchestrationRunId.safeParse((request.params as Record<string, unknown>)['runId']);
  if (!runId.success) {
    return reply.code(400).send(toApiError('BAD_REQUEST', 'Invalid run id.', runId.error.issues));
  }

  const run = await options.container.repository.getRun(runId.data);
  if (run === undefined) {
    return reply.code(404).send(toApiError('NOT_FOUND', 'Run not found.'));
  }

  const tasks = await options.container.repository.listTasksByRun(runId.data);
  const agentRuns = (
    await Promise.all(
      tasks.map((task) => options.container.repository.listAgentRunsByTask(task.taskId)),
    )
  ).flat();
  const artifacts = await options.container.repository.listArtifactsByRun(runId.data);
  const traceEvents = await options.container.repository.listTraceEventsByRun(runId.data);
  const sanitizedArtifacts = artifacts.map((artifact) => sanitizeArtifactForResponse(artifact));

  return reply.send({
    run,
    tasks,
    agentRuns,
    artifacts: sanitizedArtifacts,
    traceEvents,
    inspector: createRunReplayInspector(run, tasks, agentRuns, sanitizedArtifacts, traceEvents),
  });
});
```

- [ ] **Step 7: Run Workspace Core focused tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts
```

Expected: tests pass.

- [ ] **Step 8: Run typecheck for route helper typing**

Run:

```bash
pnpm --filter @cairn/workspace-core typecheck
```

Expected: exits 0.

- [ ] **Step 9: Commit Workspace Core route changes**

Run:

```bash
git add apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts
git commit -m "feat(core): 新增 run replay source API / add run replay source API"
```

Expected: one commit containing only Workspace Core route/test changes.

---

## Task 3: Local Artifact Store Atomic Writes

**Files:**

- Modify: `apps/workspace-core/src/artifacts/local-artifact-store.ts`
- Modify: `apps/workspace-core/src/artifacts/local-artifact-store.spec.ts`

- [ ] **Step 1: Add the failing temp-file cleanup test**

Modify `apps/workspace-core/src/artifacts/local-artifact-store.spec.ts`.

Update the `node:fs/promises` import to include `readdir`:

```ts
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
```

Add this test after the first write/read test:

```ts
it('writes payloads through a same-directory temp file and leaves only the final file', async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
  tempDirectories.push(rootDir);
  const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

  const write = await store.writeText({
    artifactId: '01J000000000000000000000A1' as ArtifactId,
    workspaceId: '01J000000000000000000000W1' as WorkspaceId,
    orchestrationRunId: '01J000000000000000000000R1' as OrchestrationRunId,
    filename: 'runtime-output.txt',
    mediaType: 'text/plain',
    text: 'atomic hello',
    maxBytes: 1024,
  });

  const relativePath = write.payloadRef.slice('artifact-payload://'.length);
  const finalDirectory = path.join(rootDir, path.dirname(relativePath));
  const entries = await readdir(finalDirectory);

  expect(entries).toEqual(['runtime-output.txt']);
  await expect(store.readText(write.payloadRef)).resolves.toMatchObject({
    text: 'atomic hello',
  });
});
```

- [ ] **Step 2: Add explicit unsafe ref tests**

Add this test after `rejects dot segment payload refs`:

```ts
it('rejects absolute-path and empty-segment payload refs', async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-artifacts-'));
  tempDirectories.push(rootDir);
  const store = new LocalArtifactStore({ rootDir, maxInlineBytes: 1024 });

  await expect(
    store.readText('artifact-payload:///Users/alice/project/output.txt'),
  ).rejects.toThrow('Invalid artifact payload reference.');
  await expect(store.readText('artifact-payload://workspace//artifact/file.txt')).rejects.toThrow(
    'Invalid artifact payload reference.',
  );
});
```

- [ ] **Step 3: Run artifact store focused tests and verify failure**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/artifacts/local-artifact-store.spec.ts
```

Expected: temp-file test fails because current write path writes the final file directly or does not guarantee the temp-file behavior asserted by the test.

- [ ] **Step 4: Implement same-directory temp write and rename**

Modify `apps/workspace-core/src/artifacts/local-artifact-store.ts`.

Update the `node:fs/promises` import:

```ts
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
```

Replace the final write block in `writeText()`:

```ts
await mkdir(path.dirname(absolutePath), { recursive: true });
await writeFile(absolutePath, storedBytes);
```

with:

```ts
const directory = path.dirname(absolutePath);
const temporaryPath = path.join(
  directory,
  `.${path.basename(absolutePath)}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`,
);

await mkdir(directory, { recursive: true });
try {
  await writeFile(temporaryPath, storedBytes);
  await rename(temporaryPath, absolutePath);
} catch (error) {
  await rm(temporaryPath, { force: true });
  throw error;
}
```

- [ ] **Step 5: Run artifact store focused tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/artifacts/local-artifact-store.spec.ts
```

Expected: tests pass.

- [ ] **Step 6: Run Workspace Core package tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test
```

Expected: all Workspace Core tests pass.

- [ ] **Step 7: Commit artifact store hardening**

Run:

```bash
git add apps/workspace-core/src/artifacts/local-artifact-store.ts \
  apps/workspace-core/src/artifacts/local-artifact-store.spec.ts
git commit -m "fix(artifacts): 原子写入本地 payload / atomically write local payloads"
```

Expected: one commit containing only artifact store changes.

---

## Task 4: Evidence Documentation Updates

**Files:**

- Modify: `docs/design/r1-codex-e2e-artifact-trace.md`
- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Inspect current evidence-layer language**

Run:

```bash
rg -n "replay source|TraceEvent replay|Artifact store|payload|导出|retention|hash|M2" docs/design/r1-codex-e2e-artifact-trace.md docs/STATUS.md CHANGELOG.md
```

Expected: output shows where to insert M2 status and where to avoid overclaiming export/hash/retention.

- [ ] **Step 2: Update the R1 Artifact / Trace design doc**

Modify `docs/design/r1-codex-e2e-artifact-trace.md`.

Add this section after the existing API/read surface discussion near the current read API section:

```md
### M2 Replay Source API

M2 新增 `GET /v1/runs/:runId/replay-source` 作为 Run Detail Inspector 的证据包入口。
它聚合 OrchestrationRun、Task、AgentRun、Artifact metadata、TraceEvent timeline 与轻量
inspector 摘要，用于从已有 TraceEvent / Artifact 重建视图。

Replay Source 不调用 RuntimeAdapter，不提交新 Task，不重新执行 Codex，也不内联 artifact
正文。Artifact 内容仍通过 `GET /v1/artifacts/:artifactId/payload` 懒加载。
```

Add this section near the current Artifact Store boundary section:

```md
### M2 Local Artifact Payload Boundary

M2 的本地 artifact payload 写入采用同目录临时文件 + rename 的方式，避免 DB/API 指向半写入文件。
`artifact-payload://...` 仍是 opaque reference，不是本地路径；读取端只接受安全 segment，
拒绝绝对路径、空 segment 与路径穿越。

R1/M2 默认保留 payload 文件。hash 校验、导出、清理与 retention API 留到后续里程碑。
```

- [ ] **Step 3: Update `docs/STATUS.md`**

In `docs/STATUS.md`, add or update the current capability language so it says:

```md
- Artifact / Trace replay source M2：Workspace Core 提供 Inspector-ready replay source，聚合 run/task/agent-run/artifact metadata/trace timeline 与轻量摘要；artifact payload 仍通过 bounded payload API 懒加载。
- Local Artifact Store M2：本地 payload 写入采用同目录临时文件 + rename，payload ref 保持 opaque 且不暴露本地路径。
```

In R1 unfinished capabilities, keep export/hash/retention/UI explicit as unfinished:

```md
- Artifact store 的导出、清理/retention、hash 校验与更完整 review metadata。
- TraceEvent replay UI。
```

Do not claim Desktop has real Run Detail integration.

- [ ] **Step 4: Update `CHANGELOG.md`**

Under `[Unreleased]` / `Added`, add:

```md
- **M2 Artifact / Trace evidence**：新增 Inspector-ready Run Replay Source 设计与实现，聚合 run/task/agent-run/artifact metadata/trace timeline 与轻量摘要，供后续 Run Detail / Desktop 观察台消费。
```

Under `[Unreleased]` / `Fixed`, add:

```md
- **Local Artifact Store**：本地 payload 写入改为同目录临时文件 + rename，避免读取到半写入 artifact payload。
```

- [ ] **Step 5: Verify documentation formatting**

Run:

```bash
pnpm exec markdownlint-cli2 docs/design/r1-codex-e2e-artifact-trace.md docs/STATUS.md CHANGELOG.md
pnpm exec prettier --check docs/design/r1-codex-e2e-artifact-trace.md docs/STATUS.md CHANGELOG.md
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit documentation updates**

Run:

```bash
git add docs/design/r1-codex-e2e-artifact-trace.md docs/STATUS.md CHANGELOG.md
git commit -m "docs(evidence): 更新 M2 replay source 状态 / update M2 replay source status"
```

Expected: one docs-only commit.

---

## Task 5: Targeted And Full Verification

**Files:**

- Read: `package.json`
- Read: changed files from Tasks 1-4

- [ ] **Step 1: Run targeted package verification**

Run:

```bash
pnpm --filter @cairn/shared-contracts test
pnpm --filter @cairn/workspace-core test
```

Expected: both package suites exit 0.

- [ ] **Step 2: Run repository verification gates**

Run:

```bash
pnpm run check
pnpm test
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Inspect final state**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: working tree is clean, and the M2 implementation commits are visible at the top of the branch.

- [ ] **Step 4: Prepare final implementation report**

Report:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Implemented:
- Contract proof: RunReplaySource schema and runContract route
- Workspace Core proof: replay source route aggregates run/tasks/agentRuns/artifacts/traceEvents/inspector
- Artifact Store proof: local payload writes use temp file + rename and reject unsafe refs
- Documentation proof: design/status/changelog updated without overclaiming export/hash/retention/UI
Verification:
- pnpm --filter @cairn/shared-contracts test: pass/fail
- pnpm --filter @cairn/workspace-core test: pass/fail
- pnpm run check: pass/fail
- pnpm test: pass/fail
- git diff --check: pass/fail
Commits:
- commit SHA and subject for each M2 implementation commit
Concerns:
- any remaining manual or future-scope items
```

Expected: the next reviewer can distinguish implemented replay evidence from deferred UI/export/hash/retention work.
