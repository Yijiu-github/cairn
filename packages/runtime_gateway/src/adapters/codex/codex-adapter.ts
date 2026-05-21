// SPDX-License-Identifier: Apache-2.0
/**
 * Codex CLI RuntimeAdapter.
 *
 * 根因：Codex process / JSONL parser 已有基线，但上层只能依赖 RuntimeAdapter 契约。
 * 修复要点：把 `codex exec --json` 子进程封装成 submit / stream / cancel / query 生命周期。
 */

import { createAdapterError } from '../../runtime-errors.js';

import { codexCapabilities, CODEX_ADAPTER_ID } from './codex-capabilities.js';
import { startCodexExec } from './codex-process.js';

import type {
  CodexExecRequest,
  CodexProcessController,
  StartCodexExecOptions,
} from './codex-process.js';
import type {
  AdapterCancelAck,
  AdapterContext,
  AdapterRunSnapshot,
  AdapterRunStatus,
  AdapterSubmitAck,
  AdapterSubmitRequest,
  CapabilityProfile,
  RuntimeAdapter,
} from '../../runtime-adapter.js';
import type { AdapterError } from '../../runtime-errors.js';
import type { AdapterStreamEvent } from '../../runtime-events.js';
import type { ArtifactRef } from '@cairn/shared-contracts/schemas';

type CodexSandboxMode = NonNullable<CodexExecRequest['sandboxMode']>;

export interface CodexRuntimeAdapterOptions extends StartCodexExecOptions {
  executable?: string;
  sandboxMode?: CodexSandboxMode;
  env?: Record<string, string>;
  now?: () => number;
  capabilities?: Partial<CapabilityProfile>;
  resolveArtifactPayload?: ArtifactPayloadResolver;
}

export interface ResolvedArtifactPayload {
  mediaType: 'text/plain' | 'application/json';
  text: string;
  truncated: boolean;
}

export type ArtifactPayloadResolver = (
  artifactRef: ArtifactRef,
) => Promise<ResolvedArtifactPayload | undefined>;

interface CodexRunState {
  request: AdapterSubmitRequest;
  controller: CodexProcessController;
  status: AdapterRunStatus;
  events?: AdapterStreamEvent[];
  providerRunId?: string;
  finalArtifactRef?: ArtifactRef;
  error?: AdapterError;
  lastEventAt?: number;
  cancelReason?: string;
}

const isTerminalStatus = (status: AdapterRunStatus): boolean =>
  status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'timeout';

const isSandboxMode = (value: unknown): value is CodexSandboxMode =>
  value === 'read-only' || value === 'workspace-write' || value === 'danger-full-access';

const normalizeCodexModel = (model: string): string | undefined => {
  const trimmed = model.trim();
  if (trimmed.length === 0 || trimmed === 'default') {
    return undefined;
  }

  return trimmed;
};

const readStringOption = (
  options: Record<string, unknown> | undefined,
  key: string,
): string | undefined => {
  const value = options?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const promptFromPayload = (text: string): string | undefined => {
  const parsed = safeParseRuntimeInput(text);
  if (parsed !== undefined) {
    return parsed;
  }

  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const safeParseRuntimeInput = (text: string): string | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    if (
      typeof value === 'object' &&
      value !== null &&
      'prompt' in value &&
      typeof value.prompt === 'string' &&
      value.prompt.length > 0
    ) {
      return value.prompt;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const toPrompt = async (
  request: AdapterSubmitRequest,
  resolveArtifactPayload: ArtifactPayloadResolver | undefined,
): Promise<string> => {
  const prompt =
    readStringOption(request.options, 'prompt') ??
    readStringOption(request.options, 'inlinePrompt') ??
    readStringOption(request.options, 'codexPrompt');

  if (prompt !== undefined) {
    return prompt;
  }

  const firstInput = request.inputs[0];
  if (firstInput !== undefined && resolveArtifactPayload !== undefined) {
    try {
      const payload = await resolveArtifactPayload(firstInput);
      const resolvedPrompt = payload === undefined ? undefined : promptFromPayload(payload.text);
      if (resolvedPrompt !== undefined) {
        return resolvedPrompt;
      }
    } catch {
      // Keep deterministic fallback behavior when artifact payload resolution is unavailable.
    }
  }

  if (request.inputs.length === 0) {
    return `Run Cairn AgentRun ${request.runId}.`;
  }

  const inputRefs = request.inputs.map((input) => `- ${input.uri ?? input.artifactId}`).join('\n');
  return `Run Cairn AgentRun ${request.runId} with these input artifact references:\n${inputRefs}`;
};

const getFinalArtifactRef = (request: AdapterSubmitRequest): ArtifactRef => ({
  artifactId: `artifact:${request.runId}`,
});

const applyEventToState = (state: CodexRunState, event: AdapterStreamEvent): void => {
  state.lastEventAt = event.at;

  switch (event.type) {
    case 'queued': {
      state.status = 'queued';
      break;
    }
    case 'started': {
      state.status = 'running';
      if (event.providerRunId !== undefined) {
        state.providerRunId = event.providerRunId;
      }
      break;
    }
    case 'succeeded': {
      state.status = 'succeeded';
      state.finalArtifactRef = event.finalArtifactRef;
      break;
    }
    case 'failed': {
      if (state.status === 'cancelled' && state.cancelReason !== undefined) {
        break;
      }
      state.status = 'failed';
      state.error = event.error;
      break;
    }
    case 'cancelled': {
      state.status = 'cancelled';
      delete state.error;
      if (event.reason !== undefined) {
        state.cancelReason = event.reason;
      }
      break;
    }
    case 'timeout': {
      state.status = 'timeout';
      state.error = createAdapterError('TIMEOUT', 'Codex CLI process timed out', true);
      break;
    }
    case 'artifact': {
      state.finalArtifactRef = event.artifact.artifactRef;
      break;
    }
    case 'heartbeat':
    case 'progress':
    case 'token':
    case 'tool_call':
    case 'tool_result': {
      break;
    }
  }
};

const resolveEvents = async (state: CodexRunState): Promise<readonly AdapterStreamEvent[]> => {
  if (state.events !== undefined) {
    return state.events;
  }

  const result = await state.controller.result;
  state.events = result.events;
  if (result.threadId !== undefined) {
    state.providerRunId = result.threadId;
  }
  for (const event of result.events) {
    applyEventToState(state, event);
  }
  return result.events;
};

const toSnapshot = (state: CodexRunState): AdapterRunSnapshot => {
  const snapshot: AdapterRunSnapshot = {
    runId: state.request.runId,
    status: state.status,
  };
  if (state.providerRunId !== undefined) {
    snapshot.providerRunId = state.providerRunId;
  }
  if (state.lastEventAt !== undefined) {
    snapshot.lastEventAt = state.lastEventAt;
  }
  if (state.finalArtifactRef !== undefined) {
    snapshot.finalArtifactRef = state.finalArtifactRef;
  }
  if (state.error !== undefined) {
    snapshot.error = state.error;
  }
  return snapshot;
};

export const createCodexRuntimeAdapter = (
  options: CodexRuntimeAdapterOptions = {},
): RuntimeAdapter => {
  const runs = new Map<string, CodexRunState>();
  let context: AdapterContext | undefined;

  const capabilities: CapabilityProfile = {
    ...codexCapabilities,
    ...options.capabilities,
  };

  const ensureInitialized = (): AdapterContext => {
    if (context === undefined) {
      throw new Error('Codex runtime adapter has not been initialized');
    }
    return context;
  };

  const adapter: RuntimeAdapter = {
    id: CODEX_ADAPTER_ID,
    displayName: 'Codex CLI Runtime Adapter',
    capabilities,

    async init(ctx: AdapterContext) {
      await Promise.resolve();
      context = ctx;
    },

    async shutdown() {
      const pendingCancels = [...runs.values()]
        .filter((run) => !isTerminalStatus(run.status))
        .map((run) => run.controller.cancel('adapter_shutdown'));

      await Promise.all(pendingCancels);
      runs.clear();
      context = undefined;
    },

    async submit(request: AdapterSubmitRequest): Promise<AdapterSubmitAck> {
      await Promise.resolve();
      const ctx = ensureInitialized();
      const existing = runs.get(request.runId);
      if (existing !== undefined) {
        const ack: AdapterSubmitAck = {
          runId: request.runId,
          accepted: true,
          idempotentReplay: true,
        };
        if (existing.providerRunId !== undefined) {
          ack.providerRunId = existing.providerRunId;
        }
        return ack;
      }

      const requestSandboxMode = request.options?.['sandboxMode'];
      const configSandboxMode = ctx.config['sandboxMode'];
      const sandboxMode =
        (isSandboxMode(requestSandboxMode) ? requestSandboxMode : undefined) ??
        (isSandboxMode(configSandboxMode) ? configSandboxMode : undefined) ??
        options.sandboxMode;
      const prompt = await toPrompt(request, options.resolveArtifactPayload);
      const model = normalizeCodexModel(request.model);
      const controller = startCodexExec(
        request.runId,
        {
          prompt,
          sandboxDir: ctx.workdir,
          finalArtifactRef: getFinalArtifactRef(request),
          ...(options.executable === undefined ? {} : { executable: options.executable }),
          ...(sandboxMode === undefined ? {} : { sandboxMode }),
          ...(model === undefined ? {} : { model }),
          ...(request.timeoutMs === undefined ? {} : { timeoutMs: request.timeoutMs }),
          ...(options.env === undefined ? {} : { env: options.env }),
          ...(options.now === undefined ? {} : { now: options.now }),
        },
        {
          ...(options.spawnProcess === undefined ? {} : { spawnProcess: options.spawnProcess }),
          ...(options.killGraceMs === undefined ? {} : { killGraceMs: options.killGraceMs }),
        },
      );

      runs.set(request.runId, {
        request,
        controller,
        status: 'submitted',
      });

      return { runId: request.runId, accepted: true };
    },

    async *stream(runId: string): AsyncIterable<AdapterStreamEvent> {
      ensureInitialized();
      const state = runs.get(runId);
      if (state === undefined) {
        yield {
          type: 'failed',
          at: options.now?.() ?? Date.now(),
          error: createAdapterError('INPUT_INVALID', `Unknown run id: ${runId}`, false),
        };
        return;
      }

      const events = await resolveEvents(state);
      for (const event of events) {
        yield event;
      }
    },

    async cancel(runId: string, reason?: string): Promise<AdapterCancelAck> {
      ensureInitialized();
      const state = runs.get(runId);
      if (state === undefined) {
        return { runId, cancelled: false, reason: 'unknown_run' };
      }

      if (isTerminalStatus(state.status)) {
        return { runId, cancelled: false, reason: 'already_terminal' };
      }

      await state.controller.cancel(reason);
      state.status = 'cancelled';
      state.lastEventAt = options.now?.() ?? Date.now();
      if (reason !== undefined) {
        state.cancelReason = reason;
      }
      delete state.error;

      return reason === undefined ? { runId, cancelled: true } : { runId, cancelled: true, reason };
    },

    async query(runId: string): Promise<AdapterRunSnapshot> {
      await Promise.resolve();
      ensureInitialized();
      const state = runs.get(runId);
      if (state === undefined) {
        return { runId, status: 'unknown' };
      }

      if (!isTerminalStatus(state.status)) {
        return toSnapshot(state);
      }

      return toSnapshot(state);
    },
  };

  return adapter;
};
