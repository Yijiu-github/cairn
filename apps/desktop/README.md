# @cairn/desktop

Cairn Electron Desktop Shell.

This first skeleton is intentionally preview-safe:

- static renderer fixtures for the main product views
- a minimal dev Workspace Core sidecar manager
- a narrow preload allowlist for Core status, internal-trial evidence, bounded artifact payload
  reads, and minimal operator actions
- no renderer-exposed filesystem reads or writes
- a non-secret sidecar diagnostic snapshot under Electron `userData`
- local paths remain redacted by default
- renderer isolation is enabled with `contextIsolation: true`, `nodeIntegration: false`, and
  `sandbox: true`

The package follows ADR-0012 with `electron-vite` for main / preload / renderer builds.

## Current UI slice

The renderer is a static desktop product shell that reuses `@cairn/ui` components and models the
first navigation shape:

- **Home / Mission Control** — simplified first-run dispatch surface, visible agent counts, live
  agent cards, recent progress, runtime health, and safety defaults
- **Run Detail** — selected run card, evidence timeline, task tree, and internal-trial operator
  controls
- **Artifact Review** — protected review panel, redacted artifact cards, and path exposure
  policy
- **Settings** — read-only source-root and connection placeholders

Production sidecar bundling, real filesystem access, complete runtime action coverage, and full
operator workflows are still out of scope for this slice. The Home dispatch composer currently
drives the bounded internal-trial path; free-form Supervisor prompts are intentionally not enabled
until the planner contract and task dispatch flow are ready.

## Workspace Core preview bridge

The current bridge is intentionally small:

- Electron main starts a local Workspace Core sidecar on `127.0.0.1` with a per-launch bearer token.
- Electron main creates the window before waiting on sidecar health, then starts the sidecar in the
  background.
- Workspace Core only requires auth when `CAIRN_WORKSPACE_CORE_AUTH_TOKEN` is configured, preserving
  normal standalone development.
- Preload exposes `workspaceCore.getStatus()`, `workspaceCore.runInternalTrial()`, read-only
  replay-source access, bounded `workspaceCore.getArtifactPayload(artifactId)` reads, and a minimal
  internal-trial operator action allowlist.
- The renderer can show sidecar health and run the internal-trial path through Workspace Core:
  create run, list task, submit AgentRun, drain runtime, then read run/task/artifact/trace
  summary and on-demand bounded artifact payload text.
- Startup writes a non-secret diagnostic snapshot to
  `<userData>/diagnostics/workspace-core-sidecar.json`.
- Renderer-facing Core status uses a display-safe connection label instead of exposing the
  loopback base URL or bearer token.
- The renderer has a lightweight Simplified Chinese / English switch. It defaults to Simplified
  Chinese and stores only the selected locale in `localStorage`.
- The main process intentionally avoids top-level `await app.whenReady()`; Electron ESM startup can
  stall app readiness when module evaluation stays suspended.

Known limits:

- The sidecar command is a development wiring that runs `tsx src/server.ts` from
  `apps/workspace-core`; packaged production sidecar bundling is not done yet.
- Automated tests cover desktop bootstrap order, the sidecar manager, and the Workspace Core HTTP
  path. `pnpm --filter @cairn/desktop test:e2e` now builds the shell and runs a minimal
  window-level Electron smoke against the default mock sidecar path. `pnpm --filter @cairn/desktop smoke:codex`
  is a separate opt-in runner for the real Codex window-level path; it requires the codex sidecar
  runtime env and remains outside default CI. A Codex-backed window-level internal-trial smoke has
  also been verified manually, but real Codex remains opt-in and outside default CI.
- Artifact payload preview is read-only and fetched by opaque artifact id through Workspace Core; it
  does not reveal local paths, expose arbitrary filesystem access, or implement a full Artifact
  workspace.
