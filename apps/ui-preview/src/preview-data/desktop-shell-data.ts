import type {
  PreviewMetric,
  PreviewRunSummary,
  PreviewRuntimeSummary,
} from '../preview-models/preview-types';

export const desktopShellNavigationItems = [
  'Mission Control',
  'Inbox',
  'Runs',
  'Artifacts',
  'Source Roots',
  'Settings',
] as const;

export const desktopShellWorkspaceMetrics: readonly PreviewMetric[] = [
  { label: 'Workspace', value: 'local_demo_workspace' },
  { label: 'Mode', value: 'local desktop' },
  { label: 'Persistence', value: 'sqlite + local artifacts' },
  { label: 'Last sync', value: '12:08 / just now' },
];

export const desktopShellRuntimeSummary: PreviewRuntimeSummary = {
  label: 'Desktop Shell Runtime',
  description: 'Electron 外壳启动中；workspace-core 以本地 sidecar 模式运行。',
  status: 'ready',
  metrics: [
    { label: 'window', value: 'main' },
    { label: 'ipc bridge', value: 'ready' },
    { label: 'auto-start', value: 'enabled' },
  ],
};

export const desktopShellPinnedRuns: readonly PreviewRunSummary[] = [
  {
    id: 'run_01JDESKTOP00000000000001',
    title: '整理本地桌面壳结构',
    description: '把 Home / Run / Artifact 视图放进统一外壳，确认布局、导航和状态栏。',
    status: 'running',
    progress: 64,
    agentLabel: 'Supervisor',
    metrics: [
      { label: 'attempts', value: '2' },
      { label: 'blocked', value: '1' },
      { label: 'updated', value: '2m ago' },
    ],
  },
  {
    id: 'run_01JDESKTOP00000000000002',
    title: '审阅页面密度和信息层级',
    description: '检查第一屏是否足够清楚地暴露接管、风险和关键产物。',
    status: 'blocked',
    progress: 41,
    agentLabel: 'Operator review',
    metrics: [
      { label: 'attempts', value: '1' },
      { label: 'risk', value: 'medium' },
      { label: 'wait', value: '5m' },
    ],
  },
];

export const desktopShellQuickActions = [
  { label: '打开最近工作区', tone: 'secondary' as const },
  { label: '导入 Source Root', tone: 'secondary' as const },
  { label: '查看本地日志', tone: 'secondary' as const },
  { label: '打开设置', tone: 'ghost' as const },
] as const;

export const desktopShellStatusLabels = {
  availability: 'local ready',
  pending: '2 pending',
  runtime: 'runtime ready',
  workspace: 'local-first workspace',
} as const;

export const desktopShellModeMetrics: readonly PreviewMetric[] = [
  { label: 'mode', value: 'local-first' },
  { label: 'storage', value: 'local sqlite' },
  { label: 'artifact', value: 'local filesystem' },
  { label: 'remote', value: 'not connected' },
];

export const desktopShellOperationsMetrics: readonly PreviewMetric[] = [
  { label: 'sync', value: 'placeholder only' },
  { label: 'backup', value: 'manual later' },
  { label: 'updates', value: 'check on demand' },
  { label: 'notifications', value: 'system bridge ready' },
];
