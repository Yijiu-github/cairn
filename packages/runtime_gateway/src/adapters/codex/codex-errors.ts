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

const summarizeStderr = (stderr: string): string | undefined => {
  const normalized = stderr.replace(/\s+/g, ' ').trim();
  return normalized === '' ? undefined : normalized;
};

export const mapCodexProcessFailure = (failure: CodexProcessFailure): AdapterError => {
  const stderr = failure.stderr.toLowerCase();
  const stderrSummary = summarizeStderr(failure.stderr);

  if (failure.signal === 'SIGTERM' || failure.signal === 'SIGKILL') {
    return createAdapterError('CANCELLED_BY_USER', 'Codex CLI process was cancelled', false);
  }

  if (failure.spawnError !== undefined || stderr.includes('not recognized')) {
    return createAdapterError('SERVICE_UNAVAILABLE', 'Codex CLI executable is unavailable', false);
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

  if (failure.exitCode !== undefined) {
    return createAdapterError(
      'INTERNAL_ERROR',
      stderrSummary === undefined
        ? `Codex CLI exited with code ${String(failure.exitCode)}`
        : `Codex CLI exited with code ${String(failure.exitCode)}: ${stderrSummary}`,
      true,
    );
  }

  return createAdapterError(
    'UNKNOWN',
    stderrSummary === undefined
      ? 'Codex CLI process failed'
      : `Codex CLI process failed: ${stderrSummary}`,
    false,
  );
};
