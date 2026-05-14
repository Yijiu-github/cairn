// SPDX-License-Identifier: Apache-2.0

import type { ApplicationRepository, CreateRunGraphInput } from '../ports/run-repository.js';
import type {
  AgentRun,
  AgentRunId,
  OrchestrationRun,
  OrchestrationRunId,
  Task,
  TaskId,
  TraceEvent,
} from '@cairn/shared-contracts/schemas';

export class InMemoryApplicationRepository implements ApplicationRepository {
  private readonly agentRuns = new Map<AgentRunId, AgentRun>();
  private readonly runs = new Map<OrchestrationRunId, OrchestrationRun>();
  private readonly tasks = new Map<TaskId, Task>();
  private readonly traceEvents: TraceEvent[] = [];

  createRunGraph(input: CreateRunGraphInput): Promise<void> {
    this.runs.set(input.run.orchestrationRunId, input.run);
    for (const task of input.tasks) {
      this.tasks.set(task.taskId, task);
    }
    return Promise.resolve();
  }

  getRun(orchestrationRunId: OrchestrationRunId): Promise<OrchestrationRun | undefined> {
    return Promise.resolve(this.runs.get(orchestrationRunId));
  }

  getTask(taskId: TaskId): Promise<Task | undefined> {
    return Promise.resolve(this.tasks.get(taskId));
  }

  getAgentRun(runId: AgentRunId): Promise<AgentRun | undefined> {
    return Promise.resolve(this.agentRuns.get(runId));
  }

  listTasksByRun(orchestrationRunId: OrchestrationRunId): Promise<Task[]> {
    return Promise.resolve(
      [...this.tasks.values()].filter((task) => task.orchestrationRunId === orchestrationRunId),
    );
  }

  listAgentRunsByTask(taskId: TaskId): Promise<AgentRun[]> {
    return Promise.resolve(
      [...this.agentRuns.values()].filter((agentRun) => agentRun.taskId === taskId),
    );
  }

  createAgentRun(agentRun: AgentRun): Promise<void> {
    this.agentRuns.set(agentRun.runId, agentRun);
    return Promise.resolve();
  }

  updateRun(run: OrchestrationRun): Promise<void> {
    this.runs.set(run.orchestrationRunId, run);
    return Promise.resolve();
  }

  updateTask(task: Task): Promise<void> {
    this.tasks.set(task.taskId, task);
    return Promise.resolve();
  }

  updateAgentRun(agentRun: AgentRun): Promise<void> {
    this.agentRuns.set(agentRun.runId, agentRun);
    return Promise.resolve();
  }

  appendTraceEvent(event: TraceEvent): Promise<void> {
    this.traceEvents.push(event);
    return Promise.resolve();
  }

  listTraceEvents(): TraceEvent[] {
    return [...this.traceEvents];
  }
}
