# @cairn/desktop

Cairn Electron Desktop Shell.

This first skeleton is intentionally preview-safe:

- static renderer fixtures only
- no Workspace Core sidecar startup
- no real IPC actions
- no filesystem reads or writes
- local paths remain redacted by default

The package follows ADR-0012 with `electron-vite` for main / preload / renderer builds.
