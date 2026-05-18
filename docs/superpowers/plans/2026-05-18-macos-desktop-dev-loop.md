# macOS Desktop Dev Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current macOS Desktop Shell development loop explicit, runnable, and verifiable without changing Desktop runtime scope.

**Architecture:** Keep Desktop as a preview-safe Electron shell. Add only development scripts and documentation that describe how to start, debug, smoke, build, and package the existing shell on macOS.

**Tech Stack:** TypeScript, Electron, electron-vite, electron-builder, pnpm, markdownlint, Prettier.

---

## Scope Check

In scope:

- Add Desktop development scripts for debug and production preview.
- Document macOS setup, startup, debugging, smoke, and development packaging.
- Keep current safety boundary visible: no sidecar, no real IPC actions, no filesystem access.

Out of scope:

- Do not start Workspace Core from Electron.
- Do not add sidecar lifecycle code.
- Do not add signing, notarization, or release automation.
- Do not create `apps/web`.

## File Structure

- Modify: `apps/desktop/package.json`
  - Adds `dev:debug` and `preview` scripts.
- Modify: `apps/desktop/README.md`
  - Adds package-level macOS dev loop and smoke checklist.
- Modify: `docs/engineering/local-dev-setup.md`
  - Adds project-level macOS Desktop dev loop.
- Modify: `docs/STATUS.md`
  - Updates date and records that macOS Desktop dev loop docs/scripts exist while release signing remains incomplete.
- Modify: `CHANGELOG.md`
  - Records the dev-loop documentation/script update.

## Task 1: Desktop Debug Scripts

**Files:**

- Modify: `apps/desktop/package.json`

- [ ] **Step 1: Add scripts**

Add these scripts under `apps/desktop/package.json`:

```json
"dev:debug": "electron-vite dev --inspect 9229 --remoteDebuggingPort 9230",
"preview": "electron-vite preview --skipBuild"
```

- [ ] **Step 2: Verify package script names**

Run:

```bash
pnpm --filter @cairn/desktop run
```

Expected: output includes `dev:debug` and `preview`.

## Task 2: macOS Local Dev Docs

**Files:**

- Modify: `docs/engineering/local-dev-setup.md`

- [ ] **Step 1: Replace generic startup/debug placeholders with macOS Desktop dev loop**

Add a section that documents:

- macOS prerequisite checks.
- Recommended separate startup commands for Workspace Core, Desktop, and UI Preview.
- What `pnpm dev` means today.
- Desktop Shell smoke checklist.
- Electron main / renderer debugging.
- Unsigned development package command and quarantine note.

- [ ] **Step 2: Remove stale TODOs**

Remove the completed TODO for filling actual `pnpm dev` behavior. Keep Windows debugging and demo video TODOs.

## Task 3: Desktop Package README

**Files:**

- Modify: `apps/desktop/README.md`

- [ ] **Step 1: Add package-level commands**

Document:

```bash
pnpm --filter @cairn/desktop dev
pnpm --filter @cairn/desktop dev:debug
pnpm --filter @cairn/desktop build
pnpm --filter @cairn/desktop package
```

- [ ] **Step 2: Add smoke checklist**

The checklist must say:

- Window opens as Cairn.
- Navigation switches Home / Run Detail / Artifact Review / Settings.
- Sidebar says preview-safe.
- Workspace Core status remains not connected.
- Operator controls remain disabled.

## Task 4: Status and Changelog

**Files:**

- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update status**

Update `docs/STATUS.md` last updated date to `2026-05-18`, and add that macOS Desktop local dev loop scripts/docs are available.

- [ ] **Step 2: Update changelog**

Add an `[Unreleased]` entry noting macOS Desktop local dev loop documentation and debug scripts.

## Task 5: Verification

**Files:**

- No source edits.

- [ ] **Step 1: Run focused verification**

Run:

```bash
pnpm --filter @cairn/desktop typecheck
pnpm --filter @cairn/desktop lint
pnpm --filter @cairn/desktop build
pnpm run docs:lint
pnpm run format:check
git diff --check
```

Expected: all pass.

- [ ] **Step 2: Commit and push**

Run:

```bash
git add apps/desktop/package.json apps/desktop/README.md docs/engineering/local-dev-setup.md docs/STATUS.md CHANGELOG.md docs/superpowers/specs/2026-05-18-macos-desktop-dev-loop-design.md docs/superpowers/plans/2026-05-18-macos-desktop-dev-loop.md
git commit -m "docs(desktop): 补齐 macOS 开发闭环 / document macOS dev loop"
git push -u origin docs/macos-desktop-dev-loop
```
