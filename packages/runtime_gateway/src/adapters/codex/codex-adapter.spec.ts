// SPDX-License-Identifier: Apache-2.0

import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { defineRuntimeAdapterConformanceSuite } from '../../testing/adapter-conformance.js';
import {
  createTestAdapterContext,
  createTestArtifactRef,
  createTestSubmitRequest,
  TEST_IDS,
} from '../../testing/fixtures.js';

import { createCodexRuntimeAdapter } from './codex-adapter.js';

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
    queueMicrotask(() => {
      child.stdout.write('{"type":"thread.started","thread_id":"thread_1"}\n');
      child.stdout.write('{"type":"turn.started"}\n');
      child.stdout.write('{"type":"turn.completed"}\n');
      child.close(0);
    });
    return child.asChildProcess();
  };
};

defineRuntimeAdapterConformanceSuite({
  name: 'codex',
  createAdapter: () =>
    createCodexRuntimeAdapter({
      spawnProcess: createFakeSpawn(new FakeCodexChildProcess(), []),
      now,
      killGraceMs: 0,
    }),
});

describe('createCodexRuntimeAdapter', () => {
  it('submits a Codex process, streams mapped events, and exposes a terminal query snapshot', async () => {
    const child = new FakeCodexChildProcess();
    const calls: SpawnCall[] = [];
    const adapter = createCodexRuntimeAdapter({
      spawnProcess: (command, args, options) => {
        calls.push({ command, args, options });
        return child.asChildProcess();
      },
      now,
      killGraceMs: 0,
    });
    await adapter.init({ ...createTestAdapterContext(), workdir: 'C:/tmp/cairn-run' });

    const request = createTestSubmitRequest({
      model: 'gpt-test',
      options: { prompt: 'Reply exactly: CAIRN_OK' },
    });
    const ack = await adapter.submit(request);

    expect(ack).toEqual({ runId: TEST_IDS.runId, accepted: true });
    expect(calls[0]).toMatchObject({
      command: 'codex',
      options: { cwd: 'C:/tmp/cairn-run' },
    });
    expect(calls[0]?.args).toContain('Reply exactly: CAIRN_OK');
    expect(calls[0]?.args).toContain('gpt-test');

    child.stdout.write('{"type":"thread.started","thread_id":"thread_1"}\n');
    child.stdout.write('{"type":"turn.started"}\n');
    child.stdout.write(
      '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"CAIRN_OK"}}\n',
    );
    child.stdout.write('{"type":"turn.completed"}\n');
    child.close(0);

    const events = [];
    for await (const event of adapter.stream(TEST_IDS.runId)) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: 'queued', at: now() },
      { type: 'started', at: now(), providerRunId: 'thread_1' },
      { type: 'token', at: now(), delta: 'CAIRN_OK' },
      { type: 'succeeded', at: now(), finalArtifactRef: createTestArtifactRef() },
    ]);
    await expect(adapter.query(TEST_IDS.runId)).resolves.toMatchObject({
      runId: TEST_IDS.runId,
      status: 'succeeded',
      providerRunId: 'thread_1',
      finalArtifactRef: createTestArtifactRef(),
      lastEventAt: now(),
    });

    await adapter.shutdown();
  });

  it('returns an idempotent replay ack without spawning a second process for the same run id', async () => {
    const child = new FakeCodexChildProcess();
    const calls: SpawnCall[] = [];
    const adapter = createCodexRuntimeAdapter({
      spawnProcess: (command, args, options) => {
        calls.push({ command, args, options });
        return child.asChildProcess();
      },
      now,
      killGraceMs: 0,
    });
    await adapter.init(createTestAdapterContext());

    const request = createTestSubmitRequest();
    await adapter.submit(request);
    const replayAck = await adapter.submit(request);

    expect(replayAck).toEqual({
      runId: TEST_IDS.runId,
      accepted: true,
      idempotentReplay: true,
    });
    expect(calls).toHaveLength(1);

    child.close(0);
    await adapter.shutdown();
  });

  it('cancels an in-flight Codex process and reports cancelled status', async () => {
    const child = new FakeCodexChildProcess();
    const adapter = createCodexRuntimeAdapter({
      spawnProcess: (_command, _args, _options) => child.asChildProcess(),
      now,
      killGraceMs: 0,
    });
    await adapter.init(createTestAdapterContext());
    await adapter.submit(createTestSubmitRequest());

    await expect(adapter.cancel(TEST_IDS.runId, 'operator_cancelled')).resolves.toEqual({
      runId: TEST_IDS.runId,
      cancelled: true,
      reason: 'operator_cancelled',
    });
    expect(child.killedSignals).toEqual(['SIGTERM', 'SIGKILL']);
    await expect(adapter.query(TEST_IDS.runId)).resolves.toMatchObject({
      runId: TEST_IDS.runId,
      status: 'cancelled',
    });

    child.close(null, 'SIGTERM');
    await adapter.shutdown();
  });
});
