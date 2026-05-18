// SPDX-License-Identifier: Apache-2.0
/**
 * Workspace Core runtime gateway factory.
 *
 * 根因：服务启动需要能显式选择真实 RuntimeAdapter，但默认仍要保持 mock 基线稳定。
 * 修复要点：把 mock/codex 选择集中在启动组合层，不让 route handler 直接知道具体 adapter。
 */

import { mkdir } from 'node:fs/promises';

import { createCodexRuntimeAdapter } from '@cairn/runtime-gateway/adapters/codex';

import { MockRuntimeGatewayPort } from './mock-runtime-gateway-port.js';
import { RuntimeAdapterGatewayPort } from './runtime-adapter-gateway-port.js';

import type { RuntimeGatewayPort } from '@cairn/application';
import type { RuntimeAdapter, RuntimeLogger } from '@cairn/runtime-gateway';
import type { CodexRuntimeAdapterOptions } from '@cairn/runtime-gateway/adapters/codex';

export interface WorkspaceCoreRuntimeConfig {
  runtime: 'mock' | 'codex';
  runtimeWorkdir: string;
  codexExecutable?: string | undefined;
  codexSandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access' | undefined;
}

export interface WorkspaceCoreRuntimeGateway {
  gateway: RuntimeGatewayPort;
  close?: () => Promise<void>;
}

export interface WorkspaceCoreRuntimeGatewayFactoryOverrides {
  createCodexAdapter?: (options: CodexRuntimeAdapterOptions) => RuntimeAdapter;
  logger?: RuntimeLogger;
  resolveArtifactPayload?: CodexRuntimeAdapterOptions['resolveArtifactPayload'];
}

const noopLogger: RuntimeLogger = {
  debug() {
    return;
  },
  info() {
    return;
  },
  warn() {
    return;
  },
  error() {
    return;
  },
};

export const createWorkspaceCoreRuntimeGateway = async (
  config: WorkspaceCoreRuntimeConfig,
  overrides: WorkspaceCoreRuntimeGatewayFactoryOverrides = {},
): Promise<WorkspaceCoreRuntimeGateway> => {
  if (config.runtime === 'mock') {
    return { gateway: new MockRuntimeGatewayPort() };
  }

  const codexOptions: CodexRuntimeAdapterOptions = {
    ...(config.codexExecutable === undefined ? {} : { executable: config.codexExecutable }),
    ...(config.codexSandboxMode === undefined ? {} : { sandboxMode: config.codexSandboxMode }),
    ...(overrides.resolveArtifactPayload === undefined
      ? {}
      : { resolveArtifactPayload: overrides.resolveArtifactPayload }),
  };

  const adapter =
    overrides.createCodexAdapter?.(codexOptions) ?? createCodexRuntimeAdapter(codexOptions);

  await mkdir(config.runtimeWorkdir, { recursive: true });

  await adapter.init({
    workdir: config.runtimeWorkdir,
    logger: overrides.logger ?? noopLogger,
    secrets: {
      async get() {
        await Promise.resolve();
        return undefined;
      },
    },
    config: {
      ...(config.codexExecutable === undefined ? {} : { executable: config.codexExecutable }),
      ...(config.codexSandboxMode === undefined ? {} : { sandboxMode: config.codexSandboxMode }),
    },
  });

  return {
    gateway: new RuntimeAdapterGatewayPort(adapter),
    close: () => adapter.shutdown(),
  };
};
