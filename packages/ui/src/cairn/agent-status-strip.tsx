import { StatusBadge } from '../feedback';
import { cn } from '../utils/cn';

import type { CairnAgentStatus } from './types';
import type { HTMLAttributes } from 'react';

const statusLabel: Record<CairnAgentStatus, string> = {
  blocked: '阻塞',
  done: '完成',
  failed: '失败',
  idle: '空闲',
  running: '执行中',
  thinking: '思考中',
  waiting: '等待',
};

const statusTone: Record<CairnAgentStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> =
  {
    blocked: 'warning',
    done: 'success',
    failed: 'danger',
    idle: 'neutral',
    running: 'info',
    thinking: 'info',
    waiting: 'warning',
  };

export interface AgentStatusItem {
  readonly id: string;
  readonly label: string;
  readonly status: CairnAgentStatus;
  readonly task?: string;
}

export interface AgentStatusStripProps extends HTMLAttributes<HTMLDivElement> {
  readonly agents: readonly AgentStatusItem[];
}

export function AgentStatusStrip({ agents, className, ...props }: AgentStatusStripProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm',
        className,
      )}
      {...props}
    >
      {agents.map((agent) => (
        <div key={agent.id} className="min-w-44 rounded-xl bg-slate-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-medium text-slate-950">{agent.label}</div>
            <StatusBadge label={statusLabel[agent.status]} tone={statusTone[agent.status]} />
          </div>
          {agent.task === undefined ? undefined : (
            <div className="mt-1 truncate text-xs text-slate-500">{agent.task}</div>
          )}
        </div>
      ))}
    </div>
  );
}
