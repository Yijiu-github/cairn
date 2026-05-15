import {
  runDetailAgents,
  runDetailArtifacts,
  runDetailAttributionItems,
  runDetailCostMetrics,
  runDetailEvidenceItems,
  runDetailRuntimeMetrics,
  runDetailTasks,
} from '../preview-data/run-detail-data';

import type {
  PreviewAgent,
  PreviewArtifact,
  PreviewCostSummary,
  PreviewMetric,
  PreviewProtectedAction,
  PreviewRunDetail,
  PreviewRuntimeSummary,
} from './preview-types';

export interface RunDetailViewModel {
  run: PreviewRunDetail;
  agents: readonly PreviewAgent[];
  runtime: PreviewRuntimeSummary;
  cost: PreviewCostSummary;
  attribution: readonly PreviewMetric[];
  protectedAction: PreviewProtectedAction;
}

const runArtifacts: readonly PreviewArtifact[] = runDetailArtifacts.map((artifact) => ({
  ...artifact,
  sensitivity: 'local_path',
}));

export const runDetailViewModel: RunDetailViewModel = {
  run: {
    id: 'run_01JDEMOHOME0000000000001',
    workspaceId: 'local_demo_workspace',
    title: '生成 Run Detail 页面 prototype',
    summary:
      '把任务树、证据链、产物、成本延迟和人工接管组合到同一个控制台视图中，验证 operator 是否能快速判断下一步。',
    status: 'running',
    tasks: runDetailTasks,
    evidence: runDetailEvidenceItems,
    artifacts: runArtifacts,
  },
  agents: runDetailAgents,
  runtime: {
    label: 'Preview runtime',
    description: 'UI preview 使用静态数据，不连接 workspace-core。',
    status: 'ready',
    metrics: runDetailRuntimeMetrics,
  },
  cost: {
    costLabel: '$0.08',
    latencyLabel: '2.1s p50 / 8.4s p95',
    tokenLabel: '31.4k',
    usagePercent: 58,
    metrics: runDetailCostMetrics,
  },
  attribution: runDetailAttributionItems,
  protectedAction: {
    actionKind: 'other',
    target: 'run_01JDEMOHOME0000000000001',
    impact: '会停止当前运行，但保留已生成的预览文件和证据链记录。',
    triggerLabel: '取消运行',
  },
};
