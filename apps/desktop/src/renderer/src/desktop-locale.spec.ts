// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it } from 'vitest';

import {
  getDesktopLocaleStrings,
  readStoredDesktopLocale,
  writeStoredDesktopLocale,
} from './desktop-locale.js';

describe('desktop locale', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('defaults the Desktop shell to Simplified Chinese', () => {
    installWindowStub();

    expect(readStoredDesktopLocale()).toBe('zh-CN');
    expect(getDesktopLocaleStrings('zh-CN').homeTabLabel).toBe('首页 / 收件箱');
  });

  it('restores English when the local preference is en-US', () => {
    installWindowStub({ 'cairn.desktop.locale': 'en-US' });

    expect(readStoredDesktopLocale()).toBe('en-US');
    expect(getDesktopLocaleStrings('en-US').homeTabLabel).toBe('Home / Inbox');
  });

  it('falls back to Simplified Chinese for unknown stored values', () => {
    installWindowStub({ 'cairn.desktop.locale': 'fr-FR' });

    expect(readStoredDesktopLocale()).toBe('zh-CN');
  });

  it('persists the selected locale locally', () => {
    const storage = installWindowStub();

    writeStoredDesktopLocale('en-US');

    expect(storage.get('cairn.desktop.locale')).toBe('en-US');
  });

  it('covers the first-run Desktop experience with Simplified Chinese copy', () => {
    const copy = getDesktopLocaleStrings('zh-CN');

    expect(copy.workspaceCorePanelTitle).toBe('Workspace Core 本地 sidecar');
    expect(copy.runInternalTrial).toBe('运行内部试用');
    expect(copy.runInternalTrialEmptyBody).toContain('点击“运行内部试用”');
    expect(copy.agentRunsLabel).toBe('AgentRuns');
    expect(copy.processLabel).toBe('进程');
    expect(copy.replaySourceBody('01J_RUN')).toBe('正在显示 01J_RUN 的脱敏 Workspace Core 证据。');
    expect(copy.sourceRootsEmptyTitle).toBe('还没有连接源目录');
    expect(copy.safetyLocalPathRevealValue).toBe('默认隐藏');
  });
});

function installWindowStub(
  initialValues: Readonly<Record<string, string>> = {},
): Map<string, string> {
  const storage = new Map(Object.entries(initialValues));
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });

  return storage;
}
