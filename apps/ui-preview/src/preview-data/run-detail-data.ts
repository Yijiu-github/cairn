export const runDetailTasks = [
  {
    id: 'task_plan_run_detail',
    label: '规划 Run Detail 信息架构',
    metadata: 'orchestration layer',
    status: 'completed' as const,
    attempt: 1,
    children: [
      {
        id: 'task_map_operator_actions',
        label: '标记人工接管入口',
        metadata: 'operator visible',
        status: 'completed' as const,
        attempt: 1,
      },
      {
        id: 'task_define_risk_copy',
        label: '补充受保护动作影响范围',
        metadata: 'local trust',
        status: 'running' as const,
        attempt: 2,
      },
    ],
  },
  {
    id: 'task_build_preview',
    label: '实现页面 preview',
    metadata: 'apps/ui-preview',
    status: 'running' as const,
    attempt: 1,
    children: [
      {
        id: 'task_wire_components',
        label: '组合 TaskTree / EvidenceTimeline / ArtifactCard',
        status: 'running' as const,
        attempt: 1,
      },
      {
        id: 'task_validate_build',
        label: '执行 typecheck / lint / build',
        status: 'todo' as const,
      },
    ],
  },
  {
    id: 'task_capture_review',
    label: '等待视觉审阅',
    metadata: 'human handoff',
    status: 'blocked' as const,
    attempt: 1,
  },
];

export const runDetailEvidenceItems = [
  {
    id: 'evidence_read_rules',
    time: '15:22',
    title: '读取 UI 分支规则',
    tone: 'info' as const,
    description: '确认当前分支为 feat/ui-desktop-v0，PR base 为 develop。',
    metadata: 'docs/engineering/git-workflow.md',
  },
  {
    id: 'evidence_home_inbox',
    time: '15:25',
    title: 'Home / Inbox prototype 已推送',
    tone: 'success' as const,
    description: '第一屏已覆盖 Inbox、Runs、Agent 状态和 Runtime 健康。',
    metadata: 'commit ede8a12',
  },
  {
    id: 'evidence_operator_scope',
    time: '15:28',
    title: '发现受保护动作需要明确范围',
    tone: 'warning' as const,
    description: '写入新页面文件前，需要展示目标、影响和批准范围。',
    metadata: 'actionKind=file_write target=apps/ui-preview/src/pages',
  },
  {
    id: 'evidence_build_pending',
    time: '15:31',
    title: '等待最终校验',
    tone: 'neutral' as const,
    description: 'typecheck、lint、build 将在提交前执行。',
  },
];

export const runDetailArtifacts = [
  {
    artifactId: 'artifact_run_detail_page',
    kind: 'document' as const,
    path: 'apps/ui-preview/src/pages/run-detail-preview-page.tsx',
    reviewState: 'pending_review' as const,
    summary: 'Run Detail 页面 prototype，组合任务树、证据链、产物列表和人工接管。',
    title: 'Run Detail preview page',
    verification: 'typecheck pending',
    actions: [
      { label: '打开预览', tone: 'primary' as const },
      { label: '请求修改', tone: 'secondary' as const },
    ],
  },
  {
    artifactId: 'artifact_preview_styles',
    kind: 'document' as const,
    path: 'apps/ui-preview/src/styles.css',
    reviewState: 'changes_requested' as const,
    summary: '新增详情页布局、侧栏和风险面板样式。',
    title: 'Preview layout styles',
    verification: 'visual review needed',
    actions: [
      { label: '查看差异', tone: 'primary' as const },
      { label: '批准', tone: 'secondary' as const },
    ],
  },
];

export const runDetailAgents = [
  {
    id: 'agent_supervisor',
    label: 'Supervisor',
    status: 'running' as const,
    task: '协调 Run Detail',
  },
  {
    id: 'agent_worker_ui',
    label: 'UI Worker',
    status: 'thinking' as const,
    task: '补齐页面结构',
  },
  { id: 'agent_reviewer', label: 'Reviewer', status: 'waiting' as const, task: '等待本轮提交' },
];

export const runDetailCostMetrics = [
  { label: 'attempt', value: '2' },
  { label: 'tool calls', value: '14' },
];

export const runDetailRuntimeMetrics = [
  { label: 'runtime', value: 'vite' },
  { label: 'backend', value: 'not connected' },
  { label: 'mode', value: 'source-only' },
];

export const runDetailAttributionItems = [
  { label: '编排', value: 'ok' },
  { label: '任务', value: '1 blocked' },
  { label: '执行', value: 'pending validation' },
  { label: '产物', value: '2 pending review' },
];
