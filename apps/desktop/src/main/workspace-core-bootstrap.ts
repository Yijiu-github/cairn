// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import type { WorkspaceCoreSidecarStatus } from './workspace-core-sidecar.js';

export interface DesktopMainBootstrap {
  readonly sidecarStartup: Promise<WorkspaceCoreSidecarStatus>;
}

export interface BootstrapDesktopMainOptions {
  readonly createMainWindow: () => void;
  readonly registerWorkspaceCoreIpcHandlers: () => void;
  readonly reportWorkspaceCoreStartupFailure: (status: WorkspaceCoreSidecarStatus) => void;
  readonly startWorkspaceCoreSidecar: () => Promise<WorkspaceCoreSidecarStatus>;
  readonly writeWorkspaceCoreDiagnostic: (status: WorkspaceCoreSidecarStatus) => Promise<void>;
}

export interface WriteWorkspaceCoreDiagnosticFileOptions {
  readonly now?: Date | undefined;
  readonly status: WorkspaceCoreSidecarStatus;
  readonly userDataPath: string;
}

export interface WriteDesktopSmokeSignalFileOptions {
  readonly event:
    | 'main-process-after-app-ready'
    | 'main-process-after-bootstrap'
    | 'main-process-after-port-allocation'
    | 'main-process-loaded'
    | 'main-window-created'
    | 'main-window-ready-to-show';
  readonly now?: Date | undefined;
  readonly path: string;
}

export const bootstrapDesktopMain = (
  options: BootstrapDesktopMainOptions,
): DesktopMainBootstrap => {
  options.registerWorkspaceCoreIpcHandlers();
  options.createMainWindow();

  const sidecarStartup = startWorkspaceCoreSidecar(options);

  return { sidecarStartup };
};

export const writeWorkspaceCoreDiagnosticFile = async (
  options: WriteWorkspaceCoreDiagnosticFileOptions,
): Promise<void> => {
  const diagnosticsDir = join(options.userDataPath, 'diagnostics');
  await mkdir(diagnosticsDir, { recursive: true });

  await writeFile(
    join(diagnosticsDir, 'workspace-core-sidecar.json'),
    `${JSON.stringify(
      {
        baseUrl: options.status.baseUrl,
        lastError: options.status.lastError,
        pid: options.status.pid,
        recordedAt: (options.now ?? new Date()).toISOString(),
        runtime: options.status.runtime,
        service: options.status.service,
        state: options.status.state,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
};

export const writeDesktopSmokeSignalFile = async (
  options: WriteDesktopSmokeSignalFileOptions,
): Promise<void> => {
  const targetDir = dirname(options.path);
  const tempPath = join(targetDir, `.${basename(options.path)}.${randomUUID()}.tmp`);
  await mkdir(targetDir, { recursive: true });

  await writeFile(
    tempPath,
    `${JSON.stringify(
      {
        event: options.event,
        recordedAt: (options.now ?? new Date()).toISOString(),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  await rename(tempPath, options.path);
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'unknown error';

const startWorkspaceCoreSidecar = async (
  options: BootstrapDesktopMainOptions,
): Promise<WorkspaceCoreSidecarStatus> => {
  let status: WorkspaceCoreSidecarStatus;

  try {
    status = await options.startWorkspaceCoreSidecar();
  } catch (error) {
    status = {
      baseUrl: '',
      lastError: `Workspace Core sidecar startup failed: ${toErrorMessage(error)}`,
      state: 'unhealthy',
    };
  }

  try {
    await options.writeWorkspaceCoreDiagnostic(status);
  } catch (error) {
    options.reportWorkspaceCoreStartupFailure({
      baseUrl: status.baseUrl,
      lastError: `Workspace Core diagnostic write failed: ${toErrorMessage(error)}`,
      pid: status.pid,
      runtime: status.runtime,
      state: 'unhealthy',
    });
  }

  if (status.state !== 'healthy') {
    options.reportWorkspaceCoreStartupFailure(status);
  }

  return status;
};
