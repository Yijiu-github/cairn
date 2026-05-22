// SPDX-License-Identifier: Apache-2.0

import type {
  AgentStatusItem,
  ArtifactCardProps,
  CairnMetric,
  HandoffQueueItemProps,
  RunCardProps,
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
  readonly missionControl: {
    readonly activeAgentCount: number;
    readonly blockedAgentCount: number;
    readonly completedAgentCount: number;
    readonly liveAgents: readonly {
      readonly agentId: string;
      readonly status: 'working' | 'idle' | 'blocked' | 'completed';
      readonly summary: string;
      readonly title: string;
    }[];
    readonly recentProgressItems: readonly {
      readonly detail: string;
      readonly itemId: string;
      readonly title: string;
    }[];
    readonly taskComposerPlaceholder: string;
    readonly totalAgentCount: number;
  };
  readonly handoffs: readonly HandoffQueueItemProps[];
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
  missionControl: {
    activeAgentCount: 1,
    blockedAgentCount: 1,
    completedAgentCount: 1,
    liveAgents: [
      {
        agentId: 'agent-supervisor',
        status: 'working',
        summary: '拆分当前目标，并把后续工作派给合适的子 Agent。',
        title: '总 Agent',
      },
      {
        agentId: 'agent-runtime',
        status: 'completed',
        summary: '已完成默认 mock sidecar 与真实 Codex opt-in 边界检查。',
        title: '运行时 Agent',
      },
      {
        agentId: 'agent-review',
        status: 'blocked',
        summary: '等待产物审阅入口收口后，再推进下一步安全确认。',
        title: '审阅 Agent',
      },
    ],
    recentProgressItems: [
      {
        detail: '首页数据已经能表达派活队列、Agent 状态和近期进展。',
        itemId: 'progress-mission-control-model',
        title: '派活工作台数据已接入',
      },
      {
        detail: '默认简中文案已经覆盖首页的核心派活和 Agent 总览入口。',
        itemId: 'progress-mission-control-locale',
        title: '首屏简中文案已准备',
      },
    ],
    taskComposerPlaceholder: '描述要交给总 Agent 的下一步目标...',
    totalAgentCount: 3,
  },
  handoffs: [
    {
      action: { disabled: true, label: 'Review' },
      agentLabel: 'Supervisor / Desktop',
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
      agentLabel: 'Supervisor / Desktop',
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
      'Renderer reads sidecar status and run replay evidence through a bounded preload bridge. Operator actions are limited to the internal-trial allowlist.',
    metrics: [
      { label: 'Workspace Core', value: 'status + replay only' },
      { label: 'IPC', value: 'allowlist bridge' },
      { label: 'Filesystem', value: 'no direct renderer access' },
    ],
    runtimeLabel: 'Desktop observation runtime',
    status: 'ready',
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
    mode: 'Desktop observation shell',
    summary:
      'Minimal internal-trial console for observing one bounded Workspace Core run through replay evidence, with safety gates still intact.',
  },
};
