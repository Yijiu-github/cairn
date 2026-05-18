// SPDX-License-Identifier: Apache-2.0
/**
 * Codex CLI `exec --json` 子进程封装。
 *
 * 根因：首发 adapter 需要真实执行 Codex CLI，但不能把 stderr warning 混进 JSONL parser。
 * 修复要点：stdout 只做 JSONL 流式解析；stderr 单独收集，退出码非 0 时用于错误归一化。
 */

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

import { mapCodexProcessFailure } from './codex-errors.js';
import { createCodexJsonlParser } from './codex-protocol.js';

import type { AdapterStreamEvent } from '../../runtime-events.js';
import type { ArtifactRef } from '@cairn/shared-contracts/schemas';
import type { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'node:child_process';

export interface CodexExecRequest {
  prompt: string;
  sandboxDir: string;
  finalArtifactRef: ArtifactRef;
  executable?: string;
  sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access';
  model?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  now?: () => number;
}

export interface CodexExecResult {
  events: AdapterStreamEvent[];
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  threadId?: string;
}

export interface CodexProcessController {
  readonly runId: string;
  cancel(reason?: string): Promise<void>;
  result: Promise<CodexExecResult>;
}

export type CodexSpawn = (
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio,
) => ChildProcessWithoutNullStreams;

export interface StartCodexExecOptions {
  spawnProcess?: CodexSpawn;
  killGraceMs?: number;
}

const DEFAULT_EXECUTABLE = 'codex';
const DEFAULT_SANDBOX_MODE = 'read-only';
const DEFAULT_KILL_GRACE_MS = 5000;

export const buildCodexExecArgs = (request: CodexExecRequest): string[] => {
  const args = [
    'exec',
    '--json',
    '--color',
    'never',
    '--sandbox',
    request.sandboxMode ?? DEFAULT_SANDBOX_MODE,
    '--ephemeral',
    '--skip-git-repo-check',
    '--ignore-rules',
    '-C',
    request.sandboxDir,
  ];

  if (request.model !== undefined) {
    args.push('--model', request.model);
  }

  args.push(request.prompt);
  return args;
};

export const startCodexExec = (
  runId: string,
  request: CodexExecRequest,
  options: StartCodexExecOptions = {},
): CodexProcessController => {
  const spawnProcess = options.spawnProcess ?? spawn;
  const killGraceMs = options.killGraceMs ?? DEFAULT_KILL_GRACE_MS;
  const parserOptions = {
    finalArtifactRef: request.finalArtifactRef,
  };
  const parser = createCodexJsonlParser(
    request.now === undefined ? parserOptions : { ...parserOptions, now: request.now },
  );
  const events: AdapterStreamEvent[] = [];
  const stderrChunks: string[] = [];
  let settled = false;
  let child: ChildProcessWithoutNullStreams;
  let timeout: NodeJS.Timeout | undefined;
  let markClosed: () => void = () => {
    return;
  };
  const closeObserved = new Promise<void>((resolve) => {
    markClosed = resolve;
  });

  const result = new Promise<CodexExecResult>((resolve) => {
    const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      markClosed();

      events.push(...parser.flush());
      const stderr = stderrChunks.join('');
      if (exitCode !== 0 || signal !== null) {
        if (signal === null) {
          events.push({
            type: 'failed',
            at: request.now?.() ?? Date.now(),
            error: mapCodexProcessFailure(exitCode === null ? { stderr } : { exitCode, stderr }),
          });
        } else {
          events.push({ type: 'cancelled', at: request.now?.() ?? Date.now(), reason: signal });
        }
      }

      const output: CodexExecResult = {
        events,
        stderr,
        exitCode,
        signal,
      };
      if (parser.threadId !== undefined) {
        output.threadId = parser.threadId;
      }
      resolve(output);
    };

    child = spawnProcess(request.executable ?? DEFAULT_EXECUTABLE, buildCodexExecArgs(request), {
      cwd: request.sandboxDir,
      env: request.env,
    });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk: string) => {
      events.push(...parser.push(chunk));
    });

    child.stderr.on('data', (chunk: string) => {
      stderrChunks.push(chunk);
    });

    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      markClosed();
      const stderr = stderrChunks.join('');
      resolve({
        events: [
          {
            type: 'failed',
            at: request.now?.() ?? Date.now(),
            error: mapCodexProcessFailure({ stderr, spawnError: error }),
          },
        ],
        stderr,
        exitCode: null,
        signal: null,
      });
    });

    child.on('close', finish);

    if (request.timeoutMs !== undefined) {
      timeout = setTimeout(() => {
        child.kill('SIGTERM');
      }, request.timeoutMs);
    }
  });

  return {
    runId,
    async cancel() {
      if (settled) {
        return;
      }

      child.kill('SIGTERM');
      const closedBeforeGrace = await Promise.race([
        delay(killGraceMs).then(() => false),
        closeObserved.then(() => true),
      ]);
      if (!closedBeforeGrace) {
        child.kill('SIGKILL');
      }
    },
    result,
  };
};
