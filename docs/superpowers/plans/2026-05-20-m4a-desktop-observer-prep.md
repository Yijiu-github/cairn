# M4a Desktop Observer Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Desktop shell read real Workspace Core run replay evidence through a minimal
read-only preload allowlist.

**Architecture:** Keep Workspace Core authority in Electron main: renderer calls preload, preload
invokes IPC, main uses the existing sidecar token and loopback base URL. Reuse the existing
`RunReplaySource` contract and derive small renderer view models locally without adding Workspace
Core endpoints or operator actions.

**Tech Stack:** TypeScript strict ESM, Electron main/preload/renderer, React, `@cairn/ui`,
`@cairn/shared-contracts`, Vitest, electron-vite.

---

## Scope Check

The spec is a single focused M4a slice. It touches Desktop main, preload, renderer, package
dependency metadata, and status/security docs. It does not require Workspace Core API changes,
schema migrations, runtime adapter changes, or Web Shell work.

## File Map

- Modify `apps/desktop/package.json`
  - Add `@cairn/shared-contracts` as a workspace dependency so Desktop can import
    `RunReplaySource` and id schemas.
- Modify `apps/desktop/src/main/workspace-core-client.ts`
  - Export `getWorkspaceCoreRunReplaySource()`.
  - Reuse the existing fixed-endpoint `requestJson()` helper.
  - Validate run id with `OrchestrationRunId`.
- Modify `apps/desktop/src/main/workspace-core-client.spec.ts`
  - Add red/green tests for the new replay-source client behavior.
- Modify `apps/desktop/src/main/index.ts`
  - Register `workspace-core:get-run-replay-source`.
  - Keep token/base URL in main only.
- Modify `apps/desktop/src/main/index.spec.ts`
  - Prove the IPC handler is registered after bootstrap.
- Modify `apps/desktop/src/preload/index.ts`
  - Expose `workspaceCore.getRunReplaySource(runId)`.
- Modify `apps/desktop/src/renderer/src/desktop-app.tsx`
  - Track `observedRunId`, replay source loading/error state, and render real Run Detail evidence
    when available.
  - Keep operator controls disabled.
- Modify `apps/desktop/src/renderer/src/preload.d.ts`
  - Type bridge updates through the preload export.
- Modify `docs/STATUS.md`, `CHANGELOG.md`, and maybe `docs/design/security-model.md`
  - State that Desktop can read replay-source evidence but is not a complete live UI and still has
    no operator actions or local path reveal.

---

## Task 1: Add Desktop Replay Source Client

**Files:**

- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/src/main/workspace-core-client.spec.ts`
- Modify: `apps/desktop/src/main/workspace-core-client.ts`

- [ ] **Step 1: Add the failing client test**

In `apps/desktop/src/main/workspace-core-client.spec.ts`, update the import:

```ts
import {
  getWorkspaceCoreRunReplaySource,
  runWorkspaceCoreMockSmoke,
} from './workspace-core-client.js';
```

Then add this test inside `describe('workspace-core client', () => { ... })` after the existing
mock smoke test:

```ts
it('reads run replay source through the fixed Workspace Core endpoint', async () => {
  const requests: { authorization?: string | undefined; method: string; url: string }[] = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const requestUrl = toRequestUrl(url);
    requests.push({
      authorization:
        init?.headers instanceof Headers
          ? (init.headers.get('authorization') ?? undefined)
          : (init?.headers as Record<string, string> | undefined)?.authorization,
      method: init?.method ?? 'GET',
      url: requestUrl,
    });

    if (requestUrl === 'http://127.0.0.1:51324/v1/runs/01J000000000000000000000R0/replay-source') {
      await Promise.resolve();
      return jsonResponse(200, {
        agentRuns: [],
        artifacts: [],
        inspector: {
          agentRunCount: 0,
          artifactCount: 0,
          errorEventCount: 0,
          status: 'running',
          taskCount: 1,
          traceEventCount: 1,
          warningEventCount: 0,
        },
        run: {
          createdAt: '2026-05-20T00:00:00.000Z',
          executionMode: 'single_worker',
          orchestrationRunId: '01J000000000000000000000R0',
          status: 'running',
          traceId: '01J000000000000000000000T0',
          triggerType: 'manual',
          updatedAt: '2026-05-20T00:00:00.000Z',
          workspaceId: '01J000000000000000000000W0',
        },
        tasks: [
          {
            attempt: 0,
            createdAt: '2026-05-20T00:00:00.000Z',
            status: 'running',
            taskId: '01J000000000000000000000K0',
            taskKind: 'custom',
            title: 'Desktop observer smoke',
            updatedAt: '2026-05-20T00:00:00.000Z',
            workspaceId: '01J000000000000000000000W0',
          },
        ],
        traceEvents: [
          {
            createdAt: '2026-05-20T00:00:00.000Z',
            eventType: 'run.queued',
            level: 'info',
            payload: {},
            traceEventId: '01J000000000000000000000V0',
            traceId: '01J000000000000000000000T0',
            workspaceId: '01J000000000000000000000W0',
          },
        ],
      });
    }

    throw new Error(`Unexpected URL ${requestUrl}`);
  };

  const result = await getWorkspaceCoreRunReplaySource({
    authToken: 'desktop-launch-token',
    baseUrl: 'http://127.0.0.1:51324',
    fetch: fetchImpl,
    runId: '01J000000000000000000000R0',
  });

  expect(result.inspector).toMatchObject({
    status: 'running',
    taskCount: 1,
    traceEventCount: 1,
  });
  expect(requests).toEqual([
    {
      authorization: 'Bearer desktop-launch-token',
      method: 'GET',
      url: 'http://127.0.0.1:51324/v1/runs/01J000000000000000000000R0/replay-source',
    },
  ]);
});

it('rejects invalid replay source run ids before calling Workspace Core', async () => {
  const fetchImpl = vi.fn<typeof fetch>();

  await expect(
    getWorkspaceCoreRunReplaySource({
      authToken: 'desktop-launch-token',
      baseUrl: 'http://127.0.0.1:51324',
      fetch: fetchImpl,
      runId: '../not-a-run',
    }),
  ).rejects.toThrow('Invalid Workspace Core run id.');
  expect(fetchImpl).not.toHaveBeenCalled();
});
```

Also update the Vitest import:

```ts
import { describe, expect, it, vi } from 'vitest';
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
pnpm --filter @cairn/desktop test -- src/main/workspace-core-client.spec.ts
```

Expected: FAIL because `getWorkspaceCoreRunReplaySource` is not exported.

- [ ] **Step 3: Add shared contracts dependency**

Modify `apps/desktop/package.json` dependencies:

```json
"@cairn/shared-contracts": "workspace:*",
"@cairn/ui": "workspace:*",
```

- [ ] **Step 4: Implement the replay source client**

In `apps/desktop/src/main/workspace-core-client.ts`, add imports:

```ts
import { OrchestrationRunId } from '@cairn/shared-contracts';

import type { RunReplaySource } from '@cairn/shared-contracts';
```

Add the options interface near the existing mock smoke options:

```ts
export interface GetWorkspaceCoreRunReplaySourceOptions {
  readonly authToken: string;
  readonly baseUrl: string;
  readonly fetch?: typeof fetch | undefined;
  readonly runId: string;
}
```

Add the function before `type RequestMethod`:

```ts
export const getWorkspaceCoreRunReplaySource = async (
  options: GetWorkspaceCoreRunReplaySourceOptions,
): Promise<RunReplaySource> => {
  const runId = OrchestrationRunId.safeParse(options.runId);
  if (!runId.success) {
    throw new Error('Invalid Workspace Core run id.');
  }

  return requestJson<RunReplaySource>(options.fetch ?? fetch, options, {
    method: 'GET',
    path: `/v1/runs/${runId.data}/replay-source`,
  });
};
```

- [ ] **Step 5: Run the focused test and verify green**

Run:

```bash
pnpm --filter @cairn/desktop test -- src/main/workspace-core-client.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add apps/desktop/package.json apps/desktop/src/main/workspace-core-client.ts apps/desktop/src/main/workspace-core-client.spec.ts
git commit -m "feat(desktop): 读取 run replay source / read run replay source"
```

Expected: one commit containing only the Desktop client dependency, tests, and implementation.

---

## Task 2: Expose Replay Source Through IPC And Preload

**Files:**

- Modify: `apps/desktop/src/main/index.spec.ts`
- Modify: `apps/desktop/src/main/index.ts`
- Modify: `apps/desktop/src/preload/index.ts`

- [ ] **Step 1: Write the failing IPC registration test**

In `apps/desktop/src/main/index.spec.ts`, add `ipcMain` to `desktopHarness`:

```ts
    ipcMain: {
      handle: vi.fn(),
    },
```

Change the electron mock to use it:

```ts
  ipcMain: desktopHarness.ipcMain,
```

Then extend the existing test after bootstrap is called:

```ts
const bootstrapOptions = desktopHarness.bootstrapDesktopMain.mock.calls[0]?.[0];
expect(bootstrapOptions).toBeDefined();
bootstrapOptions?.registerWorkspaceCoreIpcHandlers();

expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
  'workspace-core:get-status',
  expect.any(Function),
);
expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
  'workspace-core:run-mock-smoke',
  expect.any(Function),
);
expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
  'workspace-core:get-run-replay-source',
  expect.any(Function),
);
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
pnpm --filter @cairn/desktop test -- src/main/index.spec.ts
```

Expected: FAIL because the replay-source IPC channel is not registered.

- [ ] **Step 3: Implement the main IPC handler**

In `apps/desktop/src/main/index.ts`, update the client import:

```ts
import {
  getWorkspaceCoreRunReplaySource,
  runWorkspaceCoreMockSmoke,
} from './workspace-core-client.js';
```

Add this helper near `registerWorkspaceCoreIpcHandlers()`:

```ts
async function getHealthyWorkspaceCoreStatus(
  workspaceCoreSidecar: WorkspaceCoreSidecarManager,
): Promise<WorkspaceCoreSidecarStatus> {
  const status =
    workspaceCoreSidecar.getStatus().state === 'healthy'
      ? workspaceCoreSidecar.getStatus()
      : await workspaceCoreSidecar.start();

  if (status.state !== 'healthy') {
    throw new Error(status.lastError ?? 'Workspace Core sidecar is not healthy.');
  }

  return status;
}
```

Refactor the mock smoke handler to use it, then add:

```ts
ipcMain.handle('workspace-core:get-run-replay-source', async (_event, runId: unknown) => {
  if (typeof runId !== 'string') {
    throw new Error('Invalid Workspace Core run id.');
  }

  const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

  return getWorkspaceCoreRunReplaySource({
    authToken: workspaceCoreAuthToken,
    baseUrl: status.baseUrl,
    runId,
  });
});
```

- [ ] **Step 4: Expose the preload allowlist method**

In `apps/desktop/src/preload/index.ts`, import `RunReplaySource`:

```ts
import type { RunReplaySource } from '@cairn/shared-contracts';
```

Add to `CairnDesktopBridge.workspaceCore`:

```ts
readonly getRunReplaySource: (runId: string) => Promise<RunReplaySource>;
```

Add to `bridge.workspaceCore`:

```ts
    getRunReplaySource: (runId) =>
      ipcRenderer.invoke(
        'workspace-core:get-run-replay-source',
        runId,
      ) as Promise<RunReplaySource>,
```

- [ ] **Step 5: Run IPC test and desktop typecheck**

Run:

```bash
pnpm --filter @cairn/desktop test -- src/main/index.spec.ts
pnpm --filter @cairn/desktop typecheck
```

Expected: both PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add apps/desktop/src/main/index.ts apps/desktop/src/main/index.spec.ts apps/desktop/src/preload/index.ts
git commit -m "feat(desktop): 暴露只读 replay source bridge / expose read-only replay bridge"
```

Expected: one commit containing only IPC/preload bridge changes and tests.

---

## Task 3: Render Real Replay Evidence In Run Detail

**Files:**

- Modify: `apps/desktop/src/renderer/src/desktop-app.tsx`

- [ ] **Step 1: Run a renderer-focused typecheck baseline**

Run:

```bash
pnpm --filter @cairn/desktop typecheck
```

Expected: PASS before renderer edits.

- [ ] **Step 2: Add renderer state and loading function**

In `apps/desktop/src/renderer/src/desktop-app.tsx`, add:

```ts
import type { RunReplaySource } from '@cairn/shared-contracts';
import type {
  CairnEvidenceTone,
  CairnRunStatus,
  CairnTaskStatus,
  EvidenceTimelineItem,
  RunCardProps,
  TaskTreeItem,
} from '@cairn/ui';
```

Update the existing `@cairn/ui` type imports if needed so values and types stay separate.

Inside `DesktopApp`, add state:

```ts
const [observedRunId, setObservedRunId] = useState<string>();
const [runReplaySource, setRunReplaySource] = useState<RunReplaySource>();
const [runReplayLoading, setRunReplayLoading] = useState(false);
const [runReplayError, setRunReplayError] = useState<string>();
```

Add the loader:

```ts
async function loadRunReplaySource(runId: string) {
  if (window.cairnDesktop?.workspaceCore === undefined) {
    return;
  }

  setRunReplayLoading(true);
  setRunReplayError(undefined);
  try {
    setRunReplaySource(await window.cairnDesktop.workspaceCore.getRunReplaySource(runId));
    setWorkspaceCoreStatus(await window.cairnDesktop.workspaceCore.getStatus());
  } catch (error) {
    setRunReplayError(toErrorMessage(error));
  } finally {
    setRunReplayLoading(false);
  }
}
```

In `runMockSmoke()`, after `setSmokeResult(result);`, add:

```ts
setObservedRunId(result.runId);
await loadRunReplaySource(result.runId);
```

Pass the new state to `RunDetailView`:

```tsx
{
  activeView === 'run-detail' ? (
    <RunDetailView
      observedRunId={observedRunId}
      onRefreshReplay={loadRunReplaySource}
      replayError={runReplayError}
      replayLoading={runReplayLoading}
      replaySource={runReplaySource}
    />
  ) : undefined;
}
```

- [ ] **Step 3: Replace RunDetailView with replay-aware rendering**

Replace `function RunDetailView()` with:

```tsx
interface RunDetailViewProps {
  readonly observedRunId?: string | undefined;
  readonly onRefreshReplay: (runId: string) => Promise<void>;
  readonly replayError?: string | undefined;
  readonly replayLoading: boolean;
  readonly replaySource?: RunReplaySource | undefined;
}

function RunDetailView({
  observedRunId,
  onRefreshReplay,
  replayError,
  replayLoading,
  replaySource,
}: RunDetailViewProps) {
  const staticRun = desktopShellModel.pinnedRuns[0];
  const runCard = replaySource === undefined ? staticRun : toRunCardProps(replaySource);
  const timelineItems =
    replaySource === undefined
      ? desktopShellModel.runDetail.evidence
      : toEvidenceTimelineItems(replaySource);
  const taskItems =
    replaySource === undefined ? desktopShellModel.runDetail.tasks : toTaskTreeItems(replaySource);
  const selectedTaskId =
    replaySource?.tasks[0]?.taskId ?? desktopShellModel.runDetail.selectedTaskId;

  if (runCard === undefined) {
    return <InlineAlert tone="info">No selected run is available.</InlineAlert>;
  }

  return (
    <div className="content-grid">
      <section className="content-stack">
        {replayError === undefined ? undefined : (
          <InlineAlert tone="danger" title="Run evidence failed to load">
            {replayError}
          </InlineAlert>
        )}
        {replaySource === undefined ? (
          <InlineAlert tone="info" title="Static Run Detail fallback">
            Run the bounded smoke path from Home to load real Workspace Core replay evidence.
          </InlineAlert>
        ) : (
          <InlineAlert tone="success" title="Live replay source">
            Showing sanitized Workspace Core evidence for {replaySource.run.orchestrationRunId}.
          </InlineAlert>
        )}
        <RunCard {...runCard} />
        <EvidenceTimeline items={timelineItems} />
      </section>
      <aside className="content-stack">
        <TaskTree items={taskItems} selectedId={selectedTaskId} />
        {replaySource === undefined ? undefined : (
          <ReplayInspectorCard replaySource={replaySource} />
        )}
        <Card>
          <CardHeader>
            <CardTitle>Operator controls</CardTitle>
            <CardDescription>Disabled until explicit IPC and safety gates exist.</CardDescription>
          </CardHeader>
          <CardContent className="button-row">
            <Button
              disabled={observedRunId === undefined}
              loading={replayLoading}
              onClick={() => {
                if (observedRunId !== undefined) {
                  void onRefreshReplay(observedRunId);
                }
              }}
              variant="secondary"
            >
              Refresh Evidence
            </Button>
            <Button disabled>Approve</Button>
            <Button disabled variant="warning">
              Pause
            </Button>
            <Button disabled variant="danger">
              Cancel
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: Add replay view-model helpers**

Add helpers near `toStatusTone()`:

```ts
function ReplayInspectorCard({ replaySource }: { readonly replaySource: RunReplaySource }) {
  const inspector = replaySource.inspector;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Replay inspector</CardTitle>
        <CardDescription>Read-only summary derived from Workspace Core replay source.</CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Tasks', value: inspector.taskCount },
            { label: 'Agent runs', value: inspector.agentRunCount },
            { label: 'Artifacts', value: inspector.artifactCount },
            { label: 'Trace events', value: inspector.traceEventCount },
            { label: 'Warnings', value: inspector.warningEventCount },
            { label: 'Errors', value: inspector.errorEventCount },
            { label: 'First failure', value: inspector.firstFailureEventType ?? 'none' },
            { label: 'Final artifact', value: inspector.finalArtifactId ?? 'none' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function toRunCardProps(replaySource: RunReplaySource): RunCardProps {
  return {
    agentLabel: 'Workspace Core',
    description: `Replay source contains ${replaySource.tasks.length.toString()} task(s), ${replaySource.artifacts.length.toString()} artifact(s), and ${replaySource.traceEvents.length.toString()} trace event(s).`,
    metrics: [
      { label: 'Tasks', value: replaySource.inspector.taskCount },
      { label: 'Artifacts', value: replaySource.inspector.artifactCount },
      { label: 'Trace', value: replaySource.inspector.traceEventCount },
    ],
    progress: toRunProgress(replaySource.run.status),
    runId: replaySource.run.orchestrationRunId,
    status: toCairnRunStatus(replaySource.run.status),
    title: `Workspace Core run · ${replaySource.run.status}`,
  };
}

function toTaskTreeItems(replaySource: RunReplaySource): readonly TaskTreeItem[] {
  return replaySource.tasks.map((task) => ({
    attempt: task.attempt,
    id: task.taskId,
    label: task.title,
    metadata: task.taskKind,
    status: toCairnTaskStatus(task.status),
  }));
}

function toEvidenceTimelineItems(replaySource: RunReplaySource): readonly EvidenceTimelineItem[] {
  return replaySource.traceEvents.map((event) => ({
    description: `${event.level} · ${event.traceEventId}`,
    id: event.traceEventId,
    metadata: `trace ${event.traceId}`,
    time: formatTraceTime(event.createdAt),
    title: event.eventType,
    tone: toEvidenceTone(event.level),
  }));
}

function toCairnRunStatus(status: RunReplaySource['run']['status']): CairnRunStatus {
  if (status === 'succeeded') {
    return 'completed';
  }

  if (status === 'queued') {
    return 'idle';
  }

  if (status === 'planning' || status === 'running' || status === 'paused') {
    return 'running';
  }

  if (status === 'cancelled') {
    return 'cancelled';
  }

  if (status === 'failed' || status === 'timeout') {
    return 'failed';
  }

  return 'blocked';
}

function toCairnTaskStatus(status: RunReplaySource['tasks'][number]['status']): CairnTaskStatus {
  if (status === 'succeeded') {
    return 'completed';
  }

  if (status === 'ready' || status === 'queued') {
    return 'todo';
  }

  if (status === 'dispatched' || status === 'running') {
    return 'running';
  }

  if (status === 'cancelled' || status === 'skipped') {
    return 'cancelled';
  }

  if (status === 'failed' || status === 'timeout') {
    return 'failed';
  }

  return 'blocked';
}

function toRunProgress(status: RunReplaySource['run']['status']): number {
  if (status === 'succeeded') {
    return 100;
  }

  if (status === 'failed' || status === 'cancelled' || status === 'timeout') {
    return 100;
  }

  if (status === 'running') {
    return 65;
  }

  if (status === 'planning') {
    return 25;
  }

  return 10;
}

function toEvidenceTone(level: RunReplaySource['traceEvents'][number]['level']): CairnEvidenceTone {
  if (level === 'error') {
    return 'danger';
  }

  if (level === 'warn') {
    return 'warning';
  }

  return 'info';
}

function formatTraceTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
```

- [ ] **Step 5: Run desktop typecheck and build**

Run:

```bash
pnpm --filter @cairn/desktop typecheck
pnpm --filter @cairn/desktop build
```

Expected: both PASS.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add apps/desktop/src/renderer/src/desktop-app.tsx
git commit -m "feat(desktop): 展示真实 replay evidence / show real replay evidence"
```

Expected: one commit containing renderer-only changes.

---

## Task 4: Update Status And Security Docs

**Files:**

- Modify: `docs/STATUS.md`
- Modify: `docs/design/security-model.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Locate update sections**

Run:

```bash
rg -n "Desktop Shell|Desktop|preload|contextBridge|Unreleased|M4a|replay source" docs/STATUS.md docs/design/security-model.md CHANGELOG.md
```

Expected: output shows Desktop status, security allowlist, and changelog sections.

- [ ] **Step 2: Update `docs/STATUS.md`**

In the Desktop Shell section, add that Desktop can read sanitized run replay source for the mock
smoke run through a read-only preload allowlist, while retaining the no-operator-action and no-local
path boundaries.

In R1 incomplete capabilities, keep full Desktop UI, operator UI, artifact payload viewer, run list,
and packaging as incomplete.

- [ ] **Step 3: Update `docs/design/security-model.md`**

Add or adjust the Desktop bridge allowlist note so it includes:

```markdown
- `workspaceCore.getRunReplaySource(runId)`：只读读取 Workspace Core 已清洗的
  RunReplaySource；renderer 只能传 run id，不能传 base URL、token 或任意 endpoint。
```

Keep the statement that operator actions and local filesystem powers require explicit future gates.

- [ ] **Step 4: Update `CHANGELOG.md`**

Under `[Unreleased]` / Added, add:

```markdown
- **M4a Desktop observer prep**：Desktop preload 新增只读 replay-source bridge，可通过
  mock smoke 生成的 run id 读取真实 Workspace Core evidence 并在 Run Detail 展示摘要；operator
  action、artifact payload 正文和本地路径 reveal 仍未开放。
```

- [ ] **Step 5: Run docs checks**

Run:

```bash
pnpm exec markdownlint-cli2 docs/STATUS.md docs/design/security-model.md CHANGELOG.md
pnpm exec prettier --check docs/STATUS.md docs/design/security-model.md CHANGELOG.md
```

Expected: both PASS.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add docs/STATUS.md docs/design/security-model.md CHANGELOG.md
git commit -m "docs(desktop): 同步 M4a 观察台状态 / sync M4a observer status"
```

Expected: one docs-only commit.

---

## Task 5: Final Verification

**Files:**

- Read: all changed files

- [ ] **Step 1: Run Desktop focused verification**

Run:

```bash
pnpm --filter @cairn/desktop test
pnpm --filter @cairn/desktop build
```

Expected: both PASS.

- [ ] **Step 2: Run full repository gates**

Run:

```bash
pnpm run check
pnpm test
git diff --check
```

Expected: all PASS.

- [ ] **Step 3: Inspect final branch state**

Run:

```bash
git status --short --branch
git log --oneline -8
```

Expected: working tree clean; M4a implementation commits are on
`codex/m4a-desktop-observer-prep`.

- [ ] **Step 4: Prepare completion summary**

Report:

- Branch name.
- Commit SHAs and subjects.
- Verification commands and results.
- Residual risks: no full Desktop UI, no operator action, no artifact payload viewer, no packaging.
