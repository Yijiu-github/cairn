import { forwardRef } from 'react';

import { cn } from '../utils/cn';

import type { HTMLAttributes } from 'react';

export type ProgressTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const toneClassName: Record<ProgressTone, string> = {
  danger: 'bg-red-600',
  info: 'bg-blue-600',
  neutral: 'bg-slate-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
};

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  readonly label?: string;
  readonly max?: number;
  readonly tone?: ProgressTone;
  readonly value?: number;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, label, max = 100, tone = 'info', value, ...props }, ref) => {
    const safeValue = value === undefined ? undefined : Math.min(Math.max(value, 0), max);
    const percent = safeValue === undefined ? undefined : (safeValue / max) * 100;

    return (
      <div
        ref={ref}
        aria-label={label}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200', className)}
        role="progressbar"
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all motion-reduce:transition-none',
            safeValue === undefined ? 'w-1/3 animate-pulse' : undefined,
            toneClassName[tone],
          )}
          style={percent === undefined ? undefined : { width: `${percent.toString()}%` }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';
