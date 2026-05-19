# @cairn/desktop

Cairn Electron Desktop Shell.

This first skeleton is intentionally preview-safe:

- static renderer fixtures for the main product views
- a minimal dev Workspace Core sidecar manager
- a narrow preload allowlist for Core status and mock smoke only
- no filesystem reads or writes
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

Workspace Core integration is deliberately out of scope for this slice. Future work should add a
production sidecar bundle before any filesystem access, real runtime action, or operator action is
exposed.

## Workspace Core preview bridge

The current bridge is intentionally small:

- Electron main starts a local Workspace Core sidecar on `127.0.0.1` with a per-launch bearer token.
- Workspace Core only requires auth when `CAIRN_WORKSPACE_CORE_AUTH_TOKEN` is configured, preserving
  normal standalone development.
- Preload exposes `workspaceCore.getStatus()` and `workspaceCore.runMockSmoke()` only.
- The renderer can show sidecar health and run a bounded mock smoke path through Workspace Core:
  create run, list task, submit mock AgentRun, drain runtime, then read run/task/artifact/trace
  summary.

Known limits:

- The sidecar command is a development wiring that runs `tsx src/server.ts` from
  `apps/workspace-core`; packaged production sidecar bundling is not done yet.
- The verified automated smoke covers the sidecar manager and Workspace Core HTTP path. Electron
  window-level smoke is still a follow-up item.
