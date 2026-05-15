export const homeActiveRuns = [
  {
    id: 'run_01JDEMOHOME0000000000001',
    title: '生成 Run Detail 页面 prototype',
    description: '组合任务树、证据链、产物和人工接管入口，验证单运行详情页的信息密度。',
    status: 'running' as const,
    progress: 62,
    agentLabel: 'Supervisor / 白霓',
    metrics: [
      { label: 'attempt', value: '1' },
      { label: '成本', value: '$0.08' },
      { label: '最近事件', value: '2m ago' },
    ],
  },
  {
    id: 'run_01JDEMOHOME0000000000002',
    title: '审阅 ArtifactCard 状态覆盖',
    description: '检查 pending_review、approved、changes_requested 在列表和详情里的表达。',
    status: 'blocked' as const,
    progress: 78,
    agentLabel: 'Reviewer / UI',
    metrics: [
      { label: 'attempt', value: '2' },
      { label: '等待', value: '12m' },
      { label: '阻塞原因', value: '需要人工确认' },
    ],
  },
  {
    id: 'run_01JDEMOHOME0000000000003',
    title: '导出脱敏诊断包',
    description: '准备给协作者复现 UI preview build 问题，默认隐藏 token 和本地路径。',
    status: 'completed' as const,
    progress: 100,
    agentLabel: 'Diagnostic Worker',
    metrics: [
      { label: 'attempt', value: '1' },
      { label: '产物', value: 'diagnostics.zip' },
      { label: '完成', value: '18m ago' },
    ],
  },
];

export const homeQueueItems = [
  {
    agentLabel: 'Worker UI',
    description: '将写入 apps/ui-preview/src/pages/run-detail-preview-page.tsx，需要确认是否继续。',
    kind: 'approval' as const,
    sourceLabel: 'ProtectedActionDialog',
    title: '批准新增 Run Detail prototype 文件',
    waitedFor: '4m 20s',
  },
  {
    agentLabel: 'Reviewer',
    description: 'Artifact Review 页面的敏感路径提示是否足够明显？',
    kind: 'review' as const,
    sourceLabel: 'ArtifactReviewPanel',
    title: '等待审阅产物风险提示',
    waitedFor: '11m 03s',
  },
  {
    agentLabel: 'Runtime Monitor',
    description: '本地 preview server 已停止，但最近一次 build 通过。',
    kind: 'diagnostic' as const,
    sourceLabel: 'RuntimeHealthCard',
    title: '确认是否需要重新启动 preview',
  },
];

export const homeAgents = [
  {
    id: 'agent_supervisor',
    label: 'Supervisor',
    status: 'running' as const,
    task: '规划页面原型',
  },
  {
    id: 'agent_worker_ui',
    label: 'UI Worker',
    status: 'waiting' as const,
    task: '等待批准写入',
  },
  { id: 'agent_reviewer', label: 'Reviewer', status: 'idle' as const, task: '暂无审阅' },
];

export const homeRuntimeMetrics = [
  { label: '模式', value: 'local-only' },
  { label: '端口', value: '127.0.0.1:5174' },
  { label: '最近 build', value: 'passed' },
];

export const homeSummaryItems = [
  { label: '运行总数', value: '3' },
  { label: '阻塞', value: '1' },
  { label: '待审阅产物', value: '2' },
  { label: '预算使用率', value: '42%' },
];

export const homeFilterLabels = ['全部', '需要我处理', '运行中', '失败 / 阻塞', '产物待审阅'];
