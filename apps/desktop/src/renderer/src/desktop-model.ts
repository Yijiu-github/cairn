// SPDX-License-Identifier: Apache-2.0

import type {
  AgentStatusItem,
  ArtifactCardProps,
  CairnMetric,
  EvidenceTimelineItem,
  HandoffQueueItemProps,
  RunCardProps,
  TaskTreeItem,
} from '@cairn/ui';

export type DesktopView = 'home' | 'run-detail' | 'artifact-review' | 'settings';

export interface DesktopNavItem {
  readonly id: DesktopView;
  readonly label: string;
  readonly description: string;
}

export interface DesktopShellModel {
  readonly artifactReview: {
    readonly artifacts: readonly ArtifactCardProps[];
    readonly artifactId: string;
    readonly note: string;
    readonly title: string;
  };
  readonly handoffs: readonly HandoffQueueItemProps[];
  readonly navItems: readonly DesktopNavItem[];
  readonly pinnedRuns: readonly RunCardProps[];
  readonly runDetail: {
    readonly evidence: readonly EvidenceTimelineItem[];
    readonly selectedTaskId: string;
    readonly tasks: readonly TaskTreeItem[];
  };
  readonly runtime: {
    readonly description: string;
    readonly metrics: readonly CairnMetric[];
    readonly runtimeLabel: string;
    readonly status: 'ready' | 'degraded' | 'offline' | 'unknown';
  };
  readonly statusStrip: readonly AgentStatusItem[];
  readonly workspace: {
    readonly label: string;
    readonly summary: string;
    readonly mode: string;
  };
}

export const desktopShellModel: DesktopShellModel = {
  artifactReview: {
    artifacts: [
      {
        artifactId: 'artifact://preview/redacted-diff-001',
        kind: 'patch',
        path: '/Users/example/cairn-workspace/apps/desktop/src/renderer/src/desktop-app.tsx',
        redactionLabel: 'Local path hidden until an explicit reveal/export gate exists',
        reviewState: 'pending_review',
        sensitivity: 'local_path',
        summary:
          'Renderer shell changes are represented as reviewable metadata. The absolute source path is intentionally redacted in the desktop shell.',
        title: 'Desktop renderer shell patch',
        verification: 'typecheck/lint/build passed',
      },
      {
        artifactId: 'artifact://preview/docs-status-001',
        kind: 'document',
        reviewState: 'draft',
        summary:
          'Project status copy should describe the desktop app as a skeleton, not as a finished Workspace Core client.',
        title: 'Status documentation update',
        verification: 'docs lint passed',
      },
    ],
    artifactId: 'artifact://preview/redacted-diff-001',
    note: '',
    title: 'Artifact Review placeholder',
  },
  handoffs: [
    {
      action: { disabled: true, label: 'Review' },
      agentLabel: '白霓',
      description:
        'Confirm that the first desktop shell stays preview-safe before sidecar or IPC work starts.',
      kind: 'review',
      sourceLabel: 'Desktop skeleton PR',
      title: 'Review desktop shell safety copy',
      waitedFor: 'operator review',
    },
    {
      action: { disabled: true, label: 'Plan gate', tone: 'secondary' },
      agentLabel: 'Runtime agent',
      description:
        'Future Workspace Core connection needs an explicit preload allowlist and sidecar lifecycle contract.',
      kind: 'blocked',
      sourceLabel: 'Workspace Core integration',
      title: 'Sidecar connection intentionally blocked',
      waitedFor: 'contract design',
    },
  ],
  navItems: [
    {
      description: 'Handoff queue, pinned runs, and runtime overview.',
      id: 'home',
      label: 'Home / Inbox',
    },
    {
      description: 'Selected run timeline and operator context.',
      id: 'run-detail',
      label: 'Run Detail',
    },
    {
      description: 'Safe review entry point with redacted path language.',
      id: 'artifact-review',
      label: 'Artifact Review',
    },
    {
      description: 'Source roots and desktop shell configuration placeholders.',
      id: 'settings',
      label: 'Settings',
    },
  ],
  pinnedRuns: [
    {
      agentLabel: '白霓',
      description: 'Create the first desktop shell frame without touching live workspace data.',
      metrics: [
        { label: 'Scope', value: 'static shell' },
        { label: 'Risk', value: 'low' },
      ],
      progress: 42,
      runId: 'run_preview_desktop_shell',
      status: 'running',
      title: 'Desktop minimal skeleton',
    },
    {
      agentLabel: 'Reviewer',
      description: 'Keep filesystem paths hidden until an explicit export or reveal action exists.',
      metrics: [
        { label: 'Safety', value: 'redacted' },
        { label: 'IPC', value: 'disabled' },
      ],
      progress: 12,
      runId: 'run_preview_artifact_review',
      status: 'blocked',
      title: 'Artifact review safety copy',
    },
  ],
  runDetail: {
    evidence: [
      {
        description: 'Electron main creates one isolated BrowserWindow and denies new windows.',
        id: 'event-main-window',
        metadata: 'contextIsolation=true · nodeIntegration=false',
        time: '03:00',
        title: 'Main process shell baseline',
        tone: 'success',
      },
      {
        description: 'Preload exposes only static app metadata through contextBridge.',
        id: 'event-preload-bridge',
        metadata: 'window.cairnDesktop.app.mode=static-preview',
        time: '03:01',
        title: 'Read-only preload bridge',
        tone: 'info',
      },
      {
        description: 'Workspace Core startup and filesystem actions remain out of scope.',
        id: 'event-safety-gate',
        metadata: 'no live data · no IPC actions · no filesystem mutation',
        time: '03:02',
        title: 'Safety gate preserved',
        tone: 'warning',
      },
    ],
    selectedTaskId: 'task-renderer-shell',
    tasks: [
      {
        children: [
          {
            attempt: 1,
            id: 'task-main-process',
            label: 'Create Electron main process shell',
            metadata: 'window bootstrap only',
            status: 'completed',
          },
          {
            attempt: 1,
            id: 'task-preload-bridge',
            label: 'Expose read-only preload identity',
            metadata: 'no commands',
            status: 'completed',
          },
          {
            attempt: 1,
            id: 'task-renderer-shell',
            label: 'Render static desktop shell views',
            metadata: 'Home / Run / Artifact / Settings',
            status: 'running',
          },
        ],
        id: 'task-desktop-skeleton',
        label: 'Desktop minimal skeleton',
        metadata: 'preview-safe',
        status: 'running',
      },
    ],
  },
  runtime: {
    description:
      'Static renderer fixture. Workspace Core and sidecar startup are intentionally not connected yet.',
    metrics: [
      { label: 'Workspace Core', value: 'not connected' },
      { label: 'IPC', value: 'preload identity only' },
      { label: 'Filesystem', value: 'no access' },
    ],
    runtimeLabel: 'Desktop shell runtime',
    status: 'unknown',
  },
  statusStrip: [
    {
      id: 'agent-designer',
      label: 'Design agent',
      status: 'thinking',
      task: 'Shell IA alignment',
    },
    {
      id: 'agent-runtime',
      label: 'Runtime agent',
      status: 'idle',
      task: 'Waiting for sidecar contract',
    },
    {
      id: 'agent-review',
      label: 'Review agent',
      status: 'waiting',
      task: 'Artifact approval gate',
    },
  ],
  workspace: {
    label: 'Cairn Local Workspace',
    mode: 'Static desktop shell',
    summary:
      'First desktop application frame. It is safe by default: no live Workspace Core calls, no real IPC actions, and no filesystem mutation.',
  },
};
