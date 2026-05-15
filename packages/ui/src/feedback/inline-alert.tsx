import { cn } from '../utils/cn';

import type { HTMLAttributes, ReactNode } from 'react';

export type InlineAlertTone = 'info' | 'success' | 'warning' | 'danger';

const toneClassName: Record<InlineAlertTone, string> = {
  danger: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
};

export interface InlineAlertProps extends HTMLAttributes<HTMLDivElement> {
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
  readonly title?: string;
  readonly tone?: InlineAlertTone;
}

export function InlineAlert({
  action,
  children,
  className,
  icon,
  title,
  tone = 'info',
  ...props
}: InlineAlertProps) {
  return (
    <div
      className={cn('flex gap-3 rounded-xl border p-3 text-sm', toneClassName[tone], className)}
      {...props}
    >
      {icon === undefined ? undefined : (
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title === undefined ? undefined : <div className="font-semibold">{title}</div>}
        <div className={cn(title === undefined ? undefined : 'mt-1')}>{children}</div>
      </div>
      {action === undefined ? undefined : <div className="shrink-0">{action}</div>}
    </div>
  );
}
