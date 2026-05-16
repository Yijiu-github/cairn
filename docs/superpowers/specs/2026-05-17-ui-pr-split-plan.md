# UI PR Split Plan

> Date: 2026-05-17  
> Scope: review and delivery ordering for the Desktop UI / desktop follow-up work  
> Status: Draft for owner review

## 1. Why this exists

The current branch set is intentionally split so that review and implementation stay manageable.

This plan records the recommended order and the boundary between planning, IA review, contracts, and the first desktop scaffold.

## 2. Current PR map

### PR #10 — Desktop Shell IA preview

Purpose:

- Validate the shell shape and the four-page review path in `apps/ui-preview`.

Includes:

- Desktop Shell preview page
- Desktop Shell data and sections
- Home / Inbox boundary updates
- Run Detail and Artifact Review breadcrumb/path updates
- IA and PR notes docs

Decision role:

- This is the primary review gate for whether the shell is good enough.

### PR #11 — Next backlog / roadmap

Purpose:

- Capture the next planning layer after the shell preview.

Includes:

- owner review checklist
- state matrix
- workspace-core UI contract draft
- minimal `apps/desktop` skeleton plan
- PR split guidance

Decision role:

- This is the roadmap layer, not an implementation gate.

### PR #12 — Owner review checklist

Purpose:

- Give the reviewer a concrete checklist to accept or reject the shell IA.

Decision role:

- Converts subjective review into an explicit Option A/B/C decision.

### PR #13 — Desktop Shell state matrix

Purpose:

- Capture the non-happy states that matter before desktop implementation starts.

Decision role:

- Helps decide whether shell semantics are stable enough for a desktop skeleton.

### PR #14 — Workspace Core UI contract draft

Purpose:

- Define the UI-facing data and action shapes expected from future `workspace-core` integration.

Decision role:

- Prevents the desktop skeleton from inventing ad hoc local data models.

### PR #15 — Minimal `apps/desktop` skeleton plan

Purpose:

- Describe the smallest acceptable first desktop implementation.

Decision role:

- Sets the boundary for what the first code PR may include.

## 3. Recommended review order

### Phase 1 — Review and decide on IA

Review in this order:

1. PR #10 — Desktop Shell IA preview
2. PR #12 — Owner review checklist
3. PR #13 — Desktop Shell state matrix

Questions to answer:

- Is the shell shape correct?
- Are the key states modeled enough?
- Is the desktop implementation decision clear?

### Phase 2 — Lock the contract language

Then review:

1. PR #14 — Workspace Core UI contract draft

Questions to answer:

- Does the UI contract reflect the shell and page responsibilities correctly?
- Are the redaction and safety rules sufficient?

### Phase 3 — Decide desktop start plan

Then review:

1. PR #15 — Minimal `apps/desktop` skeleton plan

Questions to answer:

- Is the first desktop PR thin enough?
- Are business-logic boundaries safe enough?
- Are we ready to start actual desktop scaffolding?

### Phase 4 — Keep roadmap separate

PR #11 can be reviewed alongside the above, but it should stay clearly as a roadmap document.

## 4. Split rules

### Do split when

- The PR mixes planning and implementation.
- The PR mixes IA changes and contract changes.
- The PR mixes desktop scaffolding and business logic.
- The PR mixes preview copy edits and architectural decisions.

### Do not split when

- A doc naturally belongs to the same decision gate.
- A preview edit and its matching spec change are both needed for the same review.
- A change is small enough that splitting would make review harder.

## 5. Recommended future flow

```text
PR #10 review
  ├─ accepted → review #12/#13/#14
  │              └─ if stable, approve #15
  └─ needs changes → revise preview IA before desktop work
```

## 6. What should happen after these PRs

If the planning docs are accepted, the next code work should be:

- one thin `apps/desktop` scaffold PR,
- one shell frame PR,
- then pause before adding business behavior.

Do not combine scaffold setup with runtime integration or data plumbing in the same first PR unless the scope is still visibly minimal.

## 7. Owner-facing summary

> Keep PR #10 as the shell IA review gate. Use PR #12 and PR #13 to decide whether the shell is stable enough. Use PR #14 to define the future UI contract. Use PR #15 only if the first desktop scaffold is ready to stay thin. Keep roadmap material in PR #11 separate from implementation decisions.
