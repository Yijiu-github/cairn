// SPDX-License-Identifier: Apache-2.0

import path from 'node:path';

import { ulid } from 'ulid';

import {
  CodeContextService,
  OrchestrationRunService,
  PlanningOutputService,
} from '@cairn/application';
import { InMemoryApplicationRepository } from '@cairn/application/testing';
import { EventId, WorkspaceId } from '@cairn/shared-contracts/schemas';
import { openSqliteStorage } from '@cairn/storage/sqlite';

import { LocalArtifactStore } from '../artifacts/local-artifact-store.js';
import { LocalCodeIndexScanner } from '../code-context/local-code-index-scanner.js';
import { MockRuntimeGatewayPort } from '../runtime/mock-runtime-gateway-port.js';
import { SqliteApplicationRepository } from '../storage/sqlite-application-repository.js';

import type {
  ApplicationIdFactory,
  ApplicationRepository,
  ArtifactStorePort,
  CodeContextIdFactory,
  CodeContextScannerPort,
  RuntimeGatewayPort,
} from '@cairn/application';
import type {
  AgentRunId,
  ArtifactId,
  CodeIndexFileId,
  CodeIndexSnapshotId,
  ContextPackId,
  OrchestrationRunId,
  PlanningOutputId,
  SourceRootId,
  TaskId,
  TraceEventId,
  TraceId,
} from '@cairn/shared-contracts/schemas';

const DEFAULT_ARTIFACT_MAX_INLINE_BYTES = 262_144;
const DEFAULT_LOCAL_ARTIFACT_ROOT = '.cairn/artifacts';

export interface WorkspaceCoreContainer {
  codeContext: CodeContextService;
  planningOutputs: PlanningOutputService;
  orchestrationRuns: OrchestrationRunService;
  repository: ApplicationRepository;
  artifactStore: ArtifactStorePort;
  runtimeGateway: RuntimeGatewayPort;
  close?: () => void;
}

export interface CreateDefaultWorkspaceCoreContainerOptions {
  databasePath?: string;
  bootstrapWorkspaceId?: string;
  bootstrapEventId?: string;
  artifactRootDir?: string;
  artifactStore?: ArtifactStorePort;
  codeContextScanner?: CodeContextScannerPort;
  runtimeGateway?: RuntimeGatewayPort;
}

const createUlidFactory = (): ApplicationIdFactory & CodeContextIdFactory => ({
  agentRunId: () => ulid() as AgentRunId,
  artifactId: () => ulid() as ArtifactId,
  codeIndexFileId: () => ulid() as CodeIndexFileId,
  codeIndexSnapshotId: () => ulid() as CodeIndexSnapshotId,
  contextPackId: () => ulid() as ContextPackId,
  orchestrationRunId: () => ulid() as OrchestrationRunId,
  planningOutputId: () => ulid() as PlanningOutputId,
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
  artifactStore: ArtifactStorePort = createWorkspaceCoreLocalArtifactStore(
    DEFAULT_LOCAL_ARTIFACT_ROOT,
  ),
): WorkspaceCoreContainer => {
  const clock = { now: () => new Date() };
  const ids = createUlidFactory();

  return {
    repository,
    artifactStore,
    runtimeGateway,
    ...(close === undefined ? {} : { close }),
    codeContext: new CodeContextService({
      clock,
      ids,
      repository,
      scanner,
    }),
    planningOutputs: new PlanningOutputService({
      clock,
      ids,
      repository,
    }),
    orchestrationRuns: new OrchestrationRunService({
      clock,
      ids,
      artifactStore,
      repository,
      runtimeGateway,
    }),
  };
};

export const createInMemoryWorkspaceCoreContainer = (): WorkspaceCoreContainer =>
  createWorkspaceCoreContainer(new InMemoryApplicationRepository(), new MockRuntimeGatewayPort());

export const createInMemoryWorkspaceCoreContainerWithRuntime = (
  runtimeGateway: RuntimeGatewayPort,
  scanner?: CodeContextScannerPort,
): WorkspaceCoreContainer =>
  createWorkspaceCoreContainer(
    new InMemoryApplicationRepository(),
    runtimeGateway,
    undefined,
    scanner,
  );

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
    const artifactStore =
      options.artifactStore ?? createWorkspaceCoreLocalArtifactStore(DEFAULT_LOCAL_ARTIFACT_ROOT);

    if (options.runtimeGateway !== undefined) {
      return createWorkspaceCoreContainer(
        new InMemoryApplicationRepository(),
        options.runtimeGateway,
        undefined,
        options.codeContextScanner,
        artifactStore,
      );
    }

    if (options.codeContextScanner === undefined) {
      return createWorkspaceCoreContainer(
        new InMemoryApplicationRepository(),
        new MockRuntimeGatewayPort(),
        undefined,
        undefined,
        artifactStore,
      );
    }

    return createWorkspaceCoreContainer(
      new InMemoryApplicationRepository(),
      new MockRuntimeGatewayPort(),
      undefined,
      options.codeContextScanner,
      artifactStore,
    );
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
    options.runtimeGateway ?? new MockRuntimeGatewayPort(),
    () => {
      storage.close();
    },
    options.codeContextScanner,
    options.artifactStore ??
      createWorkspaceCoreLocalArtifactStore(
        options.artifactRootDir ?? defaultArtifactRootDir(options.databasePath),
      ),
  );
};

export const defaultArtifactRootDir = (databasePath: string): string =>
  path.join(path.dirname(databasePath), '.cairn/artifacts');

export const createWorkspaceCoreLocalArtifactStore = (rootDir: string): LocalArtifactStore =>
  new LocalArtifactStore({
    rootDir,
    maxInlineBytes: DEFAULT_ARTIFACT_MAX_INLINE_BYTES,
  });
