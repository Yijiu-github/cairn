// SPDX-License-Identifier: Apache-2.0
import { contextBridge, ipcRenderer } from 'electron';

import type { DesktopWorkspaceCoreStatus } from '../main/index.js';
import type { WorkspaceCoreInternalTrialResult } from '../main/workspace-core-client.js';
import type { ArtifactPayloadResponse, RunReplaySource } from '@cairn/shared-contracts';
import type { OrchestrationRun } from '@cairn/shared-contracts/schemas';

export interface WorkspaceCoreRetryTaskResult {
  readonly newAttempt: number;
  readonly taskId: string;
}

export interface WorkspaceCoreOperatorNoteResult {
  readonly messageId: string;
  readonly traceEventId: string;
}

export interface CairnDesktopBridge {
  readonly app: {
    readonly mode: 'workspace-core-preview';
    readonly name: 'Cairn Desktop';
  };
  readonly workspaceCore: {
    readonly addOperatorNote: (
      runId: string,
      note: string,
      visibility?: 'operator_only' | 'public',
    ) => Promise<WorkspaceCoreOperatorNoteResult>;
    readonly cancelRun: (runId: string, reason?: string) => Promise<OrchestrationRun>;
    readonly getArtifactPayload: (artifactId: string) => Promise<ArtifactPayloadResponse>;
    readonly getRunReplaySource: (runId: string) => Promise<RunReplaySource>;
    readonly getStatus: () => Promise<DesktopWorkspaceCoreStatus>;
    readonly rerun: (
      runId: string,
      options?: {
        readonly operatorNote?: string;
        readonly replan?: boolean;
      },
    ) => Promise<OrchestrationRun>;
    readonly retryTask: (taskId: string, reason?: string) => Promise<WorkspaceCoreRetryTaskResult>;
    readonly runInternalTrial: () => Promise<WorkspaceCoreInternalTrialResult>;
  };
}

const bridge: CairnDesktopBridge = {
  app: {
    mode: 'workspace-core-preview',
    name: 'Cairn Desktop',
  },
  workspaceCore: {
    addOperatorNote: (runId, note, visibility) =>
      ipcRenderer.invoke(
        'workspace-core:add-operator-note',
        runId,
        visibility === undefined ? { note } : { note, visibility },
      ) as Promise<WorkspaceCoreOperatorNoteResult>,
    cancelRun: (runId, reason) =>
      ipcRenderer.invoke('workspace-core:cancel-run', runId, reason) as Promise<OrchestrationRun>,
    getArtifactPayload: (artifactId) =>
      ipcRenderer.invoke(
        'workspace-core:get-artifact-payload',
        artifactId,
      ) as Promise<ArtifactPayloadResponse>,
    getRunReplaySource: (runId) =>
      ipcRenderer.invoke('workspace-core:get-run-replay-source', runId) as Promise<RunReplaySource>,
    getStatus: () =>
      ipcRenderer.invoke('workspace-core:get-status') as Promise<DesktopWorkspaceCoreStatus>,
    rerun: (runId, options) =>
      ipcRenderer.invoke('workspace-core:rerun', runId, options) as Promise<OrchestrationRun>,
    retryTask: (taskId, reason) =>
      ipcRenderer.invoke(
        'workspace-core:retry-task',
        taskId,
        reason,
      ) as Promise<WorkspaceCoreRetryTaskResult>,
    runInternalTrial: () =>
      ipcRenderer.invoke(
        'workspace-core:run-internal-trial',
      ) as Promise<WorkspaceCoreInternalTrialResult>,
  },
};

contextBridge.exposeInMainWorld('cairnDesktop', bridge);
