import { useMemo, useState } from 'react';

import { cn } from '../utils/cn';

import { Input } from './input';

import type { HTMLAttributes } from 'react';

export interface ComboboxOption {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: string;
}

export interface ComboboxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly onValueChange: (value: string) => void;
  readonly options: readonly ComboboxOption[];
  readonly placeholder?: string;
  readonly value?: string;
}

export function Combobox({
  className,
  onValueChange,
  options,
  placeholder,
  value,
  ...props
}: ComboboxProps) {
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <div className={cn('grid gap-2', className)} {...props}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      <div
        className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        role="listbox"
      >
        {filteredOptions.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              aria-selected={selected}
              className={cn(
                'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors',
                selected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50',
                option.disabled ? 'cursor-not-allowed opacity-50' : undefined,
              )}
              disabled={option.disabled}
              onClick={() => {
                onValueChange(option.value);
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          );
        })}
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-slate-500">没有匹配项</div>
        ) : undefined}
      </div>
    </div>
  );
}
