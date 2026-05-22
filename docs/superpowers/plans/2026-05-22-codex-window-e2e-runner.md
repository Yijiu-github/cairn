# Codex Window-Level E2E Runner Implementation Plan

> 状态：✅ Completed 2026-05-22 16:03 CST
> 结果：`pnpm --filter @cairn/desktop smoke:codex` 已作为 opt-in runner 跑通真实
> Codex window-level internal-trial、replay evidence 与 operator note 路径；默认
> `test:e2e` 仍保持 mock-only。默认简体中文界面下，runner 已改用 locale-neutral
> `data-smoke-id` hook，不依赖英文可见文案。
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in Desktop smoke runner that uses Playwright + Electron to drive a real Codex-backed Workspace Core window-level trial, while leaving the existing mock-only `test:e2e` gate untouched.

**Architecture:** Keep `apps/desktop/test:e2e` as the default mock sidecar window smoke. Add a separate `smoke:codex` launcher script that starts the built Desktop app, waits for the main window, drives the existing internal-trial UI, and asserts that real replay evidence and operator-note actions are visible in the window. The final runner uses locale-neutral `data-smoke-id` hooks so Simplified Chinese / English copy changes do not break the smoke path.

**Tech Stack:** Electron, Playwright Electron API, Node.js ESM, existing Desktop renderer, TypeScript for any helper logic.

---

## Task 1: Add the opt-in Codex smoke launcher

**Files:**

- Create: `apps/desktop/scripts/codex-window-smoke.mjs`
- Modify: `apps/desktop/package.json`

- [x] **Step 1: Write the launcher with a hard opt-in preflight**

Implement a Node ESM script that:

- refuses to run unless `CAIRN_DESKTOP_SIDECAR_RUNTIME=codex` is present
- launches the built Desktop app with Playwright Electron
- waits for the first window to be ready
- finds the `Run Internal Trial` control and triggers it

The script should surface a clear error if the runtime env is missing, so nobody can accidentally run the real smoke path while thinking it is mock-only.

- [x] **Step 2: Assert the real window-level evidence is visible**

After the internal-trial action completes, assert that the UI shows:

- a non-empty observed run id
- the `Live replay source` evidence alert
- a populated replay inspector
- at least one operator action response path that can be exercised from the window

The first pass used current renderer text and roles. After Desktop gained default Simplified
Chinese, the runner failed on the English `Home / Inbox` locator. The final runner uses
locale-neutral `data-smoke-id` hooks for smoke-only targets instead of visible copy.

- [x] **Step 3: Exercise one operator action**

Click `Add note`, wait for `Operator action applied`, and confirm the replay summary refreshes after the operator note is recorded.

Use the existing UI path rather than a direct IPC call so the runner stays a true window-level smoke.

- [x] **Step 4: Wire the package script**

Add a new package script, `smoke:codex`, that runs the Desktop build and then launches the new smoke script.

Keep `test:e2e` unchanged and mock-only.

- [x] **Step 5: Verify the opt-in boundary**

Run the new script once without the codex runtime env to confirm it fails fast with the explicit opt-in error, then run it again in a real Codex-enabled environment and capture the resulting run evidence identifiers.

---

## Task 2: Add stable renderer hooks only if the locators prove flaky

**Files:**

- Modify: `apps/desktop/src/renderer/src/desktop-app.tsx`

- [x] **Step 1: Add machine-readable hooks**

Needed after the Desktop shell default locale changed to Simplified Chinese. The runner now uses
`data-smoke-id` hooks for Home navigation, Refresh Core, Run Internal Trial, replay source,
Replay inspector, observed run id, trace event count, Add note, and operator feedback. These hooks
do not expose new Desktop bridge capabilities and keep visible copy localizable.

If the smoke runner needs them, add explicit `aria-label` or `data-testid` hooks to:

- `Run Internal Trial`
- `Observe Run`
- `Add note`
- `Retry task`
- `Rerun`
- `Cancel run`
- `Refresh Evidence`

Keep the visible copy unchanged; only add stable hooks for the runner.

- [x] **Step 2: Confirm the hooks do not alter behavior**

Renderer hooks were added only as stable smoke selectors. Existing Desktop tests, the mock-only
window smoke, and the opt-in Codex window smoke were re-run.

Run the existing Desktop unit tests and mock window smoke to confirm the new hooks do not change the current mock-only path.

---

## Task 3: Update the internal-trial docs for the new runner

**Files:**

- Modify: `docs/ops/internal-trial-runbook.md`
- Modify: `docs/engineering/testing-strategy.md`
- Modify: `docs/STATUS.md`
- Modify: `CHANGELOG.md`
- Modify: `apps/desktop/README.md` if the new command needs a short note

- [x] **Step 1: Document the new opt-in smoke command**

Add a short section that documents `pnpm --filter @cairn/desktop smoke:codex` as the opt-in real Codex window-level smoke, including:

- the required runtime env
- what the runner proves
- what it does not prove

- [x] **Step 2: Keep the mock-only gate explicit**

Make sure the existing `pnpm --filter @cairn/desktop test:e2e` wording stays mock-only and still reads as the default gate.

- [x] **Step 3: Refresh status and changelog**

Update `docs/STATUS.md` and `CHANGELOG.md` with the new runner and the boundary that real Codex automation remains opt-in and outside the default CI gate.

---

## Task 4: Verify, record, and hand off

**Files:**

- Modify: `docs/superpowers/plans/2026-05-21-nightly-cleanup-handoff.md`
- Modify: whichever files above changed

- [x] **Step 1: Run the targeted checks**

Run:

- `pnpm --filter @cairn/desktop lint`
- `pnpm --filter @cairn/desktop typecheck`
- `pnpm --filter @cairn/desktop test`
- `pnpm exec prettier --check <all changed Desktop/docs files>`
- `pnpm exec markdownlint-cli2 <all changed markdown files>`
- `pnpm run docs:lint`
- `git diff --check`

- [x] **Step 2: Run the new codex smoke**

Final successful run evidence:

- First pass before locale-neutral hooks:
  - `runId=01KS79CPRQYXC9WJGA3MGHZ6SE`
  - `taskId=01KS79CPRRD04NFM2D7ZB88KY6`
  - `agentRunId=01KS79CPS4AW7X4VZ9DS9SQ8G2`
  - `traceEventsAfterNote=13`
- Final pass after locale-neutral hooks:
  - `runId=01KS7BR6150KYPE49RZ34G5JKD`
  - `taskId=01KS7BR616KR3V8Q7GXB58ZMGA`
  - `agentRunId=01KS7BR61JTW8628CP9M501YQY`
  - `traceEventsAfterNote=13`

Run `pnpm --filter @cairn/desktop smoke:codex` in a real Codex-enabled environment and record the run id, task id, and agent-run id that it surfaces.

- [x] **Step 3: Update the handoff**

Record the exact completion state in the handoff:

- what the runner now does
- which checks passed
- which checks still need a follow-up
- the commit hash
- the next most useful direction for the next pass

- [x] **Step 4: Commit only the files from this plan**

Create a local commit with just the touched files. Do not include unrelated cleanup or unrelated docs drift.
