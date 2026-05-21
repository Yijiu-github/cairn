// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import {
  WorkspaceCoreSidecarManager,
  createWorkspaceCoreSidecarConfig,
} from './workspace-core-sidecar.js';

import type { WorkspaceCoreSidecarChild } from './workspace-core-sidecar.js';

class FakeChildProcess extends EventEmitter implements WorkspaceCoreSidecarChild {
  public killedWith: NodeJS.Signals | undefined;
  public readonly pid = 12_345;
  public readonly stderr = new PassThrough();

  public kill(signal?: NodeJS.Signals): boolean {
    this.killedWith = signal;
    this.emit('exit', 0, signal);
    return true;
  }
}

describe('workspace-core sidecar', () => {
  it('builds a preview-safe Workspace Core spawn config with per-launch auth', () => {
    const userDataPath = path.join('/tmp', 'cairn-desktop-user-data');

    const config = createWorkspaceCoreSidecarConfig({
      authToken: 'desktop-launch-token',
      port: 51_321,
      repoRoot: '/repo/cairn',
      userDataPath,
    });

    expect(config.command).toBe('node');
    expect(config.args).toEqual(['/repo/cairn/node_modules/.bin/tsx', 'src/server.ts']);
    expect(config.cwd).toBe('/repo/cairn/apps/workspace-core');
    expect(config.baseUrl).toBe('http://127.0.0.1:51321');
    expect(config.env).toMatchObject({
      CAIRN_WORKSPACE_CORE_AUTH_TOKEN: 'desktop-launch-token',
      CAIRN_WORKSPACE_CORE_DB_PATH: path.join(
        userDataPath,
        'workspaces',
        'local',
        'workspace-core.sqlite',
      ),
      CAIRN_WORKSPACE_CORE_HOST: '127.0.0.1',
      CAIRN_WORKSPACE_CORE_PORT: '51321',
      CAIRN_WORKSPACE_CORE_RUNTIME: 'mock',
      CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR: path.join(userDataPath, 'runtime', 'mock'),
    });
  });

  it('can build a codex-backed sidecar config for Desktop internal-trial observation', () => {
    const userDataPath = path.join('/tmp', 'cairn-desktop-user-data');

    const config = createWorkspaceCoreSidecarConfig({
      authToken: 'desktop-launch-token',
      baseEnv: {
        CAIRN_DESKTOP_SIDECAR_CODEX_EXECUTABLE: '/opt/homebrew/bin/codex',
        CAIRN_DESKTOP_SIDECAR_CODEX_SANDBOX_MODE: 'read-only',
        CAIRN_DESKTOP_SIDECAR_RUNTIME: 'codex',
        CAIRN_DESKTOP_SIDECAR_RUNTIME_WORKDIR: '/tmp/cairn-real-runtime',
      },
      port: 51_321,
      repoRoot: '/repo/cairn',
      userDataPath,
    });

    expect(config.env).toMatchObject({
      CAIRN_WORKSPACE_CORE_AUTH_TOKEN: 'desktop-launch-token',
      CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE: '/opt/homebrew/bin/codex',
      CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE: 'read-only',
      CAIRN_WORKSPACE_CORE_RUNTIME: 'codex',
      CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR: '/tmp/cairn-real-runtime',
    });
  });

  it('uses an explicit Node executable when one is provided by the desktop shell', () => {
    const config = createWorkspaceCoreSidecarConfig({
      authToken: 'desktop-launch-token',
      nodeExecutable: '/opt/homebrew/bin/node',
      port: 51_321,
      repoRoot: '/repo/cairn',
      userDataPath: '/tmp/cairn-desktop-user-data',
    });

    expect(config.command).toBe('/opt/homebrew/bin/node');
  });

  it('prepends common local Node binary directories to the sidecar PATH', () => {
    const config = createWorkspaceCoreSidecarConfig({
      authToken: 'desktop-launch-token',
      baseEnv: { PATH: '/usr/bin:/bin' },
      port: 51_321,
      repoRoot: '/repo/cairn',
      userDataPath: '/tmp/cairn-desktop-user-data',
    });

    expect(config.env['PATH']).toBe('/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin');
  });

  it('checks sidecar health with a bearer token and does not expose the token in status', async () => {
    const requestedHeaders: string[] = [];
    const manager = new WorkspaceCoreSidecarManager(
      createWorkspaceCoreSidecarConfig({
        authToken: 'desktop-launch-token',
        port: 51_322,
        repoRoot: '/repo/cairn',
        userDataPath: '/tmp/cairn-desktop-user-data',
      }),
      {
        fetch: (url, init) => {
          expect(url).toBe('http://127.0.0.1:51322/health');
          const headers = init?.headers as Record<string, string> | undefined;
          requestedHeaders.push(String(headers?.['authorization']));
          return Promise.resolve(
            new Response(JSON.stringify({ ok: true, service: 'workspace-core' }), {
              headers: { 'content-type': 'application/json' },
              status: 200,
            }),
          );
        },
      },
    );

    const status = await manager.checkHealth();

    expect(requestedHeaders).toEqual(['Bearer desktop-launch-token']);
    expect(status).toMatchObject({
      baseUrl: 'http://127.0.0.1:51322',
      runtime: 'mock',
      state: 'healthy',
    });
    expect(JSON.stringify(status)).not.toContain('desktop-launch-token');
  });

  it('reuses the in-flight startup probe when start is called twice before health is ready', async () => {
    const requestedUrls: string[] = [];
    const healthProbe = deferred<Response>();
    const child = new FakeChildProcess();
    const manager = new WorkspaceCoreSidecarManager(
      createWorkspaceCoreSidecarConfig({
        authToken: 'desktop-launch-token',
        port: 51_321,
        repoRoot: '/repo/cairn',
        userDataPath: '/tmp/cairn-desktop-user-data',
      }),
      {
        fetch: (url) => {
          requestedUrls.push(toRequestUrl(url));
          return healthProbe.promise;
        },
        spawnProcess: () => child,
      },
    );

    const firstStart = manager.start();
    const secondStart = manager.start();

    expect(requestedUrls).toEqual(['http://127.0.0.1:51321/health']);

    healthProbe.resolve(
      new Response(JSON.stringify({ ok: true, service: 'workspace-core' }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );

    await expect(firstStart).resolves.toMatchObject({
      baseUrl: 'http://127.0.0.1:51321',
      runtime: 'mock',
      service: 'workspace-core',
      state: 'healthy',
    });
    await expect(secondStart).resolves.toMatchObject({
      baseUrl: 'http://127.0.0.1:51321',
      runtime: 'mock',
      service: 'workspace-core',
      state: 'healthy',
    });
  });

  it('spawns and stops the sidecar process', async () => {
    const child = new FakeChildProcess();
    const spawnCalls: { command: string; args: readonly string[]; cwd: string }[] = [];
    const manager = new WorkspaceCoreSidecarManager(
      createWorkspaceCoreSidecarConfig({
        authToken: 'desktop-launch-token',
        port: 51_323,
        repoRoot: '/repo/cairn',
        userDataPath: '/tmp/cairn-desktop-user-data',
      }),
      {
        fetch: () =>
          Promise.resolve(
            new Response(JSON.stringify({ ok: true, service: 'workspace-core' }), {
              headers: { 'content-type': 'application/json' },
              status: 200,
            }),
          ),
        spawnProcess: (command, args, options) => {
          spawnCalls.push({ args, command, cwd: options.cwd });
          return child;
        },
      },
    );

    await manager.start();
    await manager.stop();

    expect(spawnCalls).toEqual([
      {
        args: ['/repo/cairn/node_modules/.bin/tsx', 'src/server.ts'],
        command: 'node',
        cwd: '/repo/cairn/apps/workspace-core',
      },
    ]);
    expect(child.killedWith).toBe('SIGTERM');
    expect(manager.getStatus()).toMatchObject({ state: 'stopped' });
  });

  it('surfaces sidecar stderr when the child exits before health becomes ready', async () => {
    const child = new FakeChildProcess();
    const manager = new WorkspaceCoreSidecarManager(
      {
        ...createWorkspaceCoreSidecarConfig({
          authToken: 'desktop-launch-token',
          port: 51_324,
          repoRoot: '/repo/cairn',
          userDataPath: '/tmp/cairn-desktop-user-data',
        }),
        healthTimeoutMs: 100,
        healthPollIntervalMs: 5,
      },
      {
        fetch: () => Promise.reject(new Error('connection refused')),
        spawnProcess: () => child,
      },
    );

    const statusPromise = manager.start();
    child.stderr.write(Buffer.from('tsx: module not found\n'));
    child.emit('exit', 127, null);
    const status = await statusPromise;

    expect(status).toMatchObject({
      lastError: 'Workspace Core sidecar exited with code 127. stderr: tsx: module not found',
      state: 'exited',
    });
  });

  it('surfaces spawn errors when the sidecar executable cannot be started', async () => {
    const child = new FakeChildProcess();
    const manager = new WorkspaceCoreSidecarManager(
      {
        ...createWorkspaceCoreSidecarConfig({
          authToken: 'desktop-launch-token',
          port: 51_325,
          repoRoot: '/repo/cairn',
          userDataPath: '/tmp/cairn-desktop-user-data',
        }),
        healthTimeoutMs: 100,
        healthPollIntervalMs: 5,
      },
      {
        fetch: () => Promise.reject(new Error('connection refused')),
        spawnProcess: () => child,
      },
    );

    const statusPromise = manager.start();
    child.emit('error', new Error('spawn node ENOENT'));
    const status = await statusPromise;

    expect(status).toMatchObject({
      lastError: 'Workspace Core sidecar failed to start: spawn node ENOENT',
      state: 'exited',
    });
  });

  it('redacts sensitive fragments from spawn errors in sidecar diagnostics', async () => {
    const child = new FakeChildProcess();
    const manager = new WorkspaceCoreSidecarManager(
      {
        ...createWorkspaceCoreSidecarConfig({
          authToken: 'desktop-launch-token',
          port: 51_328,
          repoRoot: '/repo/cairn',
          userDataPath: '/tmp/cairn-desktop-user-data',
        }),
        healthTimeoutMs: 100,
        healthPollIntervalMs: 5,
      },
      {
        fetch: () => Promise.reject(new Error('connection refused')),
        spawnProcess: () => child,
      },
    );

    const statusPromise = manager.start();
    child.emit(
      'error',
      new Error('spawn node ENOENT at /Users/alice/project/secret.txt with token=topsecret'),
    );
    const status = await statusPromise;

    expect(status.lastError).toContain('<redacted>');
    expect(status.lastError).not.toContain('/Users/');
    expect(status.lastError).not.toContain('topsecret');
  });

  it('redacts sensitive fragments from sidecar diagnostics', async () => {
    const child = new FakeChildProcess();
    const manager = new WorkspaceCoreSidecarManager(
      {
        ...createWorkspaceCoreSidecarConfig({
          authToken: 'desktop-launch-token',
          port: 51_327,
          repoRoot: '/repo/cairn',
          userDataPath: '/tmp/cairn-desktop-user-data',
        }),
        healthTimeoutMs: 100,
        healthPollIntervalMs: 5,
      },
      {
        fetch: () => Promise.reject(new Error('connection refused')),
        spawnProcess: () => child,
      },
    );

    const statusPromise = manager.start();
    child.stderr.write(Buffer.from('Bearer topsecret PATH=/Users/alice/project/secret.txt\n'));
    child.emit('exit', 127, null);
    const status = await statusPromise;

    expect(status.lastError).toContain('<redacted>');
    expect(status.lastError).not.toContain('/Users/');
    expect(status.lastError).not.toContain('topsecret');
  });

  it('does not hang forever when a health request never resolves', async () => {
    const child = new FakeChildProcess();
    const manager = new WorkspaceCoreSidecarManager(
      {
        ...createWorkspaceCoreSidecarConfig({
          authToken: 'desktop-launch-token',
          port: 51_326,
          repoRoot: '/repo/cairn',
          userDataPath: '/tmp/cairn-desktop-user-data',
        }),
        healthPollIntervalMs: 5,
        healthRequestTimeoutMs: 10,
        healthTimeoutMs: 50,
      },
      {
        fetch: () => new Promise<Response>(() => undefined),
        spawnProcess: () => child,
      },
    );

    const startedAt = Date.now();
    const status = await manager.start();

    expect(Date.now() - startedAt).toBeLessThan(500);
    expect(status).toMatchObject({
      lastError: 'Workspace Core did not become healthy before the startup timeout.',
      state: 'unhealthy',
    });
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

function toRequestUrl(url: RequestInfo | URL): string {
  if (typeof url === 'string') {
    return url;
  }

  if (url instanceof URL) {
    return url.href;
  }

  return url.url;
}
