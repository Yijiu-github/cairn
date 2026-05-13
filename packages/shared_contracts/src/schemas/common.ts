// SPDX-License-Identifier: Apache-2.0
/**
 * 跨实体共享的基础 schema：时间戳、可见性、生产者类型、分页等。
 */

import { z } from 'zod';

// ============================================================================
// 时间
// ============================================================================

/** ISO 8601 字符串。前后端统一用字符串，避免数字 / 字符串混淆。 */
export const Iso8601 = z.string().datetime({ offset: true });
export type Iso8601 = z.infer<typeof Iso8601>;

// ============================================================================
// 可见性 / 角色
// ============================================================================

export const Visibility = z.enum(['public', 'operator_only', 'debug']);
export type Visibility = z.infer<typeof Visibility>;

export const ActorRole = z.enum(['user', 'operator', 'system']);
export type ActorRole = z.infer<typeof ActorRole>;

export const SenderType = z.enum(['human', 'agent', 'system']);
export type SenderType = z.infer<typeof SenderType>;

export const ProducerType = z.enum(['human', 'agent', 'system']);
export type ProducerType = z.infer<typeof ProducerType>;

// ============================================================================
// 错误归因
// ============================================================================

/**
 * 一次执行的错误归因层级。与 docs/design/state-machines.md §6 对齐。
 */
export const ErrorLayer = z.enum([
  'orchestration', // 编排层（planner / synthesizer 失败）
  'task', // 任务层（依赖失败 / 任务级超时）
  'execution', // 执行层（runtime 失败 / heartbeat 丢失）
  'artifact', // 产物层（缺失 / 校验失败）
]);
export type ErrorLayer = z.infer<typeof ErrorLayer>;

/** 结构化错误。所有终态 / 失败转移必须填。 */
export const StructuredError = z.object({
  layer: ErrorLayer,
  code: z.string().min(1),
  message: z.string(),
  retryable: z.boolean(),
});
export type StructuredError = z.infer<typeof StructuredError>;

// ============================================================================
// 完成度
// ============================================================================

export const ResultCompleteness = z.enum(['complete', 'partial', 'empty']);
export type ResultCompleteness = z.infer<typeof ResultCompleteness>;

export const CompletionLevel = z.enum(['full', 'degraded', 'failed']);
export type CompletionLevel = z.infer<typeof CompletionLevel>;

// ============================================================================
// 分页
// ============================================================================

/** 分页查询参数（List 类 endpoint 通用）。 */
export const PaginationQuery = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

/** 分页结果包装器。 */
export const Paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().optional(),
    total: z.number().int().optional(),
  });

// ============================================================================
// 引用（Artifact 引用 / 上下文引用）
// ============================================================================

/** 指向 Artifact 的轻量引用，避免在 API 中嵌套大对象。 */
export const ArtifactRef = z.object({
  artifactId: z.string(),
  uri: z.string().optional(),
  contentType: z.string().optional(),
});
export type ArtifactRef = z.infer<typeof ArtifactRef>;

// ============================================================================
// Budget / 预算（task 提示性预算）
// ============================================================================

export const BudgetHint = z.object({
  maxTokens: z.number().int().positive().optional(),
  maxSeconds: z.number().int().positive().optional(),
  maxCostUsd: z.number().positive().optional(),
});
export type BudgetHint = z.infer<typeof BudgetHint>;
