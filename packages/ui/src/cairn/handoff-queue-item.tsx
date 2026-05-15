import { StatusBadge } from '../feedback';
import { Button, Card, CardContent } from '../primitives';
import { cn } from '../utils/cn';

import type { CairnComponentAction, CairnHandoffKind } from './types';
import type { HTMLAttributes } from 'react';
const kindLabel: Record<CairnHandoffKind, string> = {
  approval: '等待批准',
  blocked: '阻塞',
  clarification: '需要澄清',
  diagnostic: '诊断请求',
  review: '等待审阅',
};

export interface HandoffQueueItemProps extends HTMLAttributes<HTMLDivElement> {
  readonly action?: CairnComponentAction;
  readonly agentLabel: string;
  readonly description: string;
  readonly kind: CairnHandoffKind;
  readonly sourceLabel: string;
  readonly title: string;
  readonly waitedFor?: string;
}

export function HandoffQueueItem({
  action,
  agentLabel,
  className,
  description,
  kind,
  sourceLabel,
  title,
  waitedFor,
  ...props
}: HandoffQueueItemProps) {
  return (
    <Card className={cn('border-amber-200 bg-amber-50/70', className)} {...props}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={kindLabel[kind]} tone="warning" />
            {waitedFor === undefined ? undefined : (
              <span className="text-xs text-amber-800">等待 {waitedFor}</span>
            )}
          </div>
          <div className="mt-3 font-medium text-slate-950">{title}</div>
          <p className="mt-1 text-sm text-slate-700">{description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
            <span>来源：{sourceLabel}</span>
            <span>Agent：{agentLabel}</span>
          </div>
        </div>
        {action === undefined ? undefined : (
          <Button
            disabled={action.disabled}
            onClick={action.onClick}
            size="sm"
            variant={action.tone === 'danger' ? 'danger' : 'primary'}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
