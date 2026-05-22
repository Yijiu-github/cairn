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
      action: { disabled: true, label: '审阅' },
      agentLabel: '主管 / 桌面壳',
      description: '确认第一版桌面壳在 sidecar / IPC 工作开始前仍保持预览安全边界。',
      kind: 'review',
      sourceLabel: '桌面壳骨架 PR',
      title: '审阅桌面壳安全文案',
      waitedFor: 'operator review',
    },
    {
      action: { disabled: true, label: '计划门禁', tone: 'secondary' },
      agentLabel: '运行时 Agent',
      description: '未来 Workspace Core 连接需要明确的 preload allowlist 与 sidecar 生命周期契约。',
      kind: 'blocked',
      sourceLabel: 'Workspace Core 集成',
      title: 'Sidecar 连接仍有意受限',
      waitedFor: 'contract design',
    },
  ],
  navItems: [
    {
      description: '接力队列、固定运行与运行时总览。',
      id: 'home',
      label: '首页 / 收件箱',
    },
    {
      description: '所选运行的时间线与接管上下文。',
      id: 'run-detail',
      label: '运行详情',
    },
    {
      description: '脱敏后的路径语言，作为安全审阅入口。',
      id: 'artifact-review',
      label: '产物审阅',
    },
    {
      description: '源目录与桌面壳配置占位。',
      id: 'settings',
      label: '设置',
    },
  ],
  pinnedRuns: [
    {
      agentLabel: '主管 / 桌面壳',
      description: '先把首页派活壳和信息层级做顺，再碰真实工作区数据。',
      metrics: [
        { label: '范围', value: '静态壳' },
        { label: '风险', value: '低' },
      ],
      progress: 42,
      runId: 'run_preview_desktop_shell',
      status: 'running',
      title: '首屏派活壳',
    },
    {
      agentLabel: '审阅 Agent',
      description: '在导出或揭示动作真正存在前，继续隐藏文件系统路径。',
      metrics: [
        { label: '安全', value: '脱敏' },
        { label: 'IPC', value: '禁用' },
      ],
      progress: 12,
      runId: 'run_preview_artifact_review',
      status: 'blocked',
      title: '产物审阅安全文案',
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
      label: '设计 Agent',
      status: 'thinking',
      task: '对齐壳层信息架构',
    },
    {
      id: 'agent-runtime',
      label: '运行时 Agent',
      status: 'idle',
      task: '等待 sidecar 契约',
    },
    {
      id: 'agent-review',
      label: '审阅 Agent',
      status: 'waiting',
      task: '产物审阅门禁',
    },
  ],
  workspace: {
    label: 'Cairn Local Workspace',
    mode: 'Desktop observation shell',
    summary:
      '用于通过 replay evidence 观察单个受限 Workspace Core 运行的内部试用控制台，安全边界仍然保留。',
  },
};
