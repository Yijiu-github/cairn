// SPDX-License-Identifier: Apache-2.0
/**
 * AdapterStreamEvent 是 runtime 到 Gateway 的唯一流式协议。
 */

import type { AdapterError } from './runtime-errors.js';
import type { ArtifactKind, ArtifactRef } from '@cairn/shared-contracts/schemas';

export interface ArtifactDescriptor {
  artifactRef: ArtifactRef;
  kind: ArtifactKind;
  role: 'input' | 'intermediate' | 'output' | 'summary' | 'trace';
  formatVersion: string;
  contentType?: string;
  sizeBytes?: number;
}

export type AdapterStreamEvent =
  | { type: 'queued'; at: number }
  | { type: 'started'; at: number; providerRunId?: string }
  | { type: 'token'; at: number; delta: string }
  | { type: 'tool_call'; at: number; name: string; argsRef: ArtifactRef }
  | { type: 'tool_result'; at: number; name: string; resultRef: ArtifactRef }
  | { type: 'artifact'; at: number; artifact: ArtifactDescriptor }
  | { type: 'progress'; at: number; note: string }
  | { type: 'heartbeat'; at: number }
  | { type: 'succeeded'; at: number; finalArtifactRef: ArtifactRef }
  | { type: 'failed'; at: number; error: AdapterError }
  | { type: 'cancelled'; at: number; reason?: string }
  | { type: 'timeout'; at: number };

export const ADAPTER_TERMINAL_EVENT_TYPES = [
  'succeeded',
  'failed',
  'cancelled',
  'timeout',
] as const satisfies readonly AdapterStreamEvent['type'][];

export type AdapterTerminalEventType = (typeof ADAPTER_TERMINAL_EVENT_TYPES)[number];

export const isAdapterTerminalEvent = (
  event: AdapterStreamEvent,
): event is Extract<AdapterStreamEvent, { type: AdapterTerminalEventType }> =>
  ADAPTER_TERMINAL_EVENT_TYPES.includes(event.type as AdapterTerminalEventType);
