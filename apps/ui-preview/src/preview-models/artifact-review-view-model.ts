import {
  artifactDecisionItems,
  artifactReviewProvenanceItems,
  artifactReviewRelatedArtifacts,
  artifactRiskItems,
  artifactShareChecklistBaseItems,
} from '../preview-data/artifact-review-data';

import type {
  PreviewArtifact,
  PreviewArtifactReviewContext,
  PreviewDiagnosticExportSummary,
  PreviewProtectedAction,
  PreviewStatusBadge,
} from './preview-types';

export interface ArtifactReviewViewModel {
  artifact: PreviewArtifact;
  runId: string;
  hero: {
    title: string;
    summary: string;
    badges: readonly PreviewStatusBadge[];
  };
  relatedArtifacts: readonly PreviewArtifact[];
  provenance: typeof artifactReviewProvenanceItems;
  reviewContext: PreviewArtifactReviewContext;
  diagnosticExport: PreviewDiagnosticExportSummary;
  protectedAction: PreviewProtectedAction;
}

const relatedArtifacts: readonly PreviewArtifact[] = artifactReviewRelatedArtifacts.map((artifact) => ({
  ...artifact,
  actions: [],
  sensitivity: artifact.sensitive ? 'local_path' : 'none',
}));

const primaryArtifact = relatedArtifacts[0];

if (primaryArtifact === undefined) {
  throw new Error('artifactReviewViewModel requires at least one related artifact');
}

export const artifactReviewViewModel: ArtifactReviewViewModel = {
  artifact: primaryArtifact,
  runId: 'run_01JDEMOHOME0000000000001',
  hero: {
    title: 'Run Detail preview page',
    summary:
      '审阅页的目标是回答三个问题：产物从哪来、是否可信、批准后会发生什么。这里刻意把本地路径和导出风险放在第一屏。',
    badges: [
      { label: '待审阅', tone: 'info' },
      { label: '可能包含敏感路径', tone: 'warning' },
    ],
  },
  relatedArtifacts,
  provenance: artifactReviewProvenanceItems,
  reviewContext: {
    diff: `+ export function RunDetailPreviewPage() {
+   return <TaskTree items={runTasks} selectedId="task_define_risk_copy" />;
+ }

+ .run-detail-layout {
+   grid-template-columns: minmax(0, 1fr) 380px;
+ }`,
    risk: {
      alert: '产物内容安全，但路径可能暴露用户名、项目结构或机器信息；分享前应默认隐藏绝对路径。',
      metrics: artifactRiskItems,
    },
    decision: {
      alert: '推荐动作：批准页面结构，要求样式和文案在截图审阅后再标记最终 approved。',
      metrics: artifactDecisionItems,
    },
  },
  diagnosticExport: {
    includeLogsLabel: 'included, redacted',
    includePathsHiddenLabel: 'hidden by default',
    includePathsVisibleLabel: 'included',
    checklistBaseItems: artifactShareChecklistBaseItems,
  },
  protectedAction: {
    actionKind: 'artifact_delete',
    target: 'artifact_run_detail_page',
    impact: '会从当前运行的产物列表移除该 artifact；源码文件不会在这个 prototype 中真实删除。',
    triggerLabel: '删除产物',
  },
};
