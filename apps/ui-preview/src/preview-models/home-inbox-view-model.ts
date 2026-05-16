import {
  homeActiveRuns,
  homeAgents,
  homeFilterLabels,
  homeQueueItems,
  homeRuntimeMetrics,
  homeSummaryItems,
} from '../preview-data/home-inbox-data';

import type {
  PreviewAgent,
  PreviewHandoffItem,
  PreviewMetric,
  PreviewRunSummary,
  PreviewRuntimeSummary,
} from './preview-types';

export interface HomeInboxViewModel {
  workspace: {
    stats: readonly PreviewMetric[];
  };
  runs: readonly PreviewRunSummary[];
  handoffQueue: readonly PreviewHandoffItem[];
  agents: readonly PreviewAgent[];
  runtime: PreviewRuntimeSummary;
  filters: readonly string[];
  boundaryNote: string;
}

export const homeInboxViewModel: HomeInboxViewModel = {
  workspace: {
    stats: homeSummaryItems,
  },
  runs: homeActiveRuns,
  handoffQueue: homeQueueItems,
  agents: homeAgents,
  runtime: {
    label: 'UI Preview Runtime',
    description: '本地 preview server 当前未运行；最近一次 production build 通过。',
    status: 'degraded',
    metrics: homeRuntimeMetrics,
  },
  filters: homeFilterLabels,
  boundaryNote:
    'Home / Inbox 只承接 operator 当前要处理的接管、运行和审阅；工作区身份、全局导航和 runtime 总览归 Desktop Shell。',
};
