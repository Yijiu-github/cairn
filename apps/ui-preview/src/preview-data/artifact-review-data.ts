export const artifactReviewProvenanceItems = [
  {
    id: 'artifact_provenance_input',
    time: '15:24',
    title: 'Operator 批准生成页面 prototype',
    tone: 'info' as const,
    description: '目标限定在 apps/ui-preview，不触碰 runtime 或真实工作区数据。',
    metadata: 'approval_scope=ui-preview source-only',
  },
  {
    id: 'artifact_provenance_write',
    time: '15:31',
    title: 'Worker 写入 Run Detail 页面',
    tone: 'success' as const,
    description: '新增页面文件并更新 preview 导航，产物进入 pending_review。',
    metadata: 'commit 502dae5',
  },
  {
    id: 'artifact_provenance_scan',
    time: '15:36',
    title: '敏感信息扫描提示',
    tone: 'warning' as const,
    description: '页面包含本地路径示例，导出或分享前建议脱敏用户名与机器名。',
    metadata: 'risk=local_path_disclosure',
  },
  {
    id: 'artifact_provenance_review',
    time: '15:38',
    title: '等待人工审阅',
    tone: 'neutral' as const,
    description: '需要确认产物是否可以合入 PR，或要求补充交互状态。',
  },
];

export const artifactReviewRelatedArtifacts = [
  {
    artifactId: 'artifact_run_detail_page',
    kind: 'document' as const,
    path: 'apps/ui-preview/src/pages/run-detail-preview-page.tsx',
    reviewState: 'pending_review' as const,
    sensitive: true,
    summary: 'Run Detail 页面 prototype，包含 run id、任务树、证据链、产物和接管入口。',
    title: 'Run Detail 页面 prototype',
    verification: 'typecheck passed',
  },
  {
    artifactId: 'artifact_preview_styles',
    kind: 'document' as const,
    path: 'apps/ui-preview/src/styles.css',
    reviewState: 'changes_requested' as const,
    summary: '新增页面布局、侧栏、响应式断点和风险提示样式。',
    title: 'Preview styles',
    verification: 'visual review needed',
  },
  {
    artifactId: 'artifact_build_log',
    kind: 'log' as const,
    path: 'apps/ui-preview/dist/assets/index-BfLy9KfC.js',
    reviewState: 'approved' as const,
    summary: '最近一次 production build 输出。dist 目录不提交，仅用于验证。',
    title: 'Build output log',
    verification: 'build passed',
  },
];

export const artifactRiskItems = [
  { label: 'Secret scan', value: 'no tokens detected' },
  { label: 'Local path', value: 'relative path only in source card' },
  { label: 'Network action', value: 'none' },
  { label: 'Destructive action', value: 'delete requires approval' },
];

export const artifactDecisionItems = [
  { label: 'Approve scope', value: 'artifact only' },
  { label: 'Follow-up', value: 'visual QA' },
  { label: 'Owner', value: 'UI branch maintainer' },
];

export const artifactShareChecklistBaseItems = [
  { label: '凭据', value: 'never included' },
  { label: '批准范围', value: 'one artifact decision' },
];
