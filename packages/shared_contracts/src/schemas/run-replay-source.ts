// SPDX-License-Identifier: Apache-2.0
/**
 * RunReplaySource：Run Detail / Inspector 回放所需的只读数据源。
 *
 * Replay 指从 TraceEvent 与关联对象重建 UI，不重新执行 runtime。
 */

import { z } from 'zod';

import { AgentRun } from './agent-run.js';
import { Artifact } from './artifact.js';
import { Iso8601 } from './common.js';
import { ArtifactId, TraceEventId } from './ids.js';
import { OrchestrationRun, OrchestrationRunStatus } from './orchestration-run.js';
import { Task } from './task.js';
import { TraceEvent, TraceEventType } from './trace-event.js';

export const RunReplayInspector = z.object({
  status: OrchestrationRunStatus,
  taskCount: z.number().int().nonnegative(),
  agentRunCount: z.number().int().nonnegative(),
  artifactCount: z.number().int().nonnegative(),
  traceEventCount: z.number().int().nonnegative(),
  errorEventCount: z.number().int().nonnegative(),
  warningEventCount: z.number().int().nonnegative(),
  finalArtifactId: ArtifactId.optional(),
  firstFailureEventId: TraceEventId.optional(),
  firstFailureEventType: TraceEventType.optional(),
  startedAt: Iso8601.optional(),
  completedAt: Iso8601.optional(),
  durationMs: z.number().int().nonnegative().optional(),
});
export type RunReplayInspector = z.infer<typeof RunReplayInspector>;

export const RunReplaySource = z.object({
  run: OrchestrationRun,
  tasks: z.array(Task),
  agentRuns: z.array(AgentRun),
  artifacts: z.array(Artifact),
  traceEvents: z.array(TraceEvent),
  inspector: RunReplayInspector,
});
export type RunReplaySource = z.infer<typeof RunReplaySource>;
