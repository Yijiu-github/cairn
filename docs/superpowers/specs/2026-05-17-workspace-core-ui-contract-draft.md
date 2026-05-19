# Workspace Core UI Contract Draft

> Date: 2026-05-17  
> Scope: UI-facing contract sketch for future `workspace-core` integration  
> Status: Draft for owner review  
> Related: PR #10 `feat(ui-preview): add desktop shell IA preview`

## 1. Purpose

This draft defines the data and action shapes that the Cairn desktop UI expects from `workspace-core`.

It is not an implementation contract, and it is not a database schema. It is a UI-facing planning tool so the desktop shell can start with stable placeholders instead of inventing one-off view models.

## 2. What the UI needs from workspace-core

### 2.1 Workspace identity

Desktop Shell needs a canonical workspace summary.

Expected fields:

- workspace id
- workspace display name
- local mode / remote mode
- source roots
- local storage mode
- last sync state
- backup state

Why the UI needs it:

- To power the shell header and workspace summary cards.
- To explain which workspace the operator is in.
- To avoid duplicating identity data across Home / Run / Artifact pages.

### 2.2 Runtime health

Desktop Shell needs a clear runtime health snapshot.

Expected fields:

- ready / degraded / offline
- sidecar status
- IPC bridge status
- start time
- last heartbeat
- diagnostic summary
- retry / reconnect hint

Why the UI needs it:

- To explain whether the local-first shell is actually usable.
- To decide whether warnings should be subtle or blocking.

### 2.3 Handoff queue

Home / Inbox needs the operator's pending work queue.

Expected fields:

- item id
- kind: approval / review / diagnostic
- source label
- source actor label
- title
- description
- wait time
- priority
- blocking status
- recommended action

Why the UI needs it:

- To order what the operator should handle first.
- To explain whether a queue item is informational or blocking.

### 2.4 Run summaries

Home / Inbox needs compact run cards.

Expected fields:

- run id
- title
- summary
- status
- progress
- agent label
- last event
- last updated time
- priority / pin state
- actionable flags such as open / take over / cancel

Why the UI needs it:

- To support a high-density operator home.
- To let the shell show active work without opening detail pages.

### 2.5 Run detail model

Run Detail needs a deeper run object.

Expected fields:

- run id
- workspace id
- title
- summary
- status
- task tree
- evidence timeline
- artifact references
- cost / latency / token metrics
- attribution / error classification
- protected actions
- intervention hints

Why the UI needs it:

- To separate task-blocked, execution-failed, and artifact-review-blocked states.
- To support safe intervention and review paths.

### 2.6 Artifact model

Artifact Review needs reviewable artifact metadata and provenance.

Expected fields:

- artifact id
- run id
- kind
- title
- summary
- path display data
- sensitivity label
- review state
- verification state
- provenance timeline
- exportable diagnostic material

Why the UI needs it:

- To preserve safe path redaction by default.
- To let the review UI decide when to show warnings, approval states, and export actions.

### 2.7 Global operator context

The shell should also be able to show top-level operator context.

Expected fields:

- unread count
- pending approval count
- blocked count
- degraded count
- recent activity marker
- current mode / workspace mode

Why the UI needs it:

- To summarize attention without opening the main work area.
- To help decide whether the shell is idle, normal, or overloaded.

## 3. Action surface expected from workspace-core

The UI should not assume it can mutate everything directly. It should ask for specific actions.

### 3.1 Shell actions

- open workspace
- switch workspace
- refresh runtime status
- retry reconnect
- open logs
- open settings

### 3.2 Handoff actions

- open handoff item
- accept / approve
- request changes
- dismiss / defer
- open related run

### 3.3 Run actions

- open run detail
- take over
- pause
- cancel with confirmation
- inspect evidence
- jump to artifacts

### 3.4 Artifact actions

- open review
- approve
- request changes
- reject
- copy reference
- export diagnostic bundle
- include logs or exclude logs
- include local paths or keep redacted

## 4. Redaction and safety rules

This contract should preserve the UI safety defaults already used in preview.

Rules:

- Local paths are hidden by default.
- Showing a relative or full path requires explicit opt-in.
- Export/share flows must separate safe default from explicit risk acceptance.
- Sensitive artifacts need a warning state before approval or export.
- UI should not invent a fake security boundary; it should clearly label redaction and inclusion choices.

## 5. Data ownership split

### workspace-core owns

- canonical workspace state
- runtime health
- run and artifact state
- operator action outcomes
- provenance and diagnostics

### UI owns

- page layout
- state presentation
- warnings and copy
- breadcrumb semantics
- action affordances
- local preview fixtures

### preview owns

- static demo data
- edge case fixtures for review
- temporary copy experiments
- skeleton states that are not yet backed by real data

## 6. Suggested minimal contract surface

If the first desktop skeleton starts soon, the minimum useful contract probably looks like this:

- `WorkspaceSummary`
- `RuntimeHealth`
- `HandoffItem`
- `RunSummary`
- `RunDetail`
- `ArtifactSummary`
- `ArtifactReviewContext`
- `OperatorAttentionSummary`

These names are intentionally descriptive rather than prescriptive. The real domain model can differ, but the UI should be able to map onto these concepts cleanly.

## 7. Open questions for owner review

- Should runtime health be a single object or split into sidecar / bridge / update / sync sub-states?
- Should handoff queue items come from runs, notifications, or a dedicated attention feed?
- Should artifact provenance be part of run detail or an artifact-specific stream?
- Which actions must remain strictly protected in the first desktop skeleton?
- Which workspace metadata belongs in shell header versus right rail versus Home sidebar?

## 8. Recommendation

Do not wire `workspace-core` yet.

First decide whether the shell IA is accepted. If it is accepted, this contract draft can become the basis for a minimal desktop skeleton plan. If not, the contract should wait until the shell preview is revised.
