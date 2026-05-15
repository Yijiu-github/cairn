import { StatusBadge } from '../feedback';
import { Card } from '../primitives';
import { cn } from '../utils/cn';

import type { CairnTaskStatus } from './types';
import type { HTMLAttributes } from 'react';

const statusLabel: Record<CairnTaskStatus, string> = {
  blocked: '阻塞',
  cancelled: '取消',
  completed: '完成',
  failed: '失败',
  running: '运行中',
  todo: '待处理',
};

const statusTone: Record<CairnTaskStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  blocked: 'warning',
  cancelled: 'neutral',
  completed: 'success',
  failed: 'danger',
  running: 'info',
  todo: 'neutral',
};

export interface TaskTreeItem {
  readonly attempt?: number;
  readonly children?: readonly TaskTreeItem[];
  readonly id: string;
  readonly label: string;
  readonly metadata?: string;
  readonly status: CairnTaskStatus;
}

export interface TaskTreeProps extends HTMLAttributes<HTMLDivElement> {
  readonly items: readonly TaskTreeItem[];
  readonly selectedId?: string | undefined;
}

function TaskTreeNode({
  depth,
  item,
  selectedId,
}: {
  readonly depth: number;
  readonly item: TaskTreeItem;
  readonly selectedId?: string | undefined;
}) {
  const selected = item.id === selectedId;

  return (
    <li>
      <div
        className={cn(
          'grid grid-cols-[1fr_auto] items-start gap-3 rounded-xl px-3 py-2 text-sm',
          selected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-slate-50',
        )}
        style={{ paddingLeft: `${(12 + depth * 18).toString()}px` }}
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-950">{item.label}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="font-mono">{item.id}</span>
            {item.attempt === undefined ? undefined : <span>attempt {item.attempt}</span>}
            {item.metadata === undefined ? undefined : <span>{item.metadata}</span>}
          </div>
        </div>
        <StatusBadge label={statusLabel[item.status]} tone={statusTone[item.status]} />
      </div>
      {item.children === undefined || item.children.length === 0 ? undefined : (
        <ol className="mt-1 grid gap-1">
          {item.children.map((child) => (
            <TaskTreeNode key={child.id} depth={depth + 1} item={child} selectedId={selectedId} />
          ))}
        </ol>
      )}
    </li>
  );
}

export function TaskTree({ className, items, selectedId, ...props }: TaskTreeProps) {
  return (
    <Card className={cn('p-2', className)} {...props}>
      <ol className="grid gap-1">
        {items.map((item) => (
          <TaskTreeNode key={item.id} depth={0} item={item} selectedId={selectedId} />
        ))}
      </ol>
    </Card>
  );
}
