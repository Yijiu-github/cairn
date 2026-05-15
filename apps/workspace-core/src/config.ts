// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

const WorkspaceCoreConfig = z.object({
  host: z.string().min(1).default('127.0.0.1'),
  port: z.coerce.number().int().min(1).max(65_535).default(4321),
  databasePath: z.string().min(1).default('.cairn/workspace-core.sqlite'),
  bootstrapWorkspaceId: z.string().min(1).default('01J000000000000000000000W0'),
  bootstrapEventId: z.string().min(1).default('01J000000000000000000000E0'),
});

export interface WorkspaceCoreConfig {
  host: string;
  port: number;
  databasePath: string;
  bootstrapWorkspaceId: string;
  bootstrapEventId: string;
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
  });
