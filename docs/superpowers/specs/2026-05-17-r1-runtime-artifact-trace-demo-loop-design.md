# R1 Runtime + Artifact/Trace Demo Loop Design

> Date: 2026-05-17  
> Status: Draft for owner review  
> Scope: next R1 slice after PlanningOutput, Artifact/Trace read APIs, and Desktop static shell  
> Related: `docs/STATUS.md`, `docs/contracts/runtime-adapter.md`, `docs/design/state-machines.md`, `docs/product/positioning-and-boundaries.md`

## 1. Purpose

This design defines the next thin product loop for Cairn:

> Start a real Codex-backed AgentRun from Workspace Core, drain runtime events into durable run/task/agent-run state, persist replayable TraceEvents and reviewable Artifact metadata, then expose enough read APIs for UI Preview and the Desktop shell to show the result.

The goal is not to build a full planner, full desktop product, or multi-agent workflow. The goal is to prove the core Cairn value: execution is observable, recoverable, replayable, and not trapped inside a single runtime's UI.

## 2. Current Baseline

Already available:

- Workspace Core Fastify service with run/task/agent-run control APIs.
- SQLite application repository for run/task/agent-run state.
- Runtime Gateway port with `submit`, `stream`, and `cancel`.
- Codex CLI adapter primitives in `packages/runtime_gateway`.
- Application runtime drain path that applies `AdapterStreamEvent` to AgentRun state.
- PlanningOutput model and read API.
- Artifact metadata and TraceEvent read APIs.
- UI preview and Desktop static shell.

Still missing for a demo loop:

- Workspace Core route that submits a task to the real Codex runtime path with safe defaults.
- A repository-backed artifact write path for runtime output metadata.
- A clear file-store boundary for artifact payloads.
- Trace event mapping that is explicit enough for replay UI.
- A Desktop/UI-facing read model that can show the finished loop without inventing local state.

## 3. Product Boundary

This slice must stay inside R1 product boundaries.

Allowed:

- Single-user, local-first execution.
- One Task → one AgentRun → one Runtime Adapter execution.
- Codex CLI as the first real runtime.
- Metadata-first artifact records with payload references.
- TraceEvents as replay source, not re-execution source.
- Desktop shell consuming Workspace Core read APIs only after backend read models are stable.

Not allowed:

- Multi-agent DAG generation.
- Workflow builder semantics.
- Enterprise approvals or governance.
- Marketplace/provider abstraction UI.
- Direct Desktop business logic that bypasses Workspace Core.
- Uploading task, message, artifact, or trace payloads to Cairn-controlled cloud.

## 4. Recommended Approach

Use a staged backend-first loop:

1. Add a Workspace Core runtime submit route that calls the existing application `submitTaskToRuntime` path.
2. Keep drain explicit via the existing `POST /v1/agent-runs/:agentRunId/drain-runtime` route for this slice.
3. Extend application drain mapping to create lightweight Artifact metadata and TraceEvents for key runtime events.
4. Add a local artifact store port with a filesystem implementation, but initially store only bounded text/log payloads under a workspace-controlled run directory.
5. Update UI Preview/Desktop only after the backend read model is stable.

Why this approach:

- It exercises real runtime behavior without hiding complexity behind a scheduler too early.
- It keeps Desktop thin and honest.
- It turns Artifact/Trace from passive read APIs into the product memory layer.
- It preserves clear future seams for scheduler, sidecar lifecycle, and richer replay UI.

## 5. End-to-End Flow

### 5.1 Submit

The caller creates or selects a ready Task, then submits it to runtime:

```text
POST /v1/tasks/:taskId/agent-runs
```

Request shape should be minimal:

```json
{
  "runtimeType": "codex",
  "model": "default",
  "prompt": "Summarize the current repository status.",
  "timeoutMs": 120000
}
```

The route converts the prompt into an input artifact reference by writing a bounded input artifact file and storing metadata before runtime submit. Inline prompt handoff is not part of this slice because it weakens auditability.

Result:

- Task moves `ready → dispatched`.
- AgentRun is created with `submitted` status.
- Runtime adapter receives an `AdapterSubmitRequest`.
- TraceEvent records submit intent and runtime ack.

### 5.2 Drain

The caller drains runtime events explicitly:

```text
POST /v1/agent-runs/:agentRunId/drain-runtime
```

Drain applies runtime stream events to durable state:

| Adapter event | State effect                                                       | Trace effect                        | Artifact effect                         |
| ------------- | ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- |
| `queued`      | AgentRun `submitted → queued`                                      | `agent_run.queued`                  | none                                    |
| `started`     | AgentRun `queued/submitted → running`, Task `dispatched → running` | `agent_run.started`                 | none                                    |
| `progress`    | no terminal state change                                           | `agent_run.progress`                | append bounded note to runtime log      |
| `token`       | no state change                                                    | optional compact trace summary only | append to output payload buffer         |
| `artifact`    | no state change                                                    | `artifact.created`                  | create Artifact metadata                |
| `succeeded`   | AgentRun/Task/Run success progression                              | `agent_run.succeeded`               | create final output Artifact if present |
| `failed`      | AgentRun failed, Task failed, Run failed                           | `agent_run.failed`                  | optional error log Artifact             |
| `cancelled`   | AgentRun cancelled, Task cancelled, Run cancelled                  | `agent_run.cancelled`               | optional cancellation log               |
| `timeout`     | AgentRun timeout, Task failed/timeout semantics                    | `agent_run.timeout`                 | optional error log                      |

Token-level trace must be bounded. The default should not create one TraceEvent per token unless explicitly enabled for debugging, because replay should stay readable.

### 5.3 Read

The UI can reconstruct the result through existing or near-existing read APIs:

```text
GET /v1/runs/:runId
GET /v1/runs/:runId/planning-output
GET /v1/runs/:runId/artifacts
GET /v1/artifacts/:artifactId
GET /v1/runs/:runId/trace
```

For this slice, the UI does not get a dedicated demo endpoint. It reconstructs state from the normal run, artifact, planning-output, and trace read APIs.

## 6. Artifact Store Boundary

Artifact metadata and artifact payload are separate.

### 6.1 Metadata

Metadata lives in SQLite through the existing Artifact domain model.

Required metadata for this slice:

- `artifactId`
- `workspaceId`
- `orchestrationRunId`
- `taskId` when known
- `agentRunId` when known
- `kind`
- `title`
- `summary`
- `reviewState`
- `sensitivity`
- `payloadRef`
- `createdAt`
- `updatedAt`

If the current shared schema lacks `payloadRef` or sensitivity fields required by this slice, add optional fields rather than breaking existing records.

### 6.2 Payload

Payload lives in a local artifact store, not directly inside normal API responses.

Recommended local path shape:

```text
.cairn/artifacts/<workspaceId>/<orchestrationRunId>/<artifactId>/<filename>
```

Initial payload kinds:

- `runtime-input.json`
- `runtime-output.txt`
- `runtime-error.json`
- `runtime-log.txt`

Payload guardrails:

- Store bounded text by default.
- Refuse or truncate payloads above an explicit size limit.
- Never include secrets.
- Do not expose absolute local paths in API responses by default.
- Return opaque `payloadRef`, not raw filesystem path.

## 7. Trace Replay Boundary

TraceEvent is the replay source, not a command log for re-execution.

Trace payloads should answer:

- What happened?
- Which run/task/agent-run/artifact does it refer to?
- Was it user/operator/runtime/application initiated?
- Is there a compact error or artifact reference?

Trace payloads should not include:

- full runtime output,
- full source files,
- secrets,
- raw absolute filesystem paths,
- large token streams.

Replay UI should load artifacts separately when the operator chooses to inspect a payload.

## 8. Workspace Core API Shape

### 8.1 Submit Task To Runtime

Add a route if it does not already exist:

```text
POST /v1/tasks/:taskId/agent-runs
```

Request:

```ts
interface SubmitTaskRuntimeRequest {
  runtimeType: 'codex';
  model?: string;
  prompt: string;
  timeoutMs?: number;
  options?: Record<string, unknown>;
}
```

Response:

```ts
interface SubmitTaskRuntimeResponse {
  agentRunId: string;
  taskId: string;
  orchestrationRunId: string;
  status: 'submitted';
  providerRunId?: string;
}
```

Error behavior:

- `TASK_NOT_FOUND` → 404
- `TASK_NOT_READY` → 409
- `RUN_TERMINAL` → 409
- `RUNTIME_UNAVAILABLE` → 503
- `INPUT_INVALID` → 400

### 8.2 Artifact Payload Read

Add a bounded text payload read endpoint:

```text
GET /v1/artifacts/:artifactId/payload
```

Default response is safe for bounded text only. Binary or large payloads return a structured `PAYLOAD_NOT_INLINEABLE` error with artifact metadata, not inline content.

## 9. Runtime Adapter Scope

Codex adapter should be the only real runtime for this slice.

Required behavior:

- Build `codex exec --json` request from `AdapterSubmitRequest`.
- Run in a controlled cwd.
- Pass only whitelisted environment variables.
- Parse JSONL into `AdapterStreamEvent`.
- Map process errors into normalized adapter errors.
- Support best-effort cancel through existing process wrapper.

Not required:

- PTY fallback.
- Multi-provider UI.
- Mid-stream operator injection.
- Tool-call execution beyond parsed event metadata.

## 10. Desktop/UI Role

Desktop must remain thin.

For this slice:

- Desktop shell remains static in this slice. A later UI slice may call read APIs after the backend contract lands.
- Desktop must not start Workspace Core sidecar yet unless a separate sidecar lifecycle spec is approved.
- Desktop must not directly invoke Codex CLI.
- Desktop must not read artifact files directly.

UI Preview can model the future screen state with mock data after backend contracts are stable.

## 11. Testing Strategy

Minimum verification for implementation:

- Shared contract tests for new request/response schemas.
- Application tests for submit and drain state progression.
- Application/storage tests for artifact metadata creation.
- Workspace Core route tests for submit, drain, artifact list, trace list.
- Runtime Gateway tests for Codex event parsing and error mapping.
- Full commands:
  - `pnpm run check`
  - `pnpm test`
  - `pnpm --filter @cairn/workspace-core test`
  - `pnpm --filter @cairn/runtime-gateway test`
  - `pnpm --filter @cairn/ui-preview build` if UI preview changes
  - `pnpm --filter @cairn/desktop build` if Desktop changes

Real Codex CLI execution should be behind an opt-in integration test or manual smoke script, because developer machines may not have `codex` installed or authenticated.

## 12. Milestones

### Milestone 1 — Contract and store boundary

Deliver:

- Submit route contract.
- Artifact payload reference schema.
- Artifact store port design.
- Tests for schema and repository boundaries.

Exit criteria:

- No runtime behavior yet, but API and storage shape are stable.

### Milestone 2 — Application loop

Deliver:

- Submit Task → AgentRun through RuntimeGatewayPort.
- Drain runtime stream → state transitions, TraceEvents, Artifact metadata.
- In-memory tests and SQLite repository tests.

Exit criteria:

- Mock runtime can produce a complete run with artifacts and trace.

### Milestone 3 — Codex adapter path

Deliver:

- Workspace Core can use Codex runtime gateway implementation.
- Manual or opt-in smoke path can execute Codex CLI and drain events.
- Runtime errors map cleanly to Cairn state and trace.

Exit criteria:

- A local developer with Codex installed can run a documented smoke command and inspect artifacts/trace through APIs.

### Milestone 4 — Read model polish

Deliver:

- UI Preview or Desktop mock/read-only display for the loop result.
- Documentation updated: STATUS, roadmap, contracts, changelog.

Exit criteria:

- The product story is visible: run started, agent executed, artifacts captured, trace replay source available.

## 13. Decisions

### D1 — Prompt input artifact timing

Create an input artifact before runtime submit. The runtime submit path receives an artifact reference, not an unaudited inline prompt.

### D2 — Artifact payload endpoint timing

Add the bounded text payload endpoint in this slice. It is needed to make Artifact Review inspectable without exposing raw filesystem paths.

### D3 — Drain ownership

Keep drain explicit for this slice. Auto-drain belongs to a later scheduler or sidecar lifecycle slice.

## 14. Acceptance Criteria

This slice is complete when:

- A ready Task can be submitted to runtime through Workspace Core.
- A mock runtime path can drain to terminal state and create replayable TraceEvents plus Artifact metadata.
- Codex CLI path has a documented opt-in smoke flow.
- Artifact payloads are stored behind opaque references, not raw filesystem paths.
- Trace read API can reconstruct the meaningful execution timeline.
- Desktop remains a thin shell and does not bypass Workspace Core.
- `pnpm run check` and `pnpm test` pass.
