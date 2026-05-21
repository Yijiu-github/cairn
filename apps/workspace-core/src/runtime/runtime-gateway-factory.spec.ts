// SPDX-License-Identifier: Apache-2.0

import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { AgentRunId } from '@cairn/shared-contracts/schemas';

import { createWorkspaceCoreRuntimeGateway } from './runtime-gateway-factory.js';

import type { AdapterContext, AdapterSubmitRequest, RuntimeAdapter } from '@cairn/runtime-gateway';
import type {
  AdapterCancelAck,
  AdapterRunSnapshot,
  AdapterSubmitAck,
} from '@cairn/runtime-gateway';
import type { AdapterStreamEvent } from '@cairn/runtime-gateway';
import type { CodexRuntimeAdapterOptions } from '@cairn/runtime-gateway/adapters/codex';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

class RecordingRuntimeAdapter implements RuntimeAdapter {
  readonly id = 'codex';
  readonly displayName = 'Recording Codex Adapter';
  readonly capabilities = {
    streaming: true,
    cancellable: true,
    toolCalling: true,
    midStreamInjection: false,
    idempotent: false,
    supportedArtifactKinds: ['text' as const],
    models: [],
  };
  initContext?: AdapterContext;
  shutdownCount = 0;

  async init(ctx: AdapterContext): Promise<void> {
    await Promise.resolve();
    this.initContext = ctx;
  }

  async shutdown(): Promise<void> {
    await Promise.resolve();
    this.shutdownCount += 1;
  }

  async submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
    await Promise.resolve();
    return { runId: request.runId, accepted: true, providerRunId: `recording:${request.runId}` };
  }

  async *stream(runId: string): AsyncIterable<AdapterStreamEvent> {
    await Promise.resolve();
    yield { type: 'queued', at: 1 };
    yield { type: 'started', at: 2, providerRunId: `recording:${runId}` };
    yield { type: 'succeeded', at: 3, finalArtifactRef: { artifactId: `artifact:${runId}` } };
  }

  async cancel(runId: string, reason?: string): Promise<AdapterCancelAck> {
    await Promise.resolve();
    return reason === undefined ? { runId, cancelled: true } : { runId, cancelled: true, reason };
  }

  async query(runId: string): Promise<AdapterRunSnapshot> {
    await Promise.resolve();
    return {
      runId,
      status: 'cancelled',
      error: {
        code: 'CANCELLED_BY_USER',
        message: 'operator_cancelled',
        retryable: false,
      },
    };
  }
}

describe('createWorkspaceCoreRuntimeGateway', () => {
  it('keeps mock as the default runtime gateway', async () => {
    const runtime = await createWorkspaceCoreRuntimeGateway({
      runtime: 'mock',
      runtimeWorkdir: '/tmp/cairn-runtime',
    });

    const ack = await runtime.gateway.submit({
      runId: 'run-default',
      model: 'default',
      inputs: [],
      traceId: 'trace-default',
    });

    expect(ack.providerRunId).toBe('mock:run-default');
    await runtime.close?.();
  });

  it('wraps and initializes a Codex RuntimeAdapter when requested', async () => {
    const adapter = new RecordingRuntimeAdapter();
    const runtime = await createWorkspaceCoreRuntimeGateway(
      {
        runtime: 'codex',
        runtimeWorkdir: '/tmp/cairn-runtime',
        codexExecutable: '/usr/local/bin/codex',
        codexSandboxMode: 'read-only',
      },
      { createCodexAdapter: () => adapter },
    );

    expect(adapter.initContext).toMatchObject({
      workdir: '/tmp/cairn-runtime',
      config: {
        executable: '/usr/local/bin/codex',
        sandboxMode: 'read-only',
      },
    });

    const ack = await runtime.gateway.submit({
      runId: 'run-codex',
      model: 'default',
      inputs: [],
      traceId: 'trace-codex',
    });
    expect(ack.providerRunId).toBe('recording:run-codex');

    await runtime.close?.();
    expect(adapter.shutdownCount).toBe(1);
  });

  it('creates the Codex runtime workdir before initializing the adapter', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'cairn-runtime-factory-'));
    tempDirectories.push(rootDir);
    const workdir = path.join(rootDir, 'nested', 'runtime');
    const adapter = new RecordingRuntimeAdapter();

    const runtime = await createWorkspaceCoreRuntimeGateway(
      {
        runtime: 'codex',
        runtimeWorkdir: workdir,
      },
      { createCodexAdapter: () => adapter },
    );

    expect(existsSync(workdir)).toBe(true);
    expect(adapter.initContext?.workdir).toBe(workdir);

    await runtime.close?.();
  });

  it('passes an artifact payload resolver to the Codex adapter factory', async () => {
    const adapter = new RecordingRuntimeAdapter();
    let receivedOptions: CodexRuntimeAdapterOptions | undefined;

    const runtime = await createWorkspaceCoreRuntimeGateway(
      {
        runtime: 'codex',
        runtimeWorkdir: '/tmp/cairn-runtime',
      },
      {
        createCodexAdapter: (options) => {
          receivedOptions = options;
          return adapter;
        },
        resolveArtifactPayload: async () => {
          await Promise.resolve();
          return {
            mediaType: 'application/json',
            text: '{"prompt":"Hello from artifact"}',
            truncated: false,
          };
        },
      },
    );

    await expect(
      receivedOptions?.resolveArtifactPayload?.({ artifactId: 'artifact:1' }),
    ).resolves.toMatchObject({ text: '{"prompt":"Hello from artifact"}' });

    await runtime.close?.();
  });

  it('exposes the underlying Codex runtime snapshot for trial evidence reads', async () => {
    const adapter = new RecordingRuntimeAdapter();
    const agentRunId = AgentRunId.parse('01J000000000000000000000A0');

    const runtime = await createWorkspaceCoreRuntimeGateway(
      {
        runtime: 'codex',
        runtimeWorkdir: '/tmp/cairn-runtime',
      },
      { createCodexAdapter: () => adapter },
    );

    await expect(runtime.query?.(agentRunId)).resolves.toEqual({
      runId: agentRunId,
      status: 'cancelled',
      error: {
        code: 'CANCELLED_BY_USER',
        message: 'operator_cancelled',
        retryable: false,
      },
    });

    await runtime.close?.();
  });
});
