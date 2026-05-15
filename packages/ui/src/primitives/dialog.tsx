import { createContext, useContext, useId, useMemo } from 'react';

import { cn } from '../utils/cn';

import { Button } from './button';

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

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

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly open: boolean;
}

export function Dialog({ children, className, open, ...props }: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const contextValue = useMemo(() => ({ descriptionId, titleId }), [descriptionId, titleId]);

  if (!open) {
    return null;
  }

  return (
    <DialogContext.Provider value={contextValue}>
      <div
        className={cn('fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4', className)}
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
