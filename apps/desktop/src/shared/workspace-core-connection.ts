// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

import type { CairnMetric } from '@cairn/ui';

export type WorkspaceCoreSidecarMode = 'development' | 'packaged';

export type WorkspaceCoreSidecarState =
  | 'not_started'
  | 'starting'
  | 'connected'
  | 'degraded'
  | 'disconnected'
  | 'failed';

export type WorkspaceCoreRuntimeStatus = 'ready' | 'degraded' | 'offline' | 'unknown';

export interface WorkspaceCoreConnectionSnapshot {
  readonly baseUrl?: string;
  readonly authenticated: boolean;
  readonly detail: string;
  readonly host?: string;
  readonly mode: WorkspaceCoreSidecarMode;
  readonly port?: number;
  readonly reason?: 'embedded_sidecar_unavailable' | 'health_check_failed' | 'spawn_failed';
  readonly state: WorkspaceCoreSidecarState;
  readonly updatedAt: string;
}

export interface WorkspaceCoreConnectionView {
  readonly detail: string;
  readonly mode: WorkspaceCoreSidecarMode;
  readonly state: WorkspaceCoreSidecarState;
  readonly updatedAt: string;
}

export interface WorkspaceCoreRuntimeViewModel {
  readonly description: string;
  readonly metrics: readonly CairnMetric[];
  readonly runtimeLabel: string;
  readonly status: WorkspaceCoreRuntimeStatus;
}

export interface WorkspaceCoreStatusBadgeView {
  readonly label: string;
  readonly metadata: string;
  readonly tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

export const workspaceCoreSidecarModeSchema = z.enum(['development', 'packaged']);

export const workspaceCoreSidecarStateSchema = z.enum([
  'not_started',
  'starting',
  'connected',
  'degraded',
  'disconnected',
  'failed',
]);

export const workspaceCoreConnectionViewSchema = z.object({
  detail: z.string(),
  mode: workspaceCoreSidecarModeSchema,
  state: workspaceCoreSidecarStateSchema,
  updatedAt: z.string(),
});

export const workspaceCoreConnectionSnapshotSchema = workspaceCoreConnectionViewSchema.extend({
  authenticated: z.boolean(),
  baseUrl: z.string().optional(),
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  reason: z
    .enum(['embedded_sidecar_unavailable', 'health_check_failed', 'spawn_failed'])
    .optional(),
});

export const createNotStartedWorkspaceCoreConnection = (
  mode: WorkspaceCoreSidecarMode,
): WorkspaceCoreConnectionSnapshot => ({
  authenticated: false,
  detail: 'Workspace Core sidecar has not started yet.',
  mode,
  state: 'not_started',
  updatedAt: new Date().toISOString(),
});

export const sanitizeWorkspaceCoreConnection = (
  snapshot: WorkspaceCoreConnectionSnapshot,
): WorkspaceCoreConnectionView => ({
  detail: snapshot.detail,
  mode: snapshot.mode,
  state: snapshot.state,
  updatedAt: snapshot.updatedAt,
});

export const mapWorkspaceCoreConnectionToRuntimeView = (
  connection: WorkspaceCoreConnectionView,
): WorkspaceCoreRuntimeViewModel => {
  const status = mapWorkspaceCoreConnectionStateToRuntimeStatus(connection.state);

  return {
    description: connection.detail,
    metrics: [
      { label: 'Connection', value: connection.state },
      { label: 'Mode', value: connection.mode },
      { label: 'Updated', value: connection.updatedAt },
    ],
    runtimeLabel: 'Workspace Core',
    status,
  };
};

export const mapWorkspaceCoreConnectionToStatusBadge = (
  connection: WorkspaceCoreConnectionView,
): WorkspaceCoreStatusBadgeView => ({
  label: 'Workspace Core',
  metadata: connection.state.replaceAll('_', ' '),
  tone: mapWorkspaceCoreConnectionStateToBadgeTone(connection.state),
});

const mapWorkspaceCoreConnectionStateToRuntimeStatus = (
  state: WorkspaceCoreSidecarState,
): WorkspaceCoreRuntimeStatus => {
  switch (state) {
    case 'connected':
      return 'ready';
    case 'degraded':
      return 'degraded';
    case 'failed':
    case 'disconnected':
      return 'offline';
    case 'starting':
    case 'not_started':
      return 'unknown';
  }
};

const mapWorkspaceCoreConnectionStateToBadgeTone = (
  state: WorkspaceCoreSidecarState,
): WorkspaceCoreStatusBadgeView['tone'] => {
  switch (state) {
    case 'connected':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'failed':
    case 'disconnected':
      return 'danger';
    case 'starting':
      return 'info';
    case 'not_started':
      return 'neutral';
  }
};
