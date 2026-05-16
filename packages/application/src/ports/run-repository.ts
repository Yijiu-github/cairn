// SPDX-License-Identifier: Apache-2.0

import type {
  AgentRun,
  AgentRunId,
  CodeIndexFile,
  CodeIndexSnapshot,
  ContextPackId,
  ContextPackManifest,
  OrchestrationRun,
  OrchestrationRunId,
  PlanningOutput,
  PlanningOutputId,
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

export interface ReplaceCodeIndexSnapshotInput {
  sourceRoot: SourceRoot;
  snapshot: CodeIndexSnapshot;
  files: CodeIndexFile[];
}

export interface SearchCodeIndexFilesInput {
  workspaceId: WorkspaceId;
  sourceRootId?: SourceRootId | undefined;
  pathContains?: string | undefined;
  language?: string | undefined;
  limit: number;
}

export interface ApplicationRepository {
  createRunGraph(input: CreateRunGraphInput): Promise<void>;
  getRun(orchestrationRunId: OrchestrationRunId): Promise<OrchestrationRun | undefined>;
  getTask(taskId: TaskId): Promise<Task | undefined>;
  getAgentRun(runId: AgentRunId): Promise<AgentRun | undefined>;
  listTasksByRun(orchestrationRunId: OrchestrationRunId): Promise<Task[]>;
  listAgentRunsByTask(taskId: TaskId): Promise<AgentRun[]>;
  createAgentRun(agentRun: AgentRun): Promise<void>;
  createPlanningOutput(output: PlanningOutput): Promise<void>;
  updateRun(run: OrchestrationRun): Promise<void>;
  updateTask(task: Task): Promise<void>;
  updateAgentRun(agentRun: AgentRun): Promise<void>;
  getPlanningOutput(planningOutputId: PlanningOutputId): Promise<PlanningOutput | undefined>;
  getPlanningOutputByRun(
    orchestrationRunId: OrchestrationRunId,
  ): Promise<PlanningOutput | undefined>;
  updatePlanningOutput(output: PlanningOutput): Promise<void>;
  appendTraceEvent(event: TraceEvent): Promise<void>;
  createSourceRootRegistration(input: CreateSourceRootRegistrationInput): Promise<void>;
  getSourceRoot(sourceRootId: SourceRootId): Promise<SourceRoot | undefined>;
  updateSourceRoot(sourceRoot: SourceRoot): Promise<void>;
  listSourceRootsByWorkspace(workspaceId: WorkspaceId): Promise<SourceRoot[]>;
  listCodeIndexSnapshotsBySourceRoot(sourceRootId: SourceRootId): Promise<CodeIndexSnapshot[]>;
  listCodeIndexFilesBySnapshot(
    snapshotId: CodeIndexSnapshot['snapshotId'],
  ): Promise<CodeIndexFile[]>;
  searchCodeIndexFiles(input: SearchCodeIndexFilesInput): Promise<CodeIndexFile[]>;
  replaceCodeIndexSnapshot(input: ReplaceCodeIndexSnapshotInput): Promise<void>;
  createContextPack(manifest: ContextPackManifest): Promise<void>;
  getContextPack(contextPackId: ContextPackId): Promise<ContextPackManifest | undefined>;
}
