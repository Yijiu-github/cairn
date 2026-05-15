import { createContext, useContext, useEffect, useId, useMemo, useRef } from 'react';

import { cn } from '../utils/cn';

import { Button } from './button';

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject,
} from 'react';

interface DialogContextValue {
  readonly descriptionId: string;
  readonly titleId: string;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

function useDialogContext(): DialogContextValue {
  const value = useContext(DialogContext);

  if (value === undefined) {
    throw new Error('Dialog compound components must be rendered inside <Dialog>.');
  }

  return value;
}

function getFocusableElement(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
  );
}

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly closeOnBackdrop?: boolean;
  readonly closeOnEscape?: boolean;
  readonly initialFocusRef?: RefObject<HTMLElement>;
  readonly onOpenChange?: (open: boolean) => void;
  readonly open: boolean;
}

export function Dialog({
  children,
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  initialFocusRef,
  onKeyDown,
  onMouseDown,
  onOpenChange,
  open,
  tabIndex,
  ...props
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contextValue = useMemo(() => ({ descriptionId, titleId }), [descriptionId, titleId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const overlay = overlayRef.current;

    if (overlay === null) {
      return;
    }

    const target = initialFocusRef?.current ?? getFocusableElement(overlay) ?? overlay;

    target.focus();
  }, [initialFocusRef, open]);

  if (!open) {
    return null;
  }

  return (
    <DialogContext.Provider value={contextValue}>
      <div
        className={cn('fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4', className)}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);

          if (event.defaultPrevented) {
            return;
          }

          if (event.key === 'Escape' && closeOnEscape) {
            event.stopPropagation();
            onOpenChange?.(false);
          }
        }}
        onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
          onMouseDown?.(event);

          if (event.defaultPrevented) {
            return;
          }

          if (event.target === event.currentTarget && closeOnBackdrop) {
            onOpenChange?.(false);
          }
        }}
        ref={overlayRef}
        tabIndex={tabIndex ?? -1}
        {...props}
      >
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { descriptionId, titleId } = useDialogContext();

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        'w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl',
        className,
      )}
      role="dialog"
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();

  return (
    <h2 id={titleId} className={cn('text-lg font-semibold text-slate-950', className)} {...props} />
  );
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialogContext();

  return (
    <p id={descriptionId} className={cn('mt-2 text-sm text-slate-600', className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-6 flex flex-row-reverse gap-2 sm:justify-start', className)}
      {...props}
    />
  );
}

export interface DialogActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly danger?: boolean;
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
}

export function DialogAction({ danger = false, variant, ...props }: DialogActionProps) {
  return <Button variant={variant ?? (danger ? 'danger' : 'primary')} {...props} />;
}

export function DialogCancel(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button variant="secondary" {...props} />;
}
