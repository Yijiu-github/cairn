export const galleryEvidenceItems = [
  {
    id: 'ev_1',
    time: '13:02',
    title: '读取 AGENTS.md',
    tone: 'info' as const,
    metadata: 'context loaded',
  },
  {
    id: 'ev_2',
    time: '13:07',
    title: '生成 UI preview 骨架',
    tone: 'success' as const,
    metadata: 'apps/ui-preview',
  },
  {
    id: 'ev_3',
    time: '13:11',
    title: '等待截图审阅',
    tone: 'warning' as const,
    description: '需要人工确认视觉密度。',
  },
];

export const galleryAgents = [
  {
    id: 'agent_supervisor',
    label: 'Supervisor',
    status: 'running' as const,
    task: '协调 UI preview',
  },
  { id: 'agent_ui', label: 'UI Worker', status: 'thinking' as const, task: '整理组件状态' },
  { id: 'agent_review', label: 'Reviewer', status: 'waiting' as const, task: '等待截图' },
];

export const galleryRunMetrics = [
  { label: '任务', value: '3 / 5' },
  { label: '耗时', value: '02:18' },
];

export const galleryFooterItems = [
  { label: '模式', value: 'static demo data' },
  { label: 'Backend', value: 'not connected' },
  { label: 'Branch', value: 'feat/ui-desktop-v0' },
];

export const galleryDialogCopy = {
  title: '隐藏 Dialog 示例',
  description: '保留在 preview 中，便于类型和样式检查。',
};
