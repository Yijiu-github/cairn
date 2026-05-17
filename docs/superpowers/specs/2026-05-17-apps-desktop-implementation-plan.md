# apps/desktop Implementation Plan

> Date: 2026-05-17  
> Scope: first implementation plan for the future desktop app scaffold  
> Status: Draft for owner review  
> Related: PR #10, PR #11, PR #12, PR #13, PR #14, PR #15, PR #16

## 1. Purpose

This plan turns the approved Desktop Shell IA direction into a minimal first code path for `apps/desktop`.

The goal is to create the smallest real desktop package that can host the confirmed shell frame without duplicating business logic or jumping into a full product build.

## 2. Current repo reality

The repository currently has:

- `apps/ui-preview` for static UI preview work
- `apps/workspace-core` for the HTTP API shell of the shared collaboration core
- shared UI primitives in `packages/ui`
- orchestration / application layers in `packages/application` and related packages

What it does not yet have:

- an `apps/desktop` package
- a desktop host entry
- a real Electron app scaffold
- a shell-to-core adapter layer for the desktop runtime

That means the first desktop implementation must begin with package creation, not with feature work.

## 3. First implementation goal

The first desktop PR should prove this:

> Cairn can host the shell frame in a real desktop package without inventing a second domain model or a second business layer.

If that is not true, the work is too large.

## 4. Target first PR shape

The first implementation PR for `apps/desktop` should be extremely thin.

### 4.1 Include

- create `apps/desktop/`
- add `package.json`
- add a minimal desktop app entry
- wire the package into the workspace scripts if needed
- render a shell frame with placeholder routes or internal view switching
- reuse shared UI components from `@cairn/ui`
- show static preview-safe content for shell / home / run / artifact entry points
- include a small runtime/workspace status area
- add a basic dev command and typecheck/lint wiring

### 4.2 Exclude

- workspace-core integration
- live data fetching
- real IPC contract work
- filesystem mutation
- update / tray / installer behavior
- settings megascreen
- multi-window behavior
- business logic reimplementation
- any unsafe path exposure

## 5. Suggested package shape

The first desktop package should probably be organized as:

- `apps/desktop/package.json`
- `apps/desktop/src/`
- `apps/desktop/src/main.tsx` or equivalent entry
- `apps/desktop/src/shell/`
- `apps/desktop/src/routes/` or a small view-switch layer
- `apps/desktop/src/adapters/` for future bridge points only if needed

If a desktop framework is not yet chosen, this plan should stay framework-agnostic and only define the boundaries.

## 6. First screen responsibilities

The first desktop screen should cover:

- workspace identity
- global navigation
- runtime summary
- handoff / inbox summary
- pinned runs summary
- artifact review entry point
- safe warning / redaction language

These are shell responsibilities, not backend responsibilities.

## 7. Data strategy for the first skeleton

The first desktop code should not depend on real `workspace-core` responses.

Use one of these strategies:

1. Reuse static preview fixtures from `apps/ui-preview`.
2. Introduce a thin adapter that maps static fixture data to desktop view props.
3. Keep everything local until the core contract is ready.

Recommended choice for the first PR:

- static fixtures or a thin adapter only
- no network calls
- no fake API wrapper

## 8. Integration boundary

The desktop scaffold should be designed so that later work can plug in `workspace-core` through a narrow surface.

The first implementation should reserve these boundaries:

- workspace identity boundary
- runtime health boundary
- handoff queue boundary
- run summary boundary
- artifact review boundary

Do not collapse them into one generic app state blob.

## 9. Implementation sequence

### Step 1 — Create the package

- add `apps/desktop`
- establish package metadata
- verify workspace scripts recognize it

### Step 2 — Add the shell frame

- render the shell layout
- show navigation and status regions
- keep content static and preview-safe

### Step 3 — Add placeholder views

- Home / Inbox
- Run Detail
- Artifact Review
- Source Roots / Settings placeholders if needed

### Step 4 — Verify the first contract boundaries

- no real backend dependency
- no business logic duplication
- no unsafe file exposure

### Step 5 — Stop

Do not expand into product depth until the first shell scaffold is reviewed.

## 10. Validation expected for the first desktop PR

The first PR should at minimum pass:

- typecheck
- lint
- build or dev startup sanity check, depending on framework choice

If the desktop framework requires more setup, document the smallest reproducible validation command set in the PR itself.

## 11. Success criteria

The first desktop implementation is successful if:

- the package exists and runs
- the shell frame matches the agreed IA
- the shell does not invent a second business layer
- the first screen feels like Cairn, not like a generic shell demo
- future `workspace-core` integration remains cleanly separable

## 12. Open questions before coding

- Which desktop framework is the repository standard for `apps/desktop`?
- Should the first shell reuse preview components directly, or use a tiny adapter layer?
- Should the first PR include route primitives or only internal view switching?
- Which minimum placeholder pages are required for the first review pass?
- Should a desktop status strip be fed by local fixture data or a dedicated app shell model?

## 13. Recommendation

If the owner has accepted PR #10 and the planning docs are enough, the next real code work should be this first desktop scaffold PR.

Keep it thin, local, and reversible.
