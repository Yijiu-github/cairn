# Desktop UI v0 Information Architecture

> Date: 2026-05-16  
> Scope: `apps/ui-preview` static Desktop Shell preview  
> Status: Draft for PR #5 review

## 1. Intent

Desktop UI v0 is a product-shell validation pass, not a full desktop application implementation.

The goal is to make the core Cairn desktop path understandable before starting a real `apps/desktop` Electron shell:

```text
Desktop Shell → Home / Inbox → Run Detail → Artifact Review → approve / reject / export
```

This spec freezes the IA direction for the current preview so the team can review page responsibilities, not backend behavior.

## 2. Non-goals

This IA pass intentionally does not include:

- Real backend or `workspace-core` connection.
- Real Electron window, tray, updater, installer, signing, or filesystem bridge.
- A fake API wrapper around static preview data.
- Complex workflow builder, enterprise approval governance, or worker marketplace.
- Full Settings, Source Roots, or multi-workspace management screens.

## 3. Page responsibilities

### 3.1 Desktop Shell / Mission Control

Purpose:

- Own the desktop product frame.
- Show global navigation and shell-level runtime/workspace state.
- Make local-first status visible in the first screen.

First-screen questions:

- Which workspace am I in?
- Is local runtime ready, degraded, or offline?
- What needs operator attention?
- Where do I go next: Inbox, Runs, Artifacts, Source Roots, Settings?

Primary UI:

- Persistent left navigation:
  - Mission Control
  - Inbox
  - Runs
  - Artifacts
  - Source Roots
  - Settings
- Main Mission Control area:
  - handoff items
  - pinned runs
- Right rail:
  - runtime health
  - local-first mode/status
  - sync/backup/update placeholders
  - quick actions
  - risk warnings

Boundary:

- Shell owns workspace identity, global navigation, runtime summary, local/remote mode, sync/backup placeholders, and high-level risk warnings.
- Shell does not own page-specific review decisions or run execution details.

Future Workspace Core boundary:

- `workspace-core` should eventually provide workspace identity, runtime health, source-root inventory, sync/backup state, and global notification counts.
- The preview currently uses static data in `apps/ui-preview/src/preview-data/desktop-shell-data.ts`.

### 3.2 Home / Inbox

Purpose:

- Be the operator's focused work area inside the Desktop Shell.
- Prioritize handoffs, approvals, diagnostics, and active runs.

First-screen questions:

- What requires my attention now?
- Which runs are active or blocked?
- Which action is safest: open, take over, cancel, review, or ignore?

Primary UI:

- Handoff queue.
- Active run cards.
- Operator-focused runtime/detail sidebar.
- Filter chips for attention states.
- Boundary note explaining what moved up to Shell.

Boundary:

- Home keeps handoff queue, active runs, and operator focus.
- Workspace identity, global navigation, shell runtime summary, and local/remote status move up to Desktop Shell.

Future Workspace Core boundary:

- `workspace-core` should provide run summaries, handoff queue items, agent states, and operator attention metadata.
- The preview remains static and does not subscribe to live events.

### 3.3 Run Detail

Purpose:

- Explain one run deeply enough for the operator to diagnose, intervene, or jump to artifacts.

First-screen questions:

- What is this run trying to do?
- Which task is blocked?
- What evidence supports the current state?
- What artifacts were produced and which need review?

Primary UI:

- Breadcrumb path from Desktop Shell / Home / Inbox.
- Run summary and protected controls.
- Task tree.
- Evidence timeline.
- Artifact cards.
- Cost/latency/runtime sidebar.
- Intervention composer.
- Error attribution card.

Navigation semantics:

- Home run card `打开` means open Run Detail.
- Run Detail artifact card `打开审阅` means open Artifact Review.
- No real routing is implemented in this preview; breadcrumbs and actions document the intended path.

Future Workspace Core boundary:

- `workspace-core` should provide run details, task tree, evidence events, artifact references, cost/latency metrics, and intervention actions.
- Protected destructive actions must remain explicit and reviewable.

### 3.4 Artifact Review

Purpose:

- Let the operator approve, reject, request changes, or export diagnostics for a run artifact.

First-screen questions:

- What artifact am I reviewing?
- Where did it come from?
- What is the review state?
- Is it safe to share or export?

Primary UI:

- Breadcrumb path from Desktop Shell / Home / Inbox / Run Detail.
- Artifact overview cards.
- Provenance timeline.
- Review context tabs: diff, risk, decision.
- Review decision panel.
- Diagnostic export panel.
- Share-before-export safety checklist.

Safety defaults:

- Local paths are hidden by default.
- Export/share flows must surface explicit warnings before including paths or logs.
- Artifact cards should only show relative or full paths when the caller explicitly opts in.

Future Workspace Core boundary:

- `workspace-core` should provide artifact metadata, provenance, review state, sensitivity labels, and diagnostic export material.
- UI must preserve redaction defaults even when real data is wired in.

## 4. Shared states to model next

The current static preview covers the happy path plus selected blocked/degraded states. Before starting a full desktop app, these states should be modeled explicitly:

- Empty workspace: no runs, no source roots.
- Runtime offline: workspace opened but sidecar unavailable.
- Runtime degraded: partial features available, diagnostics visible.
- Handoff overload: many approvals/reviews waiting.
- Artifact unsafe to share: local path or secret-risk warning active.
- Export pending approval: logs or paths included.

## 5. Decision: whether to start `apps/desktop`

Recommendation after this IA pass:

- Do not start a full desktop implementation yet.
- It is reasonable to start a minimal `apps/desktop` plan next if PR review accepts this Shell IA.
- The first desktop implementation should only host the confirmed shell frame and static route placeholders; business behavior must still come from future shared `workspace-core` contracts.

## 6. Current validation gate

The Desktop UI v0 preview should be considered review-ready when these pass locally:

```bash
pnpm --filter @cairn/ui-preview typecheck
pnpm --filter @cairn/ui-preview lint
pnpm --filter @cairn/ui-preview build
```

If `packages/ui` changes are added in the same branch, also run:

```bash
pnpm --filter @cairn/ui typecheck
pnpm --filter @cairn/ui lint
```
