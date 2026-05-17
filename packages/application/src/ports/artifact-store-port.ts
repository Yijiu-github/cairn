// SPDX-License-Identifier: Apache-2.0

import type { ArtifactId, OrchestrationRunId, WorkspaceId } from '@cairn/shared-contracts/schemas';

export interface WriteArtifactPayloadInput {
  artifactId: ArtifactId;
  workspaceId: WorkspaceId;
  orchestrationRunId: OrchestrationRunId;
  filename: string;
  mediaType: 'text/plain' | 'application/json';
  text: string;
  maxBytes: number;
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

export interface ArtifactStorePort {
  writeText(input: WriteArtifactPayloadInput): Promise<WriteArtifactPayloadResult>;
  readText(payloadRef: string): Promise<ReadArtifactPayloadResult>;
}
