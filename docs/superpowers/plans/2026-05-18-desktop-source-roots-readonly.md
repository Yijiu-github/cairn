# Desktop Source Roots Read-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show sanitized SourceRoot metadata in the Desktop Settings view through the existing read-only Workspace Core snapshot.

**Architecture:** Keep the preload surface unchanged: `workspace.readSnapshot()` remains the only workspace API. The main read client fetches `GET /v1/workspaces/:workspaceId/source-roots`, maps each SourceRoot into a renderer-safe summary, and Settings renders those summaries without local paths, raw URIs, mutation actions, folder pickers, or reindex controls.

**Tech Stack:** TypeScript strict, Electron main/preload/renderer, Zod, React, Vitest.

---

## File Structure

- Modify `apps/desktop/src/shared/workspace-core-data.ts`: add API/source-root schemas and mapping helpers.
- Modify `apps/desktop/src/main/workspace-core-client.ts`: include source roots in connected snapshots.
- Modify `apps/desktop/src/main/workspace-core-client.spec.ts`: cover fetch order, redaction, empty/degraded behavior.
- Modify `apps/desktop/src/renderer/src/workspace-snapshot-view.ts`: map source roots into metadata list rows.
- Modify `apps/desktop/src/renderer/src/workspace-snapshot-view.spec.ts`: cover SourceRoot card metadata without path leakage.
- Modify `apps/desktop/src/renderer/src/desktop-app.tsx`: pass snapshot into Settings and render source-root summaries.
- Modify `apps/desktop/src/renderer/src/styles.css`: add small source-root grid styling if needed.
- Modify `apps/desktop/README.md`, `docs/STATUS.md`, `CHANGELOG.md`: update current Desktop capability and safety notes.

## Tasks

### Task 1: Shared Snapshot Schema and Main Client

**Files:**

- Modify: `apps/desktop/src/shared/workspace-core-data.ts`
- Modify: `apps/desktop/src/main/workspace-core-client.ts`
- Test: `apps/desktop/src/main/workspace-core-client.spec.ts`

- [x] **Step 1: Write failing tests for SourceRoot snapshot redaction**

Add tests proving `readSnapshot()` calls `/source-roots`, includes display name/status/kind/timestamps/glob counts, and never serializes `uri`, absolute paths, raw error text, token, host, or port.

- [x] **Step 2: Run the focused test and confirm RED**

Run: `pnpm --filter @cairn/desktop test -- src/main/workspace-core-client.spec.ts`

Expected: FAIL because `sourceRoots` is not in the snapshot and the route is not fetched.

- [x] **Step 3: Add source-root schemas and mapping**

Add API schema for Workspace Core SourceRoot list and renderer schema like:

```ts
export const workspaceCoreSourceRootViewSchema = z.object({
  sourceRootId: z.string(),
  displayName: z.string(),
  kind: z.string(),
  status: z.string(),
  includeGlobCount: z.number().int().nonnegative(),
  excludeGlobCount: z.number().int().nonnegative(),
  hasLastIndexedAt: z.boolean(),
  hasError: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

Map raw API rows with counts and booleans only. Do not copy `uri`, `metadata`, or `error`.

- [x] **Step 4: Fetch source roots in connected snapshots**

Read `/v1/workspaces/:workspaceId/source-roots` alongside runs. If no runs exist, return `runs: []` and `sourceRoots`. If a selected run exists, preserve existing run/task/artifact/trace behavior and include `sourceRoots`.

- [x] **Step 5: Run focused tests and commit**

Run: `pnpm --filter @cairn/desktop test -- src/main/workspace-core-client.spec.ts`

Commit:

```bash
git add apps/desktop/src/shared/workspace-core-data.ts apps/desktop/src/main/workspace-core-client.ts apps/desktop/src/main/workspace-core-client.spec.ts
git commit -m "feat(desktop): 展示只读 SourceRoot 摘要 / show read-only SourceRoot summaries"
```

### Task 2: Renderer Settings SourceRoot Panel

**Files:**

- Modify: `apps/desktop/src/renderer/src/workspace-snapshot-view.ts`
- Modify: `apps/desktop/src/renderer/src/workspace-snapshot-view.spec.ts`
- Modify: `apps/desktop/src/renderer/src/desktop-app.tsx`
- Modify: `apps/desktop/src/renderer/src/styles.css`

- [x] **Step 1: Write failing renderer mapping tests**

Add a SourceRoot in the snapshot fixture with `displayName: "Cairn Workspace"`, `status: "active"`, and verify the mapped metadata contains counts/status but not `/Users/`, `file://`, or raw URI text.

- [x] **Step 2: Run the focused renderer tests and confirm RED**

Run: `pnpm --filter @cairn/desktop test -- src/renderer/src/workspace-snapshot-view.spec.ts`

Expected: FAIL because SourceRoot mapping does not exist.

- [x] **Step 3: Implement mapping and Settings rendering**

Add `mapWorkspaceSourceRootsToSettingsItems()` returning card-ready rows. Pass `workspaceSnapshot` into `SettingsView`. Render:

- live SourceRoot cards when `workspaceSnapshot.sourceRoots.length > 0`
- empty live card when connected but zero roots
- existing preview-safe placeholder when no snapshot exists

All controls remain disabled and copy must state that folder approval, reindex, and path reveal are unavailable.

- [x] **Step 4: Run renderer tests and commit**

Run:

```bash
pnpm --filter @cairn/desktop test -- src/renderer/src/workspace-snapshot-view.spec.ts
pnpm --filter @cairn/desktop test -- src/renderer/src/desktop-app.spec.tsx
```

Commit:

```bash
git add apps/desktop/src/renderer/src/workspace-snapshot-view.ts apps/desktop/src/renderer/src/workspace-snapshot-view.spec.ts apps/desktop/src/renderer/src/desktop-app.tsx apps/desktop/src/renderer/src/styles.css
git commit -m "feat(desktop): 接入 Settings 只读 SourceRoot 视图 / wire Settings read-only SourceRoot view"
```

### Task 3: Docs and Verification

**Files:**

- Modify: `apps/desktop/README.md`
- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [x] **Step 1: Update docs**

Document that Desktop Settings can display sanitized SourceRoot metadata via read-only snapshot, while SourceRoot registration, reindex, folder picker, path reveal, and filesystem mutation remain unavailable.

- [ ] **Step 2: Run verification**

Run:

```bash
pnpm --filter @cairn/desktop lint
pnpm --filter @cairn/desktop typecheck
pnpm --filter @cairn/desktop test
pnpm --filter @cairn/desktop build
pnpm run docs:lint
pnpm run format:check
git diff --check HEAD~2..HEAD
```

- [ ] **Step 3: Commit and push**

Commit:

```bash
git add apps/desktop/README.md docs/STATUS.md CHANGELOG.md docs/superpowers/plans/2026-05-18-desktop-source-roots-readonly.md
git commit -m "docs(desktop): 记录只读 SourceRoot 设置视图 / document read-only SourceRoot settings view"
git push
```
