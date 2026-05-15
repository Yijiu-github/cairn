import { InlineAlert } from '../feedback';
import { Button, Select, Textarea } from '../primitives';
import { cn } from '../utils/cn';

import type { HTMLAttributes } from 'react';
export type InterventionEffect = 'immediate' | 'next_attempt' | 'note_only';

const effectOptions = [
  { label: '立即生效', value: 'immediate' },
  { label: '下次尝试生效', value: 'next_attempt' },
  { label: '仅记录备注', value: 'note_only' },
] as const;

export interface InterventionComposerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSubmit'
> {
  readonly disabled?: boolean;
  readonly effect: InterventionEffect;
  readonly message: string;
  readonly onEffectChange: (effect: InterventionEffect) => void;
  readonly onMessageChange: (message: string) => void;
  readonly onSubmit: () => void;
}

export function InterventionComposer({
  className,
  disabled = false,
  effect,
  message,
  onEffectChange,
  onMessageChange,
  onSubmit,
  ...props
}: InterventionComposerProps) {
  return (
    <div
      className={cn(
        'grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        className,
      )}
      {...props}
    >
      <div>
        <div className="text-sm font-semibold text-slate-950">人工接管</div>
        <p className="mt-1 text-sm text-slate-600">给当前运行补充约束、说明或批准结果。</p>
      </div>
      <InlineAlert tone="info">接管动作会写入 trace，并显示 operator action id。</InlineAlert>
      <Textarea
        disabled={disabled}
        onChange={(event) => {
          onMessageChange(event.target.value);
        }}
        placeholder="写下给 Agent 的补充说明…"
        value={message}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Select
          disabled={disabled}
          onChange={(event) => {
            onEffectChange(event.target.value as InterventionEffect);
          }}
          options={effectOptions}
          value={effect}
        />
        <Button disabled={disabled || message.trim().length === 0} onClick={onSubmit}>
          发送接管指令
        </Button>
      </div>
    </div>
  );
}
