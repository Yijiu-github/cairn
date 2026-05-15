// SPDX-License-Identifier: Apache-2.0

import { env } from 'node:process';

import { readWorkspaceCoreConfig } from './config.js';
import { createWorkspaceCoreApp } from './service/app.js';
import { createDefaultWorkspaceCoreContainer } from './service/container.js';

const config = readWorkspaceCoreConfig({
  CAIRN_WORKSPACE_CORE_HOST: env['CAIRN_WORKSPACE_CORE_HOST'],
  CAIRN_WORKSPACE_CORE_PORT: env['CAIRN_WORKSPACE_CORE_PORT'],
  CAIRN_WORKSPACE_CORE_DB_PATH: env['CAIRN_WORKSPACE_CORE_DB_PATH'],
  CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID: env['CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID'],
  CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID: env['CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID'],
});

const container = createDefaultWorkspaceCoreContainer({
  databasePath: config.databasePath,
  bootstrapWorkspaceId: config.bootstrapWorkspaceId,
  bootstrapEventId: config.bootstrapEventId,
});

const app = await createWorkspaceCoreApp({
  container,
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error({ error }, 'workspace-core failed to start');
  await app.close();
  container.close?.();
  throw error;
}
