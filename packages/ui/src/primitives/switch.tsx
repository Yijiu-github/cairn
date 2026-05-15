import { forwardRef, useId } from 'react';

import { cn } from '../utils/cn';

import type { InputHTMLAttributes, ReactNode } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly description?: ReactNode;
  readonly label?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, description, id, label, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <label
        className={cn('flex cursor-pointer items-center justify-between gap-4 text-sm', className)}
      >
        {label === undefined && description === undefined ? undefined : (
          <span className="grid gap-1">
            {label === undefined ? undefined : (
              <span className="font-medium text-slate-900">{label}</span>
            )}
            {description === undefined ? undefined : (
              <span className="text-slate-600">{description}</span>
            )}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className="peer sr-only"
          role="switch"
          type="checkbox"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative h-6 w-11 rounded-full bg-slate-200 transition-colors',
            'after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform',
            'peer-checked:bg-blue-600 peer-checked:after:translate-x-5',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
          )}
        />
      </label>
    );
  },
);

Switch.displayName = 'Switch';
