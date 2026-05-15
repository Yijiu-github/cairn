import { Children, cloneElement, createContext, isValidElement, useContext, useMemo } from 'react';

import { cn } from '../utils/cn';

import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';

interface TabsContextValue {
  readonly value: string;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(): TabsContextValue {
  const value = useContext(TabsContext);

  if (value === undefined) {
    throw new Error('Tabs compound components must be rendered inside <Tabs>.');
  }

  return value;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  readonly value: string;
}

export function Tabs({ children, value, ...props }: TabsProps) {
  const contextValue = useMemo(() => ({ value }), [value]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-flex rounded-xl bg-slate-100 p-1 text-sm text-slate-600', className)}
      role="tablist"
      {...props}
    />
  );
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly value: string;
}

export function TabsTrigger({ className, type = 'button', value, ...props }: TabsTriggerProps) {
  const context = useTabsContext();
  const selected = context.value === value;

  return (
    <button
      aria-selected={selected}
      className={cn(
        'rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        selected ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950',
        className,
      )}
      role="tab"
      type={type}
      {...props}
    />
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  readonly value: string;
}

export function TabsContent({ children, value, ...props }: TabsContentProps) {
  const context = useTabsContext();

  if (context.value !== value) {
    return null;
  }

  return (
    <div role="tabpanel" {...props}>
      {children}
    </div>
  );
}

export interface SegmentedControlProps extends HTMLAttributes<HTMLDivElement> {
  readonly onValueChange: (value: string) => void;
  readonly value: string;
}

export function SegmentedControl({
  children,
  onValueChange,
  value,
  ...props
}: SegmentedControlProps) {
  const contextValue = useMemo(() => ({ value }), [value]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div role="group" {...props}>
        {Children.map(children, (child) => {
          if (!isValidElement<SegmentedControlItemProps>(child)) {
            return child;
          }

          return cloneElement(child, { onValueChange });
        })}
      </div>
    </TabsContext.Provider>
  );
}

export interface SegmentedControlItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly onValueChange?: (value: string) => void;
  readonly value: string;
}

export function SegmentedControlItem({
  onClick,
  onValueChange,
  type = 'button',
  value,
  ...props
}: SegmentedControlItemProps) {
  const context = useTabsContext();
  const selected = context.value === value;

  return (
    <button
      aria-pressed={selected}
      data-state={selected ? 'checked' : 'unchecked'}
      onClick={(event) => {
        onClick?.(event);
        onValueChange?.(value);
      }}
      type={type}
      {...props}
    />
  );
}
