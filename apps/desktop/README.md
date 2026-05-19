# @cairn/desktop

Cairn Electron Desktop Shell.

This first skeleton is intentionally preview-safe:

- static renderer fixtures for the main product views
- a minimal dev Workspace Core sidecar manager
- a narrow preload allowlist for Core status and mock smoke only
- no renderer-exposed filesystem reads or writes
- a non-secret sidecar diagnostic snapshot under Electron `userData`
- local paths remain redacted by default
- renderer isolation is enabled with `contextIsolation: true`, `nodeIntegration: false`, and
  `sandbox: true`

The package follows ADR-0012 with `electron-vite` for main / preload / renderer builds.

## Current UI slice

The renderer is a static desktop product shell that reuses `@cairn/ui` components and models the
first navigation shape:

- **Home / Inbox** — handoff queue, pinned runs, runtime health, and safety defaults
- **Run Detail** — selected run card, evidence timeline, task tree, and disabled operator
  controls
- **Artifact Review** — protected review panel, redacted artifact cards, and path exposure
  policy
- **Settings** — read-only source-root and connection placeholders

Production sidecar bundling, real filesystem access, real runtime action, and operator actions are
still out of scope for this slice.

## Workspace Core preview bridge

The current bridge is intentionally small:

- Electron main starts a local Workspace Core sidecar on `127.0.0.1` with a per-launch bearer token.
- Electron main creates the window before waiting on sidecar health, then starts the sidecar in the
  background.
- Workspace Core only requires auth when `CAIRN_WORKSPACE_CORE_AUTH_TOKEN` is configured, preserving
  normal standalone development.
- Preload exposes `workspaceCore.getStatus()` and `workspaceCore.runMockSmoke()` only.
- The renderer can show sidecar health and run a bounded mock smoke path through Workspace Core:
  create run, list task, submit mock AgentRun, drain runtime, then read run/task/artifact/trace
  summary.
- Startup writes a non-secret diagnostic snapshot to
  `<userData>/diagnostics/workspace-core-sidecar.json`.
- The main process intentionally avoids top-level `await app.whenReady()`; Electron ESM startup can
  stall app readiness when module evaluation stays suspended.

Known limits:

- The sidecar command is a development wiring that runs `tsx src/server.ts` from
  `apps/workspace-core`; packaged production sidecar bundling is not done yet.
- The verified automated smoke covers desktop bootstrap order, the sidecar manager, and the
  Workspace Core HTTP path. Manual Electron window-level smoke reaches `ready-to-show`; automated
  Electron e2e remains a follow-up item.
