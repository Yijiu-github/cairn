// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import {
  PlanningOutput,
  PlanningOutputStatus,
  PLANNING_OUTPUT_TERMINAL_STATUSES,
  PlanningReplanReason,
} from './planning-output.js';

const ids = {
  planningOutput: '01HZZZZZZZZZZZZZZZZZZZZZY0',
  workspace: VALID_ULIDS.workspace,
  orchestrationRun: VALID_ULIDS.orchestrationRun,
  contextPack: '01HZZZZZZZZZZZZZZZZZZZZZP0',
  task: VALID_ULIDS.task,
};

const basePlanningOutput = {
  planningOutputId: ids.planningOutput,
  workspaceId: ids.workspace,
  orchestrationRunId: ids.orchestrationRun,
  status: 'pending' as const,
  createdAt: '2026-05-16T01:00:00.000Z',
  updatedAt: '2026-05-16T01:00:00.000Z',
};

describe('PlanningOutputStatus enum', () => {
  it('contains the documented planning output statuses', () => {
    const expected = [
      'pending',
      'ready',
      'blocked',
      'failed',
    ] satisfies (typeof PlanningOutputStatus._type)[];
    for (const status of expected) {
      expect(PlanningOutputStatus.safeParse(status).success).toBe(true);
    }
    expect(PlanningOutputStatus.options).toHaveLength(expected.length);
  });
});

describe('PLANNING_OUTPUT_TERMINAL_STATUSES', () => {
  it('contains exactly ready, blocked, and failed', () => {
    expect(PLANNING_OUTPUT_TERMINAL_STATUSES).toEqual(['ready', 'blocked', 'failed']);
  });
});

describe('PlanningOutput', () => {
  it('parses a pending PlanningOutput with default collections', () => {
    expect(PlanningOutput.parse(basePlanningOutput)).toEqual({
      ...basePlanningOutput,
      actionTree: [],
      preconditions: [],
      contextPackRefs: [],
    });
  });

  it('parses ready action, preconditions, and contextPackRefs', () => {
    expect(
      PlanningOutput.parse({
        ...basePlanningOutput,
        status: 'ready',
        actionTree: [
          {
            actionId: 'inspect-schema',
            title: 'Inspect shared schema patterns',
            intent: 'Find existing contract style before creating planning output.',
            status: 'ready',
          },
          {
            actionId: 'add-tests',
            parentActionId: 'inspect-schema',
            taskId: ids.task,
            title: 'Add planning output tests',
            intent: 'Capture the minimum planning output validation behavior.',
            status: 'planned',
            dependsOnActionIds: ['inspect-schema'],
          },
        ],
        preconditions: [
          {
            actionId: 'add-tests',
            description: 'Shared schema package is available.',
            status: 'satisfied',
            evidenceRefs: ['docs/STATUS.md'],
          },
          {
            description: 'No product boundary escalation is needed.',
            status: 'unknown',
          },
        ],
        contextPackRefs: [ids.contextPack],
      }),
    ).toMatchObject({
      status: 'ready',
      actionTree: [
        {
          actionId: 'inspect-schema',
          dependsOnActionIds: [],
        },
        {
          actionId: 'add-tests',
          parentActionId: 'inspect-schema',
          dependsOnActionIds: ['inspect-schema'],
        },
      ],
      preconditions: [
        {
          evidenceRefs: ['docs/STATUS.md'],
        },
        {
          evidenceRefs: [],
        },
      ],
      contextPackRefs: [ids.contextPack],
    });
  });

  it('requires blockedReason when status is blocked', () => {
    expect(PlanningOutput.safeParse({ ...basePlanningOutput, status: 'blocked' }).success).toBe(
      false,
    );

    expect(
      PlanningOutput.safeParse({
        ...basePlanningOutput,
        status: 'blocked',
        blockedReason: {
          scope: 'task',
          taskId: ids.task,
          code: 'missing_context',
          message: 'Required repository context is not available.',
          operatorActionHint: 'Attach a ContextPack and replan.',
        },
      }).success,
    ).toBe(true);
  });
});

describe('PlanningReplanReason', () => {
  it('allows documented replan triggers', () => {
    const triggers = [
      'operator_request',
      'failed_precondition',
      'stale_context',
      'runtime_failure',
    ] as const;

    for (const trigger of triggers) {
      expect(
        PlanningReplanReason.safeParse({
          previousRunId: ids.orchestrationRun,
          trigger,
          message: 'Replan is required for the next run.',
        }).success,
      ).toBe(true);
    }
  });

  it('rejects undocumented replan triggers', () => {
    expect(
      PlanningReplanReason.safeParse({
        trigger: 'retry',
        message: 'Retry is not a replan trigger.',
      }).success,
    ).toBe(false);
  });
});
