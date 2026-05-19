# R1 Evidence Chain Roadmap Design

> Status: Draft  
> Date: 2026-05-20  
> Scope: R1 to 0.1.0 Personal Desktop Edition progression plan  
> Owner: Product owner and Codex

## 1. Background

Cairn is currently in the R1 engineering baseline and Workspace Core minimal loop phase.
The repository already has shared contracts, domain schema, SQLite storage, Runtime Gateway,
application orchestration, Workspace Core, UI preview, and a minimal Electron Desktop Shell.

The next product goal is to reach `0.1.0 Personal Desktop Edition` without losing the core
positioning: local-first, self-hosted, runtime control plane, evidence layer, and human
operator control.

This roadmap chooses a vertical evidence-chain route instead of a UI-first route.

## 2. Collaboration Model

Future project work is planned as a two-person collaboration:

- The product owner owns product trimming, priority, and acceptance decisions.
- Codex owns engineering implementation, verification, documentation updates, and risk reporting.

The previous named multi-agent role split is no longer used for planning. UI work, QA, and
documentation are folded into each milestone's completion definition instead of being assigned
to separate project roles.

M0 includes updating the project collaboration documents so future tasks do not assume those
removed roles.

## 3. Recommended Route

R1 should follow an evidence-chain-first vertical route:

```text
User goal
  -> Workspace Core creates an OrchestrationRun
  -> Codex RuntimeAdapter executes an AgentRun
  -> Artifact payloads and metadata are persisted
  -> TraceEvents provide replay input
  -> Desktop observes and controls the real run
  -> 0.1.0 is hardened for pre-release delivery
```

The key product claim for R1 is not that the interface is feature-complete. The key claim is
that a real runtime execution can become a durable, observable, controllable, and replayable
engineering run.

## 4. Milestones

### M0: Collaboration and Engineering Baseline

Goal: align project documents and local verification around the new two-person collaboration
model.

Completion definition:

- Project collaboration documents no longer assume the previous named role split.
- Local dependencies are installed or documented well enough for verification to run.
- `pnpm run check` and `pnpm test` are usable as the main gates.
- R1 roadmap and verification expectations are recorded.

Out of scope:

- Reworking the full product strategy.
- Adding team collaboration features.

### M1: Real Runtime Loop

Goal: Workspace Core can execute a real Codex-backed AgentRun, not only a mock runtime test.

Completion definition:

- Workspace Core can select the Codex RuntimeAdapter through the existing runtime gateway path.
- A real run can create a task, submit an AgentRun, receive runtime stream events, and reach a
  terminal state.
- Runtime stdout, stderr, exit code, cancellation, and basic error mapping are observable.
- A minimal smoke scenario is documented and repeatable.

Out of scope:

- A second runtime adapter.
- A complex DAG planner.
- Advanced long-running task guarantees.

### M2: Artifact and Trace Evidence Layer

Goal: every meaningful execution can be inspected after the fact through artifacts and trace
events.

Completion definition:

- Artifact payload refs and bounded payload reads have a clear local storage boundary.
- TraceEvents are available as the replay source for a run.
- PlanningOutput, artifact metadata, artifact payload, and trace read APIs can explain a run.
- Tests cover the read path and the storage boundary.

Out of scope:

- Full file versioning.
- Large artifact export.
- Advanced diff and causality inspector UI.

### M3: Minimal Real Operator Control

Goal: operator actions affect the real run lifecycle and leave evidence.

Completion definition:

- `cancel` reaches the runtime cancellation path when possible.
- `retry` creates a new AgentRun attempt without mutating terminal records.
- `rerun` creates a new OrchestrationRun with a clear relationship to the prior run.
- Operator notes are recorded as evidence through the appropriate API and trace/artifact model.
- Each supported action has application or Workspace Core tests.

Out of scope:

- Enterprise approval workflows.
- Voting, arbitration, and deliberation systems.
- Thick handoff queue UI.

### M4: Desktop Real Observation Console

Goal: Desktop observes and controls real Workspace Core data instead of only static or mock
preview data.

Completion definition:

- Desktop preload exposes a minimal allowlist mapped to Workspace Core semantics.
- The renderer can show runs, run detail, artifacts, and trace timeline data from the real core.
- The renderer can trigger the minimal operator actions needed for R1.
- Electron smoke validation covers the main path.

Out of scope:

- Web Shell.
- Broad local automation powers.
- Heavy UI polish beyond the R1 main path.

### M5: 0.1.0 Pre-release Hardening

Goal: make the Personal Desktop Edition reproducible and understandable as a pre-release build.

Completion definition:

- Desktop build and package commands are documented and verified.
- Sidecar packaging and launch diagnostics are documented.
- Installation, troubleshooting, privacy, and data-locality docs cover the R1 behavior.
- A manual smoke checklist proves the R1 main path.
- Release notes clearly state alpha limitations.

Out of scope:

- Automatic updates.
- Remote workspace.
- PostgreSQL.
- Signed production distribution if it blocks an internal alpha, though formal `0.1.0` still needs
  the signing and notarization decisions tracked.

## 5. Phase Rhythm

R1 should be executed as four phases:

| Phase | Milestones | Target output | Acceptance signal |
| --- | --- | --- | --- |
| Phase 1: Baseline cleanup | M0 | Collaboration model, verification gates, and roadmap stabilized | Future work is not blocked by old role assumptions or missing verification setup |
| Phase 2: Core loop | M1 + M2 | Real Codex execution plus artifact and trace evidence | API or CLI smoke can demonstrate a real run end to end |
| Phase 3: Operator loop | M3 | Minimal operator controls affect real lifecycle | Operator actions change state and leave evidence |
| Phase 4: Desktop delivery | M4 + M5 | Desktop observation console and pre-release hardening | Electron can complete the R1 main path and packaging is reproducible |

Suggested cadence:

- Phase 1: 1-2 days.
- Phase 2: 1-2 weeks.
- Phase 3: 3-5 days.
- Phase 4: 1-2 weeks.

These are planning estimates, not commitments. They should be adjusted after each phase review.

## 6. Verification Gates

Baseline gates:

- `pnpm run check`
- `pnpm test`
- `git diff --check`

Package and milestone-specific gates:

- M1-M2: Runtime Gateway, Application, Workspace Core tests plus a documented Codex smoke.
- M3: Application and Workspace Core tests for each operator action.
- M4: Desktop main/preload tests, Desktop build, and Electron smoke.
- M5: Desktop package command, manual smoke checklist, docs lint, and release notes review.

No milestone is complete if it changes behavior but leaves the corresponding contract, design,
operations, or status document stale.

## 7. R1 Non-goals

R1 does not include:

- `apps/web`.
- Remote workspace.
- PostgreSQL.
- A second runtime adapter.
- Drag-and-drop orchestration builder.
- External worker catalog.
- Enterprise governance or organization-wide approval platform.
- Automatic update channels.
- Full team collaboration.
- Deep code graph, embedding, or semantic search.
- Heavy dashboard polish.
- Deliberation, voting, arbitration, or meeting-style agent flows.

## 8. Risks and Fallbacks

| Risk | Impact | Fallback |
| --- | --- | --- |
| Codex CLI real long tasks are unstable | M1-M2 may block Desktop integration | R1 supports a documented short-task smoke path first |
| Artifact store scope expands into file versioning | M2 may sprawl | Keep R1 to bounded payloads, metadata, refs, and local storage boundaries |
| Trace replay becomes a UI-heavy effort | M2 or M4 may slow down | Ship read APIs and a simple timeline before advanced inspector work |
| Operator control becomes an approval system | M3 may violate product boundaries | Limit R1 to cancel, retry, rerun, and note |
| Desktop bridge exposes too much local power | Security baseline may erode | Every preload API must map to Workspace Core semantics |
| Signing and packaging slow down the release | M5 may block feedback | Use an internal unsigned alpha if needed, while tracking formal signing requirements |
| Two-person context is lost between milestones | Decisions and risks become implicit | Update status, changelog, or design docs as part of each milestone |

If time is constrained, preserve this priority order:

1. Workspace Core real run lifecycle.
2. Codex RuntimeAdapter observable execution.
3. Artifact and Trace read evidence.
4. Desktop observation of the real chain.

Cut or defer UI polish, broad navigation, advanced inspector features, large artifact support,
second runtimes, Web, and remote workspace.

## 9. Minimum Acceptable 0.1.0 Shape

The minimum acceptable `0.1.0` lets a user start a local Workspace Core through Desktop, launch
a controlled Codex run, observe run/task/agent-run state, inspect artifacts and trace events,
cancel or retry when needed, and understand from documentation where data is stored and which
parts remain alpha-grade.

## 10. Next Step

After this design is reviewed and accepted, create an implementation plan that breaks M0-M5 into
ordered tasks, starting with M0 document updates and verification recovery.
