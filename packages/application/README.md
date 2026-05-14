# @cairn/application

Application-layer services for Cairn's run-driven collaboration core.

This package owns orchestration state progression for `OrchestrationRun`, `Task`,
and `AgentRun`. Storage and runtime execution stay behind ports so the same
application logic can later run inside embedded desktop Workspace Core or a
remote Workspace Core service.

Current baseline:

- Create a minimal single-worker run graph.
- Submit a ready task to a runtime gateway port.
- Apply runtime adapter events back onto AgentRun / Task / OrchestrationRun.
- Preserve terminal-state immutability at the application boundary.

This package is source-only and does not create `apps/*`.
