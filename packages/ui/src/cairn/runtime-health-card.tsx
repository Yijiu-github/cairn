import { MetadataList } from '../data-display';
import { StatusBadge } from '../feedback';
import { Card, CardContent, CardHeader, CardTitle } from '../primitives';
import { cn } from '../utils/cn';

import type { CairnMetric, CairnRuntimeStatus } from './types';
import type { HTMLAttributes } from 'react';
const statusLabel: Record<CairnRuntimeStatus, string> = {
  degraded: '部分降级',
  offline: '离线',
  ready: '就绪',
  unknown: '未知',
};

const statusTone: Record<
  CairnRuntimeStatus,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  degraded: 'warning',
  offline: 'danger',
  ready: 'success',
  unknown: 'neutral',
};

export interface RuntimeHealthCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly description?: string;
  readonly metrics?: readonly CairnMetric[];
  readonly runtimeLabel: string;
  readonly status: CairnRuntimeStatus;
}

export function RuntimeHealthCard({
  className,
  description,
  metrics = [],
  runtimeLabel,
  status,
  ...props
}: RuntimeHealthCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{runtimeLabel}</CardTitle>
            {description === undefined ? undefined : (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            )}
          </div>
          <StatusBadge label={statusLabel[status]} tone={statusTone[status]} />
        </div>
      </CardHeader>
      {metrics.length === 0 ? undefined : (
        <CardContent>
          <MetadataList
            className={cn('gap-2')}
            items={metrics.map((metric) => ({ label: metric.label, value: metric.value }))}
          />
        </CardContent>
      )}
    </Card>
  );
}
