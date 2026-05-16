// SPDX-License-Identifier: Apache-2.0
/**
 * 强类型 ID。
 *
 * 所有 ID 采用 ULID（26 字符、字典序、时间排序友好）。
 * 在 TS 端通过 branded type 防止跨类别误用（如把 TaskId 当作 RunId 用）。
 *
 * 参考：docs/design/domain-model.md §11
 */

import { z } from 'zod';

// ULID = 26 字符 Crockford base32（不含 I / L / O / U）
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ulidString = () => z.string().regex(ULID_REGEX, 'Must be a valid ULID');

/**
 * 通用 ID 构造器：派生带 brand 的字符串类型。
 *
 * 接收一个 phantom 参数 `_brand`，仅用于 TS 类型推断；运行时不使用。
 */
const brandedId = <B extends string>(_brand: B) => ulidString().brand<B>();

export const WorkspaceId = brandedId('WorkspaceId');
export type WorkspaceId = z.infer<typeof WorkspaceId>;

export const ConversationId = brandedId('ConversationId');
export type ConversationId = z.infer<typeof ConversationId>;

export const EventId = brandedId('EventId');
export type EventId = z.infer<typeof EventId>;

export const MessageId = brandedId('MessageId');
export type MessageId = z.infer<typeof MessageId>;

export const OrchestrationRunId = brandedId('OrchestrationRunId');
export type OrchestrationRunId = z.infer<typeof OrchestrationRunId>;

export const TaskId = brandedId('TaskId');
export type TaskId = z.infer<typeof TaskId>;

export const AgentRunId = brandedId('AgentRunId');
export type AgentRunId = z.infer<typeof AgentRunId>;

export const ArtifactId = brandedId('ArtifactId');
export type ArtifactId = z.infer<typeof ArtifactId>;

export const TraceEventId = brandedId('TraceEventId');
export type TraceEventId = z.infer<typeof TraceEventId>;

export const SourceRootId = brandedId('SourceRootId');
export type SourceRootId = z.infer<typeof SourceRootId>;

export const CodeIndexSnapshotId = brandedId('CodeIndexSnapshotId');
export type CodeIndexSnapshotId = z.infer<typeof CodeIndexSnapshotId>;

export const CodeIndexFileId = brandedId('CodeIndexFileId');
export type CodeIndexFileId = z.infer<typeof CodeIndexFileId>;

export const ContextPackId = brandedId('ContextPackId');
export type ContextPackId = z.infer<typeof ContextPackId>;

export const PlanningOutputId = brandedId('PlanningOutputId');
export type PlanningOutputId = z.infer<typeof PlanningOutputId>;

/**
 * TraceId 与单条 TraceEventId 不同：
 * - TraceId 是贯穿一次执行的关联 id（OrchestrationRun 启动时分配）
 * - TraceEventId 是单条事件 id
 */
export const TraceId = brandedId('TraceId');
export type TraceId = z.infer<typeof TraceId>;
