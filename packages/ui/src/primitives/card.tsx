import { forwardRef } from 'react';

import { cn } from '../utils/cn';

import type { HTMLAttributes } from 'react';

export type CardVariant = 'default' | 'interactive' | 'handoff' | 'artifact' | 'danger';

const variantClassName: Record<CardVariant, string> = {
  artifact: 'border-slate-200 bg-white',
  danger: 'border-red-200 bg-red-50',
  default: 'border-slate-200 bg-white',
  handoff: 'border-amber-200 bg-amber-50',
  interactive:
    'border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: CardVariant;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border shadow-sm', variantClassName[variant], className)}
      {...props}
    />
  ),
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-5 pb-3', className)} {...props} />
  ),
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold text-slate-950', className)} {...props} />
  ),
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-slate-600', className)} {...props} />
));

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-3', className)} {...props} />
  ),
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 p-5 pt-3', className)} {...props} />
  ),
);

CardFooter.displayName = 'CardFooter';
