import type { EvidenceTimelineItem, TaskTreeItem } from '@cairn/ui';

export type PreviewRunStatus =
  | 'idle'
  | 'running'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type PreviewTaskStatus = 'running' | 'completed' | 'blocked' | 'failed' | 'waiting' | 'todo';
export type PreviewArtifactKind =
  | 'patch'
  | 'document'
  | 'screenshot'
  | 'log'
  | 'diagnostic'
  | 'other';
export type PreviewReviewState =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'changes_requested'
  | 'rejected';
export type PreviewArtifactSensitivity = 'none' | 'local_path' | 'secret_risk';
export type PreviewHandoffKind = 'approval' | 'clarification' | 'review' | 'blocked' | 'diagnostic';
export type PreviewAgentStatus =
  | 'idle'
  | 'thinking'
  | 'running'
  | 'waiting'
  | 'blocked'
  | 'failed'
  | 'done';
export type PreviewBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface PreviewMetric {
  label: string;
  value: string;
}

export interface PreviewAction {
  label: string;
  tone?: 'primary' | 'secondary' | 'danger' | 'warning';
}

export interface PreviewAgent {
  id: string;
  label: string;
  status: PreviewAgentStatus;
  task: string;
}

export interface PreviewRunSummary {
  id: string;
  title: string;
  description: string;
  status: PreviewRunStatus;
  progress: number;
  agentLabel: string;
  metrics: readonly PreviewMetric[];
}

export interface PreviewHandoffItem {
  agentLabel: string;
  description: string;
  kind: PreviewHandoffKind;
  sourceLabel: string;
  title: string;
  waitedFor?: string;
  action?: PreviewAction;
}

export interface PreviewRuntimeSummary {
  label: string;
  description: string;
  status: 'ready' | 'degraded' | 'offline';
  metrics: readonly PreviewMetric[];
}

export interface PreviewArtifact {
  artifactId: string;
  title: string;
  kind: PreviewArtifactKind;
  reviewState: PreviewReviewState;
  summary: string;
  path: string;
  source?: string;
  sensitivity: PreviewArtifactSensitivity;
  verification: string;
  actions: readonly PreviewAction[];
}

export interface PreviewStatusBadge {
  label: string;
  tone: PreviewBadgeTone;
}

export interface PreviewProtectedAction {
  actionKind:
    | 'file_write'
    | 'shell'
    | 'network'
    | 'token_access'
    | 'workspace_reset'
    | 'artifact_delete'
    | 'other';
  target: string;
  impact: string;
  triggerLabel?: string;
}

export interface PreviewRunDetail {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  status: PreviewRunStatus;
  tasks: readonly TaskTreeItem[];
  evidence: readonly EvidenceTimelineItem[];
  artifacts: readonly PreviewArtifact[];
}

export interface PreviewPlanningAction {
  id: string;
  title: string;
  intent: string;
  status: 'ready' | 'blocked' | 'running' | 'completed';
  dependsOn: readonly string[];
}

export interface PreviewPlanningPrecondition {
  label: string;
  status: 'satisfied' | 'pending' | 'failed';
  detail: string;
}

export interface PreviewPlanningOutput {
  id: string;
  status: 'pending' | 'ready' | 'blocked' | 'failed';
  summary: string;
  blockedReason?: string;
  preconditions: readonly PreviewPlanningPrecondition[];
  actions: readonly PreviewPlanningAction[];
}

export interface PreviewCostSummary {
  costLabel: string;
  latencyLabel: string;
  tokenLabel: string;
  usagePercent: number;
  metrics: readonly PreviewMetric[];
}

export interface PreviewArtifactReviewContext {
  diff: string;
  risk: {
    alert: string;
    metrics: readonly PreviewMetric[];
  };
  decision: {
    alert: string;
    metrics: readonly PreviewMetric[];
  };
}

export interface PreviewDiagnosticExportSummary {
  includeLogsLabel: string;
  includePathsHiddenLabel: string;
  includePathsVisibleLabel: string;
  checklistBaseItems: readonly PreviewMetric[];
}
