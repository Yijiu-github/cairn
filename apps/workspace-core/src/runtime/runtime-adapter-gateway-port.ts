// SPDX-License-Identifier: Apache-2.0

import type { RuntimeGatewayPort } from '@cairn/application';
import type {
  AdapterCancelAck,
  AdapterStreamEvent,
  AdapterSubmitAck,
  AdapterSubmitRequest,
  RuntimeAdapter,
} from '@cairn/runtime-gateway';
import type { AgentRunId } from '@cairn/shared-contracts/schemas';

export class RuntimeAdapterGatewayPort implements RuntimeGatewayPort {
  constructor(private readonly adapter: RuntimeAdapter) {}

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    return this.adapter.submit(request);
  }

  stream(runId: AgentRunId): AsyncIterable<AdapterStreamEvent> {
    return this.adapter.stream(runId);
  }

  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck> {
    return this.adapter.cancel(runId, reason);
  }
}
