import { cn } from '../utils/cn';

import type { HTMLAttributes, ReactNode } from 'react';

export interface MetadataItem {
  readonly label: string;
  readonly value: ReactNode;
}

export interface MetadataListProps extends HTMLAttributes<HTMLDListElement> {
  readonly items: readonly MetadataItem[];
}

export function MetadataList({ className, items, ...props }: MetadataListProps) {
  return (
    <dl className={cn('grid gap-3 text-sm', className)} {...props}>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[9rem_1fr] gap-3">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="min-w-0 text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
