import { StatusBadge } from '../feedback';
import { Card } from '../primitives';
import { cn } from '../utils/cn';

import type { CairnEvidenceTone } from './types';
import type { HTMLAttributes, ReactNode } from 'react';

export interface EvidenceTimelineItem {
  readonly description?: ReactNode;
  readonly id: string;
  readonly metadata?: string;
  readonly time: string;
  readonly title: string;
  readonly tone?: CairnEvidenceTone;
}

export interface EvidenceTimelineProps extends HTMLAttributes<HTMLDivElement> {
  readonly items: readonly EvidenceTimelineItem[];
}

const toneClassName: Record<CairnEvidenceTone, string> = {
  danger: 'border-red-300 bg-red-500',
  info: 'border-blue-300 bg-blue-500',
  neutral: 'border-slate-300 bg-slate-400',
  success: 'border-emerald-300 bg-emerald-500',
  warning: 'border-amber-300 bg-amber-500',
};

export function EvidenceTimeline({ className, items, ...props }: EvidenceTimelineProps) {
  return (
    <Card className={cn('p-4', className)} {...props}>
      <ol className="relative grid gap-5 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-slate-200">
        {items.map((item) => {
          const tone = item.tone ?? 'neutral';

          return (
            <li key={item.id} className="relative grid grid-cols-[1rem_1fr] gap-3">
              <span
                className={cn(
                  'mt-1 size-4 rounded-full border-2 border-white shadow-sm',
                  toneClassName[tone],
                )}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-slate-950">{item.title}</div>
                  <StatusBadge label={item.time} tone="neutral" />
                </div>
                {item.description === undefined ? undefined : (
                  <div className="mt-1 text-sm text-slate-700">{item.description}</div>
                )}
                {item.metadata === undefined ? undefined : (
                  <div className="mt-1 font-mono text-xs text-slate-500">{item.metadata}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
