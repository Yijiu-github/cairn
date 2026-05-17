# apps/desktop Minimal Skeleton Plan

> Date: 2026-05-17  
> Scope: minimal implementation plan for the first real desktop app skeleton  
> Status: Draft for owner approval  
> Related: PR #10, PR #11, PR #12, PR #13, PR #14

## 1. Purpose

This plan defines the smallest useful `apps/desktop` start after the Desktop Shell IA preview and planning docs are reviewed.

The goal is not to build the full desktop product. The goal is to create a thin shell that proves the project can host the confirmed IA without re-implementing business logic locally.

## 2. Starting principle

The first desktop PR should answer only one question:

> Can Cairn host the confirmed shell frame in a real desktop runtime without inventing a second business layer?

If the answer is not clearly yes, the team should stay in preview/planning mode.

## 3. What the first skeleton may include

### 3.1 App shell

Allowed:

- A minimal Electron or desktop host entry if repository conventions already support it.
- A top-level window shell.
- Static route placeholders that match the confirmed IA.
- Shared `@cairn/ui` components.
- A simple navigation shell that mirrors the preview path.

### 3.2 Route placeholders

The first skeleton may expose placeholder destinations for:

- Desktop Shell / Mission Control
- Home / Inbox
- Run Detail
- Artifact Review
- Settings
- Source Roots

These placeholders can render static content or the same UI preview sections, but they must remain clearly non-final.

### 3.3 Integration boundary

The first skeleton may:

- Read static preview fixtures or temporary adapter data.
- Reserve hooks for future `workspace-core` integration.
- Expose a local status area for runtime health and workspace identity.

## 4. What the first skeleton must not include

### 4.1 No business logic reimplementation

Do not duplicate `workspace-core` decision logic inside `apps/desktop`.

Do not build:

- a second handoff engine,
- a second run-state engine,
- a second artifact-review engine,
- or a second provenance system.

### 4.2 No thick desktop product features

Do not start with:

- updater UX
- tray behavior
- installer flows
- signing / notarization work
- multi-window orchestration
- settings megascreen
- workflow builder
- enterprise approval governance
- local automation marketplace

### 4.3 No unsafe filesystem shortcuts

Do not expose local paths, logs, or filesystem details in a way that bypasses the safety defaults already established in preview.

## 5. Minimum technical shape

The first desktop skeleton should likely have this shape:

- app entry
- shell layout
- route or view switching layer
- static content adapters
- placeholder runtime / workspace status area
- basic build and dev command

The exact framework choice should follow repository conventions, not personal preference.

## 6. First PR should likely contain

### Included

- `apps/desktop` app scaffold
- root window shell
- navigation skeleton
- placeholder pages or routes
- shared UI imports
- minimal app-level wiring
- basic run instructions in docs

### Excluded

- workspace-core runtime integration
- live data loading
- file system mutation
- update / tray / installer behavior
- real settings implementation
- real source-root management
- thick command dispatch logic

## 7. Suggested implementation sequence

If approved, implement in this order:

1. Create the minimal app scaffold.
2. Wire the confirmed IA as placeholder screens.
3. Reuse shared UI primitives and preview-safe copy.
4. Add a tiny status strip for runtime/workspace placeholders.
5. Stop.

Do not continue into business behavior until the skeleton is reviewed.

## 8. Open questions before starting code

- Should the desktop skeleton render preview sections directly, or use a thin adapter layer?
- Should we begin with one window only?
- Should the first desktop shell include a route model, or just internal view switching?
- Which runtime / workspace placeholder is useful enough to justify the first screen?
- Do we want to gate the skeleton behind PR approval of the planning docs?

## 9. Recommended decision

Start `apps/desktop` only if all of these are true:

- PR #10 IA is accepted.
- The owner review checklist agrees the shell is stable enough.
- The state matrix is sufficient for initial desktop placeholders.
- The UI-facing contract draft is good enough to avoid ad hoc data models.

If any of those are false, stay in preview and refine the shell before starting desktop code.
