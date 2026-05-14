// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { createTestArtifactRef } from '../../testing/fixtures.js';

import { mapCodexProcessFailure } from './codex-errors.js';
import { parseCodexJsonl } from './codex-protocol.js';

const now = () => 1_715_654_400_000;

describe('parseCodexJsonl', () => {
  it('maps Codex exec JSONL into adapter lifecycle events', () => {
    const jsonl = [
      '{"type":"thread.started","thread_id":"019e2614-cc8f-7a90-9152-afa7614b25ac"}',
      '{"type":"turn.started"}',
      '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"CAIRN_STDIO_OK"}}',
      '{"type":"turn.completed","usage":{"input_tokens":14124,"cached_input_tokens":10624,"output_tokens":33,"reasoning_output_tokens":21}}',
    ].join('\n');

    const result = parseCodexJsonl(jsonl, {
      finalArtifactRef: createTestArtifactRef(),
      now,
    });

    expect(result.threadId).toBe('019e2614-cc8f-7a90-9152-afa7614b25ac');
    expect(result.events).toEqual([
      { type: 'queued', at: now() },
      {
        type: 'started',
        at: now(),
        providerRunId: '019e2614-cc8f-7a90-9152-afa7614b25ac',
      },
      { type: 'token', at: now(), delta: 'CAIRN_STDIO_OK' },
      {
        type: 'succeeded',
        at: now(),
        finalArtifactRef: createTestArtifactRef(),
      },
    ]);
  });

  it('keeps unknown item and event types as progress events', () => {
    const jsonl = [
      '{"type":"item.completed","item":{"id":"item_1","type":"tool_call"}}',
      '{"type":"custom.event","payload":true}',
    ].join('\n');

    const result = parseCodexJsonl(jsonl, {
      finalArtifactRef: createTestArtifactRef(),
      now,
    });

    expect(result.events).toEqual([
      { type: 'progress', at: now(), note: 'Codex item completed: tool_call' },
      { type: 'progress', at: now(), note: 'Codex event: custom.event' },
    ]);
  });

  it('emits normalized failure for invalid JSONL lines', () => {
    const result = parseCodexJsonl('not-json', {
      finalArtifactRef: createTestArtifactRef(),
      now,
    });

    expect(result.events).toEqual([
      {
        type: 'failed',
        at: now(),
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Codex CLI emitted invalid JSONL',
          retryable: false,
        },
      },
    ]);
  });
});

describe('mapCodexProcessFailure', () => {
  it('maps cancellation signals', () => {
    expect(mapCodexProcessFailure({ signal: 'SIGTERM', stderr: '' })).toEqual({
      code: 'CANCELLED_BY_USER',
      message: 'Codex CLI process was cancelled',
      retryable: false,
    });
  });

  it('maps auth and rate limit stderr', () => {
    expect(mapCodexProcessFailure({ exitCode: 1, stderr: 'Unauthorized' }).code).toBe(
      'AUTH_INVALID',
    );
    expect(mapCodexProcessFailure({ exitCode: 1, stderr: '429 rate limit' }).code).toBe(
      'AUTH_RATE_LIMITED',
    );
  });

  it('maps unavailable executable', () => {
    expect(
      mapCodexProcessFailure({
        stderr: "'codex' is not recognized as an internal or external command",
      }).code,
    ).toBe('MODEL_UNAVAILABLE');
  });

  it('uses internal error for unknown non-zero exits', () => {
    expect(mapCodexProcessFailure({ exitCode: 2, stderr: 'unexpected failure' })).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Codex CLI process failed',
      retryable: false,
    });
  });
});
