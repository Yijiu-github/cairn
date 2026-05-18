# Codex Runtime Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the next R1 Codex runtime slice by resolving artifact payload prompts, documenting a manual real-runtime smoke flow, and tightening observable cancel/kill behavior.

**Architecture:** Keep `@cairn/runtime-gateway` independent from `@cairn/application`: the Codex adapter gets an optional artifact payload resolver callback and reads only `ArtifactRef` data passed through the RuntimeAdapter contract. Workspace Core wires that resolver from its `ArtifactStorePort` when building the Codex adapter. Application-level operator cancel already delegates to `RuntimeGatewayPort.cancel`; this plan adds route-level proof and process-level SIGTERM/SIGKILL refinement without changing default mock runtime behavior.

**Tech Stack:** TypeScript ESM, Vitest, Fastify route tests, Codex CLI `exec --json`, existing RuntimeAdapter / ArtifactStorePort interfaces.

---

## Scope Check

In scope:

- Resolve `runtime-input.json` artifact payloads into real Codex prompts when `request.options.prompt` is absent.
- Preserve explicit `request.options.prompt` as the highest-priority override.
- Keep fallback behavior deterministic when payload reading fails.
- Wire Workspace Core Codex runtime factory to an artifact payload resolver without creating a runtime-gateway to application dependency.
- Tighten Codex process cancel so a process that exits during the grace window is not sent SIGKILL.
- Add Workspace Core route-level coverage that operator cancel reaches the injected runtime gateway.
- Add a manual, opt-in real Codex smoke procedure in engineering docs.
- Update status/changelog docs without claiming automated real Codex E2E is complete.

Out of scope:

- Do not put real Codex CLI smoke into default `pnpm test`.
- Do not create Desktop/Web code.
- Do not add a background scheduler.
- Do not change shared HTTP contracts or database schema.
- Do not make `@cairn/runtime-gateway` import `@cairn/application`.

## File Structure

- Modify: `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`
  - Adds `ArtifactPayloadResolver` option and async prompt resolution.
- Modify: `packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts`
  - Tests explicit prompt precedence, runtime-input JSON resolution, plain text fallback, and resolver failure fallback.
- Modify: `packages/runtime_gateway/src/adapters/codex/codex-process.ts`
  - Avoids SIGKILL after the process closes during cancel grace.
- Modify: `packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts`
  - Tests cancel grace behavior.
- Modify: `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`
  - Adds optional artifact payload resolver wiring for Codex runtime creation.
- Modify: `apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts`
  - Tests resolver injection into Codex adapter factory options.
- Modify: `apps/workspace-core/src/service/container.ts`
  - Passes artifact store information through composition only if needed by factory wiring.
- Modify: `apps/workspace-core/src/server.ts`
  - Wires Workspace Core artifact store resolver into the runtime gateway factory.
- Modify: `apps/workspace-core/src/service/app.spec.ts`
  - Adds route-level operator cancel proof with an injected runtime gateway.
- Modify: `docs/engineering/local-dev-setup.md`
  - Adds manual Codex runtime smoke and cancel procedure.
- Modify: `packages/runtime_gateway/README.md`
  - Updates follow-up list after payload resolver.
- Modify: `docs/STATUS.md`
  - Records resolver and manual smoke status, keeping real long-task smoke as opt-in evidence.
- Modify: `CHANGELOG.md`
  - Records the hardening slice.

## Task 1: Codex Artifact Payload Resolver

**Files:**

- Modify: `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`
- Modify: `packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts`

- [ ] **Step 1: Write failing test for runtime-input JSON payload resolution**

Add a test to `packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts`:

```ts
it('resolves runtime input artifact payloads into the Codex prompt', async () => {
  const child = new FakeCodexChildProcess();
  const calls: SpawnCall[] = [];
  const adapter = createCodexRuntimeAdapter({
    spawnProcess: (command, args, options) => {
      calls.push({ command, args, options });
      return child.asChildProcess();
    },
    resolveArtifactPayload: async (artifactRef) => {
      await Promise.resolve();
      expect(artifactRef).toEqual(createTestArtifactRef());
      return {
        mediaType: 'application/json',
        text: JSON.stringify({
          prompt: 'Summarize the staged runtime input.',
          taskId: 'task:1',
          orchestrationRunId: 'run:1',
        }),
        truncated: false,
      };
    },
    now,
    killGraceMs: 0,
  });
  await adapter.init(createTestAdapterContext());

  await adapter.submit(createTestSubmitRequest({ options: undefined }));

  expect(calls[0]?.args).toContain('Summarize the staged runtime input.');
  child.close(0);
  await adapter.shutdown();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test -- src/adapters/codex/codex-adapter.spec.ts
```

Expected: TypeScript or runtime failure because `resolveArtifactPayload` is not a recognized option and the prompt still contains artifact refs.

- [ ] **Step 3: Implement minimal resolver option**

In `packages/runtime_gateway/src/adapters/codex/codex-adapter.ts`, add:

```ts
export interface ResolvedArtifactPayload {
  mediaType: 'text/plain' | 'application/json';
  text: string;
  truncated: boolean;
}

export type ArtifactPayloadResolver = (
  artifactRef: ArtifactRef,
) => Promise<ResolvedArtifactPayload | undefined>;
```

Add to `CodexRuntimeAdapterOptions`:

```ts
resolveArtifactPayload?: ArtifactPayloadResolver;
```

Change `toPrompt` to async:

```ts
const toPrompt = async (
  request: AdapterSubmitRequest,
  resolveArtifactPayload: ArtifactPayloadResolver | undefined,
): Promise<string> => {
  const prompt =
    readStringOption(request.options, 'prompt') ??
    readStringOption(request.options, 'inlinePrompt') ??
    readStringOption(request.options, 'codexPrompt');

  if (prompt !== undefined) {
    return prompt;
  }

  const firstInput = request.inputs[0];
  if (firstInput !== undefined && resolveArtifactPayload !== undefined) {
    const payload = await resolveArtifactPayload(firstInput);
    const resolvedPrompt = payload === undefined ? undefined : promptFromPayload(payload.text);
    if (resolvedPrompt !== undefined) {
      return resolvedPrompt;
    }
  }

  if (request.inputs.length === 0) {
    return `Run Cairn AgentRun ${request.runId}.`;
  }

  const inputRefs = request.inputs.map((input) => `- ${input.uri ?? input.artifactId}`).join('\n');
  return `Run Cairn AgentRun ${request.runId} with these input artifact references:\n${inputRefs}`;
};
```

Add helper:

```ts
const promptFromPayload = (text: string): string | undefined => {
  const parsed = safeParseRuntimeInput(text);
  if (parsed !== undefined) {
    return parsed;
  }

  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const safeParseRuntimeInput = (text: string): string | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    if (
      typeof value === 'object' &&
      value !== null &&
      'prompt' in value &&
      typeof value.prompt === 'string' &&
      value.prompt.length > 0
    ) {
      return value.prompt;
    }
  } catch {
    return undefined;
  }

  return undefined;
};
```

In `submit`, compute:

```ts
const prompt = await toPrompt(request, options.resolveArtifactPayload);
```

Then pass `prompt` to `startCodexExec`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test -- src/adapters/codex/codex-adapter.spec.ts
```

Expected: all Codex adapter tests pass.

- [ ] **Step 5: Add prompt precedence and fallback tests**

Add tests covering:

```ts
it('keeps explicit prompt options ahead of artifact payload resolution', async () => {
  // resolver throws if called; request.options.prompt is used.
});

it('falls back to plain text payloads when the artifact is not runtime-input JSON', async () => {
  // resolver returns mediaType text/plain and text "Plain prompt".
});

it('falls back to artifact references when payload resolution fails', async () => {
  // resolver rejects; submit should still spawn with the existing artifact-ref prompt.
});
```

The failure fallback implementation should wrap only the resolver call:

```ts
try {
  const payload = await resolveArtifactPayload(firstInput);
  const resolvedPrompt = payload === undefined ? undefined : promptFromPayload(payload.text);
  if (resolvedPrompt !== undefined) {
    return resolvedPrompt;
  }
} catch {
  // Keep deterministic fallback prompt; Workspace Core smoke can still surface runtime failure later.
}
```

- [ ] **Step 6: Run package verification**

Run:

```bash
pnpm --filter @cairn/runtime-gateway typecheck
pnpm --filter @cairn/runtime-gateway lint
pnpm --filter @cairn/runtime-gateway test
```

Expected: all pass.

- [ ] **Step 7: Commit Task 1**

```bash
git add packages/runtime_gateway/src/adapters/codex/codex-adapter.ts packages/runtime_gateway/src/adapters/codex/codex-adapter.spec.ts
git commit -m "feat(runtime-gateway): 解析 Codex 输入产物 / resolve Codex input artifacts"
```

## Task 2: Workspace Core Resolver Wiring

**Files:**

- Modify: `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`
- Modify: `apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts`
- Modify: `apps/workspace-core/src/server.ts`

- [ ] **Step 1: Write failing factory test for resolver injection**

In `apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts`, change the fake `createCodexAdapter` override to receive options:

```ts
createCodexAdapter?: (options: CodexRuntimeAdapterOptions) => RuntimeAdapter;
```

Add a test:

```ts
it('passes an artifact payload resolver to the Codex adapter factory', async () => {
  const adapter = new RecordingRuntimeAdapter();
  let receivedOptions: CodexRuntimeAdapterOptions | undefined;

  const runtime = await createWorkspaceCoreRuntimeGateway(
    {
      runtime: 'codex',
      runtimeWorkdir: '/tmp/cairn-runtime',
    },
    {
      createCodexAdapter: (options) => {
        receivedOptions = options;
        return adapter;
      },
      resolveArtifactPayload: async () => ({
        mediaType: 'application/json',
        text: '{"prompt":"Hello from artifact"}',
        truncated: false,
      }),
    },
  );

  await expect(
    receivedOptions?.resolveArtifactPayload?.({ artifactId: 'artifact:1' }),
  ).resolves.toMatchObject({ text: '{"prompt":"Hello from artifact"}' });
  await runtime.close?.();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- src/runtime/runtime-gateway-factory.spec.ts
```

Expected: fails because override does not accept options and factory overrides do not include `resolveArtifactPayload`.

- [ ] **Step 3: Implement factory resolver wiring**

In `apps/workspace-core/src/runtime/runtime-gateway-factory.ts`, import `CodexRuntimeAdapterOptions` type and update overrides:

```ts
import type { CodexRuntimeAdapterOptions } from '@cairn/runtime-gateway/adapters/codex';

export interface WorkspaceCoreRuntimeGatewayFactoryOverrides {
  createCodexAdapter?: (options: CodexRuntimeAdapterOptions) => RuntimeAdapter;
  logger?: RuntimeLogger;
  resolveArtifactPayload?: CodexRuntimeAdapterOptions['resolveArtifactPayload'];
}
```

Build adapter options once:

```ts
const codexOptions: CodexRuntimeAdapterOptions = {
  ...(config.codexExecutable === undefined ? {} : { executable: config.codexExecutable }),
  ...(config.codexSandboxMode === undefined ? {} : { sandboxMode: config.codexSandboxMode }),
  ...(overrides.resolveArtifactPayload === undefined
    ? {}
    : { resolveArtifactPayload: overrides.resolveArtifactPayload }),
};

const adapter =
  overrides.createCodexAdapter?.(codexOptions) ?? createCodexRuntimeAdapter(codexOptions);
```

- [ ] **Step 4: Wire server artifact store resolver**

In `apps/workspace-core/src/server.ts`, create the container before runtime factory if needed so the resolver can use `container.artifactStore`. Preserve lifecycle close order:

```ts
const container = createDefaultWorkspaceCoreContainer({
  databasePath: config.databasePath,
  bootstrapWorkspaceId: config.bootstrapWorkspaceId,
  bootstrapEventId: config.bootstrapEventId,
});

const runtime = await createWorkspaceCoreRuntimeGateway(config, {
  resolveArtifactPayload: async (artifactRef) => {
    if (artifactRef.uri === undefined || !artifactRef.uri.startsWith('artifact-payload://')) {
      return undefined;
    }
    return container.artifactStore.readText(artifactRef.uri);
  },
});

container.runtimeGateway = runtime.gateway is not allowed because the object is immutable by convention.
```

Because the current container receives runtime gateway in its constructor, use this minimal two-step instead:

1. Create `artifactStore` before the container by extracting local artifact store creation from `container.ts` only if necessary.
2. Pass the same `artifactStore` into both `createDefaultWorkspaceCoreContainer` and the runtime factory.

Add `artifactStore?: ArtifactStorePort` to `CreateDefaultWorkspaceCoreContainerOptions` and use it instead of `createLocalArtifactStore(...)`.

- [ ] **Step 5: Run workspace-core tests**

Run:

```bash
pnpm --filter @cairn/workspace-core typecheck
pnpm --filter @cairn/workspace-core lint
pnpm --filter @cairn/workspace-core test
```

Expected: all pass.

- [ ] **Step 6: Commit Task 2**

```bash
git add apps/workspace-core/src/runtime/runtime-gateway-factory.ts apps/workspace-core/src/runtime/runtime-gateway-factory.spec.ts apps/workspace-core/src/server.ts apps/workspace-core/src/service/container.ts
git commit -m "feat(workspace-core): 注入运行时输入产物解析器 / inject runtime input resolver"
```

## Task 3: Cancel/Kill Tightening

**Files:**

- Modify: `packages/runtime_gateway/src/adapters/codex/codex-process.ts`
- Modify: `packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts`
- Modify: `apps/workspace-core/src/service/app.spec.ts`

- [ ] **Step 1: Write failing process cancel grace test**

Add to `packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts`:

```ts
it('does not escalate to SIGKILL when the process closes during cancel grace', async () => {
  const child = new FakeCodexChildProcess();
  const controller = startCodexExec(
    TEST_IDS.runId,
    {
      prompt: 'do work',
      sandboxDir: 'C:/tmp/cairn',
      finalArtifactRef: createTestArtifactRef(),
      now,
    },
    { spawnProcess: createFakeSpawn(child, []), killGraceMs: 10 },
  );

  const cancel = controller.cancel('operator_cancelled');
  child.close(null, 'SIGTERM');
  await cancel;

  expect(child.killedSignals).toEqual(['SIGTERM']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test -- src/adapters/codex/codex-process.spec.ts
```

Expected: fails because current cancel always sends SIGKILL after the grace delay.

- [ ] **Step 3: Implement close-aware cancel**

In `packages/runtime_gateway/src/adapters/codex/codex-process.ts`, add a close promise:

```ts
let closeObserved: Promise<void>;
let markClosed: (() => void) | undefined;

closeObserved = new Promise((resolve) => {
  markClosed = resolve;
});
```

Inside both close and error settling paths, call:

```ts
markClosed?.();
```

Change cancel:

```ts
async cancel() {
  if (settled) {
    return;
  }

  child.kill('SIGTERM');
  await Promise.race([delay(killGraceMs), closeObserved]);
  if (!settled) {
    child.kill('SIGKILL');
  }
}
```

- [ ] **Step 4: Write Workspace Core route-level cancel proof**

In `apps/workspace-core/src/service/app.spec.ts`, add a test using `MockRuntimeGatewayPort` injection:

```ts
it('dispatches runtime cancel when cancelling a submitted run through the operator route', async () => {
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
  } finally {
    await app.close();
  }
});
```

- [ ] **Step 5: Run verification for cancel**

Run:

```bash
pnpm --filter @cairn/runtime-gateway test -- src/adapters/codex/codex-process.spec.ts
pnpm --filter @cairn/workspace-core test -- src/service/app.spec.ts
```

Expected: both pass.

- [ ] **Step 6: Commit Task 3**

```bash
git add packages/runtime_gateway/src/adapters/codex/codex-process.ts packages/runtime_gateway/src/adapters/codex/codex-process.spec.ts apps/workspace-core/src/service/app.spec.ts
git commit -m "fix(runtime-gateway): 收紧 Codex 取消升级 / tighten Codex cancel escalation"
```

## Task 4: Manual Real Codex Smoke Documentation

**Files:**

- Modify: `docs/engineering/local-dev-setup.md`
- Modify: `packages/runtime_gateway/README.md`
- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update local dev smoke docs**

Add a subsection under `Workspace Core runtime 选择` in `docs/engineering/local-dev-setup.md`:

````md
### 手动 Codex runtime smoke

这不是默认 CI 门禁；只在本机已安装并登录 Codex CLI 时执行。

1. 启动 Workspace Core：

   ```bash
   CAIRN_WORKSPACE_CORE_RUNTIME=codex \
   CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR=.cairn/runtime \
   pnpm --filter @cairn/workspace-core dev
   ```
````

2. 在另一个终端创建 run、提交 agent run，并 drain runtime：

   ```bash
   curl -sS -X POST http://127.0.0.1:3000/v1/workspaces/01HZZZZZZZZZZZZZZZZZZZZZW0/runs \
     -H 'content-type: application/json' \
     -d '{"originEventId":"01HZZZZZZZZZZZZZZZZZZZZZE0","task":{"taskKind":"analysis","title":"Codex smoke","brief":"Return the exact text CAIRN_SMOKE_OK."}}'
   ```

   Use the returned run id to list tasks, submit:

   ```bash
   curl -sS -X POST http://127.0.0.1:3000/v1/tasks/<taskId>/agent-runs \
     -H 'content-type: application/json' \
     -d '{"runtimeType":"codex","model":"default","prompt":"Return exactly: CAIRN_SMOKE_OK"}'
   ```

   Then drain:

   ```bash
   curl -sS -X POST http://127.0.0.1:3000/v1/agent-runs/<agentRunId>/drain-runtime \
     -H 'content-type: application/json' \
     -d '{}'
   ```

3. Verify artifact payload:

   ```bash
   curl -sS http://127.0.0.1:3000/v1/runs/<runId>/artifacts
   curl -sS http://127.0.0.1:3000/v1/artifacts/<artifactId>/payload
   ```

4. Optional cancel smoke: submit a longer prompt, then call:

   ```bash
   curl -sS -X POST http://127.0.0.1:3000/v1/runs/<runId>/cancel \
     -H 'content-type: application/json' \
     -d '{"reason":"Manual cancel smoke."}'
   ```

````

- [ ] **Step 2: Update runtime gateway README and status**

In `packages/runtime_gateway/README.md`, remove the payload resolver follow-up and keep real smoke as manual/remaining:

```md
- 用真实长任务验证 Windows 下取消行为与 stdout JSONL 流式粒度，并记录手动 smoke 结果
````

In `docs/STATUS.md`, add that Codex adapter can resolve Workspace Core runtime input artifacts, but keep real long-task smoke/manual verification as not a default CI guarantee.

- [ ] **Step 3: Update changelog**

Add to `[Unreleased]`:

```md
- **Codex runtime hardening**：Codex adapter 可解析 Workspace Core runtime input artifact payload，补充取消升级细节与手动真实 Codex smoke 指引；默认测试仍不依赖真实 Codex CLI。
```

- [ ] **Step 4: Run docs verification**

Run:

```bash
pnpm run docs:lint
pnpm run format:check
```

Expected: both pass.

- [ ] **Step 5: Commit Task 4**

```bash
git add docs/engineering/local-dev-setup.md packages/runtime_gateway/README.md docs/STATUS.md CHANGELOG.md
git commit -m "docs(runtime): 补充 Codex 手动 smoke / document Codex smoke"
```

## Task 5: Final Verification and PR Update

**Files:**

- No direct file edits expected.

- [ ] **Step 1: Run full verification**

Run:

```bash
rm -rf apps/workspace-core/.cairn
pnpm run check
pnpm test
git diff --check
```

Expected:

- `pnpm run check`: typecheck, lint, docs lint, format check all pass.
- `pnpm test`: all package tests pass; skipped SQLite tests remain as existing skips only.
- `git diff --check`: no output.

- [ ] **Step 2: Inspect branch**

Run:

```bash
git status --short --branch
git log --oneline origin/codex/runtime-adapter-slice..HEAD
```

Expected: clean worktree and the new task commits listed.

- [ ] **Step 3: Push PR branch**

Run:

```bash
git push
```

Expected: PR #30 updates.
