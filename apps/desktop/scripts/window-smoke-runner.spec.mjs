// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { waitForDesktopSmokeSignal } from './window-smoke-runner.mjs';

describe('window smoke runner', () => {
  it('reports an early Electron process exit instead of timing out', async () => {
    const child = new EventEmitter();
    child.stdout = createReadableEmitter();
    child.stderr = createReadableEmitter();
    child.kill = () => true;

    const wait = waitForDesktopSmokeSignal({
      child,
      expectedEvent: 'main-window-ready-to-show',
      formatOutput: () =>
        [
          '--- stdout ---',
          '',
          '--- stderr ---',
          '',
          '--- signal path ---',
          '/tmp/signal.json',
        ].join('\n'),
      pollIntervalMs: 5,
      readSignal: () => Promise.resolve(undefined),
      timeoutMs: 500,
    });

    child.emit('exit', null, 'SIGABRT');

    await expect(wait).rejects.toThrow(
      /Electron exited before Desktop window smoke event main-window-ready-to-show with code null and signal SIGABRT/u,
    );
  });

  it('includes the last observed smoke signal when Electron exits early', async () => {
    const child = new EventEmitter();
    child.stdout = createReadableEmitter();
    child.stderr = createReadableEmitter();
    child.kill = () => true;

    const wait = waitForDesktopSmokeSignal({
      child,
      expectedEvent: 'main-window-ready-to-show',
      formatOutput: () => '--- smoke output ---',
      pollIntervalMs: 5,
      readSignal: () => Promise.resolve({ event: 'main-process-loaded' }),
      timeoutMs: 500,
    });

    child.emit('exit', null, 'SIGABRT');

    await expect(wait).rejects.toThrow(
      /Last observed Desktop window smoke signal: main-process-loaded/u,
    );
  });

  it('keeps the opt-in Codex smoke path connected through Artifact Review replay evidence', () => {
    const source = readFileSync(new URL('./codex-window-smoke.mjs', import.meta.url), 'utf8');

    expect(source).toContain("smokeLocator(window, 'nav-artifact-review').click()");
    expect(source).toContain("smokeLocator(window, 'artifact-review-replay-source').waitFor()");
    expect(source).toContain('observedArtifactId');
  });
});

function createReadableEmitter() {
  const stream = new EventEmitter();
  stream.setEncoding = () => undefined;

  return stream;
}
