// SPDX-License-Identifier: Apache-2.0

import { env } from 'node:process';

import { readWorkspaceCoreConfig } from './config.js';
import { createWorkspaceCoreApp } from './service/app.js';
import { createDefaultWorkspaceCoreContainer } from './service/container.js';

const config = readWorkspaceCoreConfig({
  CAIRN_WORKSPACE_CORE_HOST: env['CAIRN_WORKSPACE_CORE_HOST'],
  CAIRN_WORKSPACE_CORE_PORT: env['CAIRN_WORKSPACE_CORE_PORT'],
});

const app = await createWorkspaceCoreApp({
  container: createDefaultWorkspaceCoreContainer(),
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error({ error }, 'workspace-core failed to start');
  await app.close();
  throw error;
}
