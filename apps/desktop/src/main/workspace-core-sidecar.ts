// SPDX-License-Identifier: Apache-2.0

import { spawn as defaultSpawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { cwd, env } from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

import {
  createNotStartedWorkspaceCoreConnection,
  type WorkspaceCoreConnectionSnapshot,
  type WorkspaceCoreSidecarMode,
} from '../shared/workspace-core-connection.js';

import type { SpawnOptions } from 'node:child_process';

export interface SidecarFetchResponse {
  readonly ok: boolean;
  readonly status?: number;
}

export type SidecarFetch = (
  input: string | URL,
  init?: {
    readonly headers?: Record<string, string>;
    readonly signal?: AbortSignal;
  },
) => Promise<SidecarFetchResponse>;

export interface SidecarChildProcess {
  kill(): boolean;
  on(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void,
  ): SidecarChildProcess;
}

export type SidecarSpawn = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => SidecarChildProcess;

export interface WorkspaceCoreSidecarManagerOptions {
  readonly databasePath: string;
  readonly fetch: SidecarFetch;
  readonly mode: WorkspaceCoreSidecarMode;
  readonly portAllocator?: () => Promise<number>;
  readonly spawn?: SidecarSpawn;
  readonly startupTimeoutMs?: number;
  readonly workspaceRootDir?: string;
  readonly environment?: Record<string, string | undefined>;
  readonly healthCheckIntervalMs?: number;
  readonly tokenFactory?: () => string;
}

const DEFAULT_STARTUP_TIMEOUT_MS = 2_000;
const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 100;
const LOOPBACK_HOST = '127.0.0.1';
const loopbackBaseUrl = (port: number): string => `http://${LOOPBACK_HOST}:${String(port)}`;

export class WorkspaceCoreSidecarManager {
  private readonly fetch: SidecarFetch;
  private readonly healthCheckIntervalMs: number;
  private readonly mode: WorkspaceCoreSidecarMode;
  private readonly portAllocator: () => Promise<number>;
  private readonly spawn: SidecarSpawn;
  private readonly startupTimeoutMs: number;
  private readonly workspaceRootDir: string;
  private readonly environment: Record<string, string | undefined>;
  private readonly databasePath: string;
  private readonly tokenFactory: () => string;
  private child: SidecarChildProcess | undefined;
  private status: WorkspaceCoreConnectionSnapshot;

  public constructor(options: WorkspaceCoreSidecarManagerOptions) {
    this.fetch = options.fetch;
    this.healthCheckIntervalMs = options.healthCheckIntervalMs ?? DEFAULT_HEALTH_CHECK_INTERVAL_MS;
    this.mode = options.mode;
    this.databasePath = options.databasePath;
    this.portAllocator = options.portAllocator ?? createLoopbackPortAllocator;
    this.spawn = options.spawn ?? defaultSidecarSpawn;
    this.startupTimeoutMs = options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
    this.workspaceRootDir = options.workspaceRootDir ?? cwd();
    this.environment = options.environment ?? env;
    this.tokenFactory = options.tokenFactory ?? randomUUID;
    this.status = createNotStartedWorkspaceCoreConnection(this.mode);
  }

  public getStatus(): WorkspaceCoreConnectionSnapshot {
    return this.status;
  }

  public async start(): Promise<WorkspaceCoreConnectionSnapshot> {
    if (this.status.state === 'starting' || this.status.state === 'connected') {
      return this.status;
    }

    if (this.mode === 'packaged') {
      this.status = {
        ...this.status,
        authenticated: false,
        detail: 'Packaged Desktop builds do not bundle an embedded Workspace Core yet.',
        mode: this.mode,
        reason: 'embedded_sidecar_unavailable',
        state: 'degraded',
        updatedAt: new Date().toISOString(),
      };
      return this.status;
    }

    const port = await this.portAllocator();
    const token = this.tokenFactory();
    const child = this.spawn('pnpm', ['--filter', '@cairn/workspace-core', 'start'], {
      cwd: this.workspaceRootDir,
      env: {
        ...this.environment,
        CAIRN_WORKSPACE_CORE_AUTH_TOKEN: token,
        CAIRN_WORKSPACE_CORE_DB_PATH: this.databasePath,
        CAIRN_WORKSPACE_CORE_HOST: LOOPBACK_HOST,
        CAIRN_WORKSPACE_CORE_PORT: String(port),
      },
      stdio: 'ignore',
    });

    this.child = child;
    this.status = {
      authenticated: false,
      baseUrl: loopbackBaseUrl(port),
      detail: 'Workspace Core sidecar is starting.',
      host: LOOPBACK_HOST,
      mode: this.mode,
      port,
      state: 'starting',
      updatedAt: new Date().toISOString(),
    };

    child.on('exit', (code, signal) => {
      if (this.child !== child) {
        return;
      }

      this.child = undefined;
      const detail =
        code === null
          ? `Workspace Core sidecar exited with signal ${signal ?? 'unknown'}.`
          : `Workspace Core sidecar exited with code ${String(code)}.`;

      this.status = {
        ...(this.status.baseUrl === undefined ? {} : { baseUrl: this.status.baseUrl }),
        authenticated: false,
        detail,
        host: LOOPBACK_HOST,
        mode: this.mode,
        ...(this.status.port === undefined ? {} : { port: this.status.port }),
        reason: 'spawn_failed',
        state: this.status.state === 'connected' ? 'disconnected' : 'failed',
        updatedAt: new Date().toISOString(),
      };
    });

    const deadline = Date.now() + this.startupTimeoutMs;
    while (Date.now() < deadline) {
      if (this.child !== child) {
        return this.status;
      }

      try {
        const response = await this.fetch(`${loopbackBaseUrl(port)}/health`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          this.status = {
            authenticated: true,
            baseUrl: loopbackBaseUrl(port),
            detail: 'Workspace Core sidecar is connected.',
            host: LOOPBACK_HOST,
            mode: this.mode,
            port,
            state: 'connected',
            updatedAt: new Date().toISOString(),
          };
          return this.status;
        }
      } catch {
        // Keep polling until the sidecar becomes reachable or the timeout elapses.
      }

      await delay(this.healthCheckIntervalMs);
    }

    this.child = undefined;
    child.kill();
    this.status = {
      authenticated: false,
      baseUrl: loopbackBaseUrl(port),
      detail: 'Workspace Core sidecar failed health checks during startup.',
      host: LOOPBACK_HOST,
      mode: this.mode,
      port,
      reason: 'health_check_failed',
      state: 'failed',
      updatedAt: new Date().toISOString(),
    };
    return this.status;
  }

  public async restart(): Promise<WorkspaceCoreConnectionSnapshot> {
    this.stop();
    return this.start();
  }

  public stop(): WorkspaceCoreConnectionSnapshot {
    const child = this.child;
    this.child = undefined;

    if (child !== undefined) {
      child.kill();
    }

    this.status = {
      authenticated: false,
      detail: 'Workspace Core sidecar stopped.',
      mode: this.mode,
      state: 'disconnected',
      updatedAt: new Date().toISOString(),
    };
    return this.status;
  }
}

const createLoopbackPortAllocator = async (): Promise<number> =>
  await new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', (error) => {
      reject(error);
    });
    server.listen({ host: LOOPBACK_HOST, port: 0 }, () => {
      const address = server.address();
      server.close((closeError) => {
        if (closeError !== undefined) {
          reject(closeError);
          return;
        }

        if (typeof address !== 'object' || address === null) {
          reject(new Error('Expected loopback address.'));
          return;
        }

        resolve(address.port);
      });
    });
  });

const defaultSidecarSpawn: SidecarSpawn = (command, args, options) =>
  defaultSpawn(command, [...args], options);
