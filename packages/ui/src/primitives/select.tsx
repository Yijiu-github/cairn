import { forwardRef } from 'react';

import { cn } from '../utils/cn';

import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly invalid?: boolean;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid = false, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
        invalid ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300',
        className,
      )}
      {...props}
    >
      {placeholder === undefined ? undefined : <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} disabled={option.disabled} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
);

Select.displayName = 'Select';
