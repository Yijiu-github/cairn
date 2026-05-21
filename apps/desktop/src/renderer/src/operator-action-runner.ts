// SPDX-License-Identifier: Apache-2.0

export interface OperatorActionRunState {
  current: number;
}

export interface OperatorActionRunContext {
  readonly isCurrent: () => boolean;
}

export interface OperatorActionRunDependencies {
  readonly setOperatorActionBusy: (value: string | undefined) => void;
  readonly setOperatorActionError: (value: string | undefined) => void;
  readonly setOperatorActionFeedback: (value: string | undefined) => void;
  readonly toErrorMessage: (error: unknown) => string;
}

export async function runOperatorAction(
  requestState: OperatorActionRunState,
  dependencies: OperatorActionRunDependencies,
  actionLabel: string,
  operation: (context: OperatorActionRunContext) => Promise<string | undefined>,
): Promise<void> {
  const requestId = ++requestState.current;
  const isCurrent = () => requestState.current === requestId;

  dependencies.setOperatorActionBusy(actionLabel);
  dependencies.setOperatorActionError(undefined);
  dependencies.setOperatorActionFeedback(undefined);

  try {
    const feedback = await operation({ isCurrent });
    if (!isCurrent()) {
      return;
    }

    if (feedback !== undefined) {
      dependencies.setOperatorActionFeedback(feedback);
    }
  } catch (error) {
    if (!isCurrent()) {
      return;
    }

    dependencies.setOperatorActionError(dependencies.toErrorMessage(error));
  } finally {
    if (isCurrent()) {
      dependencies.setOperatorActionBusy(undefined);
    }
  }
}
