// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

import {
  sanitizeWorkspaceCoreConnection,
  workspaceCoreConnectionViewSchema,
} from './workspace-core-connection.js';

import type { WorkspaceCoreConnectionSnapshot } from './workspace-core-connection.js';

export const DEFAULT_WORKSPACE_ID = '01J000000000000000000000W0';

const apiPaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().optional(),
    total: z.number().int().nonnegative().optional(),
  });

const apiRunSchema = z.object({
  orchestrationRunId: z.string().min(1),
  status: z.string().min(1),
  executionMode: z.string().min(1),
  hasPartialFailures: z.boolean().optional(),
  resultCompleteness: z.string().optional(),
  completionLevel: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const apiSourceRootSchema = z.object({
  sourceRootId: z.string().min(1),
  kind: z.enum(['local_directory', 'remote_repository']),
  displayName: z.string().min(1),
  uri: z.string().min(1),
  status: z.enum(['active', 'indexing', 'stale', 'error']),
  includeGlobs: z.array(z.string()),
  excludeGlobs: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastIndexedAt: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const apiTaskSchema = z.object({
  taskId: z.string().min(1),
  parentTaskId: z.string().optional(),
  taskKind: z.string().min(1),
  title: z.string().min(1),
  brief: z.string(),
  status: z.string().min(1),
  attempt: z.number().int().nonnegative(),
  dependsOnTaskIds: z.array(z.string()),
  artifactRefs: z.array(z.string()),
  failureReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const apiArtifactSchema = z.object({
  artifactId: z.string().min(1),
  artifactRole: z.string().min(1),
  kind: z.string().min(1),
  formatVersion: z.string().min(1),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  sensitivity: z.string().optional(),
  producerType: z.string().min(1),
  visibility: z.string().min(1),
  createdAt: z.string(),
  payloadRef: z.string().optional(),
  uriOrPath: z.string().optional(),
});

const apiTraceEventSchema = z.object({
  traceEventId: z.string().min(1),
  eventType: z.string().min(1),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  payloadInline: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  traceId: z.string().min(1),
});

const apiArtifactPayloadSchema = z.object({
  artifactId: z.string().min(1),
  mediaType: z.enum(['text/plain', 'application/json']),
  text: z.string(),
  truncated: z.boolean(),
});

export const workspaceCoreArtifactPayloadPreviewSchema = z.object({
  mediaType: z.enum(['text/plain', 'application/json']),
  text: z.string(),
  truncated: z.boolean(),
});
export type WorkspaceCoreArtifactPayloadPreview = z.infer<
  typeof workspaceCoreArtifactPayloadPreviewSchema
>;

export const workspaceCoreRunSummarySchema = z.object({
  runId: z.string(),
  status: z.string(),
  executionMode: z.string(),
  hasPartialFailures: z.boolean(),
  resultCompleteness: z.string().optional(),
  completionLevel: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WorkspaceCoreRunSummary = z.infer<typeof workspaceCoreRunSummarySchema>;

export const workspaceCoreSourceRootViewSchema = z.object({
  sourceRootId: z.string(),
  displayName: z.string(),
  kind: z.string(),
  status: z.string(),
  includeGlobCount: z.number().int().nonnegative(),
  excludeGlobCount: z.number().int().nonnegative(),
  hasLastIndexedAt: z.boolean(),
  hasError: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WorkspaceCoreSourceRootView = z.infer<typeof workspaceCoreSourceRootViewSchema>;

export const workspaceCoreTaskViewSchema = z.object({
  taskId: z.string(),
  parentTaskId: z.string().optional(),
  taskKind: z.string(),
  title: z.string(),
  brief: z.string(),
  status: z.string(),
  attempt: z.number().int().nonnegative(),
  dependsOnTaskIds: z.array(z.string()),
  artifactRefs: z.array(z.string()),
  failureSummary: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WorkspaceCoreTaskView = z.infer<typeof workspaceCoreTaskViewSchema>;

export const workspaceCoreArtifactViewSchema = z.object({
  artifactId: z.string(),
  label: z.string(),
  artifactRole: z.string(),
  kind: z.string(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  sensitivity: z.string(),
  storage: z.enum(['redacted', 'metadata_only']),
  payloadPreview: workspaceCoreArtifactPayloadPreviewSchema.optional(),
  createdAt: z.string(),
});
export type WorkspaceCoreArtifactView = z.infer<typeof workspaceCoreArtifactViewSchema>;

export const workspaceCoreTraceEventViewSchema = z.object({
  traceEventId: z.string(),
  eventType: z.string(),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  payloadSummary: z.string().optional(),
  createdAt: z.string(),
  traceId: z.string(),
});
export type WorkspaceCoreTraceEventView = z.infer<typeof workspaceCoreTraceEventViewSchema>;

export const workspaceCoreSelectedRunSchema = workspaceCoreRunSummarySchema.extend({
  tasks: z.array(workspaceCoreTaskViewSchema),
  artifacts: z.array(workspaceCoreArtifactViewSchema),
  trace: z.array(workspaceCoreTraceEventViewSchema),
});
export type WorkspaceCoreSelectedRun = z.infer<typeof workspaceCoreSelectedRunSchema>;

export const workspaceCoreReadSnapshotSchema = z.object({
  connection: workspaceCoreConnectionViewSchema,
  runs: z.array(workspaceCoreRunSummarySchema),
  sourceRoots: z.array(workspaceCoreSourceRootViewSchema),
  selectedRun: workspaceCoreSelectedRunSchema.optional(),
  updatedAt: z.string(),
});
export type WorkspaceCoreReadSnapshot = z.infer<typeof workspaceCoreReadSnapshotSchema>;

export const apiWorkspaceCoreRunListSchema = apiPaginatedSchema(apiRunSchema);
export const apiWorkspaceCoreRunSchema = apiRunSchema;
export const apiWorkspaceCoreSourceRootListSchema = apiPaginatedSchema(apiSourceRootSchema);
export const apiWorkspaceCoreTaskListSchema = apiPaginatedSchema(apiTaskSchema);
export const apiWorkspaceCoreArtifactListSchema = apiPaginatedSchema(apiArtifactSchema);
export const apiWorkspaceCoreTraceListSchema = apiPaginatedSchema(apiTraceEventSchema);
export const apiWorkspaceCoreArtifactPayloadSchema = apiArtifactPayloadSchema;

export type ApiWorkspaceCoreRun = z.infer<typeof apiWorkspaceCoreRunSchema>;
export type ApiWorkspaceCoreSourceRoot = z.infer<typeof apiSourceRootSchema>;
export type ApiWorkspaceCoreTask = z.infer<typeof apiTaskSchema>;
export type ApiWorkspaceCoreArtifact = z.infer<typeof apiArtifactSchema>;
export type ApiWorkspaceCoreTraceEvent = z.infer<typeof apiTraceEventSchema>;
export type ApiWorkspaceCoreArtifactPayload = z.infer<typeof apiArtifactPayloadSchema>;

export const createDisconnectedWorkspaceCoreReadSnapshot = (
  connection: WorkspaceCoreConnectionSnapshot,
): WorkspaceCoreReadSnapshot =>
  workspaceCoreReadSnapshotSchema.parse({
    connection: sanitizeWorkspaceCoreConnection(connection),
    runs: [],
    sourceRoots: [],
    updatedAt: new Date().toISOString(),
  });

export const mapApiRunToSummary = (run: ApiWorkspaceCoreRun): WorkspaceCoreRunSummary =>
  workspaceCoreRunSummarySchema.parse({
    runId: run.orchestrationRunId,
    status: run.status,
    executionMode: run.executionMode,
    hasPartialFailures: run.hasPartialFailures ?? false,
    ...(run.resultCompleteness === undefined ? {} : { resultCompleteness: run.resultCompleteness }),
    ...(run.completionLevel === undefined ? {} : { completionLevel: run.completionLevel }),
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  });

export const mapApiSourceRootToView = (
  sourceRoot: ApiWorkspaceCoreSourceRoot,
): WorkspaceCoreSourceRootView =>
  workspaceCoreSourceRootViewSchema.parse({
    sourceRootId: sourceRoot.sourceRootId,
    displayName: sanitizeSourceRootDisplayName(sourceRoot.displayName),
    kind: sourceRoot.kind,
    status: sourceRoot.status,
    includeGlobCount: sourceRoot.includeGlobs.length,
    excludeGlobCount: sourceRoot.excludeGlobs.length,
    hasLastIndexedAt: sourceRoot.lastIndexedAt !== undefined,
    hasError: sourceRoot.error !== undefined,
    createdAt: sourceRoot.createdAt,
    updatedAt: sourceRoot.updatedAt,
  });

export const mapApiTaskToView = (task: ApiWorkspaceCoreTask): WorkspaceCoreTaskView =>
  workspaceCoreTaskViewSchema.parse({
    taskId: task.taskId,
    ...(task.parentTaskId === undefined ? {} : { parentTaskId: task.parentTaskId }),
    taskKind: task.taskKind,
    title: task.title,
    brief: task.brief,
    status: task.status,
    attempt: task.attempt,
    dependsOnTaskIds: task.dependsOnTaskIds,
    artifactRefs: task.artifactRefs,
    ...(task.failureReason === undefined
      ? {}
      : { failureSummary: 'Failure reason captured by Workspace Core.' }),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });

export const mapApiArtifactToView = (
  artifact: ApiWorkspaceCoreArtifact,
  payloadPreview?: WorkspaceCoreArtifactPayloadPreview,
): WorkspaceCoreArtifactView =>
  workspaceCoreArtifactViewSchema.parse({
    artifactId: artifact.artifactId,
    label: `${artifact.artifactRole} ${artifact.kind}`,
    artifactRole: artifact.artifactRole,
    kind: artifact.kind,
    ...(artifact.contentType === undefined ? {} : { contentType: artifact.contentType }),
    ...(artifact.sizeBytes === undefined ? {} : { sizeBytes: artifact.sizeBytes }),
    sensitivity: artifact.sensitivity ?? 'none',
    storage:
      artifact.sensitivity === 'local_path' || artifact.uriOrPath !== undefined
        ? 'redacted'
        : 'metadata_only',
    ...(payloadPreview === undefined ? {} : { payloadPreview }),
    createdAt: artifact.createdAt,
  });

export const mapApiTraceEventToView = (
  event: ApiWorkspaceCoreTraceEvent,
): WorkspaceCoreTraceEventView =>
  workspaceCoreTraceEventViewSchema.parse({
    traceEventId: event.traceEventId,
    eventType: event.eventType,
    level: event.level,
    ...(event.payloadInline === undefined
      ? {}
      : { payloadSummary: summarizePayloadKeys(event.payloadInline) }),
    createdAt: event.createdAt,
    traceId: event.traceId,
  });

export const mapApiArtifactPayloadToPreview = (
  payload: ApiWorkspaceCoreArtifactPayload,
): WorkspaceCoreArtifactPayloadPreview =>
  workspaceCoreArtifactPayloadPreviewSchema.parse({
    mediaType: payload.mediaType,
    text: `${payload.mediaType} payload, ${String(payload.text.length)} chars`,
    truncated: payload.truncated,
  });

const summarizePayloadKeys = (payload: Record<string, unknown>): string => {
  const keyCount = Object.keys(payload).length;
  if (keyCount === 0) {
    return 'payload keys: none';
  }

  return `payload keys: ${String(keyCount)} redacted`;
};

const sanitizeSourceRootDisplayName = (displayName: string): string => {
  const trimmed = displayName.trim();
  if (trimmed.length === 0 || containsSensitiveSourceRootLabelData(trimmed)) {
    return 'Source root';
  }

  return trimmed;
};

const containsSensitiveSourceRootLabelData = (label: string): boolean =>
  uriPattern.test(label) ||
  localPathPattern.test(label) ||
  secretPattern.test(label) ||
  hostPattern.test(label);

const uriPattern = /\b[A-Za-z][A-Za-z0-9+.-]*:\/{1,2}\S*/u;
const localPathPattern = /(?:^|[\s"'=(])(?:~\/|\/(?!\/)[^\s"'<>|`$]+|[A-Za-z]:[\\/]|\\{1,2})/u;
const secretPattern =
  /\b(?:sk-[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9_]+|xox[baprs]-[A-Za-z0-9-]+|bearer|token|secret|api[_-]?key)\b/iu;
const hostPattern =
  /\b(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::\d{2,5})?\b/iu;
