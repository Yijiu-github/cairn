// SPDX-License-Identifier: Apache-2.0
/**
 * Runtime Gateway 测试夹具。
 */

import type { AdapterContext, AdapterSubmitRequest, RuntimeLogger } from '../runtime-adapter.js';
import type { ArtifactRef } from '@cairn/shared-contracts/schemas';

export const TEST_IDS = {
  runId: '01HZZZZZZZZZZZZZZZZZZZZZA0',
  traceId: '01HZZZZZZZZZZZZZZZZZZZZZX0',
  artifactId: '01HZZZZZZZZZZZZZZZZZZZZZF0',
} as const;

const sinkLog = (_message: string, _fields?: Record<string, unknown>) => {
  return;
};

export const createNoopRuntimeLogger = (): RuntimeLogger => ({
  debug: sinkLog,
  info: sinkLog,
  warn: sinkLog,
  error: sinkLog,
});

export const createTestAdapterContext = (): AdapterContext => ({
  workdir: '/tmp/cairn-runtime-gateway-test',
  config: {},
  secrets: {
    async get() {
      await Promise.resolve();
      return undefined;
    },
  },
  logger: createNoopRuntimeLogger(),
});

export const createTestArtifactRef = (): ArtifactRef => ({
  artifactId: TEST_IDS.artifactId,
  uri: 'memory://artifact/input',
  contentType: 'text/plain',
});

export const createTestSubmitRequest = (
  overrides: Partial<AdapterSubmitRequest> = {},
): AdapterSubmitRequest => ({
  runId: TEST_IDS.runId,
  model: 'mock-model',
  inputs: [createTestArtifactRef()],
  traceId: TEST_IDS.traceId,
  ...overrides,
});
