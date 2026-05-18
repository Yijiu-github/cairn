# Desktop Sidecar Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first safe Desktop-to-Workspace-Core connection layer without exposing live run
actions or filesystem access.

**Architecture:** Electron main owns the local sidecar lifecycle and keeps the per-launch bearer
token out of renderer code. Preload exposes a narrow `contextBridge` allowlist for connection
status and restart only. Renderer consumes that status to replace static "not connected" copy with
real ready/degraded/stopped state while preserving all operator actions as disabled.

**Tech Stack:** TypeScript strict ESM, Electron main/preload IPC, Fastify Workspace Core,
loopback HTTP bearer auth, Vitest, existing electron-vite build.

---

## File Structure

- Modify `apps/workspace-core/src/config.ts`: add optional `CAIRN_WORKSPACE_CORE_AUTH_TOKEN`.
- Modify `apps/workspace-core/src/server.ts`: pass the token into app creation.
- Modify `apps/workspace-core/src/service/app.ts`: enforce optional bearer auth for every route.
- Modify `apps/workspace-core/src/service/app.spec.ts`: cover missing/invalid/valid bearer token.
- Modify `apps/desktop/package.json`: add `test` script and Vitest dependency.
- Create `apps/desktop/vitest.config.ts`: Node test config for main-process helpers.
- Create `apps/desktop/src/main/workspace-core-sidecar.ts`: sidecar lifecycle, token generation,
  loopback port selection, health polling, and stop/restart behavior.
- Create `apps/desktop/src/main/workspace-core-sidecar.spec.ts`: TDD coverage for lifecycle rules.
- Modify `apps/desktop/src/main/index.ts`: create the manager, register IPC handlers, start the
  sidecar in dev, and stop it during app shutdown.
- Modify `apps/desktop/src/preload/index.ts`: expose a status/restart allowlist through
  `contextBridge`.
- Modify `apps/desktop/src/renderer/src/preload.d.ts`: type the new bridge surface.
- Modify `apps/desktop/src/renderer/src/desktop-app.tsx`: render real connection status.
- Modify `apps/desktop/src/renderer/src/desktop-model.ts`: update static copy to sidecar bridge
  readiness.
- Modify `apps/desktop/README.md`, `docs/engineering/local-dev-setup.md`, `docs/STATUS.md`, and
  `CHANGELOG.md`: document the new dev-only sidecar bridge and remaining packaged-app limitation.

## Tasks

### Task 1: Workspace Core Bearer Auth

- [ ] Add failing tests showing optional token auth rejects missing/invalid credentials and allows
      `Authorization: Bearer <token>`.
- [ ] Implement optional auth in `createWorkspaceCoreApp`.
- [ ] Read `CAIRN_WORKSPACE_CORE_AUTH_TOKEN` in config and pass it from `server.ts`.
- [ ] Run `pnpm --filter @cairn/workspace-core test`.

### Task 2: Desktop Sidecar Manager

- [ ] Add failing tests for per-launch token generation, loopback host env, health polling, and
      packaged-preview degraded status.
- [ ] Implement `WorkspaceCoreSidecarManager` with injectable spawn/fetch dependencies.
- [ ] Run `pnpm --filter @cairn/desktop test`.

### Task 3: IPC And Preload Allowlist

- [ ] Wire `getStatus` and `restart` IPC handlers in Electron main.
- [ ] Expose `window.cairnDesktop.sidecar.getConnectionStatus()` and `.restart()` from preload.
- [ ] Keep the token private to main; do not expose raw base token or filesystem paths.
- [ ] Run desktop typecheck and lint.

### Task 4: Renderer Status

- [ ] Replace hard-coded Workspace Core "not connected" badge with bridge status.
- [ ] Keep operator run/artifact actions disabled.
- [ ] Show degraded copy when packaged preview cannot start an embedded sidecar yet.
- [ ] Run desktop build.

### Task 5: Documentation And Verification

- [ ] Update status/local-dev/desktop docs and changelog.
- [ ] Run `pnpm --filter @cairn/workspace-core test`.
- [ ] Run `pnpm --filter @cairn/desktop test`.
- [ ] Run `pnpm --filter @cairn/desktop build`.
- [ ] Run `pnpm run docs:lint`, `pnpm run format:check`, and `git diff --check`.
