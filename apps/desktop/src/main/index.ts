// SPDX-License-Identifier: Apache-2.0
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { is } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { z } from 'zod';

import { OrchestrationRun, TaskId } from '@cairn/shared-contracts/schemas';

import {
  bootstrapDesktopMain,
  writeDesktopSmokeSignalFile,
  writeWorkspaceCoreDiagnosticFile,
} from './workspace-core-bootstrap.js';
import {
  getWorkspaceCoreArtifactPayload,
  getWorkspaceCoreRunReplaySource,
  parseWorkspaceCoreArtifactId,
  parseWorkspaceCoreRunId,
  runWorkspaceCoreInternalTrial,
} from './workspace-core-client.js';
import {
  WorkspaceCoreSidecarManager,
  createWorkspaceCoreSidecarConfig,
} from './workspace-core-sidecar.js';

import type { WriteDesktopSmokeSignalFileOptions } from './workspace-core-bootstrap.js';
import type { WorkspaceCoreSidecarStatus } from './workspace-core-sidecar.js';

type DesktopSmokeSignalEvent = WriteDesktopSmokeSignalFileOptions['event'];

export interface DesktopWorkspaceCoreStatus {
  readonly state: WorkspaceCoreSidecarStatus['state'];
  readonly connectionLabel: 'local sidecar';
  readonly runtime?: WorkspaceCoreSidecarStatus['runtime'];
  readonly pid?: number | undefined;
  readonly service?: WorkspaceCoreSidecarStatus['service'];
  readonly lastError?: string | undefined;
}

const OPERATOR_REASON_MAX_LENGTH = 1000;
const OPERATOR_NOTE_MAX_LENGTH = 4000;
const WORKSPACE_CORE_ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/u;

const workspaceCoreRetryTaskResponseSchema = z.object({
  newAttempt: z.number().int().nonnegative(),
  taskId: TaskId,
});

const workspaceCoreOperatorNoteResponseSchema = z.object({
  messageId: z.string().min(1),
  traceEventId: z.string().min(1),
});

// Electron main process is the platform boundary. The repository-wide config
// package does not exist yet, so the desktop entry point keeps these two direct
// process reads local to window bootstrap only.
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const rendererDevServerUrl = process.env['ELECTRON_RENDERER_URL'];
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const mainProcessEnv = process.env;
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const desktopWindowSmokeSignalPath = process.env['CAIRN_DESKTOP_WINDOW_SMOKE_SIGNAL_PATH'];
// eslint-disable-next-line no-restricted-globals, no-restricted-syntax
const desktopWindowSmokeExitAfterEvent = process.env['CAIRN_DESKTOP_WINDOW_SMOKE_EXIT_AFTER_EVENT'];

writeDesktopSmokeSignal('main-process-loaded');

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    backgroundColor: '#eef3f8',
    height: 900,
    minHeight: 720,
    minWidth: 1040,
    show: false,
    title: 'Cairn',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
    },
    width: 1280,
  });

  writeDesktopSmokeSignal('main-window-created');

  window.on('ready-to-show', () => {
    writeDesktopSmokeSignal('main-window-ready-to-show');
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (is.dev && rendererDevServerUrl !== undefined) {
    void window.loadURL(rendererDevServerUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function writeDesktopSmokeSignal(event: DesktopSmokeSignalEvent): void {
  if (desktopWindowSmokeSignalPath === undefined) {
    return;
  }

  void writeDesktopSmokeSignalFile({
    event,
    path: desktopWindowSmokeSignalPath,
  })
    .then(() => {
      if (event === desktopWindowSmokeExitAfterEvent) {
        app.quit();
      }
    })
    .catch((error: unknown) => {
      console.error('Desktop smoke signal write failed.', {
        error: error instanceof Error ? error.message : 'unknown error',
        path: desktopWindowSmokeSignalPath,
      });
    });
}

async function getHealthyWorkspaceCoreStatus(
  workspaceCoreSidecar: WorkspaceCoreSidecarManager,
): Promise<WorkspaceCoreSidecarStatus> {
  const status =
    workspaceCoreSidecar.getStatus().state === 'healthy'
      ? workspaceCoreSidecar.getStatus()
      : await workspaceCoreSidecar.start();

  if (status.state !== 'healthy') {
    throw new Error(formatWorkspaceCoreSidecarHealthError(status.lastError));
  }

  return status;
}

function formatWorkspaceCoreSidecarHealthError(lastError: string | undefined): string {
  if (lastError === undefined || lastError.trim().length === 0) {
    return 'Workspace Core sidecar is not healthy.';
  }

  return redactWorkspaceCoreBridgeMessage(lastError);
}

function sanitizeWorkspaceCoreSidecarStatus(
  status: WorkspaceCoreSidecarStatus,
): DesktopWorkspaceCoreStatus {
  return {
    connectionLabel: 'local sidecar',
    ...(status.lastError === undefined
      ? {}
      : { lastError: redactWorkspaceCoreBridgeMessage(status.lastError) }),
    ...(status.pid === undefined ? {} : { pid: status.pid }),
    ...(status.runtime === undefined ? {} : { runtime: status.runtime }),
    ...(status.service === undefined ? {} : { service: status.service }),
    state: status.state,
  };
}

function registerWorkspaceCoreIpcHandlers(
  workspaceCoreSidecar: WorkspaceCoreSidecarManager,
  workspaceCoreAuthToken: string,
): void {
  ipcMain.handle('workspace-core:get-status', async () => {
    return sanitizeWorkspaceCoreSidecarStatus(await workspaceCoreSidecar.checkHealth());
  });

  ipcMain.handle('workspace-core:run-internal-trial', async () => {
    const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

    return runWorkspaceCoreInternalTrial({
      authToken: workspaceCoreAuthToken,
      baseUrl: status.baseUrl,
    });
  });

  ipcMain.handle('workspace-core:get-run-replay-source', async (_event, runId: unknown) => {
    if (typeof runId !== 'string') {
      throw new Error('Invalid Workspace Core run id.');
    }

    const normalizedRunId = parseWorkspaceCoreRunId(runId);
    const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

    return getWorkspaceCoreRunReplaySource({
      authToken: workspaceCoreAuthToken,
      baseUrl: status.baseUrl,
      runId: normalizedRunId,
    });
  });

  ipcMain.handle('workspace-core:get-artifact-payload', async (_event, artifactId: unknown) => {
    if (typeof artifactId !== 'string') {
      throw new Error('Invalid Workspace Core artifact id.');
    }

    const normalizedArtifactId = parseWorkspaceCoreArtifactId(artifactId);
    const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

    return getWorkspaceCoreArtifactPayload({
      artifactId: normalizedArtifactId,
      authToken: workspaceCoreAuthToken,
      baseUrl: status.baseUrl,
    });
  });

  ipcMain.handle('workspace-core:cancel-run', async (_event, runId: unknown, reason?: unknown) => {
    if (typeof runId !== 'string') {
      throw new Error('Invalid Workspace Core run id.');
    }

    if (reason !== undefined && typeof reason !== 'string') {
      throw new Error('Invalid cancel reason.');
    }
    if (typeof reason === 'string' && reason.length > OPERATOR_REASON_MAX_LENGTH) {
      throw new Error('Cancel reason must be 1000 characters or fewer.');
    }

    const normalizedRunId = parseWorkspaceCoreRunId(runId);
    const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

    return requestWorkspaceCoreJson({
      authToken: workspaceCoreAuthToken,
      baseUrl: status.baseUrl,
      body: reason === undefined ? {} : { reason },
      method: 'POST',
      path: `/v1/runs/${normalizedRunId}/cancel`,
      responseSchema: OrchestrationRun,
    });
  });

  ipcMain.handle('workspace-core:retry-task', async (_event, taskId: unknown, reason?: unknown) => {
    if (typeof taskId !== 'string') {
      throw new Error('Invalid Workspace Core task id.');
    }

    if (reason !== undefined && typeof reason !== 'string') {
      throw new Error('Invalid retry reason.');
    }
    if (typeof reason === 'string' && reason.length > OPERATOR_REASON_MAX_LENGTH) {
      throw new Error('Retry reason must be 1000 characters or fewer.');
    }

    const parsedTaskId = TaskId.safeParse(taskId);
    if (!parsedTaskId.success) {
      throw new Error('Invalid Workspace Core task id.');
    }

    const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

    return requestWorkspaceCoreJson({
      authToken: workspaceCoreAuthToken,
      baseUrl: status.baseUrl,
      body: reason === undefined ? {} : { reason },
      method: 'POST',
      path: `/v1/tasks/${parsedTaskId.data}/retry`,
      responseSchema: workspaceCoreRetryTaskResponseSchema,
    });
  });

  ipcMain.handle('workspace-core:rerun', async (_event, runId: unknown, options: unknown = {}) => {
    if (typeof runId !== 'string') {
      throw new Error('Invalid Workspace Core run id.');
    }

    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
      throw new Error('Invalid rerun options.');
    }

    const normalizedRunId = parseWorkspaceCoreRunId(runId);
    const { operatorNote, replan } = options as Record<string, unknown>;
    if (operatorNote !== undefined && typeof operatorNote !== 'string') {
      throw new Error('Invalid rerun operator note.');
    }
    if (typeof operatorNote === 'string' && operatorNote.trim().length === 0) {
      throw new Error('Rerun operator note must be a non-empty string.');
    }
    if (typeof operatorNote === 'string' && operatorNote.length > OPERATOR_NOTE_MAX_LENGTH) {
      throw new Error('Rerun operator note must be 4000 characters or fewer.');
    }
    if (replan !== undefined && typeof replan !== 'boolean') {
      throw new Error('Invalid rerun replan flag.');
    }

    const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

    return requestWorkspaceCoreJson({
      authToken: workspaceCoreAuthToken,
      baseUrl: status.baseUrl,
      body: {
        ...(operatorNote === undefined ? {} : { operatorNote }),
        ...(replan === undefined ? {} : { replan }),
      },
      method: 'POST',
      path: `/v1/runs/${normalizedRunId}/rerun`,
      responseSchema: OrchestrationRun,
    });
  });

  ipcMain.handle(
    'workspace-core:add-operator-note',
    async (_event, runId: unknown, options: unknown) => {
      if (typeof runId !== 'string') {
        throw new Error('Invalid Workspace Core run id.');
      }

      if (typeof options !== 'object' || options === null || Array.isArray(options)) {
        throw new Error('Invalid operator note payload.');
      }

      const normalizedRunId = parseWorkspaceCoreRunId(runId);
      const { note, visibility } = options as Record<string, unknown>;
      if (typeof note !== 'string' || note.trim().length === 0) {
        throw new Error('Operator note must be a non-empty string.');
      }
      if (note.length > OPERATOR_NOTE_MAX_LENGTH) {
        throw new Error('Operator note must be 4000 characters or fewer.');
      }
      if (visibility !== undefined && visibility !== 'operator_only' && visibility !== 'public') {
        throw new Error('Invalid operator note visibility.');
      }

      const status = await getHealthyWorkspaceCoreStatus(workspaceCoreSidecar);

      return requestWorkspaceCoreJson({
        authToken: workspaceCoreAuthToken,
        baseUrl: status.baseUrl,
        body: {
          note,
          visibility: visibility ?? 'operator_only',
        },
        method: 'POST',
        path: `/v1/runs/${normalizedRunId}/notes`,
        responseSchema: workspaceCoreOperatorNoteResponseSchema,
      });
    },
  );
}

async function requestWorkspaceCoreJson<T>(input: {
  readonly authToken: string;
  readonly baseUrl: string;
  readonly body?: unknown;
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly responseSchema?: z.ZodType<T>;
}): Promise<T> {
  const init: RequestInit = {
    headers: {
      authorization: `Bearer ${input.authToken}`,
      ...(input.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    method: input.method,
  };

  if (input.body !== undefined) {
    init.body = JSON.stringify(input.body);
  }

  let response: Response;
  try {
    response = await fetch(`${input.baseUrl}${input.path}`, init);
  } catch (error) {
    throw new Error(formatWorkspaceCoreTransportError(error));
  }

  const payload = (await response.json().catch(() => undefined)) as unknown;

  if (!response.ok) {
    const errorPayload = parseWorkspaceCoreErrorPayload(payload);
    const message = errorPayload?.message;
    const code = normalizeWorkspaceCoreErrorCode(errorPayload?.code);
    const redactedMessage =
      message === undefined ? undefined : redactWorkspaceCoreBridgeMessage(message);
    throw new Error(formatWorkspaceCoreActionError(response.status, code, redactedMessage));
  }

  if (input.responseSchema === undefined) {
    return payload as T;
  }

  const parsedPayload = input.responseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new Error(
      `Workspace Core returned an invalid response payload for ${input.method} ${input.path}.`,
    );
  }

  return parsedPayload.data;
}

function parseWorkspaceCoreErrorPayload(
  payload: unknown,
): { readonly code?: string; readonly message?: string } | undefined {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return undefined;
  }

  const error = payload.error;
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const message =
    'message' in error && typeof error.message === 'string' ? error.message : undefined;

  return {
    ...(code === undefined ? {} : { code }),
    ...(message === undefined ? {} : { message }),
  };
}

function formatWorkspaceCoreActionError(
  status: number,
  code: string | undefined,
  message: string | undefined,
): string {
  if (code === undefined) {
    return message ?? `Workspace Core request failed with ${status.toString()}.`;
  }

  return `${code}: ${message ?? 'Workspace Core action failed.'}`;
}

function formatWorkspaceCoreTransportError(error: unknown): string {
  const message =
    error instanceof Error && error.message.trim().length > 0
      ? redactWorkspaceCoreBridgeMessage(error.message)
      : 'unknown transport error';

  return `Workspace Core request failed before receiving a response: ${message}`;
}

function normalizeWorkspaceCoreErrorCode(code: string | undefined): string | undefined {
  const trimmedCode = code?.trim();
  if (trimmedCode === undefined || trimmedCode.length === 0) {
    return undefined;
  }

  return WORKSPACE_CORE_ERROR_CODE_PATTERN.test(trimmedCode) ? trimmedCode : 'WORKSPACE_CORE_ERROR';
}

function redactWorkspaceCoreBridgeMessage(message: string): string {
  const redactedUrls = message.replace(/\bhttps?:\/\/[^\s"'<>]+/giu, '<redacted>');
  const redactedPaths = redactedUrls
    .replace(/(?:[A-Za-z]:)?\/(?:[^/\s]+\/)*[^/\s]+/gu, '<redacted>')
    .replace(/\\(?:[^\\\s]+\\)*[^\\\s]+/gu, '<redacted>');
  const redactedSecrets = redactedPaths
    .replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]+\b/giu, '$1 <redacted>')
    .replace(
      /\b([A-Z0-9_]*TOKEN[A-Z0-9_]*|[A-Z0-9_]{3,})=([^\s]+)/giu,
      (_match: string, key: string) => `${key}=<redacted>`,
    );

  return trimWorkspaceCoreBridgeMessage(redactedSecrets);
}

function trimWorkspaceCoreBridgeMessage(message: string): string {
  const normalized = message.trim();
  if (normalized.length <= 2000) {
    return normalized;
  }

  return normalized.slice(-2000);
}

function reportWorkspaceCoreStartupFailure(status: WorkspaceCoreSidecarStatus): void {
  console.error('Workspace Core sidecar failed to become healthy.', {
    baseUrl: status.baseUrl,
    lastError: status.lastError,
    pid: status.pid,
    state: status.state,
  });
}

app.setAppUserModelId('io.cairn.app');

let workspaceCoreSidecar: WorkspaceCoreSidecarManager | undefined;

// Electron's app readiness can stall when the main ESM module is held open by
// top-level await. Keep startup detached so module evaluation can finish first.
// eslint-disable-next-line unicorn/prefer-top-level-await
void startDesktopMain();

async function startDesktopMain(): Promise<void> {
  try {
    await app.whenReady();
    writeDesktopSmokeSignal('main-process-after-app-ready');

    const workspaceCoreAuthToken = randomBytes(32).toString('hex');
    const workspaceCorePort = await findFreeLoopbackPort();
    writeDesktopSmokeSignal('main-process-after-port-allocation');

    const sidecar = new WorkspaceCoreSidecarManager(
      createWorkspaceCoreSidecarConfig({
        authToken: workspaceCoreAuthToken,
        baseEnv: mainProcessEnv,
        nodeExecutable: resolveNodeExecutable(),
        port: workspaceCorePort,
        repoRoot: join(__dirname, '../../../..'),
        userDataPath: app.getPath('userData'),
      }),
    );
    workspaceCoreSidecar = sidecar;

    bootstrapDesktopMain({
      createMainWindow,
      registerWorkspaceCoreIpcHandlers: () => {
        registerWorkspaceCoreIpcHandlers(sidecar, workspaceCoreAuthToken);
      },
      reportWorkspaceCoreStartupFailure,
      startWorkspaceCoreSidecar: () => sidecar.start(),
      writeWorkspaceCoreDiagnostic: (status) =>
        writeWorkspaceCoreDiagnosticFile({
          status,
          userDataPath: app.getPath('userData'),
        }),
    });
    writeDesktopSmokeSignal('main-process-after-bootstrap');
  } catch (error) {
    console.error('Desktop main startup failed.', {
      error: error instanceof Error ? error.message : 'unknown error',
    });
  }
}

app.on('before-quit', () => {
  void workspaceCoreSidecar?.stop();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  // eslint-disable-next-line no-restricted-globals
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function findFreeLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once('error', (error) => {
      reject(error);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        const port = address.port;
        server.close();
        resolve(port);
        return;
      }

      server.close();
      reject(new Error('Failed to allocate a Workspace Core sidecar port.'));
    });
  });
}

function resolveNodeExecutable(): string | undefined {
  const candidates = [
    mainProcessEnv['CAIRN_DESKTOP_NODE_EXECUTABLE'],
    '/opt/homebrew/bin/node',
    '/usr/local/bin/node',
  ];

  return candidates.find((candidate) => candidate !== undefined && existsSync(candidate));
}
