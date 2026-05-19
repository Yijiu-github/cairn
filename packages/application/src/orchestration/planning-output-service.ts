// SPDX-License-Identifier: Apache-2.0

import { ApplicationError } from '../errors.js';

import type { ApplicationClock, ApplicationIdFactory } from './orchestration-run-service.js';
import type { ApplicationRepository } from '../ports/run-repository.js';
import type {
  OrchestrationRun,
  OrchestrationRunId,
  PlanningActionNode,
  PlanningBlockedReason,
  PlanningOutput,
  PlanningOutputId,
  PlanningPrecondition,
  PlanningReplanReason,
  StructuredError,
  ContextPackId,
  TraceEvent,
} from '@cairn/shared-contracts/schemas';

export interface PlanningOutputServiceDependencies {
  clock: ApplicationClock;
  ids: ApplicationIdFactory;
  repository: ApplicationRepository;
}

export interface StartPlanningInput {
  runId: OrchestrationRunId;
  contextPackRefs?: ContextPackId[];
  replanReason?: PlanningReplanReason;
}

export interface CompletePlanningInput {
  planningOutputId: PlanningOutputId;
  actionTree?: PlanningActionNode[];
  preconditions?: PlanningPrecondition[];
  contextPackRefs?: ContextPackId[];
}

export interface BlockPlanningInput {
  planningOutputId: PlanningOutputId;
  actionTree?: PlanningActionNode[];
  preconditions?: PlanningPrecondition[];
  blockedReason: PlanningBlockedReason;
}

export interface FailPlanningInput {
  planningOutputId: PlanningOutputId;
  error: StructuredError;
}

const PLANNING_OUTPUT_TERMINAL = new Set(['ready', 'blocked', 'failed'] as const);
const isPlanningOutputTerminal = (status: PlanningOutput['status']): boolean =>
  PLANNING_OUTPUT_TERMINAL.has(
    status as typeof PLANNING_OUTPUT_TERMINAL extends Set<infer Status> ? Status : never,
  );

const ORCHESTRATION_RUN_TERMINAL = new Set([
  'succeeded',
  'failed',
  'cancelled',
  'timeout',
] as const);
const isOrchestrationRunTerminal = (status: OrchestrationRun['status']): boolean =>
  ORCHESTRATION_RUN_TERMINAL.has(
    status as typeof ORCHESTRATION_RUN_TERMINAL extends Set<infer Status> ? Status : never,
  );

const toIso = (date: Date): string => date.toISOString();

export class PlanningOutputService {
  private readonly clock: ApplicationClock;
  private readonly ids: ApplicationIdFactory;
  private readonly repository: ApplicationRepository;

  constructor(dependencies: PlanningOutputServiceDependencies) {
    this.clock = dependencies.clock;
    this.ids = dependencies.ids;
    this.repository = dependencies.repository;
  }

  async startPlanning(input: StartPlanningInput): Promise<PlanningOutput> {
    const run = await this.requireRun(input.runId);
    this.assertRunCanStartPlanning(run);

    const existingOutput = await this.repository.getPlanningOutputByRun(input.runId);
    if (run.plannerOutputRef !== undefined) {
      throw new ApplicationError(
        'PLANNING_OUTPUT_ALREADY_EXISTS',
        `Planning output already exists for run: ${input.runId}`,
      );
    }

    const now = toIso(this.clock.now());
    const planningOutput =
      existingOutput ??
      ({
        planningOutputId: this.ids.planningOutputId(),
        workspaceId: run.workspaceId,
        orchestrationRunId: run.orchestrationRunId,
        status: 'pending',
        actionTree: [],
        preconditions: [],
        contextPackRefs: input.contextPackRefs ?? [],
        createdAt: now,
        updatedAt: now,
        ...(input.replanReason === undefined ? {} : { replanReason: input.replanReason }),
      } satisfies PlanningOutput);

    if (existingOutput === undefined) {
      await this.repository.createPlanningOutput(planningOutput);
    }
    const planningRun: OrchestrationRun = {
      ...run,
      status: 'planning',
      plannerOutputRef: planningOutput.planningOutputId,
      updatedAt: now,
    };
    await this.repository.updateRun(planningRun);
    await this.appendTraceEvent(planningRun, 'run.planning_started', 'info', {
      planningOutputId: planningOutput.planningOutputId,
      contextPackCount: planningOutput.contextPackRefs.length,
      ...(input.replanReason === undefined ? {} : { replanReason: input.replanReason.trigger }),
    });

    return planningOutput;
  }

  async completePlanning(input: CompletePlanningInput): Promise<PlanningOutput> {
    const output = await this.requireActivePlanningOutput(input.planningOutputId);
    const actionTree = input.actionTree ?? output.actionTree;
    this.validateDependencies(actionTree);

    const updated = await this.updatePlanningOutput(output, {
      status: 'ready',
      actionTree,
      preconditions: input.preconditions ?? output.preconditions,
      contextPackRefs: input.contextPackRefs ?? output.contextPackRefs,
      blockedReason: undefined,
      replanReason: output.replanReason,
    });

    await this.appendTraceEventByOutput(updated, 'run.planning_completed', 'info', {
      planningOutputId: updated.planningOutputId,
      actionCount: updated.actionTree.length,
    });

    return updated;
  }

  async blockPlanning(input: BlockPlanningInput): Promise<PlanningOutput> {
    const output = await this.requireActivePlanningOutput(input.planningOutputId);
    const actionTree = input.actionTree ?? output.actionTree;
    this.validateDependencies(actionTree);

    const updated = await this.updatePlanningOutput(output, {
      status: 'blocked',
      actionTree,
      preconditions: input.preconditions ?? output.preconditions,
      blockedReason: input.blockedReason,
      replanReason: output.replanReason,
    });

    await this.appendTraceEventByOutput(updated, 'run.planning_blocked', 'warn', {
      planningOutputId: updated.planningOutputId,
      blockedCode: input.blockedReason.code,
    });

    return updated;
  }

  async failPlanning(input: FailPlanningInput): Promise<PlanningOutput> {
    const output = await this.requireActivePlanningOutput(input.planningOutputId);
    const updated = await this.updatePlanningOutput(output, {
      status: 'failed',
      replanReason: output.replanReason,
    });

    const finishedAt = toIso(this.clock.now());
    const run = await this.requireRun(output.orchestrationRunId);
    const failedRun: OrchestrationRun = {
      ...run,
      status: 'failed',
      hasPartialFailures: true,
      resultCompleteness: 'empty',
      completionLevel: 'failed',
      finishedAt,
      error: input.error,
      updatedAt: finishedAt,
    };

    await this.repository.updateRun(failedRun);
    await this.appendTraceEventByOutput(updated, 'run.planning_failed', 'error', {
      planningOutputId: updated.planningOutputId,
      errorCode: input.error.code,
      retryable: input.error.retryable,
    });

    return updated;
  }

  private async requireRun(orchestrationRunId: OrchestrationRunId): Promise<OrchestrationRun> {
    const run = await this.repository.getRun(orchestrationRunId);
    if (run === undefined) {
      throw new ApplicationError(
        'MISSING_ORCHESTRATION_RUN',
        `Missing orchestration run: ${orchestrationRunId}`,
      );
    }
    return run;
  }

  private async requirePlanningOutput(planningOutputId: PlanningOutputId): Promise<PlanningOutput> {
    const output = await this.repository.getPlanningOutput(planningOutputId);
    if (output === undefined) {
      throw new ApplicationError(
        'PLANNING_OUTPUT_NOT_FOUND',
        `Missing planning output: ${planningOutputId}`,
      );
    }
    return output;
  }

  private async requireActivePlanningOutput(
    planningOutputId: PlanningOutputId,
  ): Promise<PlanningOutput> {
    const output = await this.requirePlanningOutput(planningOutputId);
    if (isPlanningOutputTerminal(output.status)) {
      throw new ApplicationError(
        'PLANNING_OUTPUT_TERMINAL',
        `Planning output is terminal: ${planningOutputId}`,
      );
    }
    const run = await this.requireRun(output.orchestrationRunId);
    this.assertRunNotTerminal(run);
    if (run.plannerOutputRef !== planningOutputId) {
      throw new ApplicationError(
        'PLANNING_OUTPUT_RUN_MISMATCH',
        `Planning output does not match run planner reference: ${planningOutputId}`,
      );
    }
    return output;
  }

  private assertRunCanStartPlanning(run: OrchestrationRun): void {
    if (run.status !== 'queued' && run.status !== 'planning') {
      throw new ApplicationError(
        'INVALID_RUN_STATE',
        `Run must be queued or planning to start planning: ${run.orchestrationRunId}`,
      );
    }
  }

  private assertRunNotTerminal(run: OrchestrationRun): void {
    if (isOrchestrationRunTerminal(run.status)) {
      throw new ApplicationError(
        'ORCHESTRATION_RUN_TERMINAL',
        `OrchestrationRun is terminal: ${run.orchestrationRunId}`,
      );
    }
  }

  private async updatePlanningOutput(
    output: PlanningOutput,
    patch: Partial<PlanningOutput>,
  ): Promise<PlanningOutput> {
    const updatedAt = toIso(this.clock.now());
    const updated: PlanningOutput = {
      ...output,
      ...patch,
      updatedAt,
    };
    await this.repository.updatePlanningOutput(updated);
    return updated;
  }

  private validateDependencies(actionTree: PlanningActionNode[]): void {
    const actionIds = new Set<string>();
    for (const action of actionTree) {
      if (actionIds.has(action.actionId)) {
        throw new ApplicationError(
          'INVALID_PLANNING_OUTPUT',
          `Action id is duplicated in action tree: ${action.actionId}`,
        );
      }
      actionIds.add(action.actionId);
    }

    for (const action of actionTree) {
      if (action.parentActionId !== undefined && !actionIds.has(action.parentActionId)) {
        throw new ApplicationError(
          'INVALID_PLANNING_OUTPUT',
          `Action parent is missing from action tree: ${action.parentActionId}`,
        );
      }

      if (action.parentActionId === action.actionId) {
        throw new ApplicationError(
          'INVALID_PLANNING_OUTPUT',
          `Action cannot be its own parent: ${action.actionId}`,
        );
      }

      for (const dependencyId of action.dependsOnActionIds) {
        if (dependencyId === action.actionId) {
          throw new ApplicationError(
            'INVALID_PLANNING_OUTPUT',
            `Action cannot depend on itself: ${action.actionId}`,
          );
        }

        if (!actionIds.has(dependencyId)) {
          throw new ApplicationError(
            'INVALID_PLANNING_OUTPUT',
            `Action dependency is missing from action tree: ${dependencyId}`,
          );
        }
      }
    }

    this.assertAcyclicDependencies(actionTree);
    this.assertAcyclicParents(actionTree);
  }

  private assertAcyclicDependencies(actionTree: PlanningActionNode[]): void {
    const actionsById = new Map(actionTree.map((action) => [action.actionId, action]));
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (actionId: string): void => {
      if (visited.has(actionId)) {
        return;
      }

      if (visiting.has(actionId)) {
        throw new ApplicationError(
          'INVALID_PLANNING_OUTPUT',
          `Action dependency cycle detected at action: ${actionId}`,
        );
      }

      const action = actionsById.get(actionId);
      if (action === undefined) {
        return;
      }

      visiting.add(actionId);
      for (const dependencyId of action.dependsOnActionIds) {
        visit(dependencyId);
      }
      visiting.delete(actionId);
      visited.add(actionId);
    };

    for (const action of actionTree) {
      visit(action.actionId);
    }
  }

  private assertAcyclicParents(actionTree: PlanningActionNode[]): void {
    const actionsById = new Map(actionTree.map((action) => [action.actionId, action]));
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (actionId: string): void => {
      if (visited.has(actionId)) {
        return;
      }

      if (visiting.has(actionId)) {
        throw new ApplicationError(
          'INVALID_PLANNING_OUTPUT',
          `Action parent cycle detected at action: ${actionId}`,
        );
      }

      const action = actionsById.get(actionId);
      if (action?.parentActionId === undefined) {
        visited.add(actionId);
        return;
      }

      visiting.add(actionId);
      visit(action.parentActionId);
      visiting.delete(actionId);
      visited.add(actionId);
    };

    for (const action of actionTree) {
      visit(action.actionId);
    }
  }

  private async appendTraceEvent(
    run: OrchestrationRun,
    eventType: string,
    level: TraceEvent['level'],
    payloadInline: Record<string, unknown>,
  ): Promise<void> {
    const createdAt = toIso(this.clock.now());
    const event: TraceEvent = {
      traceEventId: this.ids.traceEventId(),
      workspaceId: run.workspaceId,
      orchestrationRunId: run.orchestrationRunId,
      eventType,
      level,
      payloadInline,
      createdAt,
      traceId: run.traceId,
    };
    await this.repository.appendTraceEvent(event);
  }

  private async appendTraceEventByOutput(
    output: PlanningOutput,
    eventType: string,
    level: TraceEvent['level'],
    payloadInline: Record<string, unknown>,
  ): Promise<void> {
    const run = await this.requireRun(output.orchestrationRunId);
    await this.appendTraceEvent(run, eventType, level, payloadInline);
  }
}
