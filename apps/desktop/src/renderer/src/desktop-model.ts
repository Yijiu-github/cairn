// SPDX-License-Identifier: Apache-2.0

import type { AgentStatusItem, CairnMetric, RunCardProps } from '@cairn/ui';

export type DesktopView = 'home' | 'run-detail' | 'artifact-review' | 'settings';

export interface DesktopNavItem {
  readonly id: DesktopView;
  readonly label: string;
  readonly description: string;
}

export interface DesktopShellModel {
  readonly artifactReview: {
    readonly artifactId: string;
    readonly note: string;
    readonly title: string;
  };
  readonly navItems: readonly DesktopNavItem[];
  readonly pinnedRuns: readonly RunCardProps[];
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
    artifactId: 'artifact://preview/redacted-diff-001',
    note: '',
    title: 'Artifact Review placeholder',
  },
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
