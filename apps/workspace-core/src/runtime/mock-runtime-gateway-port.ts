// SPDX-License-Identifier: Apache-2.0

import type { RuntimeGatewayPort } from '@cairn/application';
import type {
  AdapterCancelAck,
  AdapterStreamEvent,
  AdapterSubmitAck,
  AdapterSubmitRequest,
} from '@cairn/runtime-gateway';
import type { AgentRunId, ArtifactRef } from '@cairn/shared-contracts/schemas';

export class MockRuntimeGatewayPort implements RuntimeGatewayPort {
  readonly submissions: AdapterSubmitRequest[] = [];
  readonly cancelled: { runId: AgentRunId; reason?: string }[] = [];

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    this.submissions.push(request);
    return Promise.resolve({
      runId: request.runId,
      accepted: true,
      providerRunId: `mock:${request.runId}`,
    });
  }

  stream(runId: AgentRunId): AsyncIterable<AdapterStreamEvent> {
    const finalArtifactRef: ArtifactRef = { artifactId: `artifact:${runId}` };
    return {
      async *[Symbol.asyncIterator]() {
        await Promise.resolve();
        yield { type: 'queued', at: Date.parse('2026-05-14T01:00:01.000Z') };
        yield {
          type: 'started',
          at: Date.parse('2026-05-14T01:00:02.000Z'),
          providerRunId: `mock:${runId}`,
        };
        yield { type: 'heartbeat', at: Date.parse('2026-05-14T01:00:02.500Z') };
        yield {
          type: 'token',
          at: Date.parse('2026-05-14T01:00:02.750Z'),
          delta: 'mock response',
        };
        yield {
          type: 'succeeded',
          at: Date.parse('2026-05-14T01:00:03.000Z'),
          finalArtifactRef,
        };
      },
    };
  }

  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck> {
    this.cancelled.push(reason === undefined ? { runId } : { runId, reason });
    return Promise.resolve(
      reason === undefined ? { runId, cancelled: true } : { runId, cancelled: true, reason },
    );
  }
}
