# @cairn/workspace-core

Workspace Core is the single service core shared by Desktop and Web shells.

Current baseline:

- Fastify service factory and executable server entry.
- `GET /health` readiness endpoint.
- Minimal R1 run endpoints backed by `@cairn/application` in-memory ports:
  - `POST /v1/workspaces/:workspaceId/runs`
  - `GET /v1/runs/:runId`
  - `GET /v1/runs/:runId/tasks`
  - `GET /v1/tasks/:taskId/agent-runs`
- Mock runtime gateway loop for local verification.

The first implementation is intentionally in-memory. SQLite repositories will
be connected after the service boundary is stable.
