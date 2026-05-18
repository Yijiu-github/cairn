# Desktop Read-Only Data Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Desktop shell read real Workspace Core run, task, artifact, and trace data through
a safe main/preload allowlist while keeping all live actions disabled.

**Architecture:** Electron main owns Workspace Core base URL and bearer token, calls only existing
read-only HTTP endpoints, and maps responses into sanitized desktop view models. Preload exposes a
narrow `workspace.readSnapshot()` allowlist that returns UI-ready data without token, port, base URL,
local file paths, or mutation methods. Renderer uses the snapshot for Home, Run Detail, and Artifact
Review states with loading, error, empty, and disconnected fallbacks.

**Tech Stack:** TypeScript strict ESM, Electron main/preload IPC, Fastify Workspace Core read APIs,
React renderer, Vitest, existing `@cairn/ui` components.

---

## File Structure

- Create `apps/desktop/src/shared/workspace-core-data.ts`: desktop snapshot/view schemas, safe
  status mappers, and API-to-UI mapping helpers.
- Create `apps/desktop/src/main/workspace-core-client.ts`: read-only Workspace Core HTTP client
  used only from Electron main.
- Create `apps/desktop/src/main/workspace-core-client.spec.ts`: TDD coverage for auth headers,
  endpoint fan-out, disconnected fallback, and local-path redaction.
- Modify `apps/desktop/src/main/index.ts`: register `cairn:workspace:read-snapshot` IPC handler.
- Modify `apps/desktop/src/preload/bridge.ts`: expose `window.cairnDesktop.workspace.readSnapshot()`.
- Modify `apps/desktop/src/preload/index.ts`: parse the new snapshot response before exposing it.
- Modify `apps/desktop/src/preload/bridge.spec.ts`: assert the allowlist only includes `app`,
  `sidecar`, and read-only `workspace`.
- Modify `apps/desktop/src/renderer/src/preload.d.ts`: type the new bridge surface.
- Modify `apps/desktop/src/renderer/src/desktop-app.tsx`: consume live snapshots for Home / Run
  Detail / Artifact Review while keeping operator actions disabled.
- Modify `apps/desktop/src/renderer/src/desktop-app.spec.tsx`: cover snapshot mapping and fallback
  behavior.
- Modify `apps/desktop/README.md`, `docs/STATUS.md`, and `CHANGELOG.md`: document the read-only
  data bridge and remaining limitations.

## Tasks

### Task 1: Main Read-Only Workspace Client

- [ ] Add tests in `apps/desktop/src/main/workspace-core-client.spec.ts` for:
      authenticated `GET /v1/workspaces/:workspaceId/runs`;
      fetching first run detail, tasks, artifacts, trace, and artifact payload preview;
      returning a disconnected snapshot when the sidecar is not connected; and redacting
      filesystem-like artifact paths.
- [ ] Implement `WorkspaceCoreReadClient` in `apps/desktop/src/main/workspace-core-client.ts` with
      injected `fetch`, `getConnection`, and default workspace id
      `01J000000000000000000000W0`.
- [ ] Create `apps/desktop/src/shared/workspace-core-data.ts` with Zod schemas for the safe
      snapshot returned to renderer.
- [ ] Run `pnpm --filter @cairn/desktop test -- workspace-core-client`.

### Task 2: IPC And Preload Allowlist

- [ ] Add a preload bridge test proving `window.cairnDesktop` exposes only `app`, `sidecar`, and
      `workspace`, and `workspace` exposes only `readSnapshot`.
- [ ] Register `cairn:workspace:read-snapshot` in `apps/desktop/src/main/index.ts` using
      `WorkspaceCoreReadClient`.
- [ ] Wire `workspace.readSnapshot()` in `apps/desktop/src/preload/bridge.ts` and validate it in
      `apps/desktop/src/preload/index.ts`.
- [ ] Run `pnpm --filter @cairn/desktop test -- bridge`.

### Task 3: Renderer Live Read-Only Data States

- [ ] Add tests for mapping a live snapshot into UI run cards, task tree, evidence timeline,
      artifact review cards, and disconnected empty states.
- [ ] Update `apps/desktop/src/renderer/src/desktop-app.tsx` to poll
      `workspace.readSnapshot()` after connection status refreshes.
- [ ] Keep all operator, artifact export, and connect buttons disabled.
- [ ] Add compact loading / error / empty states without exposing base URL, token, port, or local
      paths.
- [ ] Run `pnpm --filter @cairn/desktop test -- desktop-app`.

### Task 4: Documentation And Status

- [ ] Update `apps/desktop/README.md` with the read-only data bridge behavior.
- [ ] Update `docs/STATUS.md` so Desktop no longer says run/task/artifact views are entirely static
      when the dev sidecar is connected.
- [ ] Update `CHANGELOG.md` under `[Unreleased]`.
- [ ] Run `pnpm run docs:lint`.

### Task 5: Verification And Review

- [ ] Run `pnpm --filter @cairn/desktop lint`.
- [ ] Run `pnpm --filter @cairn/desktop typecheck`.
- [ ] Run `pnpm --filter @cairn/desktop test`.
- [ ] Run `pnpm --filter @cairn/desktop build`.
- [ ] Run `pnpm --filter @cairn/workspace-core test`.
- [ ] Run `pnpm run format:check`.
- [ ] Run `git diff --check`.
- [ ] Request code review before commit.
- [ ] Commit with `feat(desktop): 接入只读 workspace 数据桥 / add read-only workspace data bridge`.
