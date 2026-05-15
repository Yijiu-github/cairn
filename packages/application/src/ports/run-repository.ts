// SPDX-License-Identifier: Apache-2.0

import type {
  AgentRun,
  AgentRunId,
  CodeIndexSnapshot,
  ContextPackId,
  ContextPackManifest,
  OrchestrationRun,
  OrchestrationRunId,
  SourceRoot,
  SourceRootId,
  Task,
  TaskId,
  TraceEvent,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

export interface CreateRunGraphInput {
  run: OrchestrationRun;
  tasks: Task[];
}

export interface CreateSourceRootRegistrationInput {
  sourceRoot: SourceRoot;
  initialSnapshot: CodeIndexSnapshot;
}

export interface ApplicationRepository {
  createRunGraph(input: CreateRunGraphInput): Promise<void>;
  getRun(orchestrationRunId: OrchestrationRunId): Promise<OrchestrationRun | undefined>;
  getTask(taskId: TaskId): Promise<Task | undefined>;
  getAgentRun(runId: AgentRunId): Promise<AgentRun | undefined>;
  listTasksByRun(orchestrationRunId: OrchestrationRunId): Promise<Task[]>;
  listAgentRunsByTask(taskId: TaskId): Promise<AgentRun[]>;
  createAgentRun(agentRun: AgentRun): Promise<void>;
  updateRun(run: OrchestrationRun): Promise<void>;
  updateTask(task: Task): Promise<void>;
  updateAgentRun(agentRun: AgentRun): Promise<void>;
  appendTraceEvent(event: TraceEvent): Promise<void>;
  createSourceRootRegistration(input: CreateSourceRootRegistrationInput): Promise<void>;
  listSourceRootsByWorkspace(workspaceId: WorkspaceId): Promise<SourceRoot[]>;
  listCodeIndexSnapshotsBySourceRoot(sourceRootId: SourceRootId): Promise<CodeIndexSnapshot[]>;
  createContextPack(manifest: ContextPackManifest): Promise<void>;
  getContextPack(contextPackId: ContextPackId): Promise<ContextPackManifest | undefined>;
}
