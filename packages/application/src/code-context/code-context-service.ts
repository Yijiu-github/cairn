// SPDX-License-Identifier: Apache-2.0

import { ApplicationError } from '../errors.js';

import type { ApplicationClock } from '../orchestration/orchestration-run-service.js';
import type { ApplicationRepository } from '../ports/run-repository.js';
import type {
  CodeIndexFile,
  CodeIndexFileId,
  CodeIndexReindexResult,
  CodeIndexSnapshot,
  CodeIndexSnapshotId,
  CodeIndexSnapshotDetail,
  CodeSearchQuery,
  CodeSearchResult,
  ContextPackCreate,
  ContextPackFromCodeSearchCreate,
  ContextPackItem,
  ContextPackId,
  ContextPackManifest,
  SourceRoot,
  SourceRootCreate,
  SourceRootId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

export interface CodeContextIdFactory {
  codeIndexFileId(): CodeIndexFileId;
  codeIndexSnapshotId(): CodeIndexSnapshotId;
  contextPackId(): ContextPackId;
  sourceRootId(): SourceRootId;
}

export interface CodeContextScannerPort {
  scan(sourceRoot: SourceRoot): Promise<CodeContextScannerFile[]>;
}

export interface CodeContextScannerFile {
  path: string;
  sizeBytes: number;
  mtimeMs: number;
  digest: string;
  language?: string;
}

export interface CodeContextServiceDependencies {
  clock: ApplicationClock;
  ids: CodeContextIdFactory;
  repository: ApplicationRepository;
  scanner: CodeContextScannerPort;
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

export interface CreateContextPackFromCodeSearchInput {
  workspaceId: WorkspaceId;
  contextPack: ContextPackFromCodeSearchCreate;
}

export interface ReindexSourceRootInput {
  sourceRootId: SourceRootId;
}

export interface GetSourceRootIndexInput {
  sourceRootId: SourceRootId;
}

export type SearchCodeIndexInput = CodeSearchQuery;

const INDEX_VERSION_R1A = 'r1a-manifest-only';
const INDEX_VERSION_R1B_FILE_MANIFEST = 'r1b-file-manifest';

const toIso = (date: Date): string => date.toISOString();

export class CodeContextService {
  private readonly clock: ApplicationClock;
  private readonly ids: CodeContextIdFactory;
  private readonly repository: ApplicationRepository;
  private readonly scanner: CodeContextScannerPort;

  constructor(dependencies: CodeContextServiceDependencies) {
    this.clock = dependencies.clock;
    this.ids = dependencies.ids;
    this.repository = dependencies.repository;
    this.scanner = dependencies.scanner;
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

  async reindexSourceRoot(input: ReindexSourceRootInput): Promise<CodeIndexReindexResult> {
    const existing = await this.requireSourceRoot(input.sourceRootId);
    const indexingAt = toIso(this.clock.now());
    await this.repository.updateSourceRoot({
      ...existing,
      status: 'indexing',
      error: undefined,
      updatedAt: indexingAt,
    });

    try {
      const scannedFiles = await this.scanner.scan(existing);
      const createdAt = toIso(this.clock.now());
      const snapshot: CodeIndexSnapshot = {
        snapshotId: this.ids.codeIndexSnapshotId(),
        sourceRootId: existing.sourceRootId,
        workspaceId: existing.workspaceId,
        status: 'ready',
        indexVersion: INDEX_VERSION_R1B_FILE_MANIFEST,
        fileCount: scannedFiles.length,
        createdAt,
        metadata: {
          reason: 'manual-reindex',
        },
      };
      const files = scannedFiles.map((file): CodeIndexFile => {
        const indexedFile: CodeIndexFile = {
          fileId: this.ids.codeIndexFileId(),
          snapshotId: snapshot.snapshotId,
          sourceRootId: existing.sourceRootId,
          workspaceId: existing.workspaceId,
          path: file.path,
          sizeBytes: file.sizeBytes,
          mtimeMs: file.mtimeMs,
          digest: file.digest,
          ignored: false,
          createdAt,
          ...(file.language === undefined ? {} : { language: file.language }),
        };
        return indexedFile;
      });
      const sourceRoot: SourceRoot = {
        ...existing,
        status: 'active',
        updatedAt: createdAt,
        lastIndexedAt: createdAt,
        error: undefined,
      };

      await this.repository.replaceCodeIndexSnapshot({ sourceRoot, snapshot, files });
      return { sourceRoot, snapshot, files };
    } catch (error) {
      const failedAt = toIso(this.clock.now());
      await this.repository.updateSourceRoot({
        ...existing,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown code index error.',
        updatedAt: failedAt,
      });
      throw error;
    }
  }

  async getSourceRootIndex(input: GetSourceRootIndexInput): Promise<CodeIndexSnapshotDetail> {
    const sourceRoot = await this.requireSourceRoot(input.sourceRootId);
    const snapshots = await this.repository.listCodeIndexSnapshotsBySourceRoot(input.sourceRootId);
    const latestSnapshot = snapshots.toSorted((a, b) => {
      const createdAtOrder = b.createdAt.localeCompare(a.createdAt);
      if (createdAtOrder !== 0) {
        return createdAtOrder;
      }

      return snapshotStatusRank(b.status) - snapshotStatusRank(a.status);
    })[0];

    if (latestSnapshot === undefined) {
      return { sourceRoot, files: [] };
    }

    const files = await this.repository.listCodeIndexFilesBySnapshot(latestSnapshot.snapshotId);
    return { sourceRoot, latestSnapshot, files };
  }

  async searchCodeIndex(input: SearchCodeIndexInput): Promise<CodeSearchResult> {
    if (input.sourceRootId !== undefined) {
      await this.assertSourceRootsBelongToWorkspace(input.workspaceId, [input.sourceRootId]);
    }

    const items = await this.repository.searchCodeIndexFiles(input);
    return { items };
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

  async createContextPackFromCodeSearch(
    input: CreateContextPackFromCodeSearchInput,
  ): Promise<ContextPackManifest> {
    if (input.contextPack.search.sourceRootId !== undefined) {
      await this.assertSourceRootsBelongToWorkspace(input.workspaceId, [
        input.contextPack.search.sourceRootId,
      ]);
    }
    await this.assertTargetExists(input.contextPack.createdFor);

    const files = await this.repository.searchCodeIndexFiles({
      workspaceId: input.workspaceId,
      ...input.contextPack.search,
    });
    const sourceRootIds = uniqueSourceRootIds(files);
    const items = files.map((file): ContextPackItem => toFileContextPackItem(file));
    const manifest: ContextPackManifest = {
      contextPackId: this.ids.contextPackId(),
      workspaceId: input.workspaceId,
      sourceRootIds,
      createdFor: input.contextPack.createdFor,
      query: input.contextPack.query,
      items,
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

  private async requireSourceRoot(sourceRootId: SourceRootId): Promise<SourceRoot> {
    const sourceRoot = await this.repository.getSourceRoot(sourceRootId);
    if (sourceRoot === undefined) {
      throw new ApplicationError('SOURCE_ROOT_NOT_FOUND', `Missing SourceRoot: ${sourceRootId}`);
    }
    return sourceRoot;
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

const snapshotStatusRank = (status: CodeIndexSnapshot['status']): number => {
  switch (status) {
    case 'ready':
      return 2;
    case 'pending':
      return 1;
    case 'error':
      return 0;
  }
};

const uniqueSourceRootIds = (files: CodeIndexFile[]): SourceRootId[] => [
  ...new Set(files.map((file) => file.sourceRootId)),
];

const toFileContextPackItem = (file: CodeIndexFile): ContextPackItem => ({
  kind: 'file_excerpt',
  sourceRootId: file.sourceRootId,
  path: file.path,
  digest: file.digest,
  reason: `Matched indexed file metadata: ${file.path}`,
  confidence: 'extracted',
});
