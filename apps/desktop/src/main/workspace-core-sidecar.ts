// SPDX-License-Identifier: Apache-2.0
import { spawn } from 'node:child_process';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';

import type { SpawnOptions } from 'node:child_process';
import type { Readable } from 'node:stream';

export type WorkspaceCoreSidecarState =
  | 'stopped'
  | 'starting'
  | 'healthy'
  | 'unhealthy'
  | 'stopping'
  | 'exited';

export interface WorkspaceCoreSidecarStatus {
  readonly state: WorkspaceCoreSidecarState;
  readonly baseUrl: string;
  readonly pid?: number | undefined;
  readonly service?: 'workspace-core' | undefined;
  readonly lastError?: string | undefined;
}

export interface WorkspaceCoreSidecarConfig {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
  readonly baseUrl: string;
  readonly authToken: string;
  readonly healthTimeoutMs: number;
  readonly healthRequestTimeoutMs: number;
  readonly healthPollIntervalMs: number;
  readonly stopTimeoutMs: number;
}

export interface CreateWorkspaceCoreSidecarConfigOptions {
  readonly authToken: string;
  readonly nodeExecutable?: string | undefined;
  readonly repoRoot: string;
  readonly userDataPath: string;
  readonly port?: number | undefined;
  readonly baseEnv?: Readonly<Record<string, string | undefined>> | undefined;
}

export interface WorkspaceCoreSidecarChild {
  readonly pid?: number | undefined;
  readonly stderr?: Readable | undefined;
  kill: (signal?: NodeJS.Signals) => boolean;
  once(event: 'error', listener: (error: Error) => void): this;
  once(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
}

export interface WorkspaceCoreSidecarSpawnOptions {
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
}

interface WorkspaceCoreSidecarDependencies {
  readonly fetch?: typeof fetch | undefined;
  readonly spawnProcess?:
    | ((
        command: string,
        args: readonly string[],
        options: WorkspaceCoreSidecarSpawnOptions,
      ) => WorkspaceCoreSidecarChild)
    | undefined;
}

interface HealthResponse {
  readonly ok: boolean;
  readonly service: 'workspace-core';
}

const HEALTH_REQUEST_TIMEOUT = Symbol('healthRequestTimeout');
const DEFAULT_PORT = 4321;
const DEFAULT_HEALTH_TIMEOUT_MS = 5000;
const DEFAULT_HEALTH_REQUEST_TIMEOUT_MS = 750;
const DEFAULT_HEALTH_POLL_INTERVAL_MS = 250;
const DEFAULT_STOP_TIMEOUT_MS = 3000;

export const createWorkspaceCoreSidecarConfig = (
  options: CreateWorkspaceCoreSidecarConfigOptions,
): WorkspaceCoreSidecarConfig => {
  const port = options.port ?? DEFAULT_PORT;
  const baseUrl = `http://127.0.0.1:${port.toString()}`;
  const databasePath = path.join(
    options.userDataPath,
    'workspaces',
    'local',
    'workspace-core.sqlite',
  );
  const runtimeWorkdir = path.join(options.userDataPath, 'runtime', 'mock');

  const env = compactEnv(options.baseEnv ?? {});
  const workspaceCoreCwd = path.join(options.repoRoot, 'apps', 'workspace-core');

  return {
    args: [path.join(options.repoRoot, 'node_modules/.bin/tsx'), 'src/server.ts'],
    authToken: options.authToken,
    baseUrl,
    command: options.nodeExecutable ?? 'node',
    cwd: workspaceCoreCwd,
    env: {
      ...env,
      CAIRN_WORKSPACE_CORE_AUTH_TOKEN: options.authToken,
      CAIRN_WORKSPACE_CORE_DB_PATH: databasePath,
      CAIRN_WORKSPACE_CORE_HOST: '127.0.0.1',
      CAIRN_WORKSPACE_CORE_PORT: port.toString(),
      CAIRN_WORKSPACE_CORE_RUNTIME: 'mock',
      CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR: runtimeWorkdir,
      PATH: withDesktopPath(env['PATH']),
    },
    healthPollIntervalMs: DEFAULT_HEALTH_POLL_INTERVAL_MS,
    healthRequestTimeoutMs: DEFAULT_HEALTH_REQUEST_TIMEOUT_MS,
    healthTimeoutMs: DEFAULT_HEALTH_TIMEOUT_MS,
    stopTimeoutMs: DEFAULT_STOP_TIMEOUT_MS,
  };
};

export class WorkspaceCoreSidecarManager {
  private child: WorkspaceCoreSidecarChild | undefined;
  private lastChildError: string | undefined;
  private lastExit: { code: number | null; signal: NodeJS.Signals | null } | undefined;
  private stderrTail = '';
  private status: WorkspaceCoreSidecarStatus;
  private readonly fetchImpl: typeof fetch;
  private readonly spawnProcess: (
    command: string,
    args: readonly string[],
    options: WorkspaceCoreSidecarSpawnOptions,
  ) => WorkspaceCoreSidecarChild;

  public constructor(
    private readonly config: WorkspaceCoreSidecarConfig,
    dependencies: WorkspaceCoreSidecarDependencies = {},
  ) {
    this.fetchImpl = dependencies.fetch ?? fetch;
    this.spawnProcess = dependencies.spawnProcess ?? defaultSpawnProcess;
    this.status = {
      baseUrl: config.baseUrl,
      state: 'stopped',
    };
  }

  public getStatus(): WorkspaceCoreSidecarStatus {
    return this.status;
  }

  public async start(): Promise<WorkspaceCoreSidecarStatus> {
    if (this.child !== undefined) {
      return this.checkHealth();
    }

    this.status = {
      baseUrl: this.config.baseUrl,
      state: 'starting',
    };
    const child = this.spawnProcess(this.config.command, this.config.args, {
      cwd: this.config.cwd,
      env: this.config.env,
    });
    this.child = child;
    this.lastChildError = undefined;
    this.lastExit = undefined;
    this.stderrTail = '';
    child.stderr?.on('data', (chunk: Buffer | string) => {
      this.stderrTail = trimDiagnosticTail(`${this.stderrTail}${chunk.toString()}`);
    });
    child.once('error', (error) => {
      this.lastChildError = error.message;
      this.lastExit = { code: null, signal: null };
      this.status = {
        baseUrl: this.config.baseUrl,
        lastError: `Workspace Core sidecar failed to start: ${error.message}`,
        state: 'exited',
      };
      this.child = undefined;
    });
    this.status = {
      baseUrl: this.config.baseUrl,
      pid: child.pid,
      state: 'starting',
    };

    child.once('exit', (code, signal) => {
      this.lastExit = { code, signal };
      if (this.status.state !== 'stopping' && this.status.state !== 'stopped') {
        this.status = {
          baseUrl: this.config.baseUrl,
          lastError: this.toExitDiagnostic(code, signal),
          state: 'exited',
        };
      }
      this.child = undefined;
    });

    return this.waitForHealthy();
  }

  public async checkHealth(): Promise<WorkspaceCoreSidecarStatus> {
    try {
      const response = await this.fetchWithTimeout(`${this.config.baseUrl}/health`);

      if (!response.ok) {
        this.status = {
          baseUrl: this.config.baseUrl,
          lastError: `Workspace Core health returned ${response.status.toString()}.`,
          pid: this.child?.pid,
          state: 'unhealthy',
        };
        return this.status;
      }

      const body: unknown = await response.json();
      if (!isHealthResponse(body)) {
        this.status = {
          baseUrl: this.config.baseUrl,
          lastError: 'Workspace Core health returned an invalid response.',
          pid: this.child?.pid,
          state: 'unhealthy',
        };
        return this.status;
      }

      this.status = {
        baseUrl: this.config.baseUrl,
        pid: this.child?.pid,
        service: body.service,
        state: 'healthy',
      };
      return this.status;
    } catch (error) {
      this.status = {
        baseUrl: this.config.baseUrl,
        lastError: error instanceof Error ? error.message : 'Workspace Core health check failed.',
        pid: this.child?.pid,
        state: 'unhealthy',
      };
      return this.status;
    }
  }

  public async stop(): Promise<WorkspaceCoreSidecarStatus> {
    if (this.child === undefined) {
      this.status = {
        baseUrl: this.config.baseUrl,
        state: 'stopped',
      };
      return this.status;
    }

    const child = this.child;
    this.status = {
      baseUrl: this.config.baseUrl,
      pid: child.pid,
      state: 'stopping',
    };

    const exited = new Promise<void>((resolve) => {
      child.once('exit', () => {
        resolve();
      });
    });
    child.kill('SIGTERM');
    await Promise.race([
      exited,
      delay(this.config.stopTimeoutMs).then(() => {
        child.kill('SIGKILL');
      }),
    ]);

    this.child = undefined;
    this.status = {
      baseUrl: this.config.baseUrl,
      state: 'stopped',
    };
    return this.status;
  }

  private async waitForHealthy(): Promise<WorkspaceCoreSidecarStatus> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.config.healthTimeoutMs) {
      if (this.lastExit !== undefined) {
        if (this.lastChildError !== undefined) {
          this.status = {
            baseUrl: this.config.baseUrl,
            lastError: `Workspace Core sidecar failed to start: ${this.lastChildError}`,
            state: 'exited',
          };
          return this.status;
        }

        this.status = {
          baseUrl: this.config.baseUrl,
          lastError: this.toExitDiagnostic(this.lastExit.code, this.lastExit.signal),
          state: 'exited',
        };
        return this.status;
      }

      const status = await this.checkHealth();
      if (status.state === 'healthy') {
        return status;
      }
      await delay(this.config.healthPollIntervalMs);
    }

    this.status = {
      baseUrl: this.config.baseUrl,
      lastError: 'Workspace Core did not become healthy before the startup timeout.',
      pid: this.child?.pid,
      state: 'unhealthy',
    };
    return this.status;
  }

  private toExitDiagnostic(code: number | null, signal: NodeJS.Signals | null): string {
    const exitPart =
      code === null
        ? `Workspace Core sidecar exited with signal ${signal ?? 'unknown'}.`
        : `Workspace Core sidecar exited with code ${code.toString()}.`;
    const stderrPart = this.stderrTail.length === 0 ? '' : ` stderr: ${this.stderrTail}`;

    return `${exitPart}${stderrPart}`;
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    let timeout: NodeJS.Timeout | undefined;

    try {
      const response = await Promise.race([
        this.fetchImpl(url, {
          headers: {
            authorization: `Bearer ${this.config.authToken}`,
          },
          signal: controller.signal,
        }),
        new Promise<typeof HEALTH_REQUEST_TIMEOUT>((resolve) => {
          timeout = setTimeout(() => {
            controller.abort();
            resolve(HEALTH_REQUEST_TIMEOUT);
          }, this.config.healthRequestTimeoutMs);
        }),
      ]);

      if (response === HEALTH_REQUEST_TIMEOUT) {
        throw new Error('Workspace Core health request timed out.');
      }

      return response;
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
    }
  }
}

const compactEnv = (env: Readonly<Record<string, string | undefined>>): Record<string, string> => {
  const compacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) {
      compacted[key] = value;
    }
  }
  return compacted;
};

const defaultSpawnProcess = (
  command: string,
  args: readonly string[],
  options: WorkspaceCoreSidecarSpawnOptions,
): WorkspaceCoreSidecarChild => {
  const spawnOptions: SpawnOptions = {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'ignore', 'pipe'],
  };
  const child = spawn(command, args, spawnOptions);
  return {
    pid: child.pid,
    stderr: child.stderr ?? new PassThrough(),
    kill: (signal) => child.kill(signal),
    once: (event, listener) => {
      child.once(event, listener);
      return child as WorkspaceCoreSidecarChild;
    },
  };
};

const isHealthResponse = (value: unknown): value is HealthResponse =>
  typeof value === 'object' &&
  value !== null &&
  'ok' in value &&
  value.ok === true &&
  'service' in value &&
  value.service === 'workspace-core';

const trimDiagnosticTail = (value: string): string => {
  const normalized = value.trim();
  if (normalized.length <= 2000) {
    return normalized;
  }

  return normalized.slice(-2000);
};

const withDesktopPath = (pathValue: string | undefined): string => {
  const entries = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    ...(pathValue ?? '/usr/bin:/bin:/usr/sbin:/sbin').split(':'),
  ];
  return [...new Set(entries.filter((entry) => entry.length > 0))].join(':');
};
