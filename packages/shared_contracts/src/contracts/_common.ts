// SPDX-License-Identifier: Apache-2.0
/**
 * ts-rest contract 内部共享 helper：标准错误响应、通用路径前缀。
 */

import { z } from 'zod';

/** 标准 API 错误响应 schema（HTTP 4xx / 5xx 通用）。 */
export const ApiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    /** 字段级错误（如 Zod 校验失败展开） */
    issues: z
      .array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        }),
      )
      .optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

/** 常用 4xx/5xx 响应集合。 */
export const commonErrorResponses = {
  400: ApiError,
  401: ApiError,
  403: ApiError,
  404: ApiError,
  409: ApiError,
  422: ApiError,
  429: ApiError,
  500: ApiError,
} as const;

/** API 版本前缀。breaking change 升 v2/。 */
export const API_V1 = '/v1';
