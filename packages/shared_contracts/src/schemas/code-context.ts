// SPDX-License-Identifier: Apache-2.0
/**
 * Lightweight code context indexing schemas.
 *
 * R1a only establishes the SourceRoot registry and ContextPack manifest baseline.
 * File scanning, FTS, symbol outlines, and dependency edges are added in later stages.
 *
 * See docs/design/code-context-index.md.
 */

import { z } from 'zod';

import { Iso8601 } from './common.js';
import {
  CodeIndexSnapshotId,
  ContextPackId,
  OrchestrationRunId,
  SourceRootId,
  TaskId,
  WorkspaceId,
} from './ids.js';

export const SourceRootStatus = z.enum(['active', 'indexing', 'stale', 'error']);
export type SourceRootStatus = z.infer<typeof SourceRootStatus>;

export const SourceRootKind = z.enum(['local_directory', 'remote_repository']);
export type SourceRootKind = z.infer<typeof SourceRootKind>;

export const ContextPackItemKind = z.enum([
  'file_excerpt',
  'symbol_outline',
  'dependency_edge',
  'user_note',
]);
export type ContextPackItemKind = z.infer<typeof ContextPackItemKind>;

export const ContextConfidence = z.enum(['extracted', 'inferred', 'ambiguous']);
export type ContextConfidence = z.infer<typeof ContextConfidence>;

export const ContextPackTarget = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('orchestration_run'),
    orchestrationRunId: OrchestrationRunId,
  }),
  z.object({
    type: z.literal('task'),
    taskId: TaskId,
  }),
]);
export type ContextPackTarget = z.infer<typeof ContextPackTarget>;

export const SourceRoot = z.object({
  sourceRootId: SourceRootId,
  workspaceId: WorkspaceId,
  kind: SourceRootKind,
  displayName: z.string().min(1).max(120),
  uri: z.string().min(1),
  status: SourceRootStatus,
  includeGlobs: z.array(z.string().min(1)).default([]),
  excludeGlobs: z.array(z.string().min(1)).default([]),
  createdAt: Iso8601,
  updatedAt: Iso8601,
  lastIndexedAt: Iso8601.optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type SourceRoot = z.infer<typeof SourceRoot>;

export const SourceRootCreate = z.object({
  kind: SourceRootKind.default('local_directory'),
  displayName: z.string().min(1).max(120),
  uri: z.string().min(1),
  includeGlobs: z.array(z.string().min(1)).default([]),
  excludeGlobs: z.array(z.string().min(1)).default([]),
  metadata: z.record(z.unknown()).optional(),
});
export type SourceRootCreate = z.infer<typeof SourceRootCreate>;

export const CodeIndexSnapshot = z.object({
  snapshotId: CodeIndexSnapshotId,
  sourceRootId: SourceRootId,
  workspaceId: WorkspaceId,
  status: z.enum(['pending', 'ready', 'error']),
  indexVersion: z.string().min(1),
  fileCount: z.number().int().nonnegative(),
  createdAt: Iso8601,
  metadata: z.record(z.unknown()).optional(),
});
export type CodeIndexSnapshot = z.infer<typeof CodeIndexSnapshot>;

export const ContextPackItem = z.object({
  kind: ContextPackItemKind,
  sourceRootId: SourceRootId.optional(),
  path: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  digest: z.string().optional(),
  reason: z.string().min(1),
  confidence: ContextConfidence.optional(),
  contentRef: z.string().optional(),
});
export type ContextPackItem = z.infer<typeof ContextPackItem>;

export const ContextPackManifest = z.object({
  contextPackId: ContextPackId,
  workspaceId: WorkspaceId,
  sourceRootIds: z.array(SourceRootId),
  createdFor: ContextPackTarget,
  query: z.string().min(1),
  items: z.array(ContextPackItem),
  tokenEstimate: z.number().int().nonnegative().optional(),
  createdAt: Iso8601,
});
export type ContextPackManifest = z.infer<typeof ContextPackManifest>;

export const ContextPackCreate = z.object({
  sourceRootIds: z.array(SourceRootId).default([]),
  createdFor: ContextPackTarget,
  query: z.string().min(1),
  items: z.array(ContextPackItem).default([]),
  tokenEstimate: z.number().int().nonnegative().optional(),
});
export type ContextPackCreate = z.infer<typeof ContextPackCreate>;
