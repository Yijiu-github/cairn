import { forwardRef, useId } from 'react';

import { cn } from '../utils/cn';

import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly description?: ReactNode;
  readonly label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, description, id, label, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <label
        className={cn('flex cursor-pointer items-start gap-3 text-sm text-slate-900', className)}
      >
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'mt-0.5 size-4 rounded border-slate-300 text-blue-600 shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
          type="checkbox"
          {...props}
        />
        {label === undefined && description === undefined ? undefined : (
          <span className="grid gap-1">
            {label === undefined ? undefined : (
              <span className="font-medium leading-none">{label}</span>
            )}
            {description === undefined ? undefined : (
              <span className="text-slate-600">{description}</span>
            )}
          </span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
