// SPDX-License-Identifier: Apache-2.0

import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';

import { describe, expect, it } from 'vitest';

import { createTestArtifactRef, TEST_IDS } from '../../testing/fixtures.js';

import { buildCodexExecArgs, startCodexExec } from './codex-process.js';

import type { CodexSpawn } from './codex-process.js';
import type { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'node:child_process';

const now = () => 1_715_654_400_000;

class FakeCodexChildProcess extends EventEmitter {
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly stdin = new PassThrough();
  readonly killedSignals: NodeJS.Signals[] = [];

  kill(signal: NodeJS.Signals = 'SIGTERM') {
    this.killedSignals.push(signal);
    return true;
  }

  close(exitCode: number | null, signal: NodeJS.Signals | null = null) {
    this.emit('close', exitCode, signal);
  }

  fail(error: Error) {
    this.emit('error', error);
  }

  asChildProcess(): ChildProcessWithoutNullStreams {
    return this as unknown as ChildProcessWithoutNullStreams;
  }
}

interface SpawnCall {
  command: string;
  args: readonly string[];
  options: SpawnOptionsWithoutStdio;
}

const createFakeSpawn = (child: FakeCodexChildProcess, calls: SpawnCall[]): CodexSpawn => {
  return (command, args, options) => {
    calls.push({ command, args, options });
    return child.asChildProcess();
  };
};

describe('buildCodexExecArgs', () => {
  it('builds the non-interactive JSONL command line', () => {
    expect(
      buildCodexExecArgs({
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        model: 'gpt-test',
      }),
    ).toEqual([
      'exec',
      '--json',
      '--color',
      'never',
      '--sandbox',
      'read-only',
      '--ephemeral',
      '--skip-git-repo-check',
      '--ignore-rules',
      '-C',
      'C:/tmp/cairn',
      '--model',
      'gpt-test',
      'do work',
    ]);
  });
});

describe('startCodexExec', () => {
  it('spawns codex exec and parses stdout JSONL chunks', async () => {
    const child = new FakeCodexChildProcess();
    const calls: SpawnCall[] = [];
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'Reply exactly: CAIRN_OK',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, calls), killGraceMs: 0 },
    );

    child.stdout.write('{"type":"thread.started","thread_id":"thread_1"}\n{"type":"turn.started"');
    child.stdout.write('}\n{"type":"item.completed","item":{"id":"item_0","type":"agent_message"');
    child.stdout.write(',"text":"CAIRN_OK"}}\n');
    child.stdout.write('{"type":"turn.completed"}\n');
    child.stderr.write('plugin warning');
    child.close(0);

    await expect(controller.result).resolves.toEqual({
      events: [
        { type: 'queued', at: now() },
        { type: 'started', at: now(), providerRunId: 'thread_1' },
        { type: 'token', at: now(), delta: 'CAIRN_OK' },
        { type: 'succeeded', at: now(), finalArtifactRef: createTestArtifactRef() },
      ],
      stderr: 'plugin warning',
      exitCode: 0,
      signal: null,
      threadId: 'thread_1',
    });
    expect(calls[0]).toMatchObject({
      command: 'codex',
      options: { cwd: 'C:/tmp/cairn' },
    });
  });

  it('closes stdin immediately so codex exec does not wait for extra input', () => {
    const child = new FakeCodexChildProcess();

    startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'Reply exactly: CAIRN_OK',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    expect(child.stdin.writableEnded).toBe(true);
  });

  it('maps non-zero exit codes through Codex error normalization', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    child.stderr.write('Unauthorized');
    child.close(1);

    const result = await controller.result;
    expect(result.events.at(-1)).toEqual({
      type: 'failed',
      at: now(),
      error: {
        code: 'AUTH_INVALID',
        message: 'Codex CLI authentication is invalid',
        retryable: false,
      },
    });
  });

  it('maps stderr-only failures to a stable non-zero process error', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    child.stderr.write('fatal: codex trial failed before emitting JSONL');
    child.close(2);

    const result = await controller.result;
    expect(result.events.at(-1)).toEqual({
      type: 'failed',
      at: now(),
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Codex CLI exited with code 2: fatal: codex trial failed before emitting JSONL',
        retryable: true,
      },
    });
  });

  it('emits a stable failure when stdout never reaches a terminal JSONL event', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    child.stdout.write('{"type":"thread.started","thread_id":"thread_1"}\n');
    child.close(0);

    const result = await controller.result;
    expect(result.events).toEqual([
      { type: 'queued', at: now() },
      {
        type: 'failed',
        at: now(),
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Codex CLI exited without a terminal JSONL event.',
          retryable: true,
        },
      },
    ]);
  });

  it('kills the process on cancel and escalates after the grace window', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    await controller.cancel('operator_cancelled');

    expect(child.killedSignals).toEqual(['SIGTERM', 'SIGKILL']);
  });

  it('does not escalate to SIGKILL when the process closes during cancel grace', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 10 },
    );

    const cancel = controller.cancel('operator_cancelled');
    child.close(null, 'SIGTERM');
    await cancel;

    expect(child.killedSignals).toEqual(['SIGTERM']);
  });

  it('preserves operator cancellation even when the process exits non-zero after cancel', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    const cancel = controller.cancel('operator_cancelled');
    child.stderr.write('process interrupted after cancel');
    child.close(1);
    await cancel;

    await expect(controller.result).resolves.toMatchObject({
      events: [expect.objectContaining({ type: 'cancelled', reason: 'operator_cancelled' })],
      exitCode: 1,
      signal: null,
    });
  });

  it('maps spawn errors to executable unavailable', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    child.fail(new Error('ENOENT'));

    await expect(controller.result).resolves.toMatchObject({
      events: [
        {
          type: 'failed',
          at: now(),
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Codex CLI executable is unavailable',
            retryable: false,
          },
        },
      ],
      exitCode: null,
      signal: null,
    });
  });

  it('emits timeout when the process exceeds timeoutMs', async () => {
    const child = new FakeCodexChildProcess();
    const controller = startCodexExec(
      TEST_IDS.runId,
      {
        prompt: 'do work',
        sandboxDir: 'C:/tmp/cairn',
        finalArtifactRef: createTestArtifactRef(),
        now,
        timeoutMs: 1,
      },
      { spawnProcess: createFakeSpawn(child, []), killGraceMs: 0 },
    );

    await delay(5);
    child.close(null, 'SIGTERM');

    await expect(controller.result).resolves.toMatchObject({
      events: [expect.objectContaining({ type: 'timeout' })],
      signal: 'SIGTERM',
    });
  });
});
