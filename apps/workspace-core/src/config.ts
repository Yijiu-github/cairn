// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

const WorkspaceCoreConfig = z.object({
  host: z.string().min(1).default('127.0.0.1'),
  port: z.coerce.number().int().min(1).max(65_535).default(4321),
});

export interface WorkspaceCoreConfig {
  host: string;
  port: number;
}

export const readWorkspaceCoreConfig = (
  env: Record<string, string | undefined>,
): WorkspaceCoreConfig =>
  WorkspaceCoreConfig.parse({
    host: env['CAIRN_WORKSPACE_CORE_HOST'],
    port: env['CAIRN_WORKSPACE_CORE_PORT'],
  });
