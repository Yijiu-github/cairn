import { cloneElement, useId, useState } from 'react';

import { cn } from '../utils/cn';

import type { FocusEvent, HTMLAttributes, MouseEvent, ReactElement, ReactNode } from 'react';

interface TooltipChildProps {
  readonly 'aria-describedby'?: string | undefined;
  readonly 'onBlur'?: (event: FocusEvent<HTMLElement>) => void;
  readonly 'onFocus'?: (event: FocusEvent<HTMLElement>) => void;
  readonly 'onMouseEnter'?: (event: MouseEvent<HTMLElement>) => void;
  readonly 'onMouseLeave'?: (event: MouseEvent<HTMLElement>) => void;
}

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'content'> {
  readonly children: ReactElement<TooltipChildProps>;
  readonly content: ReactNode;
}

export function Tooltip({ children, className, content, ...props }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={cn('relative inline-flex', className)} {...props}>
      {cloneElement(children, {
        'aria-describedby': open ? id : undefined,
        'onBlur': (event: FocusEvent<HTMLElement>) => {
          children.props.onBlur?.(event);
          setOpen(false);
        },
        'onFocus': (event: FocusEvent<HTMLElement>) => {
          children.props.onFocus?.(event);
          setOpen(true);
        },
        'onMouseEnter': (event: MouseEvent<HTMLElement>) => {
          children.props.onMouseEnter?.(event);
          setOpen(true);
        },
        'onMouseLeave': (event: MouseEvent<HTMLElement>) => {
          children.props.onMouseLeave?.(event);
          setOpen(false);
        },
      })}
      {open ? (
        <span
          id={id}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-lg"
          role="tooltip"
        >
          {content}
        </span>
      ) : undefined}
    </span>
  );
}
