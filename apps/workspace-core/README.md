# @cairn/workspace-core

Workspace Core is the single service core shared by Desktop and Web shells.

Current baseline:

- Fastify service factory and executable server entry.
- `GET /health` readiness endpoint.
- SQLite-backed application repository for run/task/agent-run state.
- Minimal R1 run endpoints backed by `@cairn/application` in-memory ports:
  - `POST /v1/workspaces/:workspaceId/runs`
  - `GET /v1/runs/:runId`
  - `GET /v1/runs/:runId/tasks`
  - `GET /v1/tasks/:taskId/agent-runs`
- Mock runtime gateway loop for local verification.

By default, the executable server stores data in `.cairn/workspace-core.sqlite`.

Environment variables:

- `CAIRN_WORKSPACE_CORE_HOST` (default `127.0.0.1`)
- `CAIRN_WORKSPACE_CORE_PORT` (default `4321`)
- `CAIRN_WORKSPACE_CORE_DB_PATH` (default `.cairn/workspace-core.sqlite`)
- `CAIRN_WORKSPACE_CORE_AUTH_TOKEN` (optional; when set, every request must send
  `Authorization: Bearer <token>`)
- `CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID`
- `CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID`
