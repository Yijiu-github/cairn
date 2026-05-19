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
      state: 'healthy',
    });
    expect(JSON.stringify(status)).not.toContain('desktop-launch-token');
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
