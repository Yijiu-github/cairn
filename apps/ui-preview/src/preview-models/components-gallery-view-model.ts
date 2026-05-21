import { defaultInterventionEffect, runActions, taskItems } from '../demo-data';
import {
  galleryAgents,
  galleryDialogCopy,
  galleryEvidenceItems,
  galleryFooterItems,
  galleryRunMetrics,
} from '../preview-data/components-gallery-data';

import type {
  PreviewAgent,
  PreviewMetric,
  PreviewProtectedAction,
  PreviewRunSummary,
} from './preview-types';
import type { InterventionEffect } from '@cairn/ui';

export interface ComponentsGalleryViewModel {
  product: {
    run: PreviewRunSummary;
    runActions: typeof runActions;
    taskItems: typeof taskItems;
    artifact: {
      artifactId: string;
      title: string;
      path: string;
      summary: string;
      verification: string;
    };
  };
  evidenceRuntime: {
    evidence: typeof galleryEvidenceItems;
    agents: readonly PreviewAgent[];
    review: {
      artifactId: string;
      title: string;
      initialNote: string;
    };
  };
  protectedActions: {
    defaultEffect: InterventionEffect;
    initialMessage: string;
    dialog: PreviewProtectedAction;
  };
  feedback: {
    dialogCopy: typeof galleryDialogCopy;
  };
  footer: readonly PreviewMetric[];
}

export const componentsGalleryViewModel: ComponentsGalleryViewModel = {
  product: {
    run: {
      id: 'run_01JDEMOUI000000000000000',
      title: 'UI preview implementation',
      description: '生成组件预览页面，并检查 UI 组件状态覆盖。',
      status: 'running',
      progress: 58,
      agentLabel: 'Supervisor / Preview',
      metrics: galleryRunMetrics,
    },
    runActions,
    taskItems,
    artifact: {
      artifactId: 'artifact_ui_preview_001',
      title: 'UI preview app',
      path: 'apps/ui-preview/src/ui-preview-app.tsx',
      summary: '组件预览页面源文件，用于设计和开发共同检查 UI 状态。',
      verification: 'typecheck passed',
    },
  },
  evidenceRuntime: {
    evidence: galleryEvidenceItems,
    agents: galleryAgents,
    review: {
      artifactId: 'artifact_ui_preview_001',
      title: '产物审阅',
      initialNote: '证据链完整，可以进入下一步。',
    },
  },
  protectedActions: {
    defaultEffect: defaultInterventionEffect,
    initialMessage: '请先暂停当前写入动作，我要补充边界条件。',
    dialog: {
      actionKind: 'file_write',
      target: 'apps/ui-preview',
      impact: '将更新 apps/ui-preview 下的本地预览代码。',
    },
  },
  feedback: {
    dialogCopy: galleryDialogCopy,
  },
  footer: galleryFooterItems,
};
