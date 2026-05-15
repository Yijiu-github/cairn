import { StatusBadge } from '../feedback';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
} from '../primitives';
import { cn } from '../utils/cn';

import type { CairnComponentAction, CairnMetric, CairnRunStatus } from './types';
import type { HTMLAttributes } from 'react';
const statusTone: Record<CairnRunStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  blocked: 'warning',
  cancelled: 'neutral',
  completed: 'success',
  failed: 'danger',
  idle: 'neutral',
  running: 'info',
};

const statusLabel: Record<CairnRunStatus, string> = {
  blocked: '已阻塞',
  cancelled: '已取消',
  completed: '已完成',
  failed: '失败',
  idle: '待开始',
  running: '运行中',
};

export interface RunCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly actions?: readonly CairnComponentAction[];
  readonly agentLabel?: string;
  readonly description?: string;
  readonly metrics?: readonly CairnMetric[];
  readonly progress?: number;
  readonly runId: string;
  readonly status: CairnRunStatus;
  readonly title: string;
}

export function RunCard({
  actions = [],
  agentLabel,
  className,
  description,
  metrics = [],
  progress,
  runId,
  status,
  title,
  ...props
}: RunCardProps) {
  return (
    <Card
      className={cn('overflow-hidden', className)}
      variant={status === 'blocked' ? 'handoff' : 'interactive'}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{title}</CardTitle>
            <div className="mt-1 font-mono text-xs text-slate-500">{runId}</div>
          </div>
          <StatusBadge label={statusLabel[status]} tone={statusTone[status]} />
        </div>
        {description === undefined ? undefined : (
          <p className="text-sm text-slate-600">{description}</p>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {progress === undefined ? undefined : (
          <Progress
            label={`${title} 进度`}
            tone={statusTone[status] === 'danger' ? 'danger' : 'info'}
            value={progress}
          />
        )}
        {metrics.length === 0 && agentLabel === undefined ? undefined : (
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            {agentLabel === undefined ? undefined : (
              <div>
                <div className="text-xs text-slate-500">Operator</div>
                <div className="font-medium text-slate-900">{agentLabel}</div>
              </div>
            )}
            {metrics.map((metric) => (
              <div key={metric.label}>
                <div className="text-xs text-slate-500">{metric.label}</div>
                <div className="font-medium text-slate-900">{metric.value}</div>
              </div>
            ))}
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
                action.tone === 'danger'
                  ? 'danger'
                  : action.tone === 'warning'
                    ? 'warning'
                    : action.tone === 'primary'
                      ? 'primary'
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
