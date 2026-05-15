// SPDX-License-Identifier: Apache-2.0

import type { RuntimeGatewayPort } from '@cairn/application';
import type { AdapterSubmitAck, AdapterSubmitRequest } from '@cairn/runtime-gateway';

export class MockRuntimeGatewayPort implements RuntimeGatewayPort {
  readonly submissions: AdapterSubmitRequest[] = [];

  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    this.submissions.push(request);
    return Promise.resolve({
      runId: request.runId,
      accepted: true,
      providerRunId: `mock:${request.runId}`,
    });
  }
}
