# @cairn/desktop

Cairn Electron Desktop Shell.

This first skeleton is intentionally preview-safe:

- static renderer fixtures when Workspace Core is disconnected
- dev-mode Workspace Core sidecar status and read-only run/task/artifact/trace/source-root
  snapshots
- no live Workspace Core mutation actions
- no filesystem reads or writes
- local paths and payload text remain redacted or summarized by default
- renderer isolation is enabled with `contextIsolation: true`, `nodeIntegration: false`, and
  `sandbox: true`

The package follows ADR-0012 with `electron-vite` for main / preload / renderer builds.

## macOS local loop

From the repository root:

```bash
pnpm install
pnpm --filter @cairn/desktop dev
```

Debug mode opens the same static shell while enabling local inspector ports:

```bash
pnpm --filter @cairn/desktop dev:debug
```

- Main process inspector: attach to `127.0.0.1:9229` from `chrome://inspect`.
- Renderer DevTools: focus the Electron window and press `Option` + `Command` + `I`.
- Chromium remote debugging port: `127.0.0.1:9230`.

Build and create a local ad-hoc directory package:

```bash
pnpm --filter @cairn/desktop build
pnpm --filter @cairn/desktop package:mac:dir
```

The package output is under `apps/desktop/release/`. It is not signed, notarized, or ready for
distribution.

Build the release-shaped macOS installer when signing and notarization credentials are present:

```bash
pnpm --filter @cairn/desktop package:mac:dmg
```

That path produces the DMG release artifact expected for distribution.

### Preview-safe smoke

Use this checklist after `pnpm --filter @cairn/desktop dev`:

- The app window opens with the Cairn title.
- Navigation switches between Home / Inbox, Run Detail, Artifact Review, and Settings.
- The sidebar still says preview-safe shell.
- Workspace Core status and read-only run/task/artifact/trace/source-root snapshots are read
  through preload allowlists and may show connected, starting, degraded, empty, or read-error
  states.
- Settings may show sanitized SourceRoot metadata, but folder approval, reindex, path reveal, and
  export remain unavailable.
- Operator controls remain disabled.
- Artifact Review keeps local path language redacted or hidden.

## Current UI slice

The renderer reuses `@cairn/ui` components and models the first navigation shape. When the dev
sidecar is connected it reads sanitized Workspace Core snapshots; otherwise it falls back to static
preview fixtures:

- **Home / Inbox** — handoff queue, live-or-preview runs, runtime health, and safety defaults
- **Run Detail** — selected run card, evidence timeline, task tree, and disabled operator
  controls
- **Artifact Review** — protected review panel, redacted artifact cards, and path exposure
  policy
- **Settings** — read-only connection state and sanitized SourceRoot metadata

Workspace Core integration is limited to a dev-mode sidecar lifecycle plus read-only snapshots.
Future work must add bundled sidecar packaging and action-specific safety gates before any
filesystem access, operator action, or runtime mutation is exposed.
