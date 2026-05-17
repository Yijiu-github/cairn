// SPDX-License-Identifier: Apache-2.0

import type {
  AgentRunId,
  ArtifactKind,
  ArtifactId,
  ArtifactRef,
  OrchestrationRunId,
  TaskId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

export interface WriteArtifactPayloadInput {
  artifactId: ArtifactId;
  workspaceId: WorkspaceId;
  orchestrationRunId: OrchestrationRunId;
  filename: string;
  mediaType: 'text/plain' | 'application/json';
  text: string;
}

export interface WriteArtifactPayloadResult {
  payloadRef: string;
  byteLength: number;
  truncated: boolean;
}

export interface ReadArtifactPayloadResult {
  mediaType: 'text/plain' | 'application/json';
  text: string;
  truncated: boolean;
}

export interface RegisterRuntimeArtifactInput {
  workspaceId: WorkspaceId;
  orchestrationRunId: OrchestrationRunId;
  taskId?: TaskId;
  runId?: AgentRunId;
  artifact: {
    artifactRef: ArtifactRef;
    kind: ArtifactKind;
    role: 'input' | 'intermediate' | 'output' | 'summary' | 'trace';
    formatVersion: string;
    contentType?: string;
    sizeBytes?: number;
  };
}

export interface ArtifactStorePort {
  writeText(input: WriteArtifactPayloadInput): Promise<WriteArtifactPayloadResult>;
  readText(payloadRef: string): Promise<ReadArtifactPayloadResult>;
  registerRuntimeArtifact?(input: RegisterRuntimeArtifactInput): Promise<void>;
}
