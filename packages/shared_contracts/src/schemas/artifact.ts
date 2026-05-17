// SPDX-License-Identifier: Apache-2.0
/**
 * Artifact：执行过程中产生的产物。
 *
 * 元数据存数据库；内容存文件系统（本地）或对象存储（远程）。
 *
 * 字段：docs/design/domain-model.md §9
 */

import { z } from 'zod';

import { Iso8601, Visibility, ProducerType } from './common.js';
import { ArtifactId, WorkspaceId, OrchestrationRunId, TaskId, AgentRunId } from './ids.js';

// ---------------------------------------------------------------------------
// 枚举
// ---------------------------------------------------------------------------

export const ArtifactRole = z.enum(['input', 'intermediate', 'output', 'summary', 'trace']);
export type ArtifactRole = z.infer<typeof ArtifactRole>;

export const ArtifactKind = z.enum(['text', 'patch', 'log', 'file_snapshot', 'json', 'binary']);
export type ArtifactKind = z.infer<typeof ArtifactKind>;

export const artifactSensitivitySchema = z.enum(['none', 'local_path', 'secret_risk']);
export type ArtifactSensitivity = z.infer<typeof artifactSensitivitySchema>;

export const artifactPayloadRefSchema = z
  .string()
  .min(1)
  .startsWith('artifact-payload://')
  .refine((value) => !value.includes('..'), {
    message: 'Artifact payload refs must not contain parent path segments.',
  });

export const artifactPayloadResponseSchema = z.object({
  artifactId: ArtifactId,
  mediaType: z.enum(['text/plain', 'application/json']),
  text: z.string().max(262_144),
  truncated: z.boolean(),
});
export type ArtifactPayloadResponse = z.infer<typeof artifactPayloadResponseSchema>;

// ---------------------------------------------------------------------------
// 核心对象
// ---------------------------------------------------------------------------

export const Artifact = z.object({
  artifactId: ArtifactId,
  workspaceId: WorkspaceId,

  // 关联（按需，不同 role 关联不同层级）
  orchestrationRunId: OrchestrationRunId.optional(),
  taskId: TaskId.optional(),
  runId: AgentRunId.optional(),

  artifactRole: ArtifactRole,
  kind: ArtifactKind,
  /** 内容 schema 的版本号（如 "patch.v1"）；不兼容时升版本而非破坏。 */
  formatVersion: z.string().min(1),

  /**
   * 存储 URI 或本地相对路径。
   * - 本地：<userData>/Cairn/workspaces/<id>/artifacts/<artifact_id>
   * - S3：s3://bucket/key
   */
  uriOrPath: z.string().min(1),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  payloadRef: artifactPayloadRefSchema.optional(),
  sensitivity: artifactSensitivitySchema.default('none'),

  producerType: ProducerType,
  producerId: z.string().optional(),

  visibility: Visibility,
  createdAt: Iso8601,
});
export type Artifact = z.infer<typeof Artifact>;

export const artifactSchema = Artifact;
