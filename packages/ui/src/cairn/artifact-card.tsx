import { StatusBadge } from '../feedback';
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '../primitives';
import { cn } from '../utils/cn';

import type {
  CairnArtifactKind,
  CairnArtifactPathDisplayMode,
  CairnArtifactSensitivity,
  CairnComponentAction,
  CairnReviewState,
} from './types';
import type { HTMLAttributes } from 'react';

const kindLabel: Record<CairnArtifactKind, string> = {
  diagnostic: '诊断包',
  document: '文档',
  log: '日志',
  other: '其他',
  patch: 'Patch',
  screenshot: '截图',
};

const reviewLabel: Record<CairnReviewState, string> = {
  approved: '已批准',
  changes_requested: '需修改',
  draft: '草稿',
  pending_review: '待审阅',
  rejected: '已拒绝',
};

const reviewTone: Record<CairnReviewState, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> =
  {
    approved: 'success',
    changes_requested: 'warning',
    draft: 'neutral',
    pending_review: 'info',
    rejected: 'danger',
  };

const sensitivityLabel: Record<Exclude<CairnArtifactSensitivity, 'none'>, string> = {
  local_path: '本地路径风险',
  secret_risk: '可能包含敏感信息',
};

export interface ArtifactCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly actions?: readonly CairnComponentAction[];
  readonly artifactId: string;
  readonly kind: CairnArtifactKind;
  readonly path?: string;
  readonly pathDisplayMode?: CairnArtifactPathDisplayMode;
  readonly redactionLabel?: string;
  readonly reviewState: CairnReviewState;
  readonly sensitive?: boolean;
  readonly sensitivity?: CairnArtifactSensitivity;
  readonly summary?: string;
  readonly title: string;
  readonly verification?: string;
}

export function ArtifactCard({
  actions = [],
  artifactId,
  className,
  kind,
  path,
  pathDisplayMode = 'hidden',
  redactionLabel = '路径已隐藏',
  reviewState,
  sensitive = false,
  sensitivity,
  summary,
  title,
  verification,
  ...props
}: ArtifactCardProps) {
  const resolvedSensitivity: CairnArtifactSensitivity =
    sensitivity ?? (sensitive ? 'secret_risk' : 'none');
  const shouldDisplayPath = path !== undefined && pathDisplayMode !== 'hidden';
  const shouldDisplayHiddenPath = path !== undefined && pathDisplayMode === 'hidden';
  const shouldWarnFullPath = path !== undefined && pathDisplayMode === 'full';
  const shouldDisplaySensitivity = resolvedSensitivity !== 'none';

  return (
    <Card className={cn('overflow-hidden', className)} variant="artifact" {...props}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{title}</CardTitle>
            <div className="mt-1 font-mono text-xs text-slate-500">{artifactId}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <StatusBadge label={kindLabel[kind]} tone="neutral" />
            <StatusBadge label={reviewLabel[reviewState]} tone={reviewTone[reviewState]} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {summary === undefined ? undefined : <p className="text-sm text-slate-700">{summary}</p>}
        {shouldDisplayPath ? (
          <div className="truncate font-mono text-xs text-slate-500">{path}</div>
        ) : undefined}
        {shouldDisplayHiddenPath ? (
          <div className="truncate font-mono text-xs text-slate-500">{redactionLabel}</div>
        ) : undefined}
        {verification === undefined &&
        !shouldDisplaySensitivity &&
        !shouldWarnFullPath ? undefined : (
          <div className="flex flex-wrap gap-2">
            {verification === undefined ? undefined : (
              <StatusBadge label={verification} tone="success" />
            )}
            {shouldDisplaySensitivity ? (
              <StatusBadge label={sensitivityLabel[resolvedSensitivity]} tone="warning" />
            ) : undefined}
            {shouldWarnFullPath ? <StatusBadge label="完整路径已显示" tone="warning" /> : undefined}
          </div>
        )}
      </CardContent>
      {actions.length === 0 ? undefined : (
        <CardFooter>
          {actions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled}
              onClick={action.onClick}
              size="sm"
              variant={
                action.tone === 'primary'
                  ? 'primary'
                  : action.tone === 'danger'
                    ? 'danger'
                    : 'secondary'
              }
            >
              {action.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
