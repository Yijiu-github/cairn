import { cn } from '../utils/cn';

import type { HTMLAttributes, ReactNode } from 'react';

export type StatusBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const toneClassName: Record<StatusBadgeTone, string> = {
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  neutral: 'bg-slate-50 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly metadata?: string;
  readonly tone?: StatusBadgeTone;
}

export function StatusBadge({
  className,
  icon,
  label,
  metadata,
  tone = 'neutral',
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        toneClassName[tone],
        className,
      )}
      {...props}
    >
      {icon === undefined ? undefined : <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
      {metadata === undefined ? undefined : <span className="opacity-75">· {metadata}</span>}
    </span>
  );
}
