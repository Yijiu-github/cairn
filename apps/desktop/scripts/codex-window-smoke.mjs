// SPDX-License-Identifier: Apache-2.0
import process from 'node:process';

import electronExecutable from 'electron';
import { _electron as electron } from 'playwright';

const requiredRuntime = 'codex';

if (process.env['CAIRN_DESKTOP_SIDECAR_RUNTIME'] !== requiredRuntime) {
  throw new Error(
    'CAIRN_DESKTOP_SIDECAR_RUNTIME=codex is required for smoke:codex. This runner is opt-in only.',
  );
}

const app = await electron.launch({
  args: ['.'],
  executablePath: electronExecutable,
  env: {
    ...process.env,
  },
});

try {
  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  await smokeLocator(window, 'nav-home').click();
  await waitForRunInternalTrialButton(window);
  await smokeLocator(window, 'run-internal-trial').click();
  await smokeLocator(window, 'replay-source-alert').waitFor();
  await smokeLocator(window, 'replay-inspector').waitFor();

  const observedRunId = await smokeLocator(window, 'observed-run-id').textContent();
  if (observedRunId === null || observedRunId.trim().length === 0 || observedRunId === 'none') {
    throw new Error('Expected a non-empty observed run id after running the internal trial.');
  }

  const observedTaskId = await readFirstMatchingText(
    window,
    '[class*="font-mono"]',
    /task (01[A-Z0-9]+)/u,
    1,
  );
  const observedAgentRunId = await readFirstMatchingText(
    window,
    '[class*="font-mono"]',
    /agent-run (01[A-Z0-9]+)/u,
    1,
  );
  const traceEventsBeforeNote = await readMetadataValue(window, 'Trace events');
  if (!Number.isFinite(traceEventsBeforeNote) || traceEventsBeforeNote <= 0) {
    throw new Error('Expected a positive trace event count before recording an operator note.');
  }

  await smokeLocator(window, 'operator-add-note').click();
  await smokeLocator(window, 'operator-action-applied').waitFor();
  await smokeLocator(window, 'operator-action-feedback').waitFor();

  await window.waitForFunction(
    ({ previousCount, traceEventCountSelector }) => {
      const value = globalThis.document.querySelector(traceEventCountSelector)?.textContent?.trim();
      const normalizedValue = Number(value);

      return Number.isFinite(normalizedValue) && normalizedValue > previousCount;
    },
    {
      previousCount: traceEventsBeforeNote,
      traceEventCountSelector: smokeSelector('trace-event-count'),
    },
  );

  const traceEventsAfterNote = await readMetadataValue(window, 'Trace events');
  if (traceEventsAfterNote <= traceEventsBeforeNote) {
    throw new Error('Expected operator note to refresh replay evidence trace counts.');
  }

  await smokeLocator(window, 'nav-artifact-review').click();
  await smokeLocator(window, 'artifact-review-replay-source').waitFor();
  const observedArtifactId = await readFirstMatchingText(
    window,
    '[class*="font-mono"]',
    /01[A-Z0-9]{24}/u,
  );
  if (observedArtifactId === undefined) {
    throw new Error('Expected Artifact Review to expose a replay artifact id.');
  }

  process.stdout.write(
    JSON.stringify(
      {
        observedAgentRunId,
        observedArtifactId,
        observedRunId: observedRunId.trim(),
        observedTaskId,
        traceEventsAfterNote,
      },
      null,
      2,
    ),
    'utf8',
  );
} finally {
  await app.close();
}

async function waitForRunInternalTrialButton(window) {
  const buttonName = 'run-internal-trial';
  const timeoutMs = 60_000;
  const pollIntervalMs = 1_000;
  const deadline = Date.now() + timeoutMs;
  const runButton = smokeLocator(window, buttonName);
  const refreshButton = smokeLocator(window, 'refresh-core');

  while (Date.now() < deadline) {
    if (await isEnabled(runButton)) {
      return;
    }

    if (await isEnabled(refreshButton)) {
      await refreshButton.click();
    }

    await window.waitForTimeout(pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for ${buttonName} to become actionable.\n${await readSmokeSnapshot(window)}`,
  );
}

async function readMetadataValue(window, label) {
  const smokeId = label === 'Trace events' ? 'trace-event-count' : undefined;
  const value =
    smokeId === undefined
      ? await window
          .locator('dt', { hasText: label })
          .locator('xpath=following-sibling::dd[1]')
          .textContent()
      : await smokeLocator(window, smokeId).textContent();

  if (value === null) {
    throw new Error(`Expected metadata value for ${label}.`);
  }

  const normalizedValue = Number(value.trim());
  if (!Number.isFinite(normalizedValue)) {
    throw new Error(`Expected numeric metadata value for ${label}, got ${value.trim()}.`);
  }

  return normalizedValue;
}

async function readFirstMatchingText(window, selector, pattern, captureGroup = 0) {
  return window.evaluate(
    ({ captureGroup: innerCaptureGroup, patternSource, selector: innerSelector }) => {
      const pattern = new RegExp(patternSource, 'u');
      const elements = Array.from(globalThis.document.querySelectorAll(innerSelector));

      for (const element of elements) {
        const text = element.textContent?.trim();
        if (text === undefined) {
          continue;
        }

        const match = pattern.exec(text);
        if (match === null) {
          continue;
        }

        return match[innerCaptureGroup] ?? match[0];
      }

      return undefined;
    },
    { captureGroup, patternSource: pattern.source, selector },
  );
}

async function isEnabled(locator) {
  return locator.isEnabled({ timeout: 500 }).catch(() => false);
}

function smokeLocator(window, smokeId) {
  return window.locator(smokeSelector(smokeId));
}

function smokeSelector(smokeId) {
  return `[data-smoke-id="${smokeId}"]`;
}

async function readSmokeSnapshot(window) {
  const shellStatus = await window
    .locator(smokeSelector('shell-status'))
    .textContent()
    .catch(() => undefined);
  const workspaceCoreAlert = await window
    .locator(smokeSelector('workspace-core-action-error'))
    .textContent()
    .catch(() => undefined);
  const bodyText = await window
    .evaluate(() => globalThis.document.body.innerText.slice(0, 2000))
    .catch(() => undefined);

  return [
    '--- shell status ---',
    shellStatus?.trim() ?? '<unavailable>',
    '--- workspace core alert ---',
    workspaceCoreAlert?.trim() ?? '<unavailable>',
    '--- body snippet ---',
    bodyText?.trimEnd() ?? '<unavailable>',
  ].join('\n');
}
