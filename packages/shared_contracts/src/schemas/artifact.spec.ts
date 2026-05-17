// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import {
  artifactPayloadRefSchema,
  artifactPayloadResponseSchema,
  artifactSchema,
} from './artifact.js';

const baseArtifact = {
  artifactId: VALID_ULIDS.artifact,
  workspaceId: VALID_ULIDS.workspace,
  orchestrationRunId: VALID_ULIDS.orchestrationRun,
  taskId: VALID_ULIDS.task,
  runId: VALID_ULIDS.agentRun,
  artifactRole: 'output' as const,
  kind: 'text' as const,
  formatVersion: 'text.v1',
  uriOrPath: 'artifacts/runtime-output.txt',
  contentType: 'text/plain',
  producerType: 'agent' as const,
  producerId: 'worker-1',
  visibility: 'public' as const,
  createdAt: '2026-05-17T01:00:00.000Z',
};

describe('artifactSchema', () => {
  it('accepts payload metadata with an opaque artifact payload ref and no sensitivity', () => {
    const parsed = artifactSchema.parse({
      ...baseArtifact,
      payloadRef: 'artifact-payload://workspace/run/artifact/runtime-output.txt',
      sensitivity: 'none',
    });

    expect(parsed.payloadRef).toBe('artifact-payload://workspace/run/artifact/runtime-output.txt');
    expect(parsed.sensitivity).toBe('none');
  });

  it('defaults payload sensitivity to none', () => {
    expect(artifactSchema.parse(baseArtifact).sensitivity).toBe('none');
  });
});

describe('artifactPayloadRefSchema', () => {
  it('rejects absolute-path-looking payload refs', () => {
    expect(
      artifactPayloadRefSchema.safeParse('artifact-payload:///Users/alice/project/output.txt')
        .success,
    ).toBe(false);
  });

  it('rejects traversal payload refs', () => {
    expect(
      artifactPayloadRefSchema.safeParse('artifact-payload://workspace/../secret.txt').success,
    ).toBe(false);
  });
});

describe('artifactPayloadResponseSchema', () => {
  it('rejects artifact payload text above the bounded read limit', () => {
    expect(
      artifactPayloadResponseSchema.safeParse({
        artifactId: VALID_ULIDS.artifact,
        mediaType: 'text/plain',
        text: 'x'.repeat(262_145),
        truncated: false,
      }).success,
    ).toBe(false);
  });
});
