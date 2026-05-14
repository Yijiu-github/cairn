// SPDX-License-Identifier: Apache-2.0
/**
 * RuntimeAdapter 主契约。
 */

import type { AdapterError } from './runtime-errors.js';
import type { AdapterStreamEvent } from './runtime-events.js';
import type { ArtifactKind, ArtifactRef, BudgetHint } from '@cairn/shared-contracts/schemas';

export interface ModelDescriptor {
  id: string;
  displayName?: string;
  contextWindowTokens?: number;
  outputTokens?: number;
}

export interface CapabilityProfile {
  streaming: boolean;
  cancellable: boolean;
  toolCalling: boolean;
  midStreamInjection: boolean;
  idempotent: boolean;
  maxContextTokens?: number;
  maxOutputTokens?: number;
  supportedArtifactKinds: ArtifactKind[];
  models: ModelDescriptor[];
}

export interface SecretAccessor {
  get(key: string): Promise<string | undefined>;
}

export interface RuntimeLogger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

export interface AdapterContext {
  secrets: SecretAccessor;
  workdir: string;
  logger: RuntimeLogger;
  config: Record<string, unknown>;
}

export interface ToolDescriptor {
  name: string;
  description?: string;
  inputSchemaRef?: ArtifactRef;
}

export interface AdapterSubmitRequest {
  /** Cairn 的 AgentRun.runId，作为外部幂等基准。 */
  runId: string;
  model: string;
  inputs: ArtifactRef[];
  tools?: ToolDescriptor[];
  timeoutMs?: number;
  budget?: BudgetHint;
  traceId: string;
  options?: Record<string, unknown>;
}

export interface AdapterSubmitAck {
  runId: string;
  accepted: boolean;
  providerRunId?: string;
  idempotentReplay?: boolean;
}

export interface AdapterCancelAck {
  runId: string;
  cancelled: boolean;
  reason?: string;
}

export type AdapterRunStatus =
  | 'submitted'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'unknown';

export interface AdapterRunSnapshot {
  runId: string;
  status: AdapterRunStatus;
  providerRunId?: string;
  lastEventAt?: number;
  finalArtifactRef?: ArtifactRef;
  error?: AdapterError;
}

/**
 * 所有具体 runtime 必须实现的统一接口。
 */
export interface RuntimeAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly capabilities: CapabilityProfile;

  init(ctx: AdapterContext): Promise<void>;
  shutdown(): Promise<void>;
  submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck>;
  stream(runId: string): AsyncIterable<AdapterStreamEvent>;
  cancel(runId: string, reason?: string): Promise<AdapterCancelAck>;
  query(runId: string): Promise<AdapterRunSnapshot>;
}
