import type { ReactNode } from 'react';

export type CairnRunStatus = 'idle' | 'running' | 'blocked' | 'completed' | 'failed' | 'cancelled';
export type CairnReviewState =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'changes_requested'
  | 'rejected';
export type CairnRuntimeStatus = 'ready' | 'degraded' | 'offline' | 'unknown';
export type CairnHandoffKind = 'approval' | 'clarification' | 'review' | 'blocked' | 'diagnostic';
export type CairnArtifactKind =
  | 'patch'
  | 'document'
  | 'screenshot'
  | 'log'
  | 'diagnostic'
  | 'other';

export interface CairnComponentAction {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick?: () => void;
  readonly tone?: 'primary' | 'secondary' | 'danger' | 'warning';
}

export interface CairnMetric {
  readonly label: string;
  readonly value: ReactNode;
}
