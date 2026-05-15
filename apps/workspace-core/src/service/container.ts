// SPDX-License-Identifier: Apache-2.0

import { ulid } from 'ulid';

import { CodeContextService, OrchestrationRunService } from '@cairn/application';
import { InMemoryApplicationRepository } from '@cairn/application/testing';
import { EventId, WorkspaceId } from '@cairn/shared-contracts/schemas';
import { openSqliteStorage } from '@cairn/storage/sqlite';

import { LocalCodeIndexScanner } from '../code-context/local-code-index-scanner.js';
import { MockRuntimeGatewayPort } from '../runtime/mock-runtime-gateway-port.js';
import { SqliteApplicationRepository } from '../storage/sqlite-application-repository.js';

import type {
  ApplicationIdFactory,
  ApplicationRepository,
  CodeContextIdFactory,
  CodeContextScannerPort,
  RuntimeGatewayPort,
} from '@cairn/application';
import type {
  AgentRunId,
  CodeIndexFileId,
  CodeIndexSnapshotId,
  ContextPackId,
  OrchestrationRunId,
  SourceRootId,
  TaskId,
  TraceEventId,
  TraceId,
} from '@cairn/shared-contracts/schemas';

export interface WorkspaceCoreContainer {
  codeContext: CodeContextService;
  orchestrationRuns: OrchestrationRunService;
  repository: ApplicationRepository;
  runtimeGateway: RuntimeGatewayPort;
  close?: () => void;
}

export interface CreateDefaultWorkspaceCoreContainerOptions {
  databasePath?: string;
  bootstrapWorkspaceId?: string;
  bootstrapEventId?: string;
  codeContextScanner?: CodeContextScannerPort;
}

const createUlidFactory = (): ApplicationIdFactory & CodeContextIdFactory => ({
  agentRunId: () => ulid() as AgentRunId,
  codeIndexFileId: () => ulid() as CodeIndexFileId,
  codeIndexSnapshotId: () => ulid() as CodeIndexSnapshotId,
  contextPackId: () => ulid() as ContextPackId,
  orchestrationRunId: () => ulid() as OrchestrationRunId,
  sourceRootId: () => ulid() as SourceRootId,
  taskId: () => ulid() as TaskId,
  traceEventId: () => ulid() as TraceEventId,
  traceId: () => ulid() as TraceId,
});

export const createWorkspaceCoreContainer = (
  repository: ApplicationRepository,
  runtimeGateway: RuntimeGatewayPort,
  close?: () => void,
  scanner: CodeContextScannerPort = new LocalCodeIndexScanner(),
): WorkspaceCoreContainer => {
  const clock = { now: () => new Date() };
  const ids = createUlidFactory();

  return {
    repository,
    runtimeGateway,
    ...(close === undefined ? {} : { close }),
    codeContext: new CodeContextService({
      clock,
      ids,
      repository,
      scanner,
    }),
    orchestrationRuns: new OrchestrationRunService({
      clock,
      ids,
      repository,
      runtimeGateway,
    }),
  };
};

export const createInMemoryWorkspaceCoreContainer = (): WorkspaceCoreContainer =>
  createWorkspaceCoreContainer(new InMemoryApplicationRepository(), new MockRuntimeGatewayPort());

export const createInMemoryWorkspaceCoreContainerWithScanner = (
  scanner: CodeContextScannerPort,
): WorkspaceCoreContainer =>
  createWorkspaceCoreContainer(
    new InMemoryApplicationRepository(),
    new MockRuntimeGatewayPort(),
    undefined,
    scanner,
  );

export const createDefaultWorkspaceCoreContainer = (
  options: CreateDefaultWorkspaceCoreContainerOptions = {},
): WorkspaceCoreContainer => {
  if (options.databasePath === undefined) {
    if (options.codeContextScanner === undefined) {
      return createInMemoryWorkspaceCoreContainer();
    }

    return createInMemoryWorkspaceCoreContainerWithScanner(options.codeContextScanner);
  }

  const storage = openSqliteStorage({ databasePath: options.databasePath });
  const repository = new SqliteApplicationRepository(storage.db);
  repository.migrate();
  repository.ensureBootstrapWorkspace({
    workspaceId: WorkspaceId.parse(options.bootstrapWorkspaceId ?? '01J000000000000000000000W0'),
    originEventId: EventId.parse(options.bootstrapEventId ?? '01J000000000000000000000E0'),
  });

  return createWorkspaceCoreContainer(
    repository,
    new MockRuntimeGatewayPort(),
    () => {
      storage.close();
    },
    options.codeContextScanner,
  );
};
