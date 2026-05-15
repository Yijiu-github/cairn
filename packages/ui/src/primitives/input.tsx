import { forwardRef } from 'react';

import { cn } from '../utils/cn';

import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors',
        'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
        invalid ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
