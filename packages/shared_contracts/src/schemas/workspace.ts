// SPDX-License-Identifier: Apache-2.0
/**
 * Workspace 一等领域对象。
 *
 * 所有其他对象通过 workspaceId 归属。即使单用户本地版也必须有 workspace 边界。
 *
 * 参考：docs/design/domain-model.md §2
 */

import { z } from 'zod';

import { Iso8601 } from './common.js';
import { WorkspaceId } from './ids.js';

export const WorkspaceType = z.enum(['personal', 'shared']);
export type WorkspaceType = z.infer<typeof WorkspaceType>;

export const DeploymentMode = z.enum(['local_desktop', 'remote_server']);
export type DeploymentMode = z.infer<typeof DeploymentMode>;

export const WorkspaceStatus = z.enum(['active', 'paused', 'archived']);
export type WorkspaceStatus = z.infer<typeof WorkspaceStatus>;

// ---------------------------------------------------------------------------
// 核心对象
// ---------------------------------------------------------------------------

export const Workspace = z.object({
  workspaceId: WorkspaceId,
  workspaceType: WorkspaceType,
  deploymentMode: DeploymentMode,
  displayName: z.string().min(1).max(120),
  status: WorkspaceStatus,
  defaultRuntimeProfile: z.string().optional(),
  createdAt: Iso8601,
  updatedAt: Iso8601,
  metadata: z.record(z.unknown()).optional(),
});
export type Workspace = z.infer<typeof Workspace>;

// ---------------------------------------------------------------------------
// 创建 / 更新 DTO
// ---------------------------------------------------------------------------

export const WorkspaceCreate = z.object({
  workspaceType: WorkspaceType.default('personal'),
  deploymentMode: DeploymentMode.default('local_desktop'),
  displayName: z.string().min(1).max(120),
  defaultRuntimeProfile: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type WorkspaceCreate = z.infer<typeof WorkspaceCreate>;

export const WorkspaceUpdate = z.object({
  displayName: z.string().min(1).max(120).optional(),
  status: WorkspaceStatus.optional(),
  defaultRuntimeProfile: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type WorkspaceUpdate = z.infer<typeof WorkspaceUpdate>;
