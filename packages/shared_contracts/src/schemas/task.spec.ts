// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { Task, TaskStatus, TaskKind, TASK_TERMINAL_STATUSES } from './task.js';

const baseTask = {
  taskId: VALID_ULIDS.task,
  workspaceId: VALID_ULIDS.workspace,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  taskKind: 'edit' as const,
  title: 'Apply the patch to module X',
  brief: 'Update foo() to handle null cases.',
  status: 'ready' as const,
  attempt: 0,
  idempotencyKey: 'task-01HZ-attempt-0',
  createdAt: '2026-05-14T01:00:00.000Z',
  updatedAt: '2026-05-14T01:00:00.000Z',
};

describe('Task schema', () => {
  it('parses a minimum valid task', () => {
    const parsed = Task.parse(baseTask);
    // Default values applied
    expect(parsed.priority).toBe(50);
    expect(parsed.dependsOnTaskIds).toEqual([]);
    expect(parsed.contextRefs).toEqual([]);
    expect(parsed.artifactRefs).toEqual([]);
  });

  it('requires idempotencyKey to be non-empty', () => {
    expect(Task.safeParse({ ...baseTask, idempotencyKey: '' }).success).toBe(false);
  });

  it('requires attempt to be non-negative integer', () => {
    expect(Task.safeParse({ ...baseTask, attempt: -1 }).success).toBe(false);
    expect(Task.safeParse({ ...baseTask, attempt: 1.5 }).success).toBe(false);
  });

  it('rejects priority outside [0, 100]', () => {
    expect(Task.safeParse({ ...baseTask, priority: -1 }).success).toBe(false);
    expect(Task.safeParse({ ...baseTask, priority: 101 }).success).toBe(false);
  });

  it('rejects title that is empty or too long', () => {
    expect(Task.safeParse({ ...baseTask, title: '' }).success).toBe(false);
    expect(Task.safeParse({ ...baseTask, title: 'x'.repeat(201) }).success).toBe(false);
  });

  it('accepts dependsOnTaskIds with valid ULIDs', () => {
    const parsed = Task.parse({
      ...baseTask,
      dependsOnTaskIds: [VALID_ULIDS.task],
    });
    expect(parsed.dependsOnTaskIds).toHaveLength(1);
  });

  it('rejects invalid TaskId in dependsOnTaskIds', () => {
    expect(
      Task.safeParse({
        ...baseTask,
        dependsOnTaskIds: ['not-a-ulid'],
      }).success,
    ).toBe(false);
  });
});

describe('TaskStatus + TaskKind enums', () => {
  it.each([
    'pending',
    'ready',
    'dispatched',
    'running',
    'succeeded',
    'failed',
    'skipped',
    'cancelled',
  ])('accepts status: %s', (s) => {
    expect(TaskStatus.safeParse(s).success).toBe(true);
  });

  it.each(['research', 'edit', 'review', 'synthesize', 'custom'])('accepts kind: %s', (k) => {
    expect(TaskKind.safeParse(k).success).toBe(true);
  });
});

describe('TASK_TERMINAL_STATUSES', () => {
  it('matches expected list', () => {
    expect(TASK_TERMINAL_STATUSES).toEqual(['succeeded', 'failed', 'skipped', 'cancelled']);
  });
});
