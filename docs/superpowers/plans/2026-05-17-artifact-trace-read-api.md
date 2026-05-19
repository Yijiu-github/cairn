# Artifact Trace Read API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the existing Artifact / TraceEvent read contracts in Workspace Core so Run Detail and future replay UI can consume artifact metadata and ordered trace events.

**Architecture:** Keep this slice read-only. Repository ports gain artifact and trace query methods; Workspace Core implements `GET /v1/runs/:runId/artifacts`, `GET /v1/artifacts/:artifactId`, and `GET /v1/runs/:runId/trace` using existing schemas and database tables. Runtime-generated artifact file contents remain out of scope; this slice exposes metadata and replay inputs only.

**Tech Stack:** TypeScript ESM, Fastify, Vitest, Drizzle SQLite, existing Zod schemas / ts-rest contracts.

---

## Scope Check

In scope:

- Add repository read methods for artifact metadata and TraceEvent replay source.
- Implement in-memory and SQLite repository reads.
- Add Workspace Core route tests and routes for existing shared contract paths.
- Preserve pagination shape as `{ items }` for this R1 slice; no cursor math yet.
- Update `CHANGELOG.md`.

Out of scope:

- Do not write artifact file contents.
- Do not add artifact upload / create HTTP APIs.
- Do not add Desktop / Web UI.
- Do not introduce cursor pagination semantics beyond returning ordered items.
- Do not change shared schema shape.

## File Structure

Modify these files:

- `packages/application/src/ports/run-repository.ts`
  - Adds read methods to the application repository port.
- `packages/application/src/testing/memory-run-repository.ts`
  - Stores artifacts in memory and lists trace events by run.
- `apps/workspace-core/src/storage/sqlite-application-repository.ts`
  - Implements artifact and trace queries using `artifacts` and `trace_events` tables.
- `apps/workspace-core/src/storage/sqlite-application-repository.spec.ts`
  - Verifies artifact and trace reads across repository instances.
- `apps/workspace-core/src/service/app.ts`
  - Adds read routes.
- `apps/workspace-core/src/service/app.spec.ts`
  - Adds HTTP route tests via runtime drain trace data and direct repository fixture artifact.
- `CHANGELOG.md`
  - Records the read API slice.

## Task 1: Repository Read Ports

**Files:**

- Modify: `packages/application/src/ports/run-repository.ts`
- Modify: `packages/application/src/testing/memory-run-repository.ts`

- [x] **Step 1: Extend repository port imports**

In `packages/application/src/ports/run-repository.ts`, add `Artifact` and `ArtifactId` to imports from `@cairn/shared-contracts/schemas`.

- [x] **Step 2: Add repository methods**

In `ApplicationRepository`, add these methods after `listAgentRunsByTask`:

```ts
  listArtifactsByRun(orchestrationRunId: OrchestrationRunId): Promise<Artifact[]>;
  getArtifact(artifactId: ArtifactId): Promise<Artifact | undefined>;
  listTraceEventsByRun(orchestrationRunId: OrchestrationRunId): Promise<TraceEvent[]>;
```

- [x] **Step 3: Update memory repository storage**

In `packages/application/src/testing/memory-run-repository.ts`, import `Artifact` and `ArtifactId`.

Add:

```ts
  private readonly artifacts = new Map<ArtifactId, Artifact>();
```

near the other maps.

Add these methods after `listAgentRunsByTask`:

```ts
  listArtifactsByRun(orchestrationRunId: OrchestrationRunId): Promise<Artifact[]> {
    return Promise.resolve(
      [...this.artifacts.values()].filter(
        (artifact) => artifact.orchestrationRunId === orchestrationRunId,
      ),
    );
  }

  getArtifact(artifactId: ArtifactId): Promise<Artifact | undefined> {
    return Promise.resolve(this.artifacts.get(artifactId));
  }

  listTraceEventsByRun(orchestrationRunId: OrchestrationRunId): Promise<TraceEvent[]> {
    return Promise.resolve(
      this.traceEvents
        .filter((event) => event.orchestrationRunId === orchestrationRunId)
        .toSorted((left, right) => left.createdAt.localeCompare(right.createdAt)),
    );
  }
```

Add a testing helper near `createAgentRun`:

```ts
  createArtifact(artifact: Artifact): Promise<void> {
    this.artifacts.set(artifact.artifactId, artifact);
    return Promise.resolve();
  }
```

This helper is intentionally not part of `ApplicationRepository`.

- [x] **Step 4: Verify application**

Run:

```bash
pnpm --filter @cairn/application typecheck
pnpm --filter @cairn/application test
```

Expected: both commands exit `0`.

- [x] **Step 5: Commit repository port slice**

Run:

```bash
git add packages/application/src/ports/run-repository.ts packages/application/src/testing/memory-run-repository.ts
git commit -m "feat(application): 增加产物和追踪读取端口 / add artifact and trace read ports"
```

Expected: commit succeeds.

## Task 2: SQLite Artifact and Trace Reads

**Files:**

- Modify: `apps/workspace-core/src/storage/sqlite-application-repository.ts`
- Modify: `apps/workspace-core/src/storage/sqlite-application-repository.spec.ts`

- [x] **Step 1: Add storage tests**

In `apps/workspace-core/src/storage/sqlite-application-repository.spec.ts`, add a test that:

1. Creates a run graph.
2. Creates an agent run.
3. Inserts an artifact row directly through `repository.createArtifact` if added as a public helper, or through `storage.db.insert(artifacts)` if keeping write helpers out of repository.
4. Appends two trace events out of order.
5. Opens a second repository on the same database.
6. Expects `listArtifactsByRun` to return the artifact, `getArtifact` to return it, and `listTraceEventsByRun` to return events sorted by `createdAt`.

Use existing ids and fixture style from the file.

- [x] **Step 2: Run storage test and verify failure**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- sqlite-application-repository.spec.ts
```

Expected: fail because SQLite methods do not exist yet.

- [x] **Step 3: Implement SQLite methods**

In `apps/workspace-core/src/storage/sqlite-application-repository.ts`:

1. Import `artifacts` from `@cairn/domain/schema`.
2. Import `Artifact` and `ArtifactId` types / schemas.
3. Add methods after `listAgentRunsByTask`:

```ts
  listArtifactsByRun(orchestrationRunId: OrchestrationRunId): Promise<Artifact[]> {
    const rows = this.db
      .select()
      .from(artifacts)
      .where(eq(artifacts.orchestrationRunId, orchestrationRunId))
      .orderBy(asc(artifacts.createdAt))
      .all();
    return Promise.resolve(rows.map(fromArtifactRow));
  }

  getArtifact(artifactId: ArtifactId): Promise<Artifact | undefined> {
    const row = this.db
      .select()
      .from(artifacts)
      .where(eq(artifacts.artifactId, artifactId))
      .get();
    return Promise.resolve(row === undefined ? undefined : fromArtifactRow(row));
  }

  listTraceEventsByRun(orchestrationRunId: OrchestrationRunId): Promise<TraceEvent[]> {
    const rows = this.db
      .select()
      .from(traceEvents)
      .where(eq(traceEvents.orchestrationRunId, orchestrationRunId))
      .orderBy(asc(traceEvents.createdAt))
      .all();
    return Promise.resolve(rows.map(fromTraceEventRow));
  }
```

Add helper functions near `toTraceEventRow`:

```ts
const fromArtifactRow = (row: typeof artifacts.$inferSelect): Artifact =>
  Artifact.parse({
    artifactId: row.artifactId,
    workspaceId: row.workspaceId,
    ...(row.orchestrationRunId === null ? {} : { orchestrationRunId: row.orchestrationRunId }),
    ...(row.taskId === null ? {} : { taskId: row.taskId }),
    ...(row.runId === null ? {} : { runId: row.runId }),
    artifactRole: row.artifactRole,
    kind: row.kind,
    formatVersion: row.formatVersion,
    uriOrPath: row.uriOrPath,
    ...(row.contentType === null ? {} : { contentType: row.contentType }),
    ...(row.sizeBytes === null ? {} : { sizeBytes: row.sizeBytes }),
    producerType: row.producerType,
    ...(row.producerId === null ? {} : { producerId: row.producerId }),
    visibility: row.visibility,
    createdAt: row.createdAt,
  });

const fromTraceEventRow = (row: typeof traceEvents.$inferSelect): TraceEvent =>
  TraceEvent.parse({
    traceEventId: row.traceEventId,
    workspaceId: row.workspaceId,
    ...(row.orchestrationRunId === null ? {} : { orchestrationRunId: row.orchestrationRunId }),
    ...(row.taskId === null ? {} : { taskId: row.taskId }),
    ...(row.runId === null ? {} : { runId: row.runId }),
    eventType: row.eventType,
    level: row.level,
    ...(row.payloadRef === null ? {} : { payloadRef: row.payloadRef }),
    ...(row.payloadInline === null ? {} : { payloadInline: row.payloadInline }),
    createdAt: row.createdAt,
    traceId: row.traceId,
  });
```

- [x] **Step 4: Verify storage**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- sqlite-application-repository.spec.ts
pnpm --filter @cairn/workspace-core typecheck
```

Expected: both commands exit `0`.

- [x] **Step 5: Commit SQLite slice**

Run:

```bash
git add apps/workspace-core/src/storage/sqlite-application-repository.ts apps/workspace-core/src/storage/sqlite-application-repository.spec.ts
git commit -m "feat(workspace-core): 增加产物和追踪存储读取 / add artifact and trace storage reads"
```

Expected: commit succeeds.

## Task 3: Workspace Core Read Routes

**Files:**

- Modify: `apps/workspace-core/src/service/app.ts`
- Modify: `apps/workspace-core/src/service/app.spec.ts`

- [x] **Step 1: Add route tests**

In `apps/workspace-core/src/service/app.spec.ts`, add tests for:

1. `GET /v1/runs/:runId/trace` after draining runtime events returns ordered items and includes `run.succeeded`.
2. `GET /v1/runs/:runId/artifacts` returns `{ items: [] }` for a valid run with no metadata artifacts.
3. `GET /v1/artifacts/:artifactId` returns 404 for a missing artifact.
4. Invalid IDs return 400.

- [x] **Step 2: Run route tests and verify failure**

Run:

```bash
pnpm --filter @cairn/workspace-core test -- app.spec.ts
```

Expected: fail because routes do not exist.

- [x] **Step 3: Implement routes**

In `apps/workspace-core/src/service/app.ts`:

1. Import `ArtifactId` from `@cairn/shared-contracts/schemas`.
2. Add `GET /v1/runs/:runId/artifacts` using `repository.getRun` for 404 and `repository.listArtifactsByRun` for `{ items }`.
3. Add `GET /v1/artifacts/:artifactId` using `repository.getArtifact`.
4. Add `GET /v1/runs/:runId/trace` using `repository.getRun` for 404 and `repository.listTraceEventsByRun` for `{ items }`.

Place these near existing run/task read routes.

- [x] **Step 4: Verify routes**

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
git commit -m "feat(workspace-core): 增加产物和追踪读取接口 / add artifact and trace read routes"
```

Expected: commit succeeds.

## Task 4: Docs and Final Verification

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/plans/2026-05-17-artifact-trace-read-api.md`

- [x] **Step 1: Update changelog**

Under `[Unreleased]` → `### Added`, after the Runtime Drain Slice entry, add:

```md
- **Artifact / Trace Read API**：Workspace Core 实现 Artifact metadata 与 TraceEvent replay source 只读接口，供 Run Detail / Replay UI 消费。
```

- [x] **Step 2: Run focused verification**

Run:

```bash
pnpm --filter @cairn/application typecheck
pnpm --filter @cairn/application test
pnpm --filter @cairn/workspace-core test -- sqlite-application-repository.spec.ts app.spec.ts
pnpm --filter @cairn/workspace-core typecheck
pnpm exec markdownlint-cli2 CHANGELOG.md docs/superpowers/plans/2026-05-17-artifact-trace-read-api.md
pnpm exec prettier --check packages/application/src/ports/run-repository.ts packages/application/src/testing/memory-run-repository.ts apps/workspace-core/src/storage/sqlite-application-repository.ts apps/workspace-core/src/storage/sqlite-application-repository.spec.ts apps/workspace-core/src/service/app.ts apps/workspace-core/src/service/app.spec.ts CHANGELOG.md docs/superpowers/plans/2026-05-17-artifact-trace-read-api.md
git diff --check
```

Expected: all commands exit `0`.

- [x] **Step 3: Commit docs**

Run:

```bash
git add CHANGELOG.md docs/superpowers/plans/2026-05-17-artifact-trace-read-api.md
git commit -m "docs(trace): 记录产物和追踪读取接口 / document artifact and trace read api"
```

Expected: commit succeeds.
