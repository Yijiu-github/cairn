# @cairn/desktop

Cairn Electron Desktop Shell.

This first skeleton is intentionally preview-safe:

- static renderer fixtures only
- no Workspace Core sidecar startup
- no real IPC actions
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
preload allowlist and sidecar lifecycle contract before any live data, filesystem access, or
operator action is exposed.
