// SPDX-License-Identifier: Apache-2.0
import type { RunReplaySource } from '@cairn/shared-contracts';

export interface RunReplayLoadState {
  current: number;
}

export interface RunReplayLoadDependencies<TWorkspaceCoreStatus> {
  readonly getRunReplaySource: (runId: string) => Promise<RunReplaySource>;
  readonly getStatus: () => Promise<TWorkspaceCoreStatus>;
  readonly setRunReplayLoading: (value: boolean) => void;
  readonly setRunReplayError: (value: string | undefined) => void;
  readonly setRunReplaySource: (value: RunReplaySource | undefined) => void;
  readonly setWorkspaceCoreStatus: (value: TWorkspaceCoreStatus) => void;
  readonly toErrorMessage: (error: unknown) => string;
}

export async function loadRunReplaySource<TWorkspaceCoreStatus>(
  requestState: RunReplayLoadState,
  dependencies: RunReplayLoadDependencies<TWorkspaceCoreStatus>,
  runId: string,
  options: { replaceCurrentSource?: boolean } = {},
): Promise<void> {
  const normalizedRunId = runId.trim();

  if (normalizedRunId.length === 0) {
    if (options.replaceCurrentSource === true) {
      dependencies.setRunReplaySource(undefined);
    }
    dependencies.setRunReplayError('Enter a Workspace Core run id to observe.');
    return;
  }

  const requestId = ++requestState.current;
  dependencies.setRunReplayLoading(true);
  dependencies.setRunReplayError(undefined);

  if (options.replaceCurrentSource === true) {
    dependencies.setRunReplaySource(undefined);
  }

  try {
    const replaySource = await dependencies.getRunReplaySource(normalizedRunId);
    if (requestState.current !== requestId) {
      return;
    }

    dependencies.setRunReplaySource(replaySource);
    const workspaceCoreStatus = await dependencies.getStatus();
    if (requestState.current !== requestId) {
      return;
    }

    dependencies.setWorkspaceCoreStatus(workspaceCoreStatus);
  } catch (error) {
    if (requestState.current !== requestId) {
      return;
    }

    dependencies.setRunReplayError(dependencies.toErrorMessage(error));
  } finally {
    if (requestState.current === requestId) {
      dependencies.setRunReplayLoading(false);
    }
  }
}
