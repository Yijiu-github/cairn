// SPDX-License-Identifier: Apache-2.0
import { setTimeout as delay } from 'node:timers/promises';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunReplaySource as RunReplaySourceSchema } from '@cairn/shared-contracts';

import type { BootstrapDesktopMainOptions } from './workspace-core-bootstrap.js';
import type { WorkspaceCoreSidecarStatus } from './workspace-core-sidecar.js';
import type { RunReplaySource } from '@cairn/shared-contracts';

const desktopHarness = vi.hoisted(() => {
  let resolveWhenReady: (() => void) | undefined;
  const whenReady = new Promise<void>((resolve) => {
    resolveWhenReady = resolve;
  });
  const healthyWorkspaceCoreSidecarStatus: WorkspaceCoreSidecarStatus = {
    baseUrl: 'http://127.0.0.1:4321',
    pid: 12_345,
    runtime: 'mock',
    service: 'workspace-core',
    state: 'healthy',
  };

  return {
    app: {
      getPath: vi.fn((name: string) => `/tmp/${name}`),
      on: vi.fn(),
      quit: vi.fn(),
      setAppUserModelId: vi.fn(),
      whenReady: vi.fn(() => whenReady),
    },
    bootstrapDesktopMain: vi.fn((_: BootstrapDesktopMainOptions) => ({
      sidecarStartup: Promise.resolve({
        baseUrl: 'http://127.0.0.1:4321',
        runtime: 'mock' as const,
        state: 'healthy' as const,
      }),
    })),
    browserWindows: [] as {
      options?: {
        webPreferences?: {
          preload?: string;
        };
      };
      webContents: {
        setWindowOpenHandler: ReturnType<typeof vi.fn>;
      };
    }[],
    getWorkspaceCoreRunReplaySource:
      vi.fn<
        (options: { authToken: string; baseUrl: string; runId: string }) => Promise<RunReplaySource>
      >(),
    getWorkspaceCoreArtifactPayload: vi.fn<
      (options: { artifactId: string; authToken: string; baseUrl: string }) => Promise<{
        artifactId: string;
        mediaType: 'text/plain' | 'application/json';
        text: string;
        truncated: boolean;
      }>
    >(),
    ipcMain: {
      handle: vi.fn(),
    },
    openExternal: vi.fn(),
    releaseWhenReady: () => {
      resolveWhenReady?.();
    },
    sidecarInstances: [] as MockWorkspaceCoreSidecarManager[],
    workspaceCoreSidecarStatus: healthyWorkspaceCoreSidecarStatus,
  };
});

class MockWorkspaceCoreSidecarManager {
  public readonly checkHealth = vi.fn(() =>
    Promise.resolve(desktopHarness.workspaceCoreSidecarStatus),
  );
  public readonly getStatus = vi.fn(() => desktopHarness.workspaceCoreSidecarStatus);
  public readonly start = vi.fn(() => Promise.resolve(desktopHarness.workspaceCoreSidecarStatus));
  public readonly stop = vi.fn(() =>
    Promise.resolve({
      baseUrl: desktopHarness.workspaceCoreSidecarStatus.baseUrl,
      state: 'stopped' as const,
    }),
  );

  public constructor() {
    desktopHarness.sidecarInstances.push(this);
  }
}

vi.mock('electron', () => ({
  BrowserWindow: class {
    public static getAllWindows(): unknown[] {
      return [];
    }

    public readonly webContents = {
      setWindowOpenHandler: vi.fn(),
    };

    public constructor(options?: { webPreferences?: { preload?: string } }) {
      Object.assign(this, { options });
      desktopHarness.browserWindows.push(this);
      return;
    }

    public loadFile(): void {
      return;
    }

    public loadURL(): void {
      return;
    }

    public on(): void {
      return;
    }
  },
  app: desktopHarness.app,
  ipcMain: desktopHarness.ipcMain,
  shell: {
    openExternal: desktopHarness.openExternal,
  },
}));

vi.mock('@electron-toolkit/utils', () => ({
  is: {
    dev: true,
  },
}));

vi.mock('./workspace-core-bootstrap.js', () => ({
  bootstrapDesktopMain: desktopHarness.bootstrapDesktopMain,
  writeDesktopSmokeSignalFile: vi.fn(),
  writeWorkspaceCoreDiagnosticFile: vi.fn(),
}));

vi.mock('./workspace-core-client.js', () => ({
  getWorkspaceCoreArtifactPayload: desktopHarness.getWorkspaceCoreArtifactPayload,
  getWorkspaceCoreRunReplaySource: desktopHarness.getWorkspaceCoreRunReplaySource,
  parseWorkspaceCoreArtifactId: (artifactId: string) => {
    if (!artifactId.startsWith('01J')) {
      throw new Error('Invalid Workspace Core artifact id.');
    }

    return artifactId;
  },
  parseWorkspaceCoreRunId: (runId: string) => {
    if (!runId.startsWith('01J')) {
      throw new Error('Invalid Workspace Core run id.');
    }

    return runId;
  },
  runWorkspaceCoreInternalTrial: vi.fn(),
}));

vi.mock('./workspace-core-sidecar.js', () => ({
  WorkspaceCoreSidecarManager: MockWorkspaceCoreSidecarManager,
  createWorkspaceCoreSidecarConfig: vi.fn((options: unknown) => ({
    authToken:
      typeof options === 'object' && options !== null && 'authToken' in options
        ? (options.authToken as string)
        : 'desktop-launch-token',
    baseUrl: 'http://127.0.0.1:4321',
  })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
  desktopHarness.sidecarInstances.length = 0;
  desktopHarness.browserWindows.length = 0;
  desktopHarness.workspaceCoreSidecarStatus = {
    baseUrl: 'http://127.0.0.1:4321',
    pid: 12_345,
    runtime: 'mock',
    service: 'workspace-core',
    state: 'healthy',
  };
});

describe('desktop main startup', () => {
  it('finishes module evaluation before app readiness resolves', async () => {
    const mainModule = import('./index.js');

    await expect(
      Promise.race([mainModule.then(() => 'resolved'), delay(500).then(() => 'pending')]),
    ).resolves.toBe('resolved');

    expect(desktopHarness.app.setAppUserModelId).toHaveBeenCalledWith('io.cairn.app');
    expect(desktopHarness.bootstrapDesktopMain).not.toHaveBeenCalled();

    desktopHarness.releaseWhenReady();
    await waitFor(() => desktopHarness.bootstrapDesktopMain.mock.calls.length === 1);

    expect(desktopHarness.bootstrapDesktopMain).toHaveBeenCalledTimes(1);
    const bootstrapOptions = desktopHarness.bootstrapDesktopMain.mock.calls[0]?.[0];
    expect(bootstrapOptions).toBeDefined();
    bootstrapOptions?.registerWorkspaceCoreIpcHandlers();

    expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
      'workspace-core:get-status',
      expect.any(Function),
    );
    expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
      'workspace-core:run-internal-trial',
      expect.any(Function),
    );
    expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
      'workspace-core:get-run-replay-source',
      expect.any(Function),
    );
    expect(desktopHarness.ipcMain.handle).toHaveBeenCalledWith(
      'workspace-core:get-artifact-payload',
      expect.any(Function),
    );
  });

  it('passes desktop process env through sidecar config creation so runtime overrides are available', async () => {
    desktopHarness.releaseWhenReady();
    await import('./index.js');
    await waitFor(() => desktopHarness.bootstrapDesktopMain.mock.calls.length === 1);

    const workspaceCoreSidecarModule = await import('./workspace-core-sidecar.js');
    expect(workspaceCoreSidecarModule.createWorkspaceCoreSidecarConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: expect.any(String),
        baseEnv: expect.objectContaining({
          PATH: expect.any(String),
        }),
      }),
    );
  });

  it('requests run replay source through the main-process allowlist', async () => {
    desktopHarness.getWorkspaceCoreRunReplaySource.mockResolvedValueOnce(
      createRunReplaySourceFixture({
        agentRuns: [],
        artifacts: [],
        inspector: {
          agentRunCount: 0,
          artifactCount: 0,
          errorEventCount: 0,
          status: 'running',
          taskCount: 1,
          traceEventCount: 1,
          warningEventCount: 0,
        },
        tasks: [],
        traceEvents: [],
      }),
    );

    const handlers = await loadIpcHandlers();
    const replaySourceHandler = getIpcHandler(handlers, 'workspace-core:get-run-replay-source');
    const result = await replaySourceHandler(undefined, '01J000000000000000000000R0');

    expect(result).toMatchObject({
      run: {
        orchestrationRunId: '01J000000000000000000000R0',
      },
    });
    expect(desktopHarness.getWorkspaceCoreRunReplaySource).toHaveBeenCalledWith({
      authToken: expect.any(String),
      baseUrl: 'http://127.0.0.1:4321',
      runId: '01J000000000000000000000R0',
    });
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('rejects invalid run ids before touching the sidecar replay path', async () => {
    const handlers = await loadIpcHandlers();
    const replaySourceHandler = getIpcHandler(handlers, 'workspace-core:get-run-replay-source');

    await expect(replaySourceHandler(undefined, '../not-a-run')).rejects.toThrow(
      'Invalid Workspace Core run id.',
    );

    expect(desktopHarness.sidecarInstances[0]?.getStatus).not.toHaveBeenCalled();
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
    expect(desktopHarness.getWorkspaceCoreRunReplaySource).not.toHaveBeenCalled();
  });

  it('requests bounded artifact payload text through the main-process allowlist', async () => {
    desktopHarness.getWorkspaceCoreArtifactPayload.mockResolvedValueOnce({
      artifactId: '01J000000000000000000000F0',
      mediaType: 'text/plain',
      text: 'Cairn internal trial ok',
      truncated: false,
    });

    const handlers = await loadIpcHandlers();
    const payloadHandler = getIpcHandler(handlers, 'workspace-core:get-artifact-payload');
    const result = await payloadHandler(undefined, '01J000000000000000000000F0');

    expect(result).toEqual({
      artifactId: '01J000000000000000000000F0',
      mediaType: 'text/plain',
      text: 'Cairn internal trial ok',
      truncated: false,
    });
    expect(desktopHarness.getWorkspaceCoreArtifactPayload).toHaveBeenCalledWith({
      artifactId: '01J000000000000000000000F0',
      authToken: expect.any(String),
      baseUrl: 'http://127.0.0.1:4321',
    });
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('rejects invalid artifact ids before touching the sidecar payload path', async () => {
    const handlers = await loadIpcHandlers();
    const payloadHandler = getIpcHandler(handlers, 'workspace-core:get-artifact-payload');

    await expect(payloadHandler(undefined, '../not-an-artifact')).rejects.toThrow(
      'Invalid Workspace Core artifact id.',
    );

    expect(desktopHarness.sidecarInstances[0]?.getStatus).not.toHaveBeenCalled();
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
    expect(desktopHarness.getWorkspaceCoreArtifactPayload).not.toHaveBeenCalled();
  });

  it('rejects blank rerun operator notes before touching the sidecar action path', async () => {
    const handlers = await loadIpcHandlers();
    const rerunHandler = getIpcHandler(handlers, 'workspace-core:rerun');

    await expect(
      rerunHandler(undefined, '01J000000000000000000000R0', {
        operatorNote: '   ',
        replan: true,
      }),
    ).rejects.toThrow('Rerun operator note must be a non-empty string.');

    expect(desktopHarness.sidecarInstances[0]?.getStatus).not.toHaveBeenCalled();
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('rejects cancel reasons above the contract limit before touching the sidecar action path', async () => {
    const handlers = await loadIpcHandlers();
    const cancelRunHandler = getIpcHandler(handlers, 'workspace-core:cancel-run');

    await expect(
      cancelRunHandler(undefined, '01J000000000000000000000R0', 'x'.repeat(1001)),
    ).rejects.toThrow('Cancel reason must be 1000 characters or fewer.');

    expect(desktopHarness.sidecarInstances[0]?.getStatus).not.toHaveBeenCalled();
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('rejects retry reasons above the contract limit before touching the sidecar action path', async () => {
    const handlers = await loadIpcHandlers();
    const retryTaskHandler = getIpcHandler(handlers, 'workspace-core:retry-task');

    await expect(
      retryTaskHandler(undefined, '01J000000000000000000000K0', 'x'.repeat(1001)),
    ).rejects.toThrow('Retry reason must be 1000 characters or fewer.');

    expect(desktopHarness.sidecarInstances[0]?.getStatus).not.toHaveBeenCalled();
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('rejects rerun operator notes above the contract limit before touching the sidecar action path', async () => {
    const handlers = await loadIpcHandlers();
    const rerunHandler = getIpcHandler(handlers, 'workspace-core:rerun');

    await expect(
      rerunHandler(undefined, '01J000000000000000000000R0', {
        operatorNote: 'x'.repeat(4001),
      }),
    ).rejects.toThrow('Rerun operator note must be 4000 characters or fewer.');

    expect(desktopHarness.sidecarInstances[0]?.getStatus).not.toHaveBeenCalled();
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('rejects operator notes above the contract limit before touching the sidecar action path', async () => {
    const handlers = await loadIpcHandlers();
    const addOperatorNoteHandler = getIpcHandler(handlers, 'workspace-core:add-operator-note');

    await expect(
      addOperatorNoteHandler(undefined, '01J000000000000000000000R0', {
        note: 'x'.repeat(4001),
      }),
    ).rejects.toThrow('Operator note must be 4000 characters or fewer.');

    expect(desktopHarness.sidecarInstances[0]?.getStatus).not.toHaveBeenCalled();
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('redacts sensitive fragments from unhealthy sidecar errors before returning them across Desktop bridge', async () => {
    desktopHarness.workspaceCoreSidecarStatus = {
      baseUrl: 'http://127.0.0.1:4321',
      lastError:
        'Workspace Core failed near http://127.0.0.1:4321 with token=desktop-launch-token at /Users/alice/Code/cairn',
      runtime: 'mock',
      state: 'unhealthy',
    };

    const handlers = await loadIpcHandlers();
    const cancelRunHandler = getIpcHandler(handlers, 'workspace-core:cancel-run');

    let thrownError: unknown;
    try {
      await cancelRunHandler(undefined, '01J000000000000000000000R0', 'Operator stopped it.');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(Error);
    const message = thrownError instanceof Error ? thrownError.message : '';
    expect(message).toContain('Workspace Core failed');
    expect(message).toContain('<redacted>');
    expect(message).not.toContain('desktop-launch-token');
    expect(message).not.toContain('/Users/');
    expect(message).not.toContain('127.0.0.1:4321');
  });

  it('redacts sensitive fragments from status diagnostics before returning them across Desktop bridge', async () => {
    desktopHarness.workspaceCoreSidecarStatus = {
      baseUrl: 'http://127.0.0.1:4321',
      lastError:
        'Workspace Core status has token=desktop-launch-token at /Users/alice/Code/cairn and http://127.0.0.1:4321',
      runtime: 'mock',
      state: 'unhealthy',
    };

    const handlers = await loadIpcHandlers();
    const getStatusHandler = getIpcHandler(handlers, 'workspace-core:get-status');
    const result = (await getStatusHandler(undefined)) as WorkspaceCoreSidecarStatus;

    expect(result).toMatchObject({
      connectionLabel: 'local sidecar',
      runtime: 'mock',
      state: 'unhealthy',
    });
    expect('baseUrl' in result).toBe(false);
    expect(result.lastError).toContain('Workspace Core status');
    expect(result.lastError).toContain('<redacted>');
    expect(result.lastError).not.toContain('desktop-launch-token');
    expect(result.lastError).not.toContain('/Users/');
    expect(result.lastError).not.toContain('127.0.0.1:4321');
  });

  it('forwards valid cancel run payloads through the action allowlist', async () => {
    const requests: { body?: unknown; method: string; url: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((url, init) => {
        requests.push(toRecordedRequest(url, init));
        return Promise.resolve(
          jsonResponse(200, createOrchestrationRunFixture({ status: 'cancelled' })),
        );
      }),
    );

    const handlers = await loadIpcHandlers();
    const cancelRunHandler = getIpcHandler(handlers, 'workspace-core:cancel-run');
    const result = await cancelRunHandler(
      undefined,
      '01J000000000000000000000R0',
      'Operator stopped it.',
    );

    expect(result).toMatchObject({
      orchestrationRunId: '01J000000000000000000000R0',
      status: 'cancelled',
    });
    expect(requests).toEqual([
      {
        body: { reason: 'Operator stopped it.' },
        method: 'POST',
        url: 'http://127.0.0.1:4321/v1/runs/01J000000000000000000000R0/cancel',
      },
    ]);
    expect(desktopHarness.sidecarInstances[0]?.start).not.toHaveBeenCalled();
  });

  it('rejects malformed cancel run responses before returning them across Desktop bridge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse(200, {
            orchestrationRunId: '01J000000000000000000000R0',
            status: 'cancelled',
          }),
        ),
      ),
    );

    const handlers = await loadIpcHandlers();
    const cancelRunHandler = getIpcHandler(handlers, 'workspace-core:cancel-run');

    await expect(
      cancelRunHandler(undefined, '01J000000000000000000000R0', 'Operator stopped it.'),
    ).rejects.toThrow(
      'Workspace Core returned an invalid response payload for POST /v1/runs/01J000000000000000000000R0/cancel.',
    );
  });

  it('redacts sensitive fragments from Workspace Core action errors before returning them across Desktop bridge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse(400, {
            error: {
              code: 'BAD_REQUEST',
              message:
                'Bad token=desktop-launch-token at /Users/alice/Code/cairn and http://127.0.0.1:4321',
            },
          }),
        ),
      ),
    );

    const handlers = await loadIpcHandlers();
    const cancelRunHandler = getIpcHandler(handlers, 'workspace-core:cancel-run');

    let thrownError: unknown;
    try {
      await cancelRunHandler(undefined, '01J000000000000000000000R0', 'Operator stopped it.');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(Error);
    const message = thrownError instanceof Error ? thrownError.message : '';
    expect(message).toContain('BAD_REQUEST');
    expect(message).toContain('<redacted>');
    expect(message).not.toContain('desktop-launch-token');
    expect(message).not.toContain('/Users/');
    expect(message).not.toContain('127.0.0.1:4321');
  });

  it('does not expose non-JSON Workspace Core action error bodies across Desktop bridge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response(
            'Bad token=desktop-launch-token at /Users/alice/Code/cairn and http://127.0.0.1:4321',
            {
              headers: { 'content-type': 'text/plain' },
              status: 502,
            },
          ),
        ),
      ),
    );

    const handlers = await loadIpcHandlers();
    const cancelRunHandler = getIpcHandler(handlers, 'workspace-core:cancel-run');

    let thrownError: unknown;
    try {
      await cancelRunHandler(undefined, '01J000000000000000000000R0', 'Operator stopped it.');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(Error);
    const message = thrownError instanceof Error ? thrownError.message : '';
    expect(message).toBe('Workspace Core request failed with 502.');
    expect(message).not.toContain('desktop-launch-token');
    expect(message).not.toContain('/Users/');
    expect(message).not.toContain('127.0.0.1:4321');
  });

  it('redacts sensitive fragments from Workspace Core transport errors before returning them across Desktop bridge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.reject(
          new Error(
            'fetch failed for http://127.0.0.1:4321/v1/runs/01J000000000000000000000R0/cancel with token=desktop-launch-token at /Users/alice/Code/cairn',
          ),
        ),
      ),
    );

    const handlers = await loadIpcHandlers();
    const cancelRunHandler = getIpcHandler(handlers, 'workspace-core:cancel-run');

    let thrownError: unknown;
    try {
      await cancelRunHandler(undefined, '01J000000000000000000000R0', 'Operator stopped it.');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(Error);
    const message = thrownError instanceof Error ? thrownError.message : '';
    expect(message).toContain('Workspace Core request failed before receiving a response');
    expect(message).toContain('<redacted>');
    expect(message).not.toContain('desktop-launch-token');
    expect(message).not.toContain('/Users/');
    expect(message).not.toContain('127.0.0.1:4321');
  });

  it('forwards valid retry task payloads through the action allowlist', async () => {
    const requests: { body?: unknown; method: string; url: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((url, init) => {
        requests.push(toRecordedRequest(url, init));
        return Promise.resolve(
          jsonResponse(202, {
            newAttempt: 2,
            taskId: '01J000000000000000000000K0',
          }),
        );
      }),
    );

    const handlers = await loadIpcHandlers();
    const retryTaskHandler = getIpcHandler(handlers, 'workspace-core:retry-task');
    const result = await retryTaskHandler(
      undefined,
      '01J000000000000000000000K0',
      'Try again with the latest evidence.',
    );

    expect(result).toEqual({
      newAttempt: 2,
      taskId: '01J000000000000000000000K0',
    });
    expect(requests).toEqual([
      {
        body: { reason: 'Try again with the latest evidence.' },
        method: 'POST',
        url: 'http://127.0.0.1:4321/v1/tasks/01J000000000000000000000K0/retry',
      },
    ]);
  });

  it('rejects malformed retry task responses before returning them across Desktop bridge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse(202, {
            taskId: '01J000000000000000000000K0',
          }),
        ),
      ),
    );

    const handlers = await loadIpcHandlers();
    const retryTaskHandler = getIpcHandler(handlers, 'workspace-core:retry-task');

    await expect(
      retryTaskHandler(undefined, '01J000000000000000000000K0', 'Try again.'),
    ).rejects.toThrow(
      'Workspace Core returned an invalid response payload for POST /v1/tasks/01J000000000000000000000K0/retry.',
    );
  });

  it('forwards valid rerun payloads through the action allowlist', async () => {
    const requests: { body?: unknown; method: string; url: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((url, init) => {
        requests.push(toRecordedRequest(url, init));
        return Promise.resolve(
          jsonResponse(
            202,
            createOrchestrationRunFixture({
              orchestrationRunId: '01J000000000000000000000R1',
              status: 'queued',
            }),
          ),
        );
      }),
    );

    const handlers = await loadIpcHandlers();
    const rerunHandler = getIpcHandler(handlers, 'workspace-core:rerun');
    const result = await rerunHandler(undefined, '01J000000000000000000000R0', {
      operatorNote: 'Try with narrower context.',
      replan: true,
    });

    expect(result).toMatchObject({
      orchestrationRunId: '01J000000000000000000000R1',
      status: 'queued',
    });
    expect(requests).toEqual([
      {
        body: { operatorNote: 'Try with narrower context.', replan: true },
        method: 'POST',
        url: 'http://127.0.0.1:4321/v1/runs/01J000000000000000000000R0/rerun',
      },
    ]);
  });

  it('rejects malformed rerun responses before returning them across Desktop bridge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse(202, {
            orchestrationRunId: '01J000000000000000000000R1',
            status: 'queued',
          }),
        ),
      ),
    );

    const handlers = await loadIpcHandlers();
    const rerunHandler = getIpcHandler(handlers, 'workspace-core:rerun');

    await expect(
      rerunHandler(undefined, '01J000000000000000000000R0', {
        operatorNote: 'Try with narrower context.',
      }),
    ).rejects.toThrow(
      'Workspace Core returned an invalid response payload for POST /v1/runs/01J000000000000000000000R0/rerun.',
    );
  });

  it('forwards valid operator notes through the action allowlist', async () => {
    const requests: { body?: unknown; method: string; url: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((url, init) => {
        requests.push(toRecordedRequest(url, init));
        return Promise.resolve(
          jsonResponse(201, {
            messageId: 'operator-note-1',
            traceEventId: '01J000000000000000000000V0',
          }),
        );
      }),
    );

    const handlers = await loadIpcHandlers();
    const addOperatorNoteHandler = getIpcHandler(handlers, 'workspace-core:add-operator-note');
    const result = await addOperatorNoteHandler(undefined, '01J000000000000000000000R0', {
      note: 'Reviewer checked the bounded payload.',
    });

    expect(result).toEqual({
      messageId: 'operator-note-1',
      traceEventId: '01J000000000000000000000V0',
    });
    expect(requests).toEqual([
      {
        body: {
          note: 'Reviewer checked the bounded payload.',
          visibility: 'operator_only',
        },
        method: 'POST',
        url: 'http://127.0.0.1:4321/v1/runs/01J000000000000000000000R0/notes',
      },
    ]);
  });

  it('rejects malformed operator note responses before returning them across Desktop bridge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse(201, {
            messageId: 'operator-note-1',
          }),
        ),
      ),
    );

    const handlers = await loadIpcHandlers();
    const addOperatorNoteHandler = getIpcHandler(handlers, 'workspace-core:add-operator-note');

    await expect(
      addOperatorNoteHandler(undefined, '01J000000000000000000000R0', {
        note: 'Reviewer checked the bounded payload.',
      }),
    ).rejects.toThrow(
      'Workspace Core returned an invalid response payload for POST /v1/runs/01J000000000000000000000R0/notes.',
    );
  });

  it('only opens http/https targets externally', async () => {
    desktopHarness.releaseWhenReady();
    await import('./index.js');
    await waitFor(() => desktopHarness.bootstrapDesktopMain.mock.calls.length === 1);

    const createMainWindowFn =
      desktopHarness.bootstrapDesktopMain.mock.calls[0]?.[0]?.createMainWindow;
    expect(createMainWindowFn).toBeDefined();
    if (createMainWindowFn === undefined) {
      throw new Error('Expected createMainWindow to be registered.');
    }

    createMainWindowFn();

    const browserWindowInstance = desktopHarness.browserWindows[0];
    if (browserWindowInstance === undefined) {
      throw new Error('Expected BrowserWindow instance to be created.');
    }

    const handler = browserWindowInstance.webContents.setWindowOpenHandler.mock.calls[0]?.[0] as
      | ((details: { url: string }) => { action: 'deny' })
      | undefined;

    expect(handler).toBeDefined();
    if (handler === undefined) {
      throw new Error('Expected external URL handler to be registered.');
    }

    expect(handler({ url: 'https://example.com' })).toEqual({ action: 'deny' });
    expect(desktopHarness.openExternal).toHaveBeenCalledWith('https://example.com');

    desktopHarness.openExternal.mockClear();
    expect(handler({ url: 'file:///tmp/secret.txt' })).toEqual({ action: 'deny' });
    expect(desktopHarness.openExternal).not.toHaveBeenCalled();
  });

  it('uses a CommonJS-compatible preload script for sandboxed renderer windows', async () => {
    desktopHarness.releaseWhenReady();
    await import('./index.js');
    await waitFor(() => desktopHarness.bootstrapDesktopMain.mock.calls.length === 1);

    const createMainWindowFn =
      desktopHarness.bootstrapDesktopMain.mock.calls[0]?.[0]?.createMainWindow;
    expect(createMainWindowFn).toBeDefined();
    if (createMainWindowFn === undefined) {
      throw new Error('Expected createMainWindow to be registered.');
    }

    createMainWindowFn();

    const browserWindowInstance = desktopHarness.browserWindows[0];
    expect(browserWindowInstance?.options?.webPreferences?.preload).toMatch(
      /\/preload\/index\.js$/u,
    );
    expect(browserWindowInstance?.options?.webPreferences?.preload).not.toMatch(/\.mjs$/u);
  });
});

function createRunReplaySourceFixture(overrides: Partial<RunReplaySource> = {}): RunReplaySource {
  return RunReplaySourceSchema.parse({
    agentRuns: [
      {
        attempt: 0,
        cancelable: false,
        createdAt: '2026-05-20T00:00:00.000Z',
        orchestrationRunId: '01J000000000000000000000R0',
        retryable: false,
        runId: '01J000000000000000000000A0',
        runtimeType: 'codex',
        status: 'running',
        taskId: '01J000000000000000000000K0',
        traceId: '01J000000000000000000000T0',
        updatedAt: '2026-05-20T00:00:00.000Z',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    artifacts: [
      {
        artifactId: '01J000000000000000000000F0',
        artifactRole: 'output',
        createdAt: '2026-05-20T00:00:00.000Z',
        formatVersion: '1',
        kind: 'text',
        producerType: 'agent',
        sensitivity: 'none',
        uriOrPath: 'artifact-payload://redacted',
        visibility: 'debug',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    inspector: {
      agentRunCount: 1,
      artifactCount: 1,
      errorEventCount: 0,
      status: 'running',
      taskCount: 1,
      traceEventCount: 1,
      warningEventCount: 0,
    },
    run: {
      createdAt: '2026-05-20T00:00:00.000Z',
      completionLevel: 'failed',
      executionMode: 'single_worker',
      hasPartialFailures: false,
      orchestrationRunId: '01J000000000000000000000R0',
      originEventId: '01J000000000000000000000E0',
      resultCompleteness: 'empty',
      status: 'running',
      traceId: '01J000000000000000000000T0',
      updatedAt: '2026-05-20T00:00:00.000Z',
      workspaceId: '01J000000000000000000000W0',
    },
    tasks: [
      {
        attempt: 0,
        artifactRefs: [],
        brief: 'Desktop internal-trial replay fixture',
        contextRefs: [],
        createdAt: '2026-05-20T00:00:00.000Z',
        dependsOnTaskIds: [],
        idempotencyKey: 'run-detail-key',
        orchestrationRunId: '01J000000000000000000000R0',
        priority: 50,
        status: 'running',
        taskId: '01J000000000000000000000K0',
        taskKind: 'custom',
        title: 'Desktop internal-trial replay fixture',
        updatedAt: '2026-05-20T00:00:00.000Z',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    traceEvents: [
      {
        createdAt: '2026-05-20T00:00:00.000Z',
        eventType: 'run.queued',
        level: 'info',
        orchestrationRunId: '01J000000000000000000000R0',
        payloadInline: {},
        traceEventId: '01J000000000000000000000V0',
        traceId: '01J000000000000000000000T0',
        workspaceId: '01J000000000000000000000W0',
      },
    ],
    ...overrides,
  });
}

function createOrchestrationRunFixture(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    completionLevel: 'full',
    createdAt: '2026-05-20T00:00:00.000Z',
    executionMode: 'single_worker',
    hasPartialFailures: false,
    orchestrationRunId: '01J000000000000000000000R0',
    originEventId: '01J000000000000000000000E0',
    resultCompleteness: 'complete',
    status: 'succeeded',
    traceId: '01J000000000000000000000T0',
    updatedAt: '2026-05-20T00:00:01.000Z',
    workspaceId: '01J000000000000000000000W0',
    ...overrides,
  };
}

async function waitFor(assertion: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (assertion()) {
      return;
    }

    await delay(10);
  }

  throw new Error('Timed out waiting for desktop main startup.');
}

async function loadIpcHandlers(): Promise<Record<string, (...args: unknown[]) => unknown>> {
  desktopHarness.releaseWhenReady();
  await import('./index.js');
  await waitFor(() => desktopHarness.bootstrapDesktopMain.mock.calls.length === 1);

  const bootstrapOptions = desktopHarness.bootstrapDesktopMain.mock.calls[0]?.[0];
  bootstrapOptions?.registerWorkspaceCoreIpcHandlers();

  return Object.fromEntries(
    desktopHarness.ipcMain.handle.mock.calls.map(([channel, handler]) => [
      channel as string,
      handler as (...args: unknown[]) => unknown,
    ]),
  );
}

function getIpcHandler(
  handlers: Record<string, (...args: unknown[]) => unknown>,
  channel: string,
): (...args: unknown[]) => unknown {
  const handler = handlers[channel];
  if (handler === undefined) {
    throw new Error(`Expected IPC handler ${channel}.`);
  }

  return handler;
}

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

function toRecordedRequest(
  url: RequestInfo | URL,
  init: RequestInit | undefined,
): { body?: unknown; method: string; url: string } {
  return {
    ...(init?.body === undefined ? {} : { body: JSON.parse(toRequestBody(init.body)) }),
    method: init?.method ?? 'GET',
    url: toRequestUrl(url),
  };
}

const toRequestUrl = (url: RequestInfo | URL): string => {
  if (typeof url === 'string') {
    return url;
  }

  if (url instanceof URL) {
    return url.href;
  }

  return url.url;
};

const toRequestBody = (body: BodyInit | null): string => {
  if (typeof body === 'string') {
    return body;
  }

  throw new Error('Expected JSON string request body.');
};
