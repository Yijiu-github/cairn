// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from 'node:events';

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
});

function createReadableEmitter() {
  const stream = new EventEmitter();
  stream.setEncoding = () => undefined;

  return stream;
}
