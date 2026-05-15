import { cn } from '../utils/cn';

import type { HTMLAttributes, ReactNode } from 'react';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly action?: ReactNode;
  readonly description: string;
  readonly icon?: ReactNode;
  readonly title: string;
}

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center',
        className,
      )}
      {...props}
    >
      {icon === undefined ? undefined : (
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {action === undefined ? undefined : <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
