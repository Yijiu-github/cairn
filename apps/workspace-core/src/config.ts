// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

const WorkspaceCoreConfig = z.object({
  host: z.string().min(1).default('127.0.0.1'),
  port: z.coerce.number().int().min(1).max(65_535).default(4321),
  databasePath: z.string().min(1).default('.cairn/workspace-core.sqlite'),
  bootstrapWorkspaceId: z.string().min(1).default('01J000000000000000000000W0'),
  bootstrapEventId: z.string().min(1).default('01J000000000000000000000E0'),
  runtime: z.enum(['mock', 'codex']).default('mock'),
  runtimeWorkdir: z.string().min(1).default('.cairn/runtime'),
  codexExecutable: z.string().min(1).optional(),
  codexSandboxMode: z.enum(['read-only', 'workspace-write', 'danger-full-access']).optional(),
});

export interface WorkspaceCoreConfig {
  host: string;
  port: number;
  databasePath: string;
  bootstrapWorkspaceId: string;
  bootstrapEventId: string;
  runtime: 'mock' | 'codex';
  runtimeWorkdir: string;
  codexExecutable?: string | undefined;
  codexSandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access' | undefined;
}

export const readWorkspaceCoreConfig = (
  env: Record<string, string | undefined>,
): WorkspaceCoreConfig =>
  WorkspaceCoreConfig.parse({
    host: env['CAIRN_WORKSPACE_CORE_HOST'],
    port: env['CAIRN_WORKSPACE_CORE_PORT'],
    databasePath: env['CAIRN_WORKSPACE_CORE_DB_PATH'],
    bootstrapWorkspaceId: env['CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID'],
    bootstrapEventId: env['CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID'],
    runtime: env['CAIRN_WORKSPACE_CORE_RUNTIME'],
    runtimeWorkdir: env['CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR'],
    codexExecutable: env['CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE'],
    codexSandboxMode: env['CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE'],
  });
