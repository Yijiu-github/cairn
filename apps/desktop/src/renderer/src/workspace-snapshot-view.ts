// SPDX-License-Identifier: Apache-2.0

import type {
  WorkspaceCoreArtifactView,
  WorkspaceCoreRunSummary,
  WorkspaceCoreSourceRootView,
  WorkspaceCoreTaskView,
  WorkspaceCoreTraceEventView,
} from '../../shared/workspace-core-data.js';
import type {
  ArtifactCardProps,
  EvidenceTimelineItem,
  RunCardProps,
  TaskTreeItem,
} from '@cairn/ui';

export interface SourceRootSettingsItem {
  readonly sourceRootId: string;
  readonly displayName: string;
  readonly kind: string;
  readonly status: string;
  readonly includeGlobCount: number;
  readonly excludeGlobCount: number;
  readonly hasLastIndexedAt: boolean;
  readonly hasError: boolean;
  readonly indexed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const mapWorkspaceRunsToRunCards = (
  runs: readonly WorkspaceCoreRunSummary[],
): readonly RunCardProps[] =>
  runs.map((run) => ({
    agentLabel: 'Workspace Core',
    description: `${run.executionMode} · ${run.resultCompleteness ?? 'unknown completeness'}`,
    metrics: [
      { label: 'Completion', value: run.completionLevel ?? 'unknown' },
      { label: 'Updated', value: run.updatedAt },
    ],
    progress: mapRunProgress(run.status),
    runId: run.runId,
    status: mapRunStatus(run.status),
    title: 'Workspace run',
  }));

export const mapWorkspaceSourceRootsToSettingsItems = (
  sourceRoots: readonly WorkspaceCoreSourceRootView[],
): readonly SourceRootSettingsItem[] =>
  sourceRoots.map((sourceRoot) => ({
    createdAt: sourceRoot.createdAt,
    displayName: sourceRoot.displayName,
    excludeGlobCount: sourceRoot.excludeGlobCount,
    hasError: sourceRoot.hasError,
    hasLastIndexedAt: sourceRoot.hasLastIndexedAt,
    includeGlobCount: sourceRoot.includeGlobCount,
    indexed: sourceRoot.hasLastIndexedAt && !sourceRoot.hasError,
    kind: sourceRoot.kind,
    sourceRootId: sourceRoot.sourceRootId,
    status: sourceRoot.status,
    updatedAt: sourceRoot.updatedAt,
  }));

export const mapWorkspaceTasksToTaskTree = (
  tasks: readonly WorkspaceCoreTaskView[],
): readonly TaskTreeItem[] =>
  tasks.map((task) => ({
    attempt: task.attempt,
    id: task.taskId,
    label: task.title,
    metadata: `${task.taskKind} · ${task.brief}`,
    status: mapTaskStatus(task.status),
  }));

export const mapWorkspaceArtifactsToArtifactCards = (
  artifacts: readonly WorkspaceCoreArtifactView[],
): readonly ArtifactCardProps[] =>
  artifacts.map((artifact) => {
    const sensitivity = mapArtifactSensitivity(artifact.sensitivity);

    return {
      artifactId: artifact.artifactId,
      kind: mapArtifactKind(artifact.kind),
      pathDisplayMode: 'hidden',
      redactionLabel:
        artifact.storage === 'redacted'
          ? 'Artifact storage reference hidden'
          : 'Artifact is metadata-only',
      reviewState: 'pending_review',
      ...(sensitivity === undefined ? {} : { sensitivity }),
      summary:
        artifact.payloadPreview?.text ??
        `${artifact.artifactRole} · ${artifact.contentType ?? 'unknown media type'}`,
      title: artifact.label,
      verification: `${artifact.storage.replaceAll('_', ' ')} · ${artifact.createdAt}`,
    };
  });

export const mapWorkspaceTraceToEvidence = (
  events: readonly WorkspaceCoreTraceEventView[],
): readonly EvidenceTimelineItem[] =>
  events.map((event) => ({
    description: event.payloadSummary ?? 'No inline payload summary',
    id: event.traceEventId,
    ...(event.payloadSummary === undefined ? {} : { metadata: event.payloadSummary }),
    time: event.createdAt,
    title: event.eventType,
    tone: mapTraceTone(event.level),
  }));

const mapRunStatus = (status: string): RunCardProps['status'] => {
  switch (status) {
    case 'queued':
    case 'planning':
      return 'idle';
    case 'running':
    case 'synthesizing':
      return 'running';
    case 'paused':
      return 'blocked';
    case 'succeeded':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'failed':
    case 'timeout':
      return 'failed';
    default:
      return 'idle';
  }
};

const mapRunProgress = (status: string): number => {
  switch (status) {
    case 'queued':
      return 8;
    case 'planning':
      return 18;
    case 'running':
      return 48;
    case 'synthesizing':
      return 82;
    case 'paused':
      return 50;
    case 'succeeded':
      return 100;
    case 'failed':
    case 'cancelled':
    case 'timeout':
      return 100;
    default:
      return 0;
  }
};

const mapTaskStatus = (status: string): TaskTreeItem['status'] => {
  switch (status) {
    case 'pending':
    case 'ready':
      return 'todo';
    case 'dispatched':
    case 'running':
      return 'running';
    case 'succeeded':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'skipped':
      return 'blocked';
    default:
      return 'todo';
  }
};

const mapArtifactKind = (kind: string): ArtifactCardProps['kind'] => {
  switch (kind) {
    case 'patch':
      return 'patch';
    case 'log':
      return 'log';
    case 'file_snapshot':
    case 'text':
    case 'json':
      return 'document';
    case 'binary':
      return 'other';
    default:
      return 'other';
  }
};

const mapArtifactSensitivity = (sensitivity: string): ArtifactCardProps['sensitivity'] => {
  switch (sensitivity) {
    case 'local_path':
      return 'local_path';
    case 'secret_risk':
      return 'secret_risk';
    default:
      return 'none';
  }
};

type EvidenceTone = NonNullable<EvidenceTimelineItem['tone']>;

const mapTraceTone = (level: WorkspaceCoreTraceEventView['level']): EvidenceTone => {
  switch (level) {
    case 'debug':
      return 'neutral';
    case 'info':
      return 'info';
    case 'warn':
      return 'warning';
    case 'error':
      return 'danger';
  }
};
