// SPDX-License-Identifier: Apache-2.0
/**
 * Runtime Adapter 错误归一化。
 *
 * 根因：不同 CLI / API runtime 的退出码和错误文本差异很大。
 * 修复要点：先收敛到稳定枚举，上层只依赖 retryable 与 code 做恢复策略。
 */

export const ADAPTER_ERROR_CODES = [
  'NETWORK_TIMEOUT',
  'NETWORK_UNREACHABLE',
  'AUTH_INVALID',
  'AUTH_EXPIRED',
  'AUTH_RATE_LIMITED',
  'INPUT_INVALID',
  'INPUT_TOO_LARGE',
  'CONTEXT_OVERFLOW',
  'BUDGET_EXCEEDED',
  'QUOTA_EXCEEDED',
  'MODEL_UNAVAILABLE',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
  'TOOL_EXECUTION_FAILED',
  'TOOL_PERMISSION_DENIED',
  'CANCELLED_BY_USER',
  'TIMEOUT',
  'UNKNOWN',
] as const;

export type AdapterErrorCode = (typeof ADAPTER_ERROR_CODES)[number];

export interface AdapterError {
  code: AdapterErrorCode;
  message: string;
  retryable: boolean;
  /** 原始错误只进入受控日志或 debug artifact，不能直接暴露给 UI。 */
  cause?: unknown;
}

export const isAdapterErrorCode = (code: string): code is AdapterErrorCode =>
  ADAPTER_ERROR_CODES.includes(code as AdapterErrorCode);

export const createAdapterError = (
  code: AdapterErrorCode,
  message: string,
  retryable: boolean,
  cause?: unknown,
): AdapterError => {
  const error: AdapterError = { code, message, retryable };
  if (cause !== undefined) {
    error.cause = cause;
  }
  return error;
};
