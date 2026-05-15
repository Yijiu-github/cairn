// SPDX-License-Identifier: Apache-2.0

import { ulid } from 'ulid';

import { OrchestrationRunService } from '@cairn/application';
import { InMemoryApplicationRepository } from '@cairn/application/testing';

import { MockRuntimeGatewayPort } from '../runtime/mock-runtime-gateway-port.js';

import type {
  ApplicationIdFactory,
  ApplicationRepository,
  RuntimeGatewayPort,
} from '@cairn/application';
import type {
  AgentRunId,
  OrchestrationRunId,
  TaskId,
  TraceEventId,
  TraceId,
} from '@cairn/shared-contracts/schemas';

export interface WorkspaceCoreContainer {
  orchestrationRuns: OrchestrationRunService;
  repository: ApplicationRepository;
  runtimeGateway: RuntimeGatewayPort;
}

const createUlidFactory = (): ApplicationIdFactory => ({
  agentRunId: () => ulid() as AgentRunId,
  orchestrationRunId: () => ulid() as OrchestrationRunId,
  taskId: () => ulid() as TaskId,
  traceEventId: () => ulid() as TraceEventId,
  traceId: () => ulid() as TraceId,
});

export const createWorkspaceCoreContainer = (
  repository: ApplicationRepository,
  runtimeGateway: RuntimeGatewayPort,
): WorkspaceCoreContainer => ({
  repository,
  runtimeGateway,
  orchestrationRuns: new OrchestrationRunService({
    clock: { now: () => new Date() },
    ids: createUlidFactory(),
    repository,
    runtimeGateway,
  }),
});

export const createDefaultWorkspaceCoreContainer = (): WorkspaceCoreContainer =>
  createWorkspaceCoreContainer(new InMemoryApplicationRepository(), new MockRuntimeGatewayPort());
