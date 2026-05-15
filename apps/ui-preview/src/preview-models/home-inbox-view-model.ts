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
    name: string;
    summary: string;
    stats: readonly PreviewMetric[];
  };
  runs: readonly PreviewRunSummary[];
  handoffQueue: readonly PreviewHandoffItem[];
  agents: readonly PreviewAgent[];
  runtime: PreviewRuntimeSummary;
  filters: readonly string[];
}

export const homeInboxViewModel: HomeInboxViewModel = {
  workspace: {
    name: 'local_demo_workspace',
    summary: '今日 3 个运行，2 个需要接管，1 个 runtime 降级提示。',
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
};
