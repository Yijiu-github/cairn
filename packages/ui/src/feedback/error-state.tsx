import { cn } from '../utils/cn';

import type { HTMLAttributes, ReactNode } from 'react';

export type ErrorLayer = 'orchestration' | 'task' | 'execution' | 'artifact' | 'runtime';

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly action?: ReactNode;
  readonly description: string;
  readonly layer: ErrorLayer;
  readonly title: string;
}

const layerLabel: Record<ErrorLayer, string> = {
  artifact: '产物层',
  execution: '执行层',
  orchestration: '编排层',
  runtime: '运行时层',
  task: '任务层',
};

export function ErrorState({
  action,
  className,
  description,
  layer,
  title,
  ...props
}: ErrorStateProps) {
  return (
    <div className={cn('rounded-2xl border border-red-200 bg-red-50 p-6', className)} {...props}>
      <div className="inline-flex rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
        {layerLabel[layer]}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-red-950">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm text-red-800">{description}</p>
      {action === undefined ? undefined : <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
