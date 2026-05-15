// SPDX-License-Identifier: Apache-2.0

import { ulid } from 'ulid';

import { OrchestrationRunService } from '@cairn/application';
import { InMemoryApplicationRepository } from '@cairn/application/testing';
import { EventId, WorkspaceId } from '@cairn/shared-contracts/schemas';
import { openSqliteStorage } from '@cairn/storage/sqlite';

import { MockRuntimeGatewayPort } from '../runtime/mock-runtime-gateway-port.js';
import { SqliteApplicationRepository } from '../storage/sqlite-application-repository.js';

import type {
  ApplicationIdFactory,
  ApplicationRepository,
  RuntimeGatewayPort,
} from '@cairn/application';
import type {
  AgentRunId,
  OrchestrationRunId,
  TaskId,
  TraceEventId,
  TraceId,
} from '@cairn/shared-contracts/schemas';

export interface WorkspaceCoreContainer {
  orchestrationRuns: OrchestrationRunService;
  repository: ApplicationRepository;
  runtimeGateway: RuntimeGatewayPort;
  close?: () => void;
}

export interface CreateDefaultWorkspaceCoreContainerOptions {
  databasePath?: string;
  bootstrapWorkspaceId?: string;
  bootstrapEventId?: string;
}

const createUlidFactory = (): ApplicationIdFactory => ({
  agentRunId: () => ulid() as AgentRunId,
  orchestrationRunId: () => ulid() as OrchestrationRunId,
  taskId: () => ulid() as TaskId,
  traceEventId: () => ulid() as TraceEventId,
  traceId: () => ulid() as TraceId,
});

export const createWorkspaceCoreContainer = (
  repository: ApplicationRepository,
  runtimeGateway: RuntimeGatewayPort,
  close?: () => void,
): WorkspaceCoreContainer => ({
  repository,
  runtimeGateway,
  ...(close === undefined ? {} : { close }),
  orchestrationRuns: new OrchestrationRunService({
    clock: { now: () => new Date() },
    ids: createUlidFactory(),
    repository,
    runtimeGateway,
  }),
});

export const createInMemoryWorkspaceCoreContainer = (): WorkspaceCoreContainer =>
  createWorkspaceCoreContainer(new InMemoryApplicationRepository(), new MockRuntimeGatewayPort());

export const createDefaultWorkspaceCoreContainer = (
  options: CreateDefaultWorkspaceCoreContainerOptions = {},
): WorkspaceCoreContainer => {
  if (options.databasePath === undefined) {
    return createInMemoryWorkspaceCoreContainer();
  }

  const storage = openSqliteStorage({ databasePath: options.databasePath });
  const repository = new SqliteApplicationRepository(storage.db);
  repository.migrate();
  repository.ensureBootstrapWorkspace({
    workspaceId: WorkspaceId.parse(options.bootstrapWorkspaceId ?? '01J000000000000000000000W0'),
    originEventId: EventId.parse(options.bootstrapEventId ?? '01J000000000000000000000E0'),
  });

  return createWorkspaceCoreContainer(repository, new MockRuntimeGatewayPort(), () => {
    storage.close();
  });
};
