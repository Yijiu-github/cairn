# PR #5 Update Notes — Desktop UI v0 Shell IA

## Summary

This update adds a static Desktop Shell preview to `apps/ui-preview` and tightens the IA relationship between Desktop Shell, Home / Inbox, Run Detail, and Artifact Review.

The goal is to validate the product shell before starting a real Electron desktop app. The preview remains static, backend-free, and `workspace-core`-free.

## Added / changed

- Added Desktop Shell preview as the first preview navigation item.
- Added Desktop Shell page/section/data split:
  - `apps/ui-preview/src/pages/desktop-shell-preview-page.tsx`
  - `apps/ui-preview/src/preview-sections/desktop-shell-sections.tsx`
  - `apps/ui-preview/src/preview-data/desktop-shell-data.ts`
- Added shell-level IA:
  - left navigation: Mission Control / Inbox / Runs / Artifacts / Source Roots / Settings
  - main work area: handoff items + pinned runs
  - right rail: runtime health, local-first mode, sync/backup placeholders, quick actions, warnings
- Updated Home / Inbox to behave as the focused work area inside the Shell:
  - keeps handoff queue, active runs, operator focus
  - moves workspace identity, global navigation, and shell runtime summary up to Desktop Shell
- Added lightweight breadcrumb/path semantics:
  - Run Detail: Desktop Shell / Home / Inbox / Run Detail
  - Artifact Review: Desktop Shell / Home / Inbox / Run Detail / Artifact Review
- Clarified Run Detail artifact action semantics:
  - artifact cards now use `打开审阅` to indicate entering Artifact Review
- Preserved Artifact Review safety defaults:
  - local paths remain hidden by default
  - export/share warning remains visible when paths/logs are included
- Added planning/spec docs:
  - `docs/superpowers/specs/2026-05-16-ui-weekly-plan.md`
  - `docs/superpowers/specs/2026-05-16-desktop-ui-v0-information-architecture.md`

## Review path

The intended user path is now visible without real routing:

```text
Desktop Shell → Home / Inbox → Run Detail → Artifact Review → approve / reject / export
```

## Non-goals preserved

- No real backend connection.
- No `workspace-core` connection.
- No real Electron desktop app yet.
- No fake API wrapper around static preview data.
- No complex workflow builder.
- No enterprise approval governance platform.
- No full Settings, Source Roots, updater, installer, tray, or signing work.

## Validation

Latest local validation for this Desktop Shell IA pass:

- `pnpm --filter @cairn/ui-preview typecheck`
- `pnpm --filter @cairn/ui-preview lint`
- `pnpm --filter @cairn/ui-preview build`

All passed locally.

## Screenshot / preview note

Run locally with:

```bash
pnpm --filter @cairn/ui-preview dev
```

Then open the UI preview and start from the first navigation item: `Desktop Shell`.

## Next decision

Recommended next step after owner review:

- If the Shell IA is accepted, draft a minimal `apps/desktop` plan next.
- If the Shell IA still feels unclear, continue iterating inside `apps/ui-preview` instead of starting Electron work.
