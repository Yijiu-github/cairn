// SPDX-License-Identifier: Apache-2.0
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import process from 'node:process';
import { dirname, join } from 'node:path';
import { clearTimeout, setTimeout } from 'node:timers';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, URL } from 'node:url';

const expectedEvent = 'main-window-ready-to-show';
const timeoutMs = 20_000;
const pollIntervalMs = 100;
const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const require = createRequire(import.meta.url);
const smokeDir = await mkdtemp(join(tmpdir(), 'cairn-desktop-window-smoke-'));
const signalPath = join(smokeDir, 'signal.json');

const electronBin = process.env['CAIRN_DESKTOP_ELECTRON_BIN'] ?? (await resolveElectronBin(root));
const child = spawn(electronBin, ['.'], {
  cwd: root,
  env: {
    ...process.env,
    CAIRN_DESKTOP_WINDOW_SMOKE_EXIT_AFTER_EVENT: expectedEvent,
    CAIRN_DESKTOP_WINDOW_SMOKE_SIGNAL_PATH: signalPath,
    ELECTRON_ENABLE_LOGGING: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
let spawnError;
child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdout += chunk;
});
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});
child.once('error', (error) => {
  spawnError = error;
});

try {
  await waitForSignal();
  const exitPromise = waitForExit();
  child.kill('SIGTERM');
  const exit = await exitPromise;

  if (exit.code !== 0 && exit.signal !== 'SIGTERM') {
    throw new Error(
      `Electron exited with code ${String(exit.code)} and signal ${String(exit.signal)}.\n${formatOutput()}`,
    );
  }
} finally {
  child.kill('SIGTERM');
  await rm(smokeDir, { force: true, recursive: true });
}

async function waitForSignal() {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (spawnError !== undefined) {
      throw spawnError;
    }

    const signal = await readSignal();
    if (signal?.event === expectedEvent) {
      return;
    }

    await delay(pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for Desktop window smoke event ${expectedEvent}.\n${formatOutput()}`,
  );
}

async function findElectronBin(packageRoot) {
  const candidates = [
    join(packageRoot, 'node_modules/.bin/electron'),
    join(packageRoot, '../../node_modules/.bin/electron'),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next workspace layout candidate.
    }
  }

  throw new Error(`Electron binary not found. Checked: ${candidates.join(', ')}`);
}

async function resolveElectronBin(packageRoot) {
  try {
    return require('electron');
  } catch {
    return findElectronBin(packageRoot);
  }
}

async function readSignal() {
  try {
    return JSON.parse(await readFile(signalPath, 'utf8'));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    if (error instanceof SyntaxError) {
      return undefined;
    }

    throw error;
  }
}

async function waitForExit() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(`Timed out waiting for Electron to exit after smoke event.\n${formatOutput()}`),
      );
    }, 5000);

    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
}

function formatOutput() {
  return [
    '--- stdout ---',
    stdout.trimEnd(),
    '--- stderr ---',
    stderr.trimEnd(),
    '--- signal path ---',
    signalPath,
  ].join('\n');
}
