# Desktop Shell State Matrix

> Date: 2026-05-17  
> Scope: state planning for Desktop Shell IA preview and future minimal `apps/desktop` skeleton  
> Status: Draft for owner review  
> Related: PR #10 `feat(ui-preview): add desktop shell IA preview`

## 1. Why this exists

The Desktop Shell IA preview is currently strong on shape and flow, but the next implementation decision depends on a smaller question:

> Which non-happy states must the shell represent before a real desktop skeleton starts?

This document defines the states that matter most for shell-level design.

## 2. State categories

### 2.1 Workspace state

Describes whether the shell has useful workspace context.

- Empty workspace
- Populated workspace
- Multiple source roots
- Missing source roots

### 2.2 Runtime state

Describes whether the local sidecar / runtime bridge is available.

- Ready
- Degraded
- Offline
- Reconnecting

### 2.3 Attention state

Describes how much operator attention is waiting.

- Idle
- Normal queue
- Handoff overload
- Blocked by approval
- Blocked by diagnostic

### 2.4 Safety state

Describes whether export/share actions are safe by default.

- Safe default
- Local path redaction active
- Logs included by request
- Export requires explicit confirmation
- Sensitive artifact warning

### 2.5 Connectivity state

Describes whether the shell is local-only or has remote affordances.

- Local-only ready
- Remote disconnected
- Remote connected
- Sync unavailable
- Backup pending

## 3. Canonical states to model first

Not every combination needs UI. The shell should first model the small set below because they affect IA or copy decisions.

### A. Empty workspace

Symptoms:

- No active runs.
- No source roots.
- No recent activity.

Why it matters:

- Changes the first-screen density.
- Prevents the shell from assuming there is always data.
- Forces a helpful empty-state call to action.

Likely UI needs:

- Empty-state card in the main area.
- CTA to add source roots or open a workspace.
- Runtime summary still visible.

### B. Runtime offline

Symptoms:

- Runtime health unavailable.
- Sidecar bridge not connected.
- Handoff queue may be stale.

Why it matters:

- This is the most important operational failure state for a local-first shell.
- The shell must show whether the app can still be used read-only.

Likely UI needs:

- Strong warning in right rail.
- Clear message about what still works.
- Retry / reconnect affordance.

### C. Runtime degraded

Symptoms:

- Shell opens successfully.
- Some features are available.
- Diagnostics or sync are partially limited.

Why it matters:

- This is likely to be a common real-world state.
- It should not read like a total failure.

Likely UI needs:

- Warning tone, not danger tone.
- Short explanation of partial availability.
- Visible path to inspect details.

### D. Handoff overload

Symptoms:

- Many approvals or reviews are waiting.
- The operator needs triage, not just a list.

Why it matters:

- This affects prioritization and sorting rules.
- The shell should surface what is most urgent first.

Likely UI needs:

- Priority badges.
- Grouping by type.
- A summary count in the shell header or sidebar.

### E. Unsafe artifact/export

Symptoms:

- Local paths are about to be exposed.
- Logs are being included.
- Sensitive artifact warning is active.

Why it matters:

- This is the main privacy / sharing boundary.
- It should be harder to accidentally leak local filesystem details.

Likely UI needs:

- Explicit warning before export.
- Redaction state visible in the artifact card.
- Clear copy that default behavior hides paths.

### F. Remote disconnected

Symptoms:

- Local-first shell is fine.
- Remote sync or optional remote workspace access is unavailable.

Why it matters:

- Prevents remote status from being confused with core availability.
- Keeps the local-first promise honest.

Likely UI needs:

- Neutral or warning indicator.
- Small copy that remote is optional.
- No interruption to core local workflow.

## 4. State-to-UI mapping

### Desktop Shell

- Empty workspace → empty-state main rail, runtime still visible.
- Runtime offline → stronger right-rail warning and reconnect copy.
- Handoff overload → high-priority badge and summary count.
- Remote disconnected → subtle status, not a blocking error.

### Home / Inbox

- Empty workspace → no runs / no handoffs placeholder.
- Handoff overload → grouped queue, high-priority first.
- Runtime degraded → sidebar warning plus clearer operator guidance.

### Run Detail

- Runtime degraded → diagnostic-first copy in sidebar.
- Blocked task → stronger distinction between task block and system failure.
- Unsafe artifact/export → artifact CTA should lead to safe review.

### Artifact Review

- Unsafe export → explicit opt-in warning.
- Local path redaction active → default hidden path label.
- Sensitive artifact warning → stronger tone before approval/export.

## 5. Suggested implementation order

If the next step is preview-only:

1. Add state fixtures for empty, offline, degraded, and unsafe export.
2. Decide whether state switching belongs in preview navigation.
3. Use the same state language in future `apps/desktop` skeleton.

If the next step is desktop skeleton:

1. Keep state names as shell contracts.
2. Wire only the smallest shell frame.
3. Leave business state to future `workspace-core` contracts.

## 6. Recommendation

Before starting `apps/desktop`, the shell should at minimum be able to explain:

- whether the workspace exists,
- whether runtime is ready,
- whether the operator is overloaded,
- and whether export is safe.

If those four are clear, the desktop skeleton can start without guessing the shell's semantics.
