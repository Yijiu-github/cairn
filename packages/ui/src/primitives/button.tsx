import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

import { cn } from '../utils/cn';

import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClassName: Record<ButtonVariant, string> = {
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-200',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
  primary:
    'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500 disabled:bg-blue-200',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400',
  warning:
    'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-500',
};

const sizeClassName: Record<ButtonSize, string> = {
  lg: 'h-11 gap-2 rounded-2xl px-5 text-base',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly asChild?: boolean;
  readonly loading?: boolean;
  readonly size?: ButtonSize;
  readonly variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      children,
      className,
      disabled = false,
      loading = false,
      size = 'md',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';

    return (
      <Component
        ref={ref}
        className={cn(
          'inline-flex select-none items-center justify-center font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
          sizeClassName[size],
          variantClassName[variant],
          className,
        )}
        disabled={disabled || loading}
        data-loading={loading ? 'true' : undefined}
        {...props}
      >
        {loading ? <span aria-hidden="true">…</span> : undefined}
        {children}
      </Component>
    );
  },
);

Button.displayName = 'Button';
