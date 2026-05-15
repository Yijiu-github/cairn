import { forwardRef } from 'react';

import { cn } from '../utils/cn';

import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-24 w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
        'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
        invalid ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
