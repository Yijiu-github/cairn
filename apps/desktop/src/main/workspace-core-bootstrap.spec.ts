// SPDX-License-Identifier: Apache-2.0
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  bootstrapDesktopMain,
  writeDesktopSmokeSignalFile,
  writeWorkspaceCoreDiagnosticFile,
} from './workspace-core-bootstrap.js';

import type { WorkspaceCoreSidecarStatus } from './workspace-core-sidecar.js';

describe('desktop main Workspace Core bootstrap', () => {
  it('does not await sidecar setup before creating the window', () => {
    const events: string[] = [];

    bootstrapDesktopMain({
      createMainWindow: () => {
        events.push('window');
      },
      registerWorkspaceCoreIpcHandlers: () => {
        events.push('ipc');
      },
      reportWorkspaceCoreStartupFailure: () => undefined,
      startWorkspaceCoreSidecar: () => {
        events.push('start-sidecar');
        return Promise.resolve({
          baseUrl: 'http://127.0.0.1:4321',
          state: 'healthy',
        });
      },
      writeWorkspaceCoreDiagnostic: () => Promise.resolve(),
    });

    expect(events).toEqual(['ipc', 'window', 'start-sidecar']);
  });

  it('creates the window before the sidecar startup health check resolves', async () => {
    const events: string[] = [];
    const startup = deferred<WorkspaceCoreSidecarStatus>();

    const bootstrap = bootstrapDesktopMain({
      createMainWindow: () => {
        events.push('window');
      },
      registerWorkspaceCoreIpcHandlers: () => {
        events.push('ipc');
      },
      reportWorkspaceCoreStartupFailure: (status) => {
        events.push(`failure:${status.state}`);
      },
      startWorkspaceCoreSidecar: () => {
        events.push('start-sidecar');
        return startup.promise;
      },
      writeWorkspaceCoreDiagnostic: (status) => {
        events.push(`diagnostic:${status.state}`);
        return Promise.resolve();
      },
    });

    expect(events).toEqual(['ipc', 'window', 'start-sidecar']);

    startup.resolve({
      baseUrl: 'http://127.0.0.1:4321',
      lastError: 'Workspace Core did not become healthy before the startup timeout.',
      state: 'unhealthy',
    });

    await expect(bootstrap.sidecarStartup).resolves.toMatchObject({ state: 'unhealthy' });
    expect(events).toEqual([
      'ipc',
      'window',
      'start-sidecar',
      'diagnostic:unhealthy',
      'failure:unhealthy',
    ]);
  });

  it('keeps sidecar startup resolved when diagnostic writing fails', async () => {
    const failures: string[] = [];

    const bootstrap = bootstrapDesktopMain({
      createMainWindow: () => undefined,
      registerWorkspaceCoreIpcHandlers: () => undefined,
      reportWorkspaceCoreStartupFailure: (status) => {
        failures.push(status.lastError ?? status.state);
      },
      startWorkspaceCoreSidecar: () =>
        Promise.resolve({
          baseUrl: 'http://127.0.0.1:4321',
          pid: 12_345,
          service: 'workspace-core',
          state: 'healthy',
        }),
      writeWorkspaceCoreDiagnostic: () => Promise.reject(new Error('disk full')),
    });

    await expect(bootstrap.sidecarStartup).resolves.toMatchObject({ state: 'healthy' });
    expect(failures).toEqual(['Workspace Core diagnostic write failed: disk full']);
  });

  it('converts sidecar startup exceptions into an unhealthy status', async () => {
    const diagnostics: string[] = [];
    const failures: string[] = [];

    const bootstrap = bootstrapDesktopMain({
      createMainWindow: () => undefined,
      registerWorkspaceCoreIpcHandlers: () => undefined,
      reportWorkspaceCoreStartupFailure: (status) => {
        failures.push(status.lastError ?? status.state);
      },
      startWorkspaceCoreSidecar: () => Promise.reject(new Error('spawn crashed')),
      writeWorkspaceCoreDiagnostic: (status) => {
        diagnostics.push(status.state);
        return Promise.resolve();
      },
    });

    await expect(bootstrap.sidecarStartup).resolves.toMatchObject({
      lastError: 'Workspace Core sidecar startup failed: spawn crashed',
      state: 'unhealthy',
    });
    expect(diagnostics).toEqual(['unhealthy']);
    expect(failures).toEqual(['Workspace Core sidecar startup failed: spawn crashed']);
  });

  it('writes a non-secret sidecar diagnostic snapshot', async () => {
    const userDataPath = await mkdtemp(join(tmpdir(), 'cairn-desktop-diagnostic-'));

    await writeWorkspaceCoreDiagnosticFile({
      now: new Date('2026-05-19T04:30:00.000Z'),
      status: {
        baseUrl: 'http://127.0.0.1:4321',
        lastError: 'Workspace Core did not become healthy before the startup timeout.',
        pid: 12_345,
        service: 'workspace-core',
        state: 'unhealthy',
      },
      userDataPath,
    });

    const diagnostic = await readFile(
      join(userDataPath, 'diagnostics', 'workspace-core-sidecar.json'),
      'utf8',
    );

    expect(JSON.parse(diagnostic)).toEqual({
      baseUrl: 'http://127.0.0.1:4321',
      lastError: 'Workspace Core did not become healthy before the startup timeout.',
      pid: 12_345,
      recordedAt: '2026-05-19T04:30:00.000Z',
      service: 'workspace-core',
      state: 'unhealthy',
    });
    expect(diagnostic).not.toContain('desktop-launch-token');
  });

  it('writes a non-secret desktop smoke signal file', async () => {
    const signalPath = join(
      await mkdtemp(join(tmpdir(), 'cairn-desktop-window-smoke-')),
      'window-ready.json',
    );

    await writeDesktopSmokeSignalFile({
      event: 'main-window-created',
      now: new Date('2026-05-19T04:40:00.000Z'),
      path: signalPath,
    });

    const signal = await readFile(signalPath, 'utf8');

    expect(JSON.parse(signal)).toEqual({
      event: 'main-window-created',
      recordedAt: '2026-05-19T04:40:00.000Z',
    });
    expect(signal).not.toContain('desktop-launch-token');
  });
});

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });

  if (resolve === undefined) {
    throw new Error('Deferred promise resolver was not initialized.');
  }

  return { promise, resolve };
}
