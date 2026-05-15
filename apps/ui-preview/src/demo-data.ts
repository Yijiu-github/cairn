import type { InterventionEffect } from '@cairn/ui';

export const runActions = [
  { label: '接管', tone: 'primary' as const },
  { label: '暂停', tone: 'secondary' as const },
  { label: '取消运行', tone: 'danger' as const },
];

export const taskItems = [
  {
    id: 'task_root',
    label: '实现 UI preview playground',
    metadata: 'workspace_id: local_demo',
    status: 'running' as const,
    children: [
      {
        id: 'task_primitives',
        label: '检查基础组件状态',
        status: 'completed' as const,
        attempt: 1,
      },
      { id: 'task_product', label: '组合 Cairn 业务组件', status: 'running' as const, attempt: 1 },
      { id: 'task_review', label: '截图与人工审阅', status: 'todo' as const },
    ],
  },
];

export const defaultInterventionEffect: InterventionEffect = 'immediate';
