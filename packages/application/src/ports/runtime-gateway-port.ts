// SPDX-License-Identifier: Apache-2.0

import type {
  AdapterCancelAck,
  AdapterStreamEvent,
  AdapterSubmitAck,
  AdapterSubmitRequest,
} from '@cairn/runtime-gateway';
import type { AgentRunId } from '@cairn/shared-contracts/schemas';

export interface RuntimeGatewayPort {
  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck>;
  stream(runId: AgentRunId): AsyncIterable<AdapterStreamEvent>;
  cancel(runId: AgentRunId, reason?: string): Promise<AdapterCancelAck>;
}
