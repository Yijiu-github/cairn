import { MetadataList } from '../data-display';
import { Card, CardContent, CardHeader, CardTitle, Progress } from '../primitives';

import type { CairnMetric } from './types';
import type { HTMLAttributes } from 'react';

export interface CostLatencyMeterProps extends HTMLAttributes<HTMLDivElement> {
  readonly costLabel: string;
  readonly latencyLabel: string;
  readonly metrics?: readonly CairnMetric[];
  readonly tokenLabel?: string;
  readonly usagePercent?: number;
}

export function CostLatencyMeter({
  costLabel,
  latencyLabel,
  metrics = [],
  tokenLabel,
  usagePercent,
  ...props
}: CostLatencyMeterProps) {
  const items = [
    { label: '成本', value: costLabel },
    { label: '延迟', value: latencyLabel },
    ...(tokenLabel === undefined ? [] : [{ label: 'Token', value: tokenLabel }]),
    ...metrics.map((metric) => ({ label: metric.label, value: metric.value })),
  ];

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>成本 / 延迟</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {usagePercent === undefined ? undefined : (
          <Progress
            label="预算使用率"
            tone={usagePercent > 80 ? 'warning' : 'info'}
            value={usagePercent}
          />
        )}
        <MetadataList items={items} />
      </CardContent>
    </Card>
  );
}
