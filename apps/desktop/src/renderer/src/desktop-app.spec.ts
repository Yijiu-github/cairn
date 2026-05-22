// SPDX-License-Identifier: Apache-2.0
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { DesktopApp } from './desktop-app.js';
import { desktopShellModel } from './desktop-model.js';

describe('DesktopApp home screen', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('renders the mission-control home layout with dispatch, agent summary, live agents, and recent progress', () => {
    globalThis.window = {
      cairnDesktop: {
        app: {
          mode: 'desktop-observer',
          name: 'Cairn Desktop',
        },
      },
      localStorage: createStorage(),
    } as unknown as Window & typeof globalThis;

    const markup = renderToStaticMarkup(createElement(DesktopApp));

    expect(markup).toContain('派活工作台');
    expect(markup).toContain('派发给总 Agent');
    expect(markup).toContain('活跃 Agent');
    expect(markup).toContain('1');
    expect(markup).toContain('总 Agent');
    expect(markup).toContain('最近进展');
  });

  it('keeps mission-control counts aligned with the visible agent roster', () => {
    const statusCounts = desktopShellModel.missionControl.liveAgents.reduce(
      (counts, agent) => ({
        ...counts,
        [agent.status]: counts[agent.status] + 1,
      }),
      { blocked: 0, completed: 0, idle: 0, working: 0 },
    );

    expect(desktopShellModel.missionControl.totalAgentCount).toBe(
      desktopShellModel.missionControl.liveAgents.length,
    );
    expect(desktopShellModel.missionControl.activeAgentCount).toBe(statusCounts.working);
    expect(desktopShellModel.missionControl.blockedAgentCount).toBe(statusCounts.blocked);
    expect(desktopShellModel.missionControl.completedAgentCount).toBe(statusCounts.completed);
  });

  it('keeps the default zh-CN home free of hard-coded English mission-control copy', () => {
    globalThis.window = {
      cairnDesktop: {
        app: {
          mode: 'desktop-observer',
          name: 'Cairn Desktop',
        },
      },
      localStorage: createStorage(),
    } as unknown as Window & typeof globalThis;

    const markup = renderToStaticMarkup(createElement(DesktopApp));

    expect(markup).toContain('运行中的 Agent');
    expect(markup).toContain('当前任务队列里的总 Agent 与子 Agent 动态。');
    expect(markup).not.toContain('Live agents');
    expect(markup).not.toContain('Current supervisor and worker activity');
    expect(markup).not.toContain('Small but durable changes');
  });

  it('keeps mission dispatch as the primary smoke path without duplicate Core error selectors', () => {
    globalThis.window = {
      cairnDesktop: {
        app: {
          mode: 'desktop-observer',
          name: 'Cairn Desktop',
        },
      },
      localStorage: createStorage(),
    } as unknown as Window & typeof globalThis;

    const markup = renderToStaticMarkup(createElement(DesktopApp));

    expect(markup.match(/data-smoke-id="run-internal-trial"/g) ?? []).toHaveLength(1);
    expect(markup.match(/data-smoke-id="workspace-core-action-error"/g) ?? []).toHaveLength(0);
  });
});

function createStorage(): Storage {
  const store = new Map<string, string>();

  return {
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.get(key) ?? null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}
