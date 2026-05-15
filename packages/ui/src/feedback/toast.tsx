import { cn } from '../utils/cn';

import type { HTMLAttributes, ReactNode } from 'react';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

const toneClassName: Record<ToastTone, string> = {
  danger: 'border-red-200 bg-red-50 text-red-950',
  info: 'border-slate-200 bg-white text-slate-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
};

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  readonly action?: ReactNode;
  readonly description?: string;
  readonly title: string;
  readonly tone?: ToastTone;
}

export function Toast({
  action,
  className,
  description,
  title,
  tone = 'info',
  ...props
}: ToastProps) {
  return (
    <div
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg',
        toneClassName[tone],
        className,
      )}
      role="status"
      {...props}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        {description === undefined ? undefined : (
          <div className="mt-1 text-sm opacity-80">{description}</div>
        )}
      </div>
      {action === undefined ? undefined : <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ToastViewport({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('fixed bottom-4 right-4 z-50 grid gap-2', className)} {...props} />;
}
