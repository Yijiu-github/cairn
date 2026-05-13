// SPDX-License-Identifier: Apache-2.0
/**
 * WebSocket 事件：TraceEvent 的实时流。
 *
 * 与 run-events.ts 的关系：
 *   - run-events 是「业务流」（UI 主要监听）
 *   - trace-events 是「观察流」（详细日志 / 高吞吐，Operator 在调试视图监听）
 *
 * 客户端可独立订阅，按 level 过滤。
 */

import { z } from 'zod';

import { TraceEvent } from '../schemas/trace-event.js';

/** 包装一层订阅级 envelope，便于未来扩展（如 batch 推送）。 */
export const TraceStreamEvent = z.object({
  type: z.literal('trace.event'),
  event: TraceEvent,
  /** 用于客户端去重 / 乱序矫正 */
  seq: z.number().int().nonnegative(),
});
export type TraceStreamEvent = z.infer<typeof TraceStreamEvent>;

/** 服务端在订阅初始化完成时发送一次。 */
export const TraceStreamReady = z.object({
  type: z.literal('trace.ready'),
  runId: z.string(),
  /** 从该 seq 开始增量推送（前面的可通过 HTTP listTraceEvents 拉取） */
  fromSeq: z.number().int().nonnegative(),
});
export type TraceStreamReady = z.infer<typeof TraceStreamReady>;

/** 服务端关闭流时通知。 */
export const TraceStreamClosed = z.object({
  type: z.literal('trace.closed'),
  reason: z.enum(['run_completed', 'idle_timeout', 'server_shutdown', 'error']),
});
export type TraceStreamClosed = z.infer<typeof TraceStreamClosed>;

export const TraceFrame = z.discriminatedUnion('type', [
  TraceStreamReady,
  TraceStreamEvent,
  TraceStreamClosed,
]);
export type TraceFrame = z.infer<typeof TraceFrame>;
