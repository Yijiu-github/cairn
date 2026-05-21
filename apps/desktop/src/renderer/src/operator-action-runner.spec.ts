// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from 'vitest';

import { runOperatorAction } from './operator-action-runner.js';

describe('runOperatorAction', () => {
  it('ignores stale operator action errors after a newer action starts', async () => {
    const requestState = { current: 0 };
    let rejectFirst: ((error: Error) => void) | undefined;
    let resolveSecond: ((feedback: string) => void) | undefined;
    const setOperatorActionBusy = vi.fn();
    const setOperatorActionError = vi.fn();
    const setOperatorActionFeedback = vi.fn();

    const firstAction = runOperatorAction(
      requestState,
      {
        setOperatorActionBusy,
        setOperatorActionError,
        setOperatorActionFeedback,
        toErrorMessage,
      },
      'note',
      () =>
        new Promise<string>((_, reject) => {
          rejectFirst = reject;
        }),
    );

    const secondAction = runOperatorAction(
      requestState,
      {
        setOperatorActionBusy,
        setOperatorActionError,
        setOperatorActionFeedback,
        toErrorMessage,
      },
      'cancel',
      () =>
        new Promise<string>((resolve) => {
          resolveSecond = resolve;
        }),
    );

    rejectFirst?.(new Error('stale note failed'));
    await firstAction;

    expect(setOperatorActionError).toHaveBeenCalledTimes(2);
    expect(setOperatorActionError).toHaveBeenNthCalledWith(1, undefined);
    expect(setOperatorActionError).toHaveBeenNthCalledWith(2, undefined);
    expect(setOperatorActionError).not.toHaveBeenCalledWith('stale note failed');
    expect(setOperatorActionBusy.mock.calls).toEqual([['note'], ['cancel']]);

    resolveSecond?.('Cancel applied.');
    await secondAction;

    expect(setOperatorActionFeedback).toHaveBeenLastCalledWith('Cancel applied.');
    expect(setOperatorActionBusy.mock.calls).toEqual([['note'], ['cancel'], [undefined]]);
  });

  it('lets stale operations skip guarded follow-up effects', async () => {
    const requestState = { current: 0 };
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;
    const guardedEffects: string[] = [];
    const setOperatorActionFeedback = vi.fn();

    const firstAction = runOperatorAction(
      requestState,
      {
        setOperatorActionBusy: vi.fn(),
        setOperatorActionError: vi.fn(),
        setOperatorActionFeedback,
        toErrorMessage,
      },
      'rerun',
      async ({ isCurrent }) => {
        await new Promise<void>((resolve) => {
          resolveFirst = resolve;
        });
        if (isCurrent()) {
          guardedEffects.push('first-rerun-observed');
        }
        return 'Created first rerun.';
      },
    );

    const secondAction = runOperatorAction(
      requestState,
      {
        setOperatorActionBusy: vi.fn(),
        setOperatorActionError: vi.fn(),
        setOperatorActionFeedback,
        toErrorMessage,
      },
      'note',
      async ({ isCurrent }) => {
        await new Promise<void>((resolve) => {
          resolveSecond = resolve;
        });
        if (isCurrent()) {
          guardedEffects.push('second-note-refreshed');
        }
        return 'Operator note recorded.';
      },
    );

    resolveSecond?.();
    await secondAction;
    resolveFirst?.();
    await firstAction;

    expect(guardedEffects).toEqual(['second-note-refreshed']);
    expect(setOperatorActionFeedback).not.toHaveBeenCalledWith('Created first rerun.');
    expect(setOperatorActionFeedback).toHaveBeenLastCalledWith('Operator note recorded.');
  });
});

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown desktop bridge error.';
}
