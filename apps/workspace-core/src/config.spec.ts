// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { readWorkspaceCoreConfig } from './config.js';

describe('readWorkspaceCoreConfig', () => {
  it('defaults to the mock runtime gateway', () => {
    expect(readWorkspaceCoreConfig({})).toMatchObject({
      authToken: undefined,
      runtime: 'mock',
      runtimeWorkdir: '.cairn/runtime',
    });
  });

  it('parses explicit Codex runtime settings', () => {
    expect(
      readWorkspaceCoreConfig({
        CAIRN_WORKSPACE_CORE_AUTH_TOKEN: 'desktop-launch-token',
        CAIRN_WORKSPACE_CORE_RUNTIME: 'codex',
        CAIRN_WORKSPACE_CORE_RUNTIME_WORKDIR: '/tmp/cairn-runtime',
        CAIRN_WORKSPACE_CORE_CODEX_EXECUTABLE: '/usr/local/bin/codex',
        CAIRN_WORKSPACE_CORE_CODEX_SANDBOX_MODE: 'workspace-write',
      }),
    ).toMatchObject({
      authToken: 'desktop-launch-token',
      runtime: 'codex',
      runtimeWorkdir: '/tmp/cairn-runtime',
      codexExecutable: '/usr/local/bin/codex',
      codexSandboxMode: 'workspace-write',
    });
  });
});
