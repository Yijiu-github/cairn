// SPDX-License-Identifier: Apache-2.0
import { setTimeout as delay } from 'node:timers/promises';

export async function waitForDesktopSmokeSignal({
  child,
  expectedEvent,
  formatOutput,
  pollIntervalMs,
  readSignal,
  timeoutMs,
}) {
  let spawnError;
  let exitResult;
  let lastObservedSignal;

  child.once('error', (error) => {
    spawnError = error;
  });
  child.once('exit', (code, signal) => {
    exitResult = { code, signal };
  });

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (spawnError !== undefined) {
      throw spawnError;
    }

    const signal = await readSignal();
    if (signal?.event === expectedEvent) {
      return;
    }
    if (signal?.event !== undefined) {
      lastObservedSignal = signal;
    }

    if (exitResult !== undefined) {
      throw formatEarlyExitError(expectedEvent, exitResult, formatOutput, lastObservedSignal);
    }

    await delay(pollIntervalMs);
  }

  if (spawnError !== undefined) {
    throw spawnError;
  }
  if (exitResult !== undefined) {
    throw formatEarlyExitError(expectedEvent, exitResult, formatOutput, lastObservedSignal);
  }

  throw new Error(
    `Timed out waiting for Desktop window smoke event ${expectedEvent}.\n${formatObservedSignal(
      lastObservedSignal,
    )}${formatOutput()}`,
  );
}

function formatEarlyExitError(expectedEvent, exitResult, formatOutput, lastObservedSignal) {
  return new Error(
    `Electron exited before Desktop window smoke event ${expectedEvent} with code ${String(
      exitResult.code,
    )} and signal ${String(exitResult.signal)}.\n${formatObservedSignal(
      lastObservedSignal,
    )}${formatOutput()}`,
  );
}

function formatObservedSignal(lastObservedSignal) {
  if (lastObservedSignal?.event === undefined) {
    return '';
  }

  return `Last observed Desktop window smoke signal: ${String(lastObservedSignal.event)}\n`;
}
