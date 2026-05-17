// SPDX-License-Identifier: Apache-2.0

import type {
  ApplicationRepository,
  CreateSourceRootRegistrationInput,
  CreateRunGraphInput,
  ReplaceCodeIndexSnapshotInput,
  SearchCodeIndexFilesInput,
} from '../ports/run-repository.js';
import type {
  AgentRun,
  AgentRunId,
  Artifact,
  ArtifactId,
  CodeIndexFile,
  CodeIndexFileId,
  CodeIndexSnapshot,
  CodeIndexSnapshotId,
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

export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly agentRuns = new Map<AgentRunId, AgentRun>();
  private readonly artifacts = new Map<ArtifactId, Artifact>();
  private readonly codeIndexFiles = new Map<CodeIndexFileId, CodeIndexFile>();
  private readonly codeIndexSnapshots = new Map<CodeIndexSnapshotId, CodeIndexSnapshot>();
  private readonly contextPacks = new Map<ContextPackId, ContextPackManifest>();
  private readonly planningOutputs = new Map<PlanningOutputId, PlanningOutput>();
  private readonly planningOutputsByRun = new Map<OrchestrationRunId, PlanningOutputId>();
  private readonly runs = new Map<OrchestrationRunId, OrchestrationRun>();
  private readonly sourceRoots = new Map<SourceRootId, SourceRoot>();
  private readonly tasks = new Map<TaskId, Task>();
  private readonly traceEvents: TraceEvent[] = [];

  createRunGraph(input: CreateRunGraphInput): Promise<void> {
    this.runs.set(input.run.orchestrationRunId, input.run);
    for (const task of input.tasks) {
      this.tasks.set(task.taskId, task);
    }
    return Promise.resolve();
  }

  listRunsByWorkspace(workspaceId: WorkspaceId): Promise<OrchestrationRun[]> {
    return Promise.resolve(
      [...this.runs.values()]
        .filter((run) => run.workspaceId === workspaceId)
        .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt)),
    );
  }

  getRun(orchestrationRunId: OrchestrationRunId): Promise<OrchestrationRun | undefined> {
    return Promise.resolve(this.runs.get(orchestrationRunId));
  }

  getTask(taskId: TaskId): Promise<Task | undefined> {
    return Promise.resolve(this.tasks.get(taskId));
  }

  getAgentRun(runId: AgentRunId): Promise<AgentRun | undefined> {
    return Promise.resolve(this.agentRuns.get(runId));
  }

  listTasksByRun(orchestrationRunId: OrchestrationRunId): Promise<Task[]> {
    return Promise.resolve(
      [...this.tasks.values()].filter((task) => task.orchestrationRunId === orchestrationRunId),
    );
  }

  listAgentRunsByTask(taskId: TaskId): Promise<AgentRun[]> {
    return Promise.resolve(
      [...this.agentRuns.values()].filter((agentRun) => agentRun.taskId === taskId),
    );
  }

  listArtifactsByRun(orchestrationRunId: OrchestrationRunId): Promise<Artifact[]> {
    return Promise.resolve(
      [...this.artifacts.values()].filter(
        (artifact) => artifact.orchestrationRunId === orchestrationRunId,
      ),
    );
  }

  getArtifact(artifactId: ArtifactId): Promise<Artifact | undefined> {
    return Promise.resolve(this.artifacts.get(artifactId));
  }

  listTraceEventsByRun(orchestrationRunId: OrchestrationRunId): Promise<TraceEvent[]> {
    return Promise.resolve(
      this.traceEvents
        .filter((event) => event.orchestrationRunId === orchestrationRunId)
        .toSorted((left, right) => left.createdAt.localeCompare(right.createdAt)),
    );
  }

  createAgentRun(agentRun: AgentRun): Promise<void> {
    this.agentRuns.set(agentRun.runId, agentRun);
    return Promise.resolve();
  }

  createArtifact(artifact: Artifact): Promise<void> {
    this.artifacts.set(artifact.artifactId, artifact);
    return Promise.resolve();
  }

  updateArtifact(artifact: Artifact): Promise<void> {
    this.artifacts.set(artifact.artifactId, artifact);
    return Promise.resolve();
  }

  createPlanningOutput(output: PlanningOutput): Promise<void> {
    const previousPlanningOutputId = this.planningOutputsByRun.get(output.orchestrationRunId);
    if (previousPlanningOutputId !== undefined) {
      this.planningOutputs.delete(previousPlanningOutputId);
    }
    this.planningOutputs.set(output.planningOutputId, output);
    this.planningOutputsByRun.set(output.orchestrationRunId, output.planningOutputId);
    return Promise.resolve();
  }

  updateRun(run: OrchestrationRun): Promise<void> {
    this.runs.set(run.orchestrationRunId, run);
    return Promise.resolve();
  }

  updateTask(task: Task): Promise<void> {
    this.tasks.set(task.taskId, task);
    return Promise.resolve();
  }

  updateAgentRun(agentRun: AgentRun): Promise<void> {
    this.agentRuns.set(agentRun.runId, agentRun);
    return Promise.resolve();
  }

  getPlanningOutput(planningOutputId: PlanningOutputId): Promise<PlanningOutput | undefined> {
    return Promise.resolve(this.planningOutputs.get(planningOutputId));
  }

  getPlanningOutputByRun(
    orchestrationRunId: OrchestrationRunId,
  ): Promise<PlanningOutput | undefined> {
    return Promise.resolve(
      [...this.planningOutputs.values()].find(
        (planningOutput) => planningOutput.orchestrationRunId === orchestrationRunId,
      ),
    );
  }

  updatePlanningOutput(output: PlanningOutput): Promise<void> {
    const previousPlanningOutputId = this.planningOutputsByRun.get(output.orchestrationRunId);
    if (
      previousPlanningOutputId !== undefined &&
      previousPlanningOutputId !== output.planningOutputId
    ) {
      this.planningOutputs.delete(previousPlanningOutputId);
    }
    this.planningOutputs.set(output.planningOutputId, output);
    this.planningOutputsByRun.set(output.orchestrationRunId, output.planningOutputId);
    return Promise.resolve();
  }

  appendTraceEvent(event: TraceEvent): Promise<void> {
    this.traceEvents.push(event);
    return Promise.resolve();
  }

  createSourceRootRegistration(input: CreateSourceRootRegistrationInput): Promise<void> {
    this.sourceRoots.set(input.sourceRoot.sourceRootId, input.sourceRoot);
    this.codeIndexSnapshots.set(input.initialSnapshot.snapshotId, input.initialSnapshot);
    return Promise.resolve();
  }

  getSourceRoot(sourceRootId: SourceRootId): Promise<SourceRoot | undefined> {
    return Promise.resolve(this.sourceRoots.get(sourceRootId));
  }

  updateSourceRoot(sourceRoot: SourceRoot): Promise<void> {
    this.sourceRoots.set(sourceRoot.sourceRootId, sourceRoot);
    return Promise.resolve();
  }

  listSourceRootsByWorkspace(workspaceId: WorkspaceId): Promise<SourceRoot[]> {
    return Promise.resolve(
      [...this.sourceRoots.values()].filter((sourceRoot) => sourceRoot.workspaceId === workspaceId),
    );
  }

  listCodeIndexSnapshotsBySourceRoot(sourceRootId: SourceRootId): Promise<CodeIndexSnapshot[]> {
    return Promise.resolve(
      [...this.codeIndexSnapshots.values()].filter(
        (snapshot) => snapshot.sourceRootId === sourceRootId,
      ),
    );
  }

  listCodeIndexFilesBySnapshot(snapshotId: CodeIndexSnapshotId): Promise<CodeIndexFile[]> {
    return Promise.resolve(
      [...this.codeIndexFiles.values()].filter((file) => file.snapshotId === snapshotId),
    );
  }

  searchCodeIndexFiles(input: SearchCodeIndexFilesInput): Promise<CodeIndexFile[]> {
    const pathContains = input.pathContains?.toLowerCase();
    const language = input.language?.toLowerCase();
    const latestSnapshotIds = this.latestReadySnapshotIds(input);

    if (latestSnapshotIds.size === 0) {
      return Promise.resolve([]);
    }

    return Promise.resolve(
      [...this.codeIndexFiles.values()]
        .filter((file) => file.workspaceId === input.workspaceId)
        .filter((file) => latestSnapshotIds.has(file.snapshotId))
        .filter((file) =>
          input.sourceRootId === undefined ? true : file.sourceRootId === input.sourceRootId,
        )
        .filter((file) =>
          pathContains === undefined ? true : file.path.toLowerCase().includes(pathContains),
        )
        .filter((file) =>
          language === undefined ? true : file.language?.toLowerCase() === language,
        )
        .sort((a, b) => a.path.localeCompare(b.path))
        .slice(0, input.limit),
    );
  }

  private latestReadySnapshotIds(input: SearchCodeIndexFilesInput): Set<CodeIndexSnapshotId> {
    const latestBySourceRoot = new Map<SourceRootId, CodeIndexSnapshot>();

    for (const snapshot of this.codeIndexSnapshots.values()) {
      if (snapshot.workspaceId !== input.workspaceId || snapshot.status !== 'ready') {
        continue;
      }

      if (input.sourceRootId !== undefined && snapshot.sourceRootId !== input.sourceRootId) {
        continue;
      }

      const current = latestBySourceRoot.get(snapshot.sourceRootId);
      if (current === undefined || snapshot.createdAt.localeCompare(current.createdAt) > 0) {
        latestBySourceRoot.set(snapshot.sourceRootId, snapshot);
      }
    }

    return new Set([...latestBySourceRoot.values()].map((snapshot) => snapshot.snapshotId));
  }

  replaceCodeIndexSnapshot(input: ReplaceCodeIndexSnapshotInput): Promise<void> {
    this.sourceRoots.set(input.sourceRoot.sourceRootId, input.sourceRoot);
    this.codeIndexSnapshots.set(input.snapshot.snapshotId, input.snapshot);
    for (const file of input.files) {
      this.codeIndexFiles.set(file.fileId, file);
    }
    return Promise.resolve();
  }

  createContextPack(manifest: ContextPackManifest): Promise<void> {
    this.contextPacks.set(manifest.contextPackId, manifest);
    return Promise.resolve();
  }

  getContextPack(contextPackId: ContextPackId): Promise<ContextPackManifest | undefined> {
    return Promise.resolve(this.contextPacks.get(contextPackId));
  }

  listTraceEvents(): TraceEvent[] {
    return [...this.traceEvents];
  }
}
