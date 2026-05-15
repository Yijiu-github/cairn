import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
} from 'react';

import { cn } from '../utils/cn';

import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent } from 'react';

interface TabsContextValue {
  readonly baseId: string;
  readonly onValueChange: ((value: string) => void) | undefined;
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

function getTabIds(baseId: string, value: string) {
  const safeValue = value.replace(/[^a-zA-Z0-9_-]/g, '-');

  return {
    panelId: `${baseId}-panel-${safeValue}`,
    triggerId: `${baseId}-trigger-${safeValue}`,
  };
}

function getEnabledTabs(tabList: HTMLElement): HTMLElement[] {
  return Array.from(tabList.querySelectorAll<HTMLElement>('[role="tab"]')).filter((tab) => {
    const ariaDisabled = tab.getAttribute('aria-disabled') === 'true';
    const disabled = 'disabled' in tab && Boolean(tab.disabled);

    return !ariaDisabled && !disabled;
  });
}

function focusTabAtIndex(tabs: HTMLElement[], index: number) {
  const target = tabs[index];

  if (target === undefined) {
    return;
  }

  target.focus();
}

function handleTabsListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  const tabs = getEnabledTabs(event.currentTarget);

  if (tabs.length === 0) {
    return;
  }

  const currentIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab === document.activeElement),
  );

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    focusTabAtIndex(tabs, (currentIndex + 1) % tabs.length);
    return;
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    focusTabAtIndex(tabs, (currentIndex - 1 + tabs.length) % tabs.length);
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    focusTabAtIndex(tabs, 0);
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    focusTabAtIndex(tabs, tabs.length - 1);
  }
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  readonly onValueChange?: (value: string) => void;
  readonly value: string;
}

export function Tabs({ children, onValueChange, value, ...props }: TabsProps) {
  const baseId = useId();
  const contextValue = useMemo(
    () => ({ baseId, onValueChange, value }),
    [baseId, onValueChange, value],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, onKeyDown, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-flex rounded-xl bg-slate-100 p-1 text-sm text-slate-600', className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        handleTabsListKeyDown(event);
      }}
      role="tablist"
      {...props}
    />
  );
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly value: string;
}

export function TabsTrigger({
  'aria-controls': ariaControls,
  className,
  id,
  onClick,
  tabIndex,
  type = 'button',
  value,
  ...props
}: TabsTriggerProps) {
  const context = useTabsContext();
  const selected = context.value === value;
  const { panelId, triggerId } = getTabIds(context.baseId, value);

  return (
    <button
      aria-controls={ariaControls ?? panelId}
      aria-selected={selected}
      className={cn(
        'rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        selected ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950',
        className,
      )}
      data-state={selected ? 'active' : 'inactive'}
      id={id ?? triggerId}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        context.onValueChange?.(value);
      }}
      role="tab"
      tabIndex={tabIndex ?? (selected ? 0 : -1)}
      type={type}
      {...props}
    />
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  readonly value: string;
}

export function TabsContent({
  'aria-labelledby': ariaLabelledBy,
  children,
  id,
  value,
  ...props
}: TabsContentProps) {
  const context = useTabsContext();
  const { panelId, triggerId } = getTabIds(context.baseId, value);

  if (context.value !== value) {
    return null;
  }

  return (
    <div id={id ?? panelId} aria-labelledby={ariaLabelledBy ?? triggerId} role="tabpanel" {...props}>
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
  const baseId = useId();
  const contextValue = useMemo(
    () => ({ baseId, onValueChange, value }),
    [baseId, onValueChange, value],
  );

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
