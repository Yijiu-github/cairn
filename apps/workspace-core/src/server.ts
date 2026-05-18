// SPDX-License-Identifier: Apache-2.0

import { env } from 'node:process';

import { readWorkspaceCoreConfig } from './config.js';
import { createWorkspaceCoreRuntimeGateway } from './runtime/runtime-gateway-factory.js';
import { createWorkspaceCoreApp } from './service/app.js';
import { createDefaultWorkspaceCoreContainer } from './service/container.js';

const config = readWorkspaceCoreConfig({
  CAIRN_WORKSPACE_CORE_HOST: env['CAIRN_WORKSPACE_CORE_HOST'],
  CAIRN_WORKSPACE_CORE_PORT: env['CAIRN_WORKSPACE_CORE_PORT'],
  CAIRN_WORKSPACE_CORE_DB_PATH: env['CAIRN_WORKSPACE_CORE_DB_PATH'],
  CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID: env['CAIRN_WORKSPACE_CORE_BOOTSTRAP_WORKSPACE_ID'],
  CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID: env['CAIRN_WORKSPACE_CORE_BOOTSTRAP_EVENT_ID'],
  CAIRN_WORKSPACE_CORE_RUNTIME: env['CAIRN_WORKSPACE_CORE_RUNTIME'],
  CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR: env['CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR'],
  CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE: env['CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE'],
  CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE: env['CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE'],
});

const runtime = await createWorkspaceCoreRuntimeGateway(config);
const container = createDefaultWorkspaceCoreContainer({
  databasePath: config.databasePath,
  bootstrapWorkspaceId: config.bootstrapWorkspaceId,
  bootstrapEventId: config.bootstrapEventId,
  runtimeGateway: runtime.gateway,
});

const app = await createWorkspaceCoreApp({
  container,
});

app.addHook('onClose', async () => {
  container.close?.();
  await runtime.close?.();
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error({ error }, 'workspace-core failed to start');
  await app.close();
  throw error;
}
