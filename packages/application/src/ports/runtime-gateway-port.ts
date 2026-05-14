// SPDX-License-Identifier: Apache-2.0

import type { AdapterSubmitAck, AdapterSubmitRequest } from '@cairn/runtime-gateway';

export interface RuntimeGatewayPort {
  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck>;
}
