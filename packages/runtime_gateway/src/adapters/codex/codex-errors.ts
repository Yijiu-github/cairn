// SPDX-License-Identifier: Apache-2.0
/**
 * Codex CLI 错误归一化。
 */

import { createAdapterError, type AdapterError } from '../../runtime-errors.js';

export interface CodexProcessFailure {
  exitCode?: number;
  signal?: string;
  stderr: string;
  spawnError?: unknown;
}

export const mapCodexProcessFailure = (failure: CodexProcessFailure): AdapterError => {
  const stderr = failure.stderr.toLowerCase();

  if (failure.signal === 'SIGTERM' || failure.signal === 'SIGKILL') {
    return createAdapterError('CANCELLED_BY_USER', 'Codex CLI process was cancelled', false);
  }

  if (failure.spawnError !== undefined || stderr.includes('not recognized')) {
    return createAdapterError('MODEL_UNAVAILABLE', 'Codex CLI executable is unavailable', false);
  }

  if (stderr.includes('unauthorized') || stderr.includes('auth_invalid')) {
    return createAdapterError('AUTH_INVALID', 'Codex CLI authentication is invalid', false);
  }

  if (stderr.includes('rate limit') || stderr.includes('429')) {
    return createAdapterError('AUTH_RATE_LIMITED', 'Codex CLI request was rate limited', true);
  }

  if (stderr.includes('context') && stderr.includes('overflow')) {
    return createAdapterError('CONTEXT_OVERFLOW', 'Codex CLI context window was exceeded', false);
  }

  if (stderr.includes('timeout')) {
    return createAdapterError('TIMEOUT', 'Codex CLI process timed out', true);
  }

  return createAdapterError(
    failure.exitCode === undefined ? 'UNKNOWN' : 'INTERNAL_ERROR',
    'Codex CLI process failed',
    false,
  );
};
