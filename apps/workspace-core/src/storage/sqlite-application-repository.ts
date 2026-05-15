// SPDX-License-Identifier: Apache-2.0

import { eq } from 'drizzle-orm';

import {
  agentRuns,
  codeIndexSnapshots,
  contextPacks,
  events,
  orchestrationRuns,
  sourceRoots,
  tasks,
  traceEvents,
  workspaces,
} from '@cairn/domain/schema';
import {
  AgentRun,
  CodeIndexSnapshot,
  ContextPackManifest,
  OrchestrationRun,
  SourceRoot,
  Task,
} from '@cairn/shared-contracts/schemas';
import { runSqliteMigrations, type CairnSqliteDatabase } from '@cairn/storage/sqlite';

import type {
  ApplicationRepository,
  CreateRunGraphInput,
  CreateSourceRootRegistrationInput,
} from '@cairn/application';
import type { BudgetHintRow } from '@cairn/domain/schema';
import type {
  AgentRunId,
  ContextPackId,
  EventId,
  OrchestrationRunId,
  SourceRootId,
  TaskId,
  TraceEvent,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

export interface BootstrapWorkspaceInput {
  workspaceId: WorkspaceId;
  originEventId: EventId;
  displayName?: string;
}

/**
 * Workspace Core 的 SQLite application repository 适配器。
 *
 * storage 包只暴露数据库连接和迁移；这里负责把 Drizzle 表映射到
 * application 层端口，避免 storage 反向依赖 application。
 */
export class SqliteApplicationRepository implements ApplicationRepository {
  private readonly db: CairnSqliteDatabase;

  constructor(db: CairnSqliteDatabase) {
    this.db = db;
  }

  migrate(): void {
    runSqliteMigrations(this.db);
  }

  ensureBootstrapWorkspace(input: BootstrapWorkspaceInput): void {
    const now = new Date().toISOString();
    const existingWorkspace = this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.workspaceId, input.workspaceId))
      .get();

    if (existingWorkspace === undefined) {
      this.db
        .insert(workspaces)
        .values({
          workspaceId: input.workspaceId,
          workspaceType: 'personal',
          deploymentMode: 'local_desktop',
          displayName: input.displayName ?? 'Local Workspace',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    const existingEvent = this.db
      .select()
      .from(events)
      .where(eq(events.eventId, input.originEventId))
      .get();

    if (existingEvent === undefined) {
      this.db
        .insert(events)
        .values({
          eventId: input.originEventId,
          workspaceId: input.workspaceId,
          sourceType: 'system',
          actorRole: 'system',
          text: 'Workspace Core bootstrap event.',
          attachments: [],
          createdAt: now,
          metadata: {
            reason: 'workspace-core-bootstrap',
          },
        })
        .run();
    }
  }

  createRunGraph(input: CreateRunGraphInput): Promise<void> {
    this.db.transaction((tx) => {
      tx.insert(orchestrationRuns).values(toRunRow(input.run)).run();
      for (const task of input.tasks) {
        tx.insert(tasks).values(toTaskRow(task)).run();
      }
    });
    return Promise.resolve();
  }

  getRun(orchestrationRunId: OrchestrationRunId): Promise<OrchestrationRun | undefined> {
    const row = this.db
      .select()
      .from(orchestrationRuns)
      .where(eq(orchestrationRuns.orchestrationRunId, orchestrationRunId))
      .get();
    return Promise.resolve(row === undefined ? undefined : fromRunRow(row));
  }

  getTask(taskId: TaskId): Promise<Task | undefined> {
    const row = this.db.select().from(tasks).where(eq(tasks.taskId, taskId)).get();
    return Promise.resolve(row === undefined ? undefined : fromTaskRow(row));
  }

  getAgentRun(runId: AgentRunId): Promise<AgentRun | undefined> {
    const row = this.db.select().from(agentRuns).where(eq(agentRuns.runId, runId)).get();
    return Promise.resolve(row === undefined ? undefined : fromAgentRunRow(row));
  }

  listTasksByRun(orchestrationRunId: OrchestrationRunId): Promise<Task[]> {
    const rows = this.db
      .select()
      .from(tasks)
      .where(eq(tasks.orchestrationRunId, orchestrationRunId))
      .all();
    return Promise.resolve(rows.map(fromTaskRow));
  }

  listAgentRunsByTask(taskId: TaskId): Promise<AgentRun[]> {
    const rows = this.db.select().from(agentRuns).where(eq(agentRuns.taskId, taskId)).all();
    return Promise.resolve(rows.map(fromAgentRunRow));
  }

  createAgentRun(agentRun: AgentRun): Promise<void> {
    this.db.insert(agentRuns).values(toAgentRunRow(agentRun)).run();
    return Promise.resolve();
  }

  updateRun(run: OrchestrationRun): Promise<void> {
    this.db
      .update(orchestrationRuns)
      .set(toRunRow(run))
      .where(eq(orchestrationRuns.orchestrationRunId, run.orchestrationRunId))
      .run();
    return Promise.resolve();
  }

  updateTask(task: Task): Promise<void> {
    this.db.update(tasks).set(toTaskRow(task)).where(eq(tasks.taskId, task.taskId)).run();
    return Promise.resolve();
  }

  updateAgentRun(agentRun: AgentRun): Promise<void> {
    this.db
      .update(agentRuns)
      .set(toAgentRunRow(agentRun))
      .where(eq(agentRuns.runId, agentRun.runId))
      .run();
    return Promise.resolve();
  }

  appendTraceEvent(event: TraceEvent): Promise<void> {
    this.db.insert(traceEvents).values(toTraceEventRow(event)).run();
    return Promise.resolve();
  }

  createSourceRootRegistration(input: CreateSourceRootRegistrationInput): Promise<void> {
    this.db.transaction((tx) => {
      tx.insert(sourceRoots).values(toSourceRootRow(input.sourceRoot)).run();
      tx.insert(codeIndexSnapshots).values(toCodeIndexSnapshotRow(input.initialSnapshot)).run();
    });
    return Promise.resolve();
  }

  listSourceRootsByWorkspace(workspaceId: WorkspaceId): Promise<SourceRoot[]> {
    const rows = this.db
      .select()
      .from(sourceRoots)
      .where(eq(sourceRoots.workspaceId, workspaceId))
      .all();
    return Promise.resolve(rows.map(fromSourceRootRow));
  }

  listCodeIndexSnapshotsBySourceRoot(sourceRootId: SourceRootId): Promise<CodeIndexSnapshot[]> {
    const rows = this.db
      .select()
      .from(codeIndexSnapshots)
      .where(eq(codeIndexSnapshots.sourceRootId, sourceRootId))
      .all();
    return Promise.resolve(rows.map(fromCodeIndexSnapshotRow));
  }

  createContextPack(manifest: ContextPackManifest): Promise<void> {
    this.db.insert(contextPacks).values(toContextPackRow(manifest)).run();
    return Promise.resolve();
  }

  getContextPack(contextPackId: ContextPackId): Promise<ContextPackManifest | undefined> {
    const row = this.db
      .select()
      .from(contextPacks)
      .where(eq(contextPacks.contextPackId, contextPackId))
      .get();
    return Promise.resolve(row === undefined ? undefined : fromContextPackRow(row));
  }
}

const toRunRow = (run: OrchestrationRun): typeof orchestrationRuns.$inferInsert => ({
  orchestrationRunId: run.orchestrationRunId,
  workspaceId: run.workspaceId,
  status: run.status,
  executionMode: run.executionMode,
  originEventId: run.originEventId,
  hasPartialFailures: run.hasPartialFailures,
  resultCompleteness: run.resultCompleteness,
  completionLevel: run.completionLevel,
  traceId: run.traceId,
  createdAt: run.createdAt,
  updatedAt: run.updatedAt,
  ...(run.conversationId === undefined ? {} : { conversationId: run.conversationId }),
  ...(run.plannerOutputRef === undefined ? {} : { plannerOutputRef: run.plannerOutputRef }),
  ...(run.synthesisOutputRef === undefined ? {} : { synthesisOutputRef: run.synthesisOutputRef }),
  ...(run.finalResponseRef === undefined ? {} : { finalResponseRef: run.finalResponseRef }),
  ...(run.startedAt === undefined ? {} : { startedAt: run.startedAt }),
  ...(run.finishedAt === undefined ? {} : { finishedAt: run.finishedAt }),
  ...(run.error === undefined ? {} : { error: run.error }),
});

const fromRunRow = (row: typeof orchestrationRuns.$inferSelect): OrchestrationRun =>
  OrchestrationRun.parse({
    orchestrationRunId: row.orchestrationRunId,
    workspaceId: row.workspaceId,
    originEventId: row.originEventId,
    status: row.status,
    executionMode: row.executionMode,
    hasPartialFailures: row.hasPartialFailures,
    resultCompleteness: row.resultCompleteness,
    completionLevel: row.completionLevel,
    traceId: row.traceId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.conversationId === null ? {} : { conversationId: row.conversationId }),
    ...(row.plannerOutputRef === null ? {} : { plannerOutputRef: row.plannerOutputRef }),
    ...(row.synthesisOutputRef === null ? {} : { synthesisOutputRef: row.synthesisOutputRef }),
    ...(row.finalResponseRef === null ? {} : { finalResponseRef: row.finalResponseRef }),
    ...(row.startedAt === null ? {} : { startedAt: row.startedAt }),
    ...(row.finishedAt === null ? {} : { finishedAt: row.finishedAt }),
    ...(row.error === null ? {} : { error: row.error }),
  });

const toTaskRow = (task: Task): typeof tasks.$inferInsert => ({
  taskId: task.taskId,
  workspaceId: task.workspaceId,
  orchestrationRunId: task.orchestrationRunId,
  taskKind: task.taskKind,
  title: task.title,
  brief: task.brief,
  status: task.status,
  priority: task.priority,
  attempt: task.attempt,
  idempotencyKey: task.idempotencyKey,
  dependsOnTaskIds: task.dependsOnTaskIds,
  contextRefs: task.contextRefs,
  artifactRefs: task.artifactRefs,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  ...(task.parentTaskId === undefined ? {} : { parentTaskId: task.parentTaskId }),
  ...(task.executionProfile === undefined ? {} : { executionProfile: task.executionProfile }),
  ...(task.budgetHint === undefined ? {} : { budgetHint: toBudgetHintRow(task.budgetHint) }),
  ...(task.failureReason === undefined ? {} : { failureReason: task.failureReason }),
});

const fromTaskRow = (row: typeof tasks.$inferSelect): Task =>
  Task.parse({
    taskId: row.taskId,
    workspaceId: row.workspaceId,
    orchestrationRunId: row.orchestrationRunId,
    taskKind: row.taskKind,
    title: row.title,
    brief: row.brief,
    status: row.status,
    priority: row.priority,
    attempt: row.attempt,
    idempotencyKey: row.idempotencyKey,
    dependsOnTaskIds: row.dependsOnTaskIds,
    contextRefs: row.contextRefs,
    artifactRefs: row.artifactRefs,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.parentTaskId === null ? {} : { parentTaskId: row.parentTaskId }),
    ...(row.executionProfile === null ? {} : { executionProfile: row.executionProfile }),
    ...(row.budgetHint === null ? {} : { budgetHint: row.budgetHint }),
    ...(row.failureReason === null ? {} : { failureReason: row.failureReason }),
  });

const toAgentRunRow = (agentRun: AgentRun): typeof agentRuns.$inferInsert => ({
  runId: agentRun.runId,
  workspaceId: agentRun.workspaceId,
  taskId: agentRun.taskId,
  orchestrationRunId: agentRun.orchestrationRunId,
  runtimeType: agentRun.runtimeType,
  status: agentRun.status,
  attempt: agentRun.attempt,
  retryable: agentRun.retryable,
  cancelable: agentRun.cancelable,
  traceId: agentRun.traceId,
  createdAt: agentRun.createdAt,
  updatedAt: agentRun.updatedAt,
  ...(agentRun.runtimeModel === undefined ? {} : { runtimeModel: agentRun.runtimeModel }),
  ...(agentRun.providerRunId === undefined ? {} : { providerRunId: agentRun.providerRunId }),
  ...(agentRun.submittedAt === undefined ? {} : { submittedAt: agentRun.submittedAt }),
  ...(agentRun.queuedAt === undefined ? {} : { queuedAt: agentRun.queuedAt }),
  ...(agentRun.startedAt === undefined ? {} : { startedAt: agentRun.startedAt }),
  ...(agentRun.finishedAt === undefined ? {} : { finishedAt: agentRun.finishedAt }),
  ...(agentRun.timeoutAt === undefined ? {} : { timeoutAt: agentRun.timeoutAt }),
  ...(agentRun.inputRef === undefined ? {} : { inputRef: agentRun.inputRef }),
  ...(agentRun.outputRef === undefined ? {} : { outputRef: agentRun.outputRef }),
  ...(agentRun.error === undefined ? {} : { error: agentRun.error }),
  ...(agentRun.heartbeatAt === undefined ? {} : { heartbeatAt: agentRun.heartbeatAt }),
  ...(agentRun.leaseOwner === undefined ? {} : { leaseOwner: agentRun.leaseOwner }),
  ...(agentRun.leaseExpiresAt === undefined ? {} : { leaseExpiresAt: agentRun.leaseExpiresAt }),
});

const fromAgentRunRow = (row: typeof agentRuns.$inferSelect): AgentRun =>
  AgentRun.parse({
    runId: row.runId,
    workspaceId: row.workspaceId,
    taskId: row.taskId,
    orchestrationRunId: row.orchestrationRunId,
    runtimeType: row.runtimeType,
    status: row.status,
    attempt: row.attempt,
    retryable: row.retryable,
    cancelable: row.cancelable,
    traceId: row.traceId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.runtimeModel === null ? {} : { runtimeModel: row.runtimeModel }),
    ...(row.providerRunId === null ? {} : { providerRunId: row.providerRunId }),
    ...(row.submittedAt === null ? {} : { submittedAt: row.submittedAt }),
    ...(row.queuedAt === null ? {} : { queuedAt: row.queuedAt }),
    ...(row.startedAt === null ? {} : { startedAt: row.startedAt }),
    ...(row.finishedAt === null ? {} : { finishedAt: row.finishedAt }),
    ...(row.timeoutAt === null ? {} : { timeoutAt: row.timeoutAt }),
    ...(row.inputRef === null ? {} : { inputRef: row.inputRef }),
    ...(row.outputRef === null ? {} : { outputRef: row.outputRef }),
    ...(row.error === null ? {} : { error: row.error }),
    ...(row.heartbeatAt === null ? {} : { heartbeatAt: row.heartbeatAt }),
    ...(row.leaseOwner === null ? {} : { leaseOwner: row.leaseOwner }),
    ...(row.leaseExpiresAt === null ? {} : { leaseExpiresAt: row.leaseExpiresAt }),
  });

const toTraceEventRow = (event: TraceEvent): typeof traceEvents.$inferInsert => ({
  traceEventId: event.traceEventId,
  workspaceId: event.workspaceId,
  eventType: event.eventType,
  level: event.level,
  createdAt: event.createdAt,
  traceId: event.traceId,
  ...(event.orchestrationRunId === undefined
    ? {}
    : { orchestrationRunId: event.orchestrationRunId }),
  ...(event.taskId === undefined ? {} : { taskId: event.taskId }),
  ...(event.runId === undefined ? {} : { runId: event.runId }),
  ...(event.payloadRef === undefined ? {} : { payloadRef: event.payloadRef }),
  ...(event.payloadInline === undefined ? {} : { payloadInline: event.payloadInline }),
});

const toSourceRootRow = (sourceRoot: SourceRoot): typeof sourceRoots.$inferInsert => ({
  sourceRootId: sourceRoot.sourceRootId,
  workspaceId: sourceRoot.workspaceId,
  kind: sourceRoot.kind,
  displayName: sourceRoot.displayName,
  uri: sourceRoot.uri,
  status: sourceRoot.status,
  includeGlobs: sourceRoot.includeGlobs,
  excludeGlobs: sourceRoot.excludeGlobs,
  createdAt: sourceRoot.createdAt,
  updatedAt: sourceRoot.updatedAt,
  ...(sourceRoot.lastIndexedAt === undefined ? {} : { lastIndexedAt: sourceRoot.lastIndexedAt }),
  ...(sourceRoot.error === undefined ? {} : { error: sourceRoot.error }),
  ...(sourceRoot.metadata === undefined ? {} : { metadata: sourceRoot.metadata }),
});

const fromSourceRootRow = (row: typeof sourceRoots.$inferSelect): SourceRoot =>
  SourceRoot.parse({
    sourceRootId: row.sourceRootId,
    workspaceId: row.workspaceId,
    kind: row.kind,
    displayName: row.displayName,
    uri: row.uri,
    status: row.status,
    includeGlobs: row.includeGlobs,
    excludeGlobs: row.excludeGlobs,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.lastIndexedAt === null ? {} : { lastIndexedAt: row.lastIndexedAt }),
    ...(row.error === null ? {} : { error: row.error }),
    ...(row.metadata === null ? {} : { metadata: row.metadata }),
  });

const toCodeIndexSnapshotRow = (
  snapshot: CodeIndexSnapshot,
): typeof codeIndexSnapshots.$inferInsert => ({
  snapshotId: snapshot.snapshotId,
  sourceRootId: snapshot.sourceRootId,
  workspaceId: snapshot.workspaceId,
  status: snapshot.status,
  indexVersion: snapshot.indexVersion,
  fileCount: snapshot.fileCount,
  createdAt: snapshot.createdAt,
  ...(snapshot.metadata === undefined ? {} : { metadata: snapshot.metadata }),
});

const fromCodeIndexSnapshotRow = (row: typeof codeIndexSnapshots.$inferSelect): CodeIndexSnapshot =>
  CodeIndexSnapshot.parse({
    snapshotId: row.snapshotId,
    sourceRootId: row.sourceRootId,
    workspaceId: row.workspaceId,
    status: row.status,
    indexVersion: row.indexVersion,
    fileCount: row.fileCount,
    createdAt: row.createdAt,
    ...(row.metadata === null ? {} : { metadata: row.metadata }),
  });

const toContextPackRow = (manifest: ContextPackManifest): typeof contextPacks.$inferInsert => ({
  contextPackId: manifest.contextPackId,
  workspaceId: manifest.workspaceId,
  sourceRootIds: manifest.sourceRootIds,
  createdFor: manifest.createdFor,
  query: manifest.query,
  items: manifest.items,
  createdAt: manifest.createdAt,
  ...(manifest.createdFor.type === 'orchestration_run'
    ? { orchestrationRunId: manifest.createdFor.orchestrationRunId }
    : { taskId: manifest.createdFor.taskId }),
  ...(manifest.tokenEstimate === undefined ? {} : { tokenEstimate: manifest.tokenEstimate }),
});

const fromContextPackRow = (row: typeof contextPacks.$inferSelect): ContextPackManifest =>
  ContextPackManifest.parse({
    contextPackId: row.contextPackId,
    workspaceId: row.workspaceId,
    sourceRootIds: row.sourceRootIds,
    createdFor: row.createdFor,
    query: row.query,
    items: row.items,
    createdAt: row.createdAt,
    ...(row.tokenEstimate === null ? {} : { tokenEstimate: row.tokenEstimate }),
  });

const toBudgetHintRow = (budgetHint: Task['budgetHint']): BudgetHintRow => ({
  ...(budgetHint?.maxTokens === undefined ? {} : { maxTokens: budgetHint.maxTokens }),
  ...(budgetHint?.maxSeconds === undefined ? {} : { maxSeconds: budgetHint.maxSeconds }),
  ...(budgetHint?.maxCostUsd === undefined ? {} : { maxCostUsd: budgetHint.maxCostUsd }),
});
