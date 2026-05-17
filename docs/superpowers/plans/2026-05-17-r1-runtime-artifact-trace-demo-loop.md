# R1 Runtime Artifact Trace Demo Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first backend-first runtime demo loop: submit a Task to runtime, persist input/output artifacts behind opaque payload references, drain runtime events into durable state and TraceEvents, and expose bounded artifact payload reads.

**Architecture:** Extend shared contracts first, then application ports/services, then repository adapters, then Workspace Core routes. Keep Desktop static and keep drain explicit; use mock runtime for automated tests and make real Codex execution an opt-in smoke path.

**Tech Stack:** TypeScript strict ESM, Zod schemas, ts-rest contracts, Fastify Workspace Core, SQLite repository, Vitest, existing RuntimeGatewayPort and Codex adapter primitives.

---

## File Map

- Modify `packages/shared_contracts/src/schemas/artifact.ts`: add optional payload reference and sensitivity metadata.
- Modify `packages/shared_contracts/src/contracts/run.contract.ts`: add submit task runtime route and artifact payload read route.
- Modify `packages/shared_contracts/src/contracts/index.spec.ts`: assert the new routes are exported.
- Add `packages/shared_contracts/src/schemas/artifact-payload.spec.ts`: schema coverage for bounded payload responses if colocated schema is added to `artifact.ts`.
- Modify `packages/application/src/ports/artifact-store-port.ts`: define bounded write/read artifact payload operations.
- Modify `packages/application/src/ports/run-repository.ts`: add artifact create/update port if missing.
- Modify `packages/application/src/testing/memory-run-repository.ts`: implement artifact create/update behavior.
- Modify `packages/application/src/orchestration/orchestration-run-service.ts`: create input artifact before submit and output/error artifacts during drain.
- Modify `packages/application/src/orchestration/orchestration-run-service.spec.ts`: cover submit/drain artifact + trace behavior with mock runtime.
- Modify `apps/workspace-core/src/storage/sqlite-application-repository.ts`: persist artifact metadata creation/update.
- Modify `apps/workspace-core/src/storage/sqlite-application-repository.spec.ts`: cover artifact metadata persistence and readback.
- Add `apps/workspace-core/src/artifacts/local-artifact-store.ts`: local bounded filesystem payload store.
- Modify `apps/workspace-core/src/service/container.ts`: wire artifact store into application services.
- Modify `apps/workspace-core/src/service/app.ts`: add submit runtime and payload read routes.
- Modify `apps/workspace-core/src/service/app.spec.ts`: route-level tests for submit, drain, artifact list, trace list, payload read.
- Modify `docs/contracts/runtime-adapter.md`: document explicit drain demo-loop behavior if route semantics change.
- Modify `docs/STATUS.md`, `CHANGELOG.md`: update status after implementation.

---

### Task 1: Shared Contract Surface

**Files:**

- Modify: `packages/shared_contracts/src/schemas/artifact.ts`
- Modify: `packages/shared_contracts/src/contracts/run.contract.ts`
- Modify: `packages/shared_contracts/src/contracts/index.spec.ts`
- Test: `packages/shared_contracts/src/schemas/artifact.spec.ts` or create if absent

- [ ] **Step 1: Inspect existing artifact schema and run contract**

Run:

```bash
sed -n '1,220p' packages/shared_contracts/src/schemas/artifact.ts
sed -n '1,260p' packages/shared_contracts/src/contracts/run.contract.ts
```

Expected: identify current `Artifact` fields and existing run route naming style.

- [ ] **Step 2: Add failing schema tests for artifact payload metadata**

Create or modify `packages/shared_contracts/src/schemas/artifact.spec.ts` with tests equivalent to:

```ts
import { describe, expect, it } from 'vitest';

import { artifactSchema, artifactPayloadResponseSchema } from './artifact.js';

import type { Artifact } from './artifact.js';

describe('artifactSchema payload metadata', () => {
  it('accepts opaque payload references without raw filesystem paths', () => {
    const artifact = artifactSchema.parse({
      artifactId: 'artifact_01J00000000000000000000000',
      workspaceId: 'workspace_01J0000000000000000000000',
      orchestrationRunId: 'run_01J000000000000000000000000',
      kind: 'log',
      title: 'Runtime output',
      summary: 'Bounded runtime output.',
      reviewState: 'pending_review',
      payloadRef: 'artifact-payload://workspace/run/artifact/runtime-output.txt',
      sensitivity: 'none',
      createdAt: '2026-05-17T00:00:00.000Z',
      updatedAt: '2026-05-17T00:00:00.000Z',
    } satisfies Artifact);

    expect(artifact.payloadRef).toBe(
      'artifact-payload://workspace/run/artifact/runtime-output.txt',
    );
  });

  it('rejects inline payload responses above the bounded text limit', () => {
    expect(() =>
      artifactPayloadResponseSchema.parse({
        artifactId: 'artifact_01J00000000000000000000000',
        mediaType: 'text/plain',
        text: 'x'.repeat(262_145),
        truncated: false,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 3: Run schema test and verify failure**

Run:

```bash
pnpm --filter @cairn/shared-contracts test -- artifact.spec.ts
```

Expected: FAIL because `payloadRef`, `sensitivity`, or `artifactPayloadResponseSchema` does not exist yet.

- [ ] **Step 4: Implement artifact payload schemas**

In `packages/shared_contracts/src/schemas/artifact.ts`, add:

```ts
export const artifactSensitivitySchema = z.enum(['none', 'local_path', 'secret_risk']);

export const artifactPayloadRefSchema = z
  .string()
  .min(1)
  .startsWith('artifact-payload://')
  .refine((value) => !value.includes('..'), 'payloadRef must not contain path traversal');

export const artifactPayloadResponseSchema = z.object({
  artifactId: artifactIdSchema,
  mediaType: z.enum(['text/plain', 'application/json']),
  text: z.string().max(262_144),
  truncated: z.boolean(),
});
```

Extend `artifactSchema` with optional fields:

```ts
payloadRef: artifactPayloadRefSchema.optional(),
sensitivity: artifactSensitivitySchema.default('none'),
```

Export inferred types:

```ts
export type ArtifactPayloadResponse = z.infer<typeof artifactPayloadResponseSchema>;
export type ArtifactSensitivity = z.infer<typeof artifactSensitivitySchema>;
```

- [ ] **Step 5: Add run contract routes**

In `packages/shared_contracts/src/contracts/run.contract.ts`, add Zod request/response schemas:

```ts
const submitTaskRuntimeRequestSchema = z.object({
  runtimeType: z.literal('codex'),
  model: z.string().min(1).default('default'),
  prompt: z.string().min(1).max(32_000),
  timeoutMs: z.number().int().positive().max(600_000).optional(),
  options: z.record(z.unknown()).optional(),
});

const submitTaskRuntimeResponseSchema = z.object({
  agentRunId: agentRunIdSchema,
  taskId: taskIdSchema,
  orchestrationRunId: orchestrationRunIdSchema,
  status: z.literal('submitted'),
  providerRunId: z.string().optional(),
});
```

Add routes following existing contract style:

```ts
submitTaskToRuntime: {
  method: 'POST',
  path: '/v1/tasks/:taskId/agent-runs',
  pathParams: z.object({ taskId: taskIdSchema }),
  body: submitTaskRuntimeRequestSchema,
  responses: {
    201: submitTaskRuntimeResponseSchema,
    400: apiErrorResponseSchema,
    404: apiErrorResponseSchema,
    409: apiErrorResponseSchema,
    503: apiErrorResponseSchema,
  },
},
getArtifactPayload: {
  method: 'GET',
  path: '/v1/artifacts/:artifactId/payload',
  pathParams: z.object({ artifactId: artifactIdSchema }),
  responses: {
    200: artifactPayloadResponseSchema,
    404: apiErrorResponseSchema,
    413: apiErrorResponseSchema,
    415: apiErrorResponseSchema,
  },
},
```

- [ ] **Step 6: Run shared contract tests**

Run:

```bash
pnpm --filter @cairn/shared-contracts test
```

Expected: PASS.

- [ ] **Step 7: Commit shared contracts**

Run:

```bash
git add packages/shared_contracts/src/schemas/artifact.ts packages/shared_contracts/src/schemas/artifact.spec.ts packages/shared_contracts/src/contracts/run.contract.ts packages/shared_contracts/src/contracts/index.spec.ts
git commit -m "feat(contracts): 增加 runtime artifact trace 闭环契约 / add runtime artifact trace loop contracts"
```

---

### Task 2: Artifact Store Port And Application Loop

**Files:**

- Modify: `packages/application/src/ports/artifact-store-port.ts`
- Modify: `packages/application/src/ports/run-repository.ts`
- Modify: `packages/application/src/testing/memory-run-repository.ts`
- Modify: `packages/application/src/orchestration/orchestration-run-service.ts`
- Test: `packages/application/src/orchestration/orchestration-run-service.spec.ts`

- [ ] **Step 1: Add failing application tests**

In `packages/application/src/orchestration/orchestration-run-service.spec.ts`, add tests for:

```ts
it('creates an input artifact before submitting a ready task to runtime', async () => {
  const harness = createHarness();
  const { task } = await harness.service.createSingleWorkerRun(createRunInput());

  await harness.service.submitTaskToRuntime({
    taskId: task.taskId,
    runtimeType: 'codex',
    model: 'default',
    prompt: 'Summarize this workspace.',
  });

  const artifacts = await harness.repository.listArtifactsByRun(task.orchestrationRunId);
  expect(artifacts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'log',
        title: 'Runtime input',
        payloadRef: expect.stringMatching(/^artifact-payload:\/\//u),
      }),
    ]),
  );
});

it('drains runtime output into artifact metadata and trace events', async () => {
  const harness = createHarness({
    runtimeEvents: [
      { type: 'queued', at: 1 },
      { type: 'started', at: 2, providerRunId: 'codex-run-1' },
      { type: 'token', at: 3, delta: 'hello' },
      {
        type: 'succeeded',
        at: 4,
        finalArtifactRef: { artifactId: 'artifact_01J00000000000000000000001' },
      },
    ],
  });
  const { task } = await harness.service.createSingleWorkerRun(createRunInput());
  const { agentRun } = await harness.service.submitTaskToRuntime({
    taskId: task.taskId,
    runtimeType: 'codex',
    model: 'default',
    prompt: 'Say hello.',
  });

  await harness.service.drainAgentRunRuntime({ agentRunId: agentRun.runId });

  const artifacts = await harness.repository.listArtifactsByRun(task.orchestrationRunId);
  const trace = await harness.repository.listTraceEventsByRun(task.orchestrationRunId);

  expect(artifacts).toEqual(
    expect.arrayContaining([expect.objectContaining({ title: 'Runtime output' })]),
  );
  expect(trace.map((event) => event.eventType)).toEqual(
    expect.arrayContaining(['agent_run.started', 'agent_run.succeeded', 'artifact.created']),
  );
});
```

- [ ] **Step 2: Run application tests and verify failure**

Run:

```bash
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
```

Expected: FAIL because artifact store/repository creation is not wired.

- [ ] **Step 3: Define artifact store port**

In `packages/application/src/ports/artifact-store-port.ts`, ensure this shape exists:

```ts
import type { ArtifactId, OrchestrationRunId, WorkspaceId } from '@cairn/shared-contracts/schemas';

export interface WriteArtifactPayloadInput {
  readonly artifactId: ArtifactId;
  readonly workspaceId: WorkspaceId;
  readonly orchestrationRunId: OrchestrationRunId;
  readonly filename: string;
  readonly mediaType: 'text/plain' | 'application/json';
  readonly text: string;
}

export interface WriteArtifactPayloadResult {
  readonly payloadRef: string;
  readonly byteLength: number;
  readonly truncated: boolean;
}

export interface ReadArtifactPayloadResult {
  readonly mediaType: 'text/plain' | 'application/json';
  readonly text: string;
  readonly truncated: boolean;
}

export interface ArtifactStorePort {
  writeText(input: WriteArtifactPayloadInput): Promise<WriteArtifactPayloadResult>;
  readText(payloadRef: string): Promise<ReadArtifactPayloadResult>;
}
```

- [ ] **Step 4: Extend repository port**

In `packages/application/src/ports/run-repository.ts`, add:

```ts
createArtifact(artifact: Artifact): Promise<void>;
updateArtifact(artifact: Artifact): Promise<void>;
```

- [ ] **Step 5: Implement memory repository artifact writes**

In `packages/application/src/testing/memory-run-repository.ts`, add a `Map<ArtifactId, Artifact>` and implement:

```ts
async createArtifact(artifact: Artifact): Promise<void> {
  this.artifacts.set(artifact.artifactId, artifact);
}

async updateArtifact(artifact: Artifact): Promise<void> {
  this.artifacts.set(artifact.artifactId, artifact);
}
```

Ensure `listArtifactsByRun` and `getArtifact` read from that map.

- [ ] **Step 6: Inject ArtifactStorePort into OrchestrationRunService**

Update service dependencies:

```ts
export interface OrchestrationRunServiceDependencies {
  clock: ApplicationClock;
  ids: ApplicationIdFactory;
  repository: ApplicationRepository;
  runtimeGateway: RuntimeGatewayPort;
  artifactStore: ArtifactStorePort;
}
```

Store it as `private readonly artifactStore`.

- [ ] **Step 7: Create input artifact before runtime submit**

In `submitTaskToRuntime`, before `runtimeGateway.submit`, create an artifact id, write payload, persist artifact metadata, and pass the artifact ref as first input:

```ts
const inputArtifactId = this.ids.artifactId();
const inputPayload = await this.artifactStore.writeText({
  artifactId: inputArtifactId,
  workspaceId: task.workspaceId,
  orchestrationRunId: task.orchestrationRunId,
  filename: 'runtime-input.json',
  mediaType: 'application/json',
  text: JSON.stringify({ prompt: input.prompt }),
});

await this.repository.createArtifact({
  artifactId: inputArtifactId,
  workspaceId: task.workspaceId,
  orchestrationRunId: task.orchestrationRunId,
  taskId: task.taskId,
  agentRunId: agentRun.runId,
  kind: 'log',
  title: 'Runtime input',
  summary: 'Prompt submitted to runtime.',
  reviewState: 'pending_review',
  payloadRef: inputPayload.payloadRef,
  sensitivity: 'none',
  createdAt: now,
  updatedAt: now,
});
```

If current service input only accepts `inputs`, first add `prompt` to `SubmitTaskToRuntimeInput` and keep `inputs` optional for future compatibility.

- [ ] **Step 8: Create runtime output artifact during drain**

In `drainAgentRunRuntime`, accumulate token deltas in a local string buffer. On `succeeded`, write `runtime-output.txt`, create `Runtime output` artifact metadata, and append an `artifact.created` trace event.

- [ ] **Step 9: Run application tests**

Run:

```bash
pnpm --filter @cairn/application test -- orchestration-run-service.spec.ts
```

Expected: PASS.

- [ ] **Step 10: Commit application loop**

Run:

```bash
git add packages/application/src/ports/artifact-store-port.ts packages/application/src/ports/run-repository.ts packages/application/src/testing/memory-run-repository.ts packages/application/src/orchestration/orchestration-run-service.ts packages/application/src/orchestration/orchestration-run-service.spec.ts
git commit -m "feat(application): 持久化 runtime artifact trace 闭环 / persist runtime artifact trace loop"
```

---

### Task 3: SQLite Repository And Local Artifact Store

**Files:**

- Modify: `apps/workspace-core/src/storage/sqlite-application-repository.ts`
- Test: `apps/workspace-core/src/storage/sqlite-application-repository.spec.ts`
- Add: `apps/workspace-core/src/artifacts/local-artifact-store.ts`
- Test: `apps/workspace-core/src/artifacts/local-artifact-store.spec.ts`

- [ ] **Step 1: Add failing SQLite artifact persistence test**

In `apps/workspace-core/src/storage/sqlite-application-repository.spec.ts`, add a test that creates an artifact with `payloadRef`, then verifies `listArtifactsByRun` and `getArtifact` return it.

- [ ] **Step 2: Implement SQLite artifact create/update**

In `sqlite-application-repository.ts`, implement `createArtifact` and `updateArtifact` using Drizzle insert/update patterns already used for runs/tasks/agent-runs.

- [ ] **Step 3: Add failing local artifact store tests**

Create `apps/workspace-core/src/artifacts/local-artifact-store.spec.ts`:

```ts
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { LocalArtifactStore } from './local-artifact-store.js';

describe('LocalArtifactStore', () => {
  it('writes and reads bounded text through an opaque payloadRef', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cairn-artifacts-'));
    const store = new LocalArtifactStore({ rootDir: root, maxInlineBytes: 1024 });

    const write = await store.writeText({
      artifactId: 'artifact_01J00000000000000000000000',
      workspaceId: 'workspace_01J0000000000000000000000',
      orchestrationRunId: 'run_01J000000000000000000000000',
      filename: 'runtime-output.txt',
      mediaType: 'text/plain',
      text: 'hello',
    });

    expect(write.payloadRef).toMatch(/^artifact-payload:\/\//u);
    await expect(readFile(write.payloadRef, 'utf8')).rejects.toThrow();

    await expect(store.readText(write.payloadRef)).resolves.toMatchObject({ text: 'hello' });
  });
});
```

- [ ] **Step 4: Implement LocalArtifactStore**

Create `apps/workspace-core/src/artifacts/local-artifact-store.ts` with:

```ts
export class LocalArtifactStore implements ArtifactStorePort {
  constructor(private readonly options: { rootDir: string; maxInlineBytes: number }) {}

  async writeText(input: WriteArtifactPayloadInput): Promise<WriteArtifactPayloadResult> {
    const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/gu, '-');
    const relativePath = `${input.workspaceId}/${input.orchestrationRunId}/${input.artifactId}/${safeFilename}`;
    const absolutePath = join(this.options.rootDir, relativePath);
    await mkdir(dirname(absolutePath), { recursive: true });

    const bytes = Buffer.from(input.text, 'utf8');
    const truncated = bytes.byteLength > this.options.maxInlineBytes;
    const storedText = truncated
      ? bytes.subarray(0, this.options.maxInlineBytes).toString('utf8')
      : input.text;

    await writeFile(absolutePath, storedText, 'utf8');

    return {
      payloadRef: `artifact-payload://${relativePath}`,
      byteLength: Buffer.byteLength(storedText, 'utf8'),
      truncated,
    };
  }

  async readText(payloadRef: string): Promise<ReadArtifactPayloadResult> {
    const prefix = 'artifact-payload://';
    if (!payloadRef.startsWith(prefix) || payloadRef.includes('..')) {
      throw new Error('Invalid artifact payload reference.');
    }
    const relativePath = payloadRef.slice(prefix.length);
    const absolutePath = join(this.options.rootDir, relativePath);
    return {
      mediaType: 'text/plain',
      text: await readFile(absolutePath, 'utf8'),
      truncated: false,
    };
  }
}
```

Adjust imports and mediaType storage to match final implementation.

- [ ] **Step 5: Run workspace-core storage tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- sqlite-application-repository.spec.ts local-artifact-store.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit storage and artifact store**

Run:

```bash
git add apps/workspace-core/src/storage/sqlite-application-repository.ts apps/workspace-core/src/storage/sqlite-application-repository.spec.ts apps/workspace-core/src/artifacts/local-artifact-store.ts apps/workspace-core/src/artifacts/local-artifact-store.spec.ts
git commit -m "feat(storage): 增加本地 artifact payload store / add local artifact payload store"
```

---

### Task 4: Workspace Core Routes

**Files:**

- Modify: `apps/workspace-core/src/service/container.ts`
- Modify: `apps/workspace-core/src/service/app.ts`
- Test: `apps/workspace-core/src/service/app.spec.ts`

- [ ] **Step 1: Add route tests for submit runtime and payload read**

In `app.spec.ts`, add tests:

```ts
it('submits a ready task to runtime and returns a submitted agent run', async () => {
  const app = await buildTestApp();
  const created = await createReadyRun(app);

  const response = await app.inject({
    method: 'POST',
    url: `/v1/tasks/${created.task.taskId}/agent-runs`,
    payload: { runtimeType: 'codex', model: 'default', prompt: 'Say hello.' },
  });

  expect(response.statusCode).toBe(201);
  expect(response.json()).toMatchObject({ taskId: created.task.taskId, status: 'submitted' });
});

it('reads bounded artifact payload text without exposing a file path', async () => {
  const app = await buildTestApp();
  const artifact = await createArtifactWithPayload(app, 'hello');

  const response = await app.inject({
    method: 'GET',
    url: `/v1/artifacts/${artifact.artifactId}/payload`,
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ text: 'hello', truncated: false });
  expect(JSON.stringify(response.json())).not.toContain('/Users/');
});
```

Use existing test helpers or add local helper functions in the spec.

- [ ] **Step 2: Run route tests and verify failure**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
```

Expected: FAIL because routes are not implemented.

- [ ] **Step 3: Wire LocalArtifactStore in container**

In `container.ts`, create `LocalArtifactStore` with root under `.cairn/artifacts` for local dev/test. For tests, allow injection of a temp artifact root through the existing container/test dependency pattern.

- [ ] **Step 4: Implement submit route**

In `app.ts`, add route:

```ts
fastify.post('/v1/tasks/:taskId/agent-runs', async (request, reply) => {
  const parsedParams = taskPathParamsSchema.parse(request.params);
  const body = submitTaskRuntimeRequestSchema.parse(request.body);
  const result = await services.orchestration.submitTaskToRuntime({
    taskId: parsedParams.taskId,
    runtimeType: body.runtimeType,
    model: body.model,
    prompt: body.prompt,
    timeoutMs: body.timeoutMs,
    options: body.options,
  });

  return reply.code(201).send({
    agentRunId: result.agentRun.runId,
    taskId: result.agentRun.taskId,
    orchestrationRunId: result.agentRun.orchestrationRunId,
    status: result.agentRun.status,
    ...(result.providerRunId === undefined ? {} : { providerRunId: result.providerRunId }),
  });
});
```

Use existing error mapping helpers rather than duplicating error response logic.

- [ ] **Step 5: Implement payload read route**

In `app.ts`, add:

```ts
fastify.get('/v1/artifacts/:artifactId/payload', async (request, reply) => {
  const params = artifactPathParamsSchema.parse(request.params);
  const artifact = await services.repository.getArtifact(params.artifactId);
  if (artifact?.payloadRef === undefined) {
    return reply
      .code(404)
      .send({ code: 'ARTIFACT_PAYLOAD_NOT_FOUND', message: 'Artifact payload not found.' });
  }
  const payload = await services.artifactStore.readText(artifact.payloadRef);
  return reply.send({ artifactId: params.artifactId, ...payload });
});
```

Keep response shape aligned with shared contract.

- [ ] **Step 6: Run workspace-core route tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Workspace Core routes**

Run:

```bash
git add apps/workspace-core/src/service/container.ts apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts
git commit -m "feat(workspace-core): 暴露 runtime submit 与 artifact payload 读取 / expose runtime submit and artifact payload read"
```

---

### Task 5: Codex Smoke Path And Documentation

**Files:**

- Modify: `docs/contracts/runtime-adapter.md`
- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`
- Add: `docs/superpowers/plans/2026-05-17-r1-runtime-artifact-trace-demo-loop-smoke.md` if a manual smoke note is needed

- [ ] **Step 1: Document manual smoke flow**

Add a short section to `docs/contracts/runtime-adapter.md` or a dedicated smoke note:

```markdown
### R1 demo-loop smoke flow

1. Start Workspace Core locally.
2. Create a single-worker run and ready task.
3. Submit the task with `POST /v1/tasks/:taskId/agent-runs` using `runtimeType=codex`.
4. Drain with `POST /v1/agent-runs/:agentRunId/drain-runtime`.
5. Inspect `GET /v1/runs/:runId/artifacts` and `GET /v1/runs/:runId/trace`.

This smoke path requires Codex CLI to be installed and authenticated on the developer machine. It is not part of default CI.
```

- [ ] **Step 2: Update STATUS**

In `docs/STATUS.md`, update R1 completed/unfinished sections only after implementation lands:

```markdown
- Runtime Artifact/Trace demo loop: Workspace Core can submit a ready Task to runtime, drain runtime events, create Artifact metadata/payload references, and expose TraceEvents for replay source.
```

Keep real Codex CLI E2E marked as opt-in smoke unless automated.

- [ ] **Step 3: Update CHANGELOG**

Under `[Unreleased] > Added`, add:

```markdown
- **Runtime Artifact/Trace Demo Loop**：新增 Task runtime submit、bounded artifact payload reference/read、runtime output artifact metadata 与 TraceEvent replay source 闭环。
```

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm run check
pnpm test
pnpm --filter @cairn/workspace-core test
pnpm --filter @cairn/runtime-gateway test
```

Expected: all commands PASS.

- [ ] **Step 5: Commit docs and final polish**

Run:

```bash
git add docs/contracts/runtime-adapter.md docs/STATUS.md CHANGELOG.md
git commit -m "docs(runtime): 记录 runtime artifact trace 闭环 / document runtime artifact trace loop"
```

---

## Final Review Gate

- [ ] Run `git diff --check`.
- [ ] Run `pnpm run check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm --filter @cairn/workspace-core test`.
- [ ] Run `pnpm --filter @cairn/runtime-gateway test`.
- [ ] Confirm no Desktop business logic was added.
- [ ] Confirm no raw absolute artifact payload paths are returned by APIs.
- [ ] Confirm trace payloads do not contain full runtime output.
- [ ] Open PR against `develop` with risk marked High because this touches API, storage, runtime, artifacts, and trace.
