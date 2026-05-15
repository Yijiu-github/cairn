import { cn } from '../utils/cn';

import type { HTMLAttributes } from 'react';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
