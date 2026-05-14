// SPDX-License-Identifier: Apache-2.0

import {
  AGENT_RUN_TERMINAL_STATUSES,
  ORCHESTRATION_RUN_TERMINAL_STATUSES,
  TASK_TERMINAL_STATUSES,
} from '@cairn/shared-contracts/schemas';

import type {
  AgentRunStatus,
  OrchestrationRunStatus,
  TaskStatus,
} from '@cairn/shared-contracts/schemas';

const runTerminalStatuses = new Set<OrchestrationRunStatus>(ORCHESTRATION_RUN_TERMINAL_STATUSES);
const taskTerminalStatuses = new Set<TaskStatus>(TASK_TERMINAL_STATUSES);
const agentRunTerminalStatuses = new Set<AgentRunStatus>(AGENT_RUN_TERMINAL_STATUSES);

export const isRunTerminal = (status: OrchestrationRunStatus): boolean =>
  runTerminalStatuses.has(status);

export const isTaskTerminal = (status: TaskStatus): boolean => taskTerminalStatuses.has(status);

export const isAgentRunTerminal = (status: AgentRunStatus): boolean =>
  agentRunTerminalStatuses.has(status);
