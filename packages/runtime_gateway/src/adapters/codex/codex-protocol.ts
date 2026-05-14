// SPDX-License-Identifier: Apache-2.0
/**
 * Codex CLI `exec --json` stdout JSONL 协议解析。
 *
 * 根因：Codex CLI 0.130.0-alpha.5 会把结构化事件写到 stdout，把插件同步 /
 * PowerShell snapshot 等 warning 写到 stderr。解析器必须只消费 stdout JSONL。
 * 修复要点：未知事件保留为 progress，避免上游新增事件时直接打断 adapter。
 */

import { createAdapterError } from '../../runtime-errors.js';

import type { AdapterStreamEvent } from '../../runtime-events.js';
import type { ArtifactRef } from '@cairn/shared-contracts/schemas';

export type CodexJsonEvent =
  | { type: 'thread.started'; threadId: string }
  | { type: 'turn.started' }
  | { type: 'item.completed'; item: CodexCompletedItem }
  | { type: 'turn.completed'; usage?: CodexUsage }
  | { type: 'unknown'; originalType: string };

export type CodexCompletedItem =
  | { id: string; type: 'agent_message'; text: string }
  | { id: string; type: 'unknown'; originalType: string };

export interface CodexUsage {
  input_tokens?: number;
  cached_input_tokens?: number;
  output_tokens?: number;
  reasoning_output_tokens?: number;
}

export interface ParseCodexJsonlOptions {
  finalArtifactRef: ArtifactRef;
  now?: () => number;
}

export interface ParseCodexJsonlResult {
  events: AdapterStreamEvent[];
  threadId?: string;
}

export const parseCodexJsonl = (
  jsonl: string,
  options: ParseCodexJsonlOptions,
): ParseCodexJsonlResult => {
  const now = options.now ?? Date.now;
  const events: AdapterStreamEvent[] = [];
  let threadId: string | undefined;

  for (const line of jsonl.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const codexEvent = parseCodexJsonLine(trimmed);
    if (codexEvent === undefined) {
      events.push({
        type: 'failed',
        at: now(),
        error: createAdapterError('INTERNAL_ERROR', 'Codex CLI emitted invalid JSONL', false),
      });
      continue;
    }

    switch (codexEvent.type) {
      case 'thread.started': {
        threadId = codexEvent.threadId;
        events.push({ type: 'queued', at: now() });
        break;
      }
      case 'turn.started': {
        events.push(
          threadId === undefined
            ? { type: 'started', at: now() }
            : { type: 'started', at: now(), providerRunId: threadId },
        );
        break;
      }
      case 'item.completed': {
        if (codexEvent.item.type === 'agent_message') {
          events.push({ type: 'token', at: now(), delta: codexEvent.item.text });
        } else {
          events.push({
            type: 'progress',
            at: now(),
            note: `Codex item completed: ${codexEvent.item.originalType}`,
          });
        }
        break;
      }
      case 'turn.completed': {
        events.push({ type: 'succeeded', at: now(), finalArtifactRef: options.finalArtifactRef });
        break;
      }
      default: {
        events.push({
          type: 'progress',
          at: now(),
          note: `Codex event: ${codexEvent.originalType}`,
        });
      }
    }
  }

  return threadId === undefined ? { events } : { events, threadId };
};

const parseCodexJsonLine = (line: string): CodexJsonEvent | undefined => {
  try {
    const raw = JSON.parse(line) as unknown;
    if (!isRecord(raw)) {
      return undefined;
    }
    return toCodexJsonEvent(raw);
  } catch {
    return undefined;
  }
};

const toCodexJsonEvent = (value: Record<string, unknown>): CodexJsonEvent | undefined => {
  const type = value['type'];
  if (typeof type !== 'string') {
    return undefined;
  }

  switch (type) {
    case 'thread.started': {
      const threadId = value['thread_id'];
      return typeof threadId === 'string' ? { type, threadId } : undefined;
    }
    case 'turn.started':
      return { type };
    case 'item.completed': {
      const item = toCodexCompletedItem(value['item']);
      return item === undefined ? undefined : { type, item };
    }
    case 'turn.completed':
      return { type };
    default:
      return { type: 'unknown', originalType: type };
  }
};

const toCodexCompletedItem = (value: unknown): CodexCompletedItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = value['id'];
  const type = value['type'];
  if (typeof id !== 'string' || typeof type !== 'string') {
    return undefined;
  }

  if (type === 'agent_message') {
    const text = value['text'];
    return typeof text === 'string' ? { id, type, text } : undefined;
  }

  return { id, type: 'unknown', originalType: type };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
