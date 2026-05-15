// SPDX-License-Identifier: Apache-2.0

import { ApplicationError } from '../errors.js';

import type { ApplicationClock } from '../orchestration/orchestration-run-service.js';
import type { ApplicationRepository } from '../ports/run-repository.js';
import type {
  CodeIndexSnapshot,
  CodeIndexSnapshotId,
  ContextPackCreate,
  ContextPackId,
  ContextPackManifest,
  SourceRoot,
  SourceRootCreate,
  SourceRootId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

export interface CodeContextIdFactory {
  codeIndexSnapshotId(): CodeIndexSnapshotId;
  contextPackId(): ContextPackId;
  sourceRootId(): SourceRootId;
}

export interface CodeContextServiceDependencies {
  clock: ApplicationClock;
  ids: CodeContextIdFactory;
  repository: ApplicationRepository;
}

export interface RegisterSourceRootInput {
  workspaceId: WorkspaceId;
  sourceRoot: SourceRootCreate;
}

export interface RegisterSourceRootResult {
  sourceRoot: SourceRoot;
  initialSnapshot: CodeIndexSnapshot;
}

export interface ListSourceRootsInput {
  workspaceId: WorkspaceId;
}

export interface CreateContextPackInput {
  workspaceId: WorkspaceId;
  contextPack: ContextPackCreate;
}

const INDEX_VERSION_R1A = 'r1a-manifest-only';

const toIso = (date: Date): string => date.toISOString();

export class CodeContextService {
  private readonly clock: ApplicationClock;
  private readonly ids: CodeContextIdFactory;
  private readonly repository: ApplicationRepository;

  constructor(dependencies: CodeContextServiceDependencies) {
    this.clock = dependencies.clock;
    this.ids = dependencies.ids;
    this.repository = dependencies.repository;
  }

  async registerSourceRoot(input: RegisterSourceRootInput): Promise<RegisterSourceRootResult> {
    const now = toIso(this.clock.now());
    const sourceRoot: SourceRoot = {
      sourceRootId: this.ids.sourceRootId(),
      workspaceId: input.workspaceId,
      kind: input.sourceRoot.kind,
      displayName: input.sourceRoot.displayName,
      uri: input.sourceRoot.uri,
      status: 'active',
      includeGlobs: input.sourceRoot.includeGlobs,
      excludeGlobs: input.sourceRoot.excludeGlobs,
      createdAt: now,
      updatedAt: now,
      ...(input.sourceRoot.metadata === undefined ? {} : { metadata: input.sourceRoot.metadata }),
    };

    const initialSnapshot: CodeIndexSnapshot = {
      snapshotId: this.ids.codeIndexSnapshotId(),
      sourceRootId: sourceRoot.sourceRootId,
      workspaceId: input.workspaceId,
      status: 'pending',
      indexVersion: INDEX_VERSION_R1A,
      fileCount: 0,
      createdAt: now,
      metadata: {
        reason: 'r1a-source-root-registration',
      },
    };

    await this.repository.createSourceRootRegistration({ sourceRoot, initialSnapshot });
    return { sourceRoot, initialSnapshot };
  }

  listSourceRoots(input: ListSourceRootsInput): Promise<SourceRoot[]> {
    return this.repository.listSourceRootsByWorkspace(input.workspaceId);
  }

  async createContextPack(input: CreateContextPackInput): Promise<ContextPackManifest> {
    await this.assertSourceRootsBelongToWorkspace(
      input.workspaceId,
      input.contextPack.sourceRootIds,
    );
    await this.assertTargetExists(input.contextPack.createdFor);

    const manifest: ContextPackManifest = {
      contextPackId: this.ids.contextPackId(),
      workspaceId: input.workspaceId,
      sourceRootIds: input.contextPack.sourceRootIds,
      createdFor: input.contextPack.createdFor,
      query: input.contextPack.query,
      items: input.contextPack.items,
      createdAt: toIso(this.clock.now()),
      ...(input.contextPack.tokenEstimate === undefined
        ? {}
        : { tokenEstimate: input.contextPack.tokenEstimate }),
    };

    await this.repository.createContextPack(manifest);
    return manifest;
  }

  private async assertSourceRootsBelongToWorkspace(
    workspaceId: WorkspaceId,
    sourceRootIds: SourceRootId[],
  ): Promise<void> {
    if (sourceRootIds.length === 0) {
      return;
    }

    const sourceRoots = await this.repository.listSourceRootsByWorkspace(workspaceId);
    const knownIds = new Set(sourceRoots.map((sourceRoot) => sourceRoot.sourceRootId));
    const missingIds = sourceRootIds.filter((sourceRootId) => !knownIds.has(sourceRootId));

    if (missingIds.length > 0) {
      throw new ApplicationError(
        'SOURCE_ROOT_NOT_FOUND',
        `SourceRoot does not belong to workspace: ${missingIds.join(', ')}`,
      );
    }
  }

  private async assertTargetExists(target: ContextPackCreate['createdFor']): Promise<void> {
    if (target.type === 'orchestration_run') {
      const run = await this.repository.getRun(target.orchestrationRunId);
      if (run === undefined) {
        throw new ApplicationError(
          'MISSING_ORCHESTRATION_RUN',
          `Missing orchestration run: ${target.orchestrationRunId}`,
        );
      }
      return;
    }

    const task = await this.repository.getTask(target.taskId);
    if (task === undefined) {
      throw new ApplicationError('MISSING_TASK', `Missing task: ${target.taskId}`);
    }
  }
}
