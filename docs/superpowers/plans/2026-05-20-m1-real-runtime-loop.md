# M1 Real Runtime Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Workspace Core can submit, drain, observe, and document a Codex RuntimeAdapter-backed
AgentRun without making real Codex execution part of default CI.

**Architecture:** Keep the current runtime gateway boundary: Workspace Core selects `mock` or `codex`
in `runtime-gateway-factory.ts`, wraps concrete adapters with `RuntimeAdapterGatewayPort`, and lets
`@cairn/application` apply `AdapterStreamEvent` data through `submitTaskToRuntime()` and
`drainAgentRunRuntime()`. Tests should use deterministic Codex process fixtures or injected fake
Codex adapters, while a manual smoke path covers the real Codex CLI.

**Tech Stack:** TypeScript strict ESM, Vitest, Fastify route tests, RuntimeAdapter/Codex CLI
`exec --json`, pnpm, markdownlint-cli2, Prettier.

---

## Scope Check

In scope:

- Confirm the current Runtime Gateway and Workspace Core test baseline before changing behavior.
- Add or refine deterministic Codex adapter smoke coverage using fake process output or injected
  adapter seams.
- Prove Workspace Core can select a RuntimeAdapter-backed gateway and push submit/drain events into
  AgentRun, Task, and OrchestrationRun state.
- Keep the real Codex CLI smoke as an opt-in manual procedure in
  `docs/engineering/local-dev-setup.md`.
- Update `docs/STATUS.md` and `CHANGELOG.md` after implementation.

Out of scope:

- Do not create a second runtime adapter.
- Do not add a complex planner, background scheduler, multi-worker DAG, or workflow builder.
- Do not run real Codex CLI in default `pnpm test`, `pnpm run check`, or CI paths.
- Do not change Desktop or Web behavior for M1.
- Do not change database schema unless the implementation discovers a blocker and records it before
  code changes.

## File Map

- Read: `docs/superpowers/specs/2026-05-20-r1-evidence-chain-roadmap-design.md`
  - M1 milestone definition and non-goals.
- Read: `docs/design/r1-codex-e2e-artifact-trace.md`
  - Expected real-runtime object chain and artifact/trace direction.
- Read: `docs/superpowers/plans/2026-05-18-codex-runtime-hardening.md`
  - Existing Codex hardening slice; do not duplicate completed resolver/cancel work.
- Inspect and likely modify: `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`
  - Codex RuntimeAdapter lifecycle, prompt resolution, stream, cancel, query.
- Inspect and likely modify: `packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts`
  - Deterministic adapter submit/stream tests with fake Codex child process output.
- Inspect and likely modify: `packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts`
  - Process-level fake stdout/stderr/exit coverage if a deterministic short-task fixture belongs
    below the adapter.
- Inspect and likely modify: `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`
  - Runtime selection and Codex adapter option wiring.
- Inspect and likely modify: `apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts`
  - Factory proof that `codex` selection initializes and wraps a RuntimeAdapter.
- Inspect and likely modify: `apps/workspace-core/src/service/app.ts`
  - Route handlers for submit and drain; prefer no route change unless tests expose a gap.
- Inspect and likely modify: `apps/workspace-core/src/service/app.spec.ts`
  - Route-level or service-level submit/drain proof through a real `RuntimeAdapterGatewayPort`.
- Inspect and likely modify: `apps/workspace-core/src/service/container.ts`
  - Composition only if Codex runtime selection cannot currently reach the app container.
- Inspect and likely modify: `apps/workspace-core/src/server.ts`
  - Server bootstrap only if manual Codex smoke needs missing configuration wiring.
- Modify: `docs/engineering/local-dev-setup.md`
  - Manual Codex smoke procedure.
- Modify: `docs/STATUS.md`
  - M1 status update after implementation.
- Modify: `CHANGELOG.md`
  - M1 implementation entry after implementation.

## Task 1: Confirm Baseline And Current Runtime Wiring

**Files:**

- Read: `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`
- Read: `apps/workspace-core/src/runtime/runtime-adapter-gateway-port.ts`
- Read: `apps/workspace-core/src/service/app.ts`
- Read: `apps/workspace-core/src/service/container.ts`
- Read: `apps/workspace-core/src/server.ts`
- Read: `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`
- Read: `packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts`

- [ ] **Step 1: Confirm branch and local edits**

Run:

```bash
git status --short --branch
```

Expected: current branch is the M1 implementation branch. If unrelated edits are present, do not
revert them; record their paths in task notes and avoid touching them.

- [ ] **Step 2: Confirm package test baseline**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test
pnpm --filter @cairn/workspace-core test
```

Expected: both package suites exit 0. If either fails before edits, stop M1 implementation and first
commit a baseline repair or record a baseline failure note with the failing test names and command
output.

- [ ] **Step 3: Inspect current real-runtime seams**

Run:

```bash
rg -n "createWorkspaceCoreRuntimeGateway|RuntimeAdapterGatewayPort|CAIRN_WORKSPACE_CORE_RUNTIME|drainAgentRunRuntime|submitTaskToRuntime|createCodexRuntimeAdapter" apps/workspace-core/src packages/application/src packages/runtime_gateway/src/adapters/codex
```

Expected: output shows the existing runtime factory, adapter-backed gateway port, submit/drain
application service, Workspace Core submit/drain routes, and Codex adapter lifecycle. Use these
existing seams; do not introduce a parallel runtime path.

- [ ] **Step 4: Record the current gap before writing tests**

Add a short note to the task log or PR description, not a source file, using this shape:

```text
M1 baseline:
- @cairn/runtime-gateway tests: pass/fail
- @cairn/workspace-core tests: pass/fail
- Existing Codex deterministic process fixture: present/missing
- Existing Workspace Core RuntimeAdapter-backed drain proof: present/missing
- Missing M1 proof to add: deterministic Codex short-task stream, Workspace Core
  RuntimeAdapter-backed AgentRun/Task/Run terminal state, or manual Codex smoke docs
```

Expected: the implementer can explain exactly why the next failing test is needed.

## Task 2: Codex Adapter Deterministic Short-Task Smoke

**Files:**

- Modify: `packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts`
- Modify only if the test exposes a real gap:
  `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`
- Modify only if the fixture belongs at process level:
  `packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts`

- [ ] **Step 1: Write the failing deterministic short-task test**

In `packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts`, add or refine one test that
uses the existing fake child process helper pattern. Align helper names with the current spec file
during execution.

```ts
it('maps a deterministic Codex short-task stream into a terminal adapter snapshot', async () => {
  const child = new FakeCodexChildProcess();
  const adapter = createCodexRuntimeAdapter({
    spawnProcess: () => child.asChildProcess(),
    now: () => 1_715_654_400_000,
    killGraceMs: 0,
  });
  await adapter.init(createTestAdapterContext());

  const request = createTestSubmitRequest({
    runId: 'agent-run-short-task',
    options: { prompt: 'Reply with exactly: Cairn smoke ok' },
  });
  const ack = await adapter.submit(request);
  expect(ack).toEqual({ runId: 'agent-run-short-task', accepted: true });

  child.stdoutJson({
    type: 'thread.started',
    thread_id: 'codex-thread-short-task',
  });
  child.stdoutJson({
    type: 'item.completed',
    item: {
      id: 'item_short_task',
      type: 'agent_message',
      text: 'Cairn smoke ok',
    },
  });
  child.close(0);

  await expect(toArray(adapter.stream('agent-run-short-task'))).resolves.toEqual([
    expect.objectContaining({
      type: 'started',
      providerRunId: 'codex-thread-short-task',
    }),
    expect.objectContaining({
      type: 'token',
      delta: 'Cairn smoke ok',
    }),
    expect.objectContaining({
      type: 'succeeded',
      finalArtifactRef: expect.objectContaining({
        artifactId: expect.any(String) as unknown,
      }),
    }),
  ]);
  await expect(adapter.query('agent-run-short-task')).resolves.toMatchObject({
    runId: 'agent-run-short-task',
    status: 'succeeded',
    providerRunId: 'codex-thread-short-task',
    finalArtifactRef: expect.objectContaining({
      artifactId: expect.any(String) as unknown,
    }) as unknown,
  });

  await adapter.shutdown();
});
```

If current parser event names differ, keep the assertion intent but use the actual Codex protocol
fixtures already accepted by `codex-protocol.spec.ts`.

- [ ] **Step 2: Run the focused test and confirm it fails for the intended gap**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test -- src/adapters/codex/codex-adapter.spec.ts
```

Expected: the new test fails because the deterministic short-task path is not fully mapped, or it
passes because equivalent coverage already exists. If it passes, keep the test only if it improves
the M1 smoke signal without duplicating an existing assertion.

- [ ] **Step 3: Implement the smallest adapter/process fix if needed**

If Step 2 fails because the current Codex parser already emits a known event that the adapter does
not surface correctly, update `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts` or the
process fixture code with the narrowest change. Preserve these invariants:

```ts
// Adapter stream events remain the only data passed to Workspace Core.
// stdout JSONL stays in the Codex protocol/parser path.
// stderr remains debug/error evidence and must not be parsed as JSONL.
```

Expected: no new public API unless the current implementation lacks a test-only injection seam.

- [ ] **Step 4: Re-run Runtime Gateway focused and package tests**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test -- src/adapters/codex/codex-adapter.spec.ts
pnpm --filter @cairn/runtime-gateway test
```

Expected: all Runtime Gateway tests pass.

- [ ] **Step 5: Commit the deterministic adapter smoke slice**

Run:

```bash
git add packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts packages/runtime_gateway/src/adapters/codex/codex-adapter.ts packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts
git commit -m "test(runtime): 补齐 Codex 短任务烟测 / cover Codex short-task smoke"
```

Expected: commit contains only files changed for the deterministic Codex smoke slice. If
`codex-adapter.ts` or `codex-process.spec.ts` did not change, omit them from `git add`.

## Task 3: Workspace Core Runtime Selection And Submit/Drain Proof

**Files:**

- Modify: `apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts`
- Modify only if needed: `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`
- Modify: `apps/workspace-core/src/service/app.spec.ts`
- Modify only if needed: `apps/workspace-core/src/service/app.ts`
- Modify only if needed: `apps/workspace-core/src/service/container.ts`
- Modify only if needed: `apps/workspace-core/src/server.ts`

- [ ] **Step 1: Add or refine factory proof for Codex runtime selection**

In `apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts`, first look for an equivalent
Codex runtime selection test. If it already exists, extend only the missing assertions instead of
adding a duplicate test. The assertion shape should prove the configured `codex` runtime initializes
and wraps a `RuntimeAdapter`. Use the current `RecordingRuntimeAdapter` helper if it already exists.

```ts
it('selects a Codex RuntimeAdapter-backed gateway when configured', async () => {
  const adapter = new RecordingRuntimeAdapter();
  const runtime = await createWorkspaceCoreRuntimeGateway(
    {
      runtime: 'codex',
      runtimeWorkdir: '/tmp/cairn-runtime',
      codexExecutable: '/usr/local/bin/codex',
      codexSandboxMode: 'read-only',
    },
    { createCodexAdapter: () => adapter },
  );

  const ack = await runtime.gateway.submit({
    runId: 'agent-run-codex-selection',
    model: 'default',
    inputs: [],
    traceId: 'trace-codex-selection',
  });

  expect(adapter.initContext).toMatchObject({
    workdir: '/tmp/cairn-runtime',
    config: {
      executable: '/usr/local/bin/codex',
      sandboxMode: 'read-only',
    },
  });
  expect(ack).toMatchObject({
    runId: 'agent-run-codex-selection',
    accepted: true,
  });

  await runtime.close?.();
});
```

Expected: the test proves `runtime: 'codex'` uses the `RuntimeAdapter` path, not the mock gateway.

- [ ] **Step 2: Run factory tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/runtime/runtime-gateway-factory.spec.ts
```

Expected: tests pass if selection is already wired; otherwise fail before implementation.

- [ ] **Step 3: Implement minimal runtime factory wiring if needed**

If Step 2 fails, update `apps/workspace-core/src/runtime/runtime-gateway-factory.ts` so the Codex
branch:

```ts
const adapter =
  overrides.createCodexAdapter?.(codexOptions) ?? createCodexRuntimeAdapter(codexOptions);

await mkdir(config.runtimeWorkdir, { recursive: true });
await adapter.init({
  workdir: config.runtimeWorkdir,
  logger: overrides.logger ?? noopLogger,
  secrets: {
    async get() {
      await Promise.resolve();
      return undefined;
    },
  },
  config: {
    ...(config.codexExecutable === undefined ? {} : { executable: config.codexExecutable }),
    ...(config.codexSandboxMode === undefined ? {} : { sandboxMode: config.codexSandboxMode }),
  },
});

return {
  gateway: new RuntimeAdapterGatewayPort(adapter),
  close: () => adapter.shutdown(),
};
```

Expected: mock remains the default branch and no route handler imports a concrete Codex adapter.

- [ ] **Step 4: Add route-level submit/drain proof through a RuntimeAdapter-backed gateway**

In `apps/workspace-core/src/service/app.spec.ts`, first look for an equivalent RuntimeAdapter-backed
submit/drain route test. If it already exists, extend only the missing assertions instead of adding a
duplicate test. The proof must inject a deterministic `RuntimeAdapter` through
`new RuntimeAdapterGatewayPort(adapter)`, submit through `POST /v1/tasks/:taskId/agent-runs`, drain
through `POST /v1/agent-runs/:agentRunId/drain-runtime`, and read final state through existing GET
routes.

```ts
it('updates AgentRun, Task, and Run state from a RuntimeAdapter-backed stream', async () => {
  const runtimeAdapter = createMockRuntimeAdapter({ clock: () => 1_715_654_400_000 });
  await runtimeAdapter.init({
    workdir: '/tmp/cairn-runtime-adapter-backed-stream-test',
    config: {},
    secrets: {
      async get() {
        await Promise.resolve();
        return undefined;
      },
    },
    logger: {
      debug() {
        return;
      },
      info() {
        return;
      },
      warn() {
        return;
      },
      error() {
        return;
      },
    },
  });
  const app = await createWorkspaceCoreApp({
    container: createDefaultWorkspaceCoreContainer({
      runtimeGateway: new RuntimeAdapterGatewayPort(runtimeAdapter),
    }),
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
      eventCount: expect.any(Number) as unknown,
    });

    await expect(
      app
        .inject({ method: 'GET', url: `/v1/agent-runs/${agentRun.runId}` })
        .then((response) => response.json()),
    ).resolves.toMatchObject({ status: 'succeeded' });
    await expect(
      app.inject({ method: 'GET', url: `/v1/tasks/${taskId}` }).then((response) => response.json()),
    ).resolves.toMatchObject({ status: 'succeeded' });
    await expect(
      app.inject({ method: 'GET', url: `/v1/runs/${runId}` }).then((response) => response.json()),
    ).resolves.toMatchObject({ status: 'succeeded' });
  } finally {
    await app.close();
    await runtimeAdapter.shutdown();
  }
});
```

Align helper names with the current `app.spec.ts`; the important assertion is that route-level
submit/drain uses `RuntimeAdapterGatewayPort` and terminal state is visible through all three object
read paths.

- [ ] **Step 5: Run Workspace Core focused tests**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/runtime/runtime-gateway-factory.spec.ts src/service/app.spec.ts
```

Expected: the new runtime selection and submit/drain proof passes.

- [ ] **Step 6: Commit the Workspace Core proof slice**

Run:

```bash
git add apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts apps/workspace-core/src/runtime/runtime-gateway-factory.ts apps/workspace-core/src/service/app.spec.ts apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/container.ts apps/workspace-core/src/server.ts
git commit -m "test(workspace-core): 证明真实运行时提交回写 / prove real runtime submit drain"
```

Expected: commit contains only Workspace Core runtime selection and route/service proof changes.
Omit unchanged files from `git add`.

## Task 4: Manual Codex Smoke Documentation

**Files:**

- Modify: `docs/engineering/local-dev-setup.md`

- [ ] **Step 1: Inspect current local dev runtime notes**

Run:

```bash
rg -n "Codex|CAIRN_WORKSPACE_CORE_RUNTIME|workspace-core|drain-runtime|agent-runs" docs/engineering/local-dev-setup.md
```

Expected: output identifies whether a manual Codex smoke section already exists. Refine it instead
of adding a duplicate section.

- [ ] **Step 2: Add or refine the opt-in manual smoke procedure**

In `docs/engineering/local-dev-setup.md`, add a section with this content shape, adjusted to the
current surrounding language. The resulting section must include copy-pastable HTTP examples, not
only prose. Commands must not include real credentials or business task content.

- Heading: `### Manual Codex Runtime Smoke (Opt-In)`
- Intro: this smoke is not part of default `pnpm test` or CI, and should run only on a machine with
  Codex CLI installed and user-configured credentials. State that all example prompts use synthetic
  smoke text, and that users must not paste real credentials, repository secrets, customer data, or
  business task content into the smoke commands.
- Step 1: start Workspace Core with explicit Codex runtime selection:

  ```bash
  CAIRN_WORKSPACE_CORE_RUNTIME=codex \
  CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR=.cairn/runtime/codex-smoke \
  CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE=read-only \
  pnpm --filter @cairn/workspace-core dev
  ```

- Step 2: in another terminal, set base URL and the optional auth header:

  ```bash
  export CAIRN_BASE_URL="${CAIRN_BASE_URL:-http://127.0.0.1:4321}"

  # Optional: set only when Workspace Core was started with CAIRN_WORKSPACE_CORE_AUTH_TOKEN.
  export CAIRN_AUTH_HEADER="${CAIRN_AUTH_HEADER:-}"
  # Example shape only; do not paste real tokens into committed docs or issue reports:
  # export CAIRN_AUTH_HEADER="Authorization: Bearer local-dev-token"
  ```

- Step 3: create a single-worker run and extract `runId` with `jq`:

  ```bash
  export CAIRN_WORKSPACE_ID="${CAIRN_WORKSPACE_ID:-01J000000000000000000000W0}"
  export CAIRN_ORIGIN_EVENT_ID="${CAIRN_ORIGIN_EVENT_ID:-01J000000000000000000000E0}"

  RUN_RESPONSE="$(
    curl -sS -X POST "$CAIRN_BASE_URL/v1/workspaces/$CAIRN_WORKSPACE_ID/runs" \
      ${CAIRN_AUTH_HEADER:+-H "$CAIRN_AUTH_HEADER"} \
      -H 'content-type: application/json' \
      -d "$(
        jq -nc --arg originEventId "$CAIRN_ORIGIN_EVENT_ID" '{
          originEventId: $originEventId,
          task: {
            taskKind: "analysis",
            title: "Codex smoke",
            brief: "Run a synthetic Codex smoke prompt."
          }
        }'
      )"
  )"
  export CAIRN_RUN_ID="$(printf '%s' "$RUN_RESPONSE" | jq -r '.orchestrationRunId')"
  printf 'runId=%s\n' "$CAIRN_RUN_ID"
  ```

- Step 4: list run tasks and extract `taskId` with `jq`:

  ```bash
  TASKS_RESPONSE="$(
    curl -sS "$CAIRN_BASE_URL/v1/runs/$CAIRN_RUN_ID/tasks" \
      ${CAIRN_AUTH_HEADER:+-H "$CAIRN_AUTH_HEADER"}
  )"
  export CAIRN_TASK_ID="$(printf '%s' "$TASKS_RESPONSE" | jq -r '.items[0].taskId')"
  printf 'taskId=%s\n' "$CAIRN_TASK_ID"
  ```

- Step 5: submit an AgentRun with the exact prompt `Reply with exactly: Cairn smoke ok`, then extract
  `agentRunId` with `jq`:

  ```bash
  AGENT_RUN_RESPONSE="$(
    curl -sS -X POST "$CAIRN_BASE_URL/v1/tasks/$CAIRN_TASK_ID/agent-runs" \
      ${CAIRN_AUTH_HEADER:+-H "$CAIRN_AUTH_HEADER"} \
      -H 'content-type: application/json' \
      -d '{
        "runtimeType": "codex",
        "model": "default",
        "prompt": "Reply with exactly: Cairn smoke ok"
      }'
  )"
  export CAIRN_AGENT_RUN_ID="$(printf '%s' "$AGENT_RUN_RESPONSE" | jq -r '.agentRunId')"
  printf 'agentRunId=%s\n' "$CAIRN_AGENT_RUN_ID"
  ```

- Step 6: drain runtime:

  ```bash
  curl -sS -X POST "$CAIRN_BASE_URL/v1/agent-runs/$CAIRN_AGENT_RUN_ID/drain-runtime" \
    ${CAIRN_AUTH_HEADER:+-H "$CAIRN_AUTH_HEADER"} \
    -H 'content-type: application/json' \
    -d '{}' | jq
  ```

- Step 7: read final AgentRun, Task, and OrchestrationRun state:

  ```bash
  curl -sS "$CAIRN_BASE_URL/v1/agent-runs/$CAIRN_AGENT_RUN_ID" \
    ${CAIRN_AUTH_HEADER:+-H "$CAIRN_AUTH_HEADER"} | jq '{runId, status, providerRunId, outputRef, error}'

  curl -sS "$CAIRN_BASE_URL/v1/tasks/$CAIRN_TASK_ID" \
    ${CAIRN_AUTH_HEADER:+-H "$CAIRN_AUTH_HEADER"} | jq '{taskId, status, artifactRefs}'

  curl -sS "$CAIRN_BASE_URL/v1/runs/$CAIRN_RUN_ID" \
    ${CAIRN_AUTH_HEADER:+-H "$CAIRN_AUTH_HEADER"} | jq '{orchestrationRunId, status, finalResponseRef, error}'
  ```

- Alternative without `jq`: if `jq` is unavailable, document that the user can save each response to
  a `.json` file and copy the `orchestrationRunId`, first `items[0].taskId`, and `agentRunId` fields
  manually into `CAIRN_RUN_ID`, `CAIRN_TASK_ID`, and `CAIRN_AGENT_RUN_ID` before continuing.
- Expected result: the AgentRun, Task, and OrchestrationRun reach `succeeded` for a short prompt such
  as `Reply with exactly: Cairn smoke ok`. Runtime stdout/stderr and provider run id should be
  visible in local logs or returned state where currently supported.
- Failure handling: if Codex CLI is missing, credentials are unavailable, or the process exits
  non-zero, record the failure as manual smoke evidence. Do not skip or weaken automated
  mock/runtime-adapter tests.

Do not include real credentials, tokens, or business task content in the docs.

- [ ] **Step 3: Verify docs formatting**

Run:

```bash
pnpm exec markdownlint-cli2 docs/engineering/local-dev-setup.md
pnpm exec prettier --check docs/engineering/local-dev-setup.md
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit manual smoke docs**

Run:

```bash
git add docs/engineering/local-dev-setup.md
git commit -m "docs(runtime): 记录 Codex 手动烟测 / document Codex manual smoke"
```

Expected: docs-only commit.

## Task 5: Status And Changelog Updates

**Files:**

- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Inspect current status and changelog language**

Run:

```bash
rg -n "Runtime Gateway|Codex|M1|真实闭环|manual smoke|Unreleased" docs/STATUS.md CHANGELOG.md
```

Expected: output shows the exact sections to update. Do not overclaim Desktop integration, artifact
file storage completion, or automated real Codex E2E.

- [ ] **Step 2: Update `docs/STATUS.md`**

Adjust the Runtime Gateway, Workspace Core, R1 completed/unfinished, or近期主线 sections so they
state the implemented M1 evidence accurately. Use language like:

```markdown
- Runtime Gateway / Workspace Core M1 real-runtime loop: deterministic Codex adapter smoke and
  RuntimeAdapter-backed Workspace Core submit/drain proof are covered by tests; real Codex CLI smoke
  remains an opt-in manual procedure and is not part of default CI.
```

Expected: status reflects what tests prove and what remains manual.

- [ ] **Step 3: Update `CHANGELOG.md`**

Under `[Unreleased]`, add one entry:

```markdown
- 规划并验证 M1 真实运行时闭环：补齐 Codex adapter 短任务烟测、Workspace Core
  RuntimeAdapter-backed submit/drain 证明，以及手动 Codex smoke 文档。
```

If the repository uses grouped headings such as `Added` or `Changed`, place the entry under the
matching existing heading.

- [ ] **Step 4: Verify docs formatting**

Run:

```bash
pnpm exec markdownlint-cli2 docs/STATUS.md CHANGELOG.md
pnpm exec prettier --check docs/STATUS.md CHANGELOG.md
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit status and changelog**

Run:

```bash
git add docs/STATUS.md CHANGELOG.md
git commit -m "docs(status): 更新 M1 运行时闭环状态 / update M1 runtime loop status"
```

Expected: docs-only commit.

## Task 6: Targeted And Full Verification

**Files:**

- Read: `package.json`
- Read: changed files from Tasks 2-5

- [ ] **Step 1: Run targeted package verification**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test
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

Expected: all commands exit 0. If full verification fails outside the M1 change surface, capture the
failing command and decide whether it is a pre-existing baseline issue before changing unrelated
files.

- [ ] **Step 3: Inspect final diff and commit state**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: working tree is clean, and M1 implementation commits are visible at the top of the branch.

- [ ] **Step 4: Prepare final implementation report**

Report:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Implemented:
- Runtime Gateway proof: deterministic Codex short-task adapter stream test
- Workspace Core proof: RuntimeAdapter-backed submit/drain state propagation test
- Documentation proof: manual Codex smoke docs plus status and changelog updates
Verification:
- pnpm --filter @cairn/runtime-gateway test: pass/fail
- pnpm --filter @cairn/workspace-core test: pass/fail
- pnpm run check: pass/fail
- pnpm test: pass/fail
- git diff --check: pass/fail
Commits:
- commit SHA and subject for each M1 implementation commit
Concerns:
- manual Codex smoke result, or a short reason it was not run on this machine
```

Expected: the next reviewer can distinguish automated proof from opt-in real Codex smoke evidence.
