// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, it } from 'vitest';

import { WorkspaceCoreSidecarManager } from './workspace-core-sidecar.js';

import type { SidecarChildProcess, SidecarFetch, SidecarSpawn } from './workspace-core-sidecar.js';

class FakeChildProcess extends EventEmitter implements SidecarChildProcess {
  killed = false;
  readonly pid = 12_345;

  kill(): boolean {
    this.killed = true;
    return true;
  }
}

const createSpawnRecorder = () => {
  const child = new FakeChildProcess();
  const calls: Parameters<SidecarSpawn>[] = [];
  const spawn: SidecarSpawn = (...parameters) => {
    calls.push(parameters);
    return child;
  };

  return { calls, child, spawn };
};

it('starts workspace-core on loopback with a per-launch bearer token', async () => {
  const spawned = createSpawnRecorder();
  const manager = new WorkspaceCoreSidecarManager({
    fetch: createHealthyFetch(),
    databasePath: path.join(tmpdir(), 'cairn-workspace-core.sqlite'),
    mode: 'development',
    portAllocator: () => Promise.resolve(45_321),
    spawn: spawned.spawn,
    tokenFactory: () => 'token-one',
  });

  const status = await manager.start();

  expect(status).toMatchObject({
    baseUrl: 'http://127.0.0.1:45321',
    host: '127.0.0.1',
    port: 45_321,
    state: 'connected',
  });
  expect(status.authenticated).toBe(true);
  expect(spawned.calls).toHaveLength(1);
  const [, , options] = spawned.calls[0] ?? [];
  expect(options?.env).toMatchObject({
    CAIRN_WORKSPACE_CORE_AUTH_TOKEN: 'token-one',
    CAIRN_WORKSPACE_CORE_DB_PATH: path.join(tmpdir(), 'cairn-workspace-core.sqlite'),
    CAIRN_WORKSPACE_CORE_HOST: '127.0.0.1',
    CAIRN_WORKSPACE_CORE_PORT: '45321',
  });
});

it('reports degraded status for packaged builds until a bundled sidecar exists', async () => {
  const spawned = createSpawnRecorder();
  const manager = new WorkspaceCoreSidecarManager({
    fetch: createHealthyFetch(),
    databasePath: path.join(tmpdir(), 'cairn-workspace-core.sqlite'),
    mode: 'packaged',
    portAllocator: () => Promise.resolve(45_321),
    spawn: spawned.spawn,
    tokenFactory: () => 'token-one',
  });

  const status = await manager.start();

  expect(status).toMatchObject({
    reason: 'embedded_sidecar_unavailable',
    state: 'degraded',
  });
  expect(spawned.calls).toHaveLength(0);
});

it('stops the spawned sidecar process', async () => {
  const spawned = createSpawnRecorder();
  const manager = new WorkspaceCoreSidecarManager({
    fetch: createHealthyFetch(),
    databasePath: path.join(tmpdir(), 'cairn-workspace-core.sqlite'),
    mode: 'development',
    portAllocator: () => Promise.resolve(45_321),
    spawn: spawned.spawn,
    tokenFactory: () => 'token-one',
  });

  await manager.start();
  manager.stop();

  expect(spawned.child.killed).toBe(true);
  expect(manager.getStatus()).toMatchObject({ state: 'disconnected' });
});

it('fails startup when the sidecar never becomes healthy', async () => {
  const spawned = createSpawnRecorder();
  const manager = new WorkspaceCoreSidecarManager({
    fetch: () => Promise.resolve({ ok: false, status: 503 }),
    databasePath: path.join(tmpdir(), 'cairn-workspace-core.sqlite'),
    healthCheckIntervalMs: 1,
    mode: 'development',
    portAllocator: () => Promise.resolve(45_321),
    spawn: spawned.spawn,
    startupTimeoutMs: 3,
    tokenFactory: () => 'token-one',
  });

  const status = await manager.start();

  expect(status).toMatchObject({
    reason: 'health_check_failed',
    state: 'failed',
  });
});

const createHealthyFetch = (): SidecarFetch => (_url, init) => {
  const authorization = init?.headers?.['authorization'];
  return Promise.resolve({
    ok: authorization === 'Bearer token-one',
    status: authorization === 'Bearer token-one' ? 200 : 401,
  });
};
