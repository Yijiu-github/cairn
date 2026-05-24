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

    if (exitResult !== undefined) {
      throw formatEarlyExitError(expectedEvent, exitResult, formatOutput);
    }

    await delay(pollIntervalMs);
  }

  if (spawnError !== undefined) {
    throw spawnError;
  }
  if (exitResult !== undefined) {
    throw formatEarlyExitError(expectedEvent, exitResult, formatOutput);
  }

  throw new Error(
    `Timed out waiting for Desktop window smoke event ${expectedEvent}.\n${formatOutput()}`,
  );
}

function formatEarlyExitError(expectedEvent, exitResult, formatOutput) {
  return new Error(
    `Electron exited before Desktop window smoke event ${expectedEvent} with code ${String(
      exitResult.code,
    )} and signal ${String(exitResult.signal)}.\n${formatOutput()}`,
  );
}
