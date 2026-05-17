# Desktop UI Next Backlog / Brainstorm

> Date: 2026-05-17  
> Scope: follow-up planning after Desktop Shell IA preview  
> Status: Draft backlog for owner review  
> Related: PR #10 `feat(ui-preview): add desktop shell IA preview`

## 1. Current state

PR #10 establishes a static Desktop Shell IA preview path:

```text
Desktop Shell → Home / Inbox → Run Detail → Artifact Review → approve / reject / export
```

The next step should not be "add more random preview pages". The useful question is:

> Is the product shell stable enough to start a minimal `apps/desktop` skeleton, or do we need another preview-only pass first?

This backlog turns that decision into concrete tasks.

## 2. Recommendation

Do one short decision sprint before starting desktop implementation.

Recommended order:

1. Owner review checklist for PR #10.
2. Desktop Shell state coverage pass in `apps/ui-preview`.
3. Workspace Core UI contract draft.
4. Minimal `apps/desktop` skeleton plan.
5. Decision: start `apps/desktop` or keep iterating in preview.

Do not start a full Electron app until steps 1–4 are clear.

## 3. Backlog overview

### B1 — Owner review checklist for Desktop Shell IA

Goal: make PR #10 easy to review and decide.

Questions for owner review:

- Does the first screen feel like Cairn's main desktop workspace?
- Is the left navigation right for v0?
- Is Home / Inbox clearly a focused work area, not a duplicate homepage?
- Is the Run Detail → Artifact Review path obvious enough?
- Are local-first / runtime / export-risk concepts visible without too much noise?
- Should `apps/desktop` start next, or should preview states be expanded first?

Deliverable:

- A short review checklist doc or PR comment.

Suggested files:

- `docs/superpowers/specs/2026-05-17-desktop-ui-owner-review-checklist.md`

Exit criteria:

- Owner can answer: accept Shell IA, request changes, or defer desktop implementation.

### B2 — Desktop Shell state coverage pass

Goal: model the important non-happy states before implementation hardens around the happy path.

States to cover:

- Empty workspace: no runs, no source roots.
- Runtime offline: shell opens but local sidecar is unavailable.
- Runtime degraded: partial functionality available with diagnostic path.
- Handoff overload: many approvals/reviews waiting.
- Unsafe artifact/export: local paths or logs included.
- Remote disconnected: local-first still works, sync unavailable.

Implementation options:

1. Add simple state variants inside `apps/ui-preview`.
2. Add a view selector in the preview nav.
3. Keep variants as data fixtures only and document them without UI toggles.

Recommendation:

- Start with option 3 if we only need planning.
- Use option 1 if owner wants visual review of edge cases.
- Avoid option 2 unless state switching becomes genuinely useful.

Deliverable:

- Preview fixtures or state matrix.

Suggested files:

- `apps/ui-preview/src/preview-data/desktop-shell-state-variants.ts`
- or `docs/superpowers/specs/2026-05-17-desktop-shell-state-matrix.md`

Exit criteria:

- Runtime and workspace state language is stable enough for desktop skeleton placeholders.

### B3 — Workspace Core UI contract draft

Goal: define what the UI expects from `workspace-core` without wiring real data yet.

Contract areas:

- Workspace identity:
  - workspace id/name
  - source roots
  - local storage mode
  - last sync / backup state
- Runtime health:
  - ready / degraded / offline
  - sidecar status
  - IPC bridge status
  - diagnostics
- Handoff queue:
  - approval / review / diagnostic items
  - priority
  - wait time
  - source entity
- Runs:
  - run summary
  - progress
  - status
  - agent label
  - latest evidence/event
- Run detail:
  - task tree
  - evidence timeline
  - protected actions
  - intervention actions
- Artifacts:
  - artifact id/kind/title
  - review state
  - sensitivity
  - redacted path display
  - provenance
  - export material

Deliverable:

- UI-facing contract sketch; not an implementation.

Suggested files:

- `docs/superpowers/specs/2026-05-17-workspace-core-ui-contract-draft.md`

Exit criteria:

- UI can start a desktop shell skeleton without inventing one-off local data models.

### B4 — Minimal `apps/desktop` skeleton plan

Goal: define the smallest useful desktop app start.

Allowed in first skeleton:

- Vite/React/Electron app shell if repository conventions support it.
- Static route placeholders matching the confirmed IA.
- Shared `@cairn/ui` components.
- No business logic outside future `workspace-core` contracts.
- No real filesystem mutation.
- No real updater, tray, installer, signing, or OS integration.

Not allowed:

- Duplicating Workspace Core business logic inside desktop.
- Adding real automation capabilities before safety boundaries exist.
- Exposing local paths or logs without explicit warning paths.
- Building a thick Settings app before core shell is validated.

Deliverable:

- Implementation plan only, unless owner explicitly approves starting code.

Suggested files:

- `docs/superpowers/specs/2026-05-17-apps-desktop-minimal-skeleton-plan.md`

Exit criteria:

- The team knows what first desktop PR will and will not include.

### B5 — PR split plan

Goal: keep future work reviewable.

Suggested PR sequence:

1. PR #10: Desktop Shell IA preview.
2. PR next: state matrix / owner review checklist docs.
3. PR next: Workspace Core UI contract draft.
4. PR next: minimal `apps/desktop` skeleton plan.
5. PR next only after approval: actual `apps/desktop` skeleton.

Exit criteria:

- No single PR mixes planning, IA changes, contracts, and desktop scaffolding.

## 4. Proposed immediate next task

Recommended next task: **B1 owner review checklist**.

Why:

- PR #10 is already open and mergeable.
- The cheapest next move is to make review decisive.
- If review accepts Shell IA, B3/B4 become sharper.
- If review rejects Shell IA, desktop implementation should not start.

## 5. Decision tree

```text
Owner accepts PR #10 IA?
├─ yes
│  ├─ Draft Workspace Core UI contract (B3)
│  ├─ Draft apps/desktop minimal skeleton plan (B4)
│  └─ Decide whether to code skeleton
└─ no / unclear
   ├─ Run Desktop Shell state coverage pass (B2)
   ├─ Tighten preview IA
   └─ Re-review before apps/desktop
```

## 6. Risks

- Starting Electron too early may lock in wrong IA.
- Expanding preview too much may become fake product implementation.
- UI contracts may drift from `workspace-core` if written without checking existing domain/application contracts.
- Local path/export safety can regress if desktop filesystem affordances are added casually.

## 7. Suggested owner-facing summary

> The current Desktop Shell IA is ready for review. Next we should not add more pages by default. We should use PR #10 to decide whether the shell is accepted. If accepted, draft the Workspace Core UI contract and the minimal `apps/desktop` skeleton plan. If not accepted, do one preview-only state coverage pass first.
