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
    expect(markup).toContain('name="missionDraft"');
    expect(markup).not.toContain('readOnly');
    expect(markup).not.toContain('readonly');
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
    expect(markup).not.toContain('Design agent');
    expect(markup).not.toContain('Runtime agent');
    expect(markup).not.toContain('Review agent');
    expect(markup).not.toContain('Shell IA alignment');
    expect(markup).not.toContain('Waiting for sidecar contract');
    expect(markup).not.toContain('Artifact approval gate');
    expect(markup).not.toContain('Desktop minimal skeleton');
    expect(markup).not.toContain('Artifact review safety copy');
    expect(markup).not.toContain('healthy');
    expect(markup).not.toContain('local sidecar');
  });

  it('uses user-facing zh-CN wording for the first-run home surface', () => {
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

    expect(markup).toContain('本地运行服务');
    expect(markup).toContain('运行安全');
    expect(markup).toContain('派活工作台');
    expect(markup).not.toContain('Workspace Core 本地 sidecar');
    expect(markup).not.toContain('预览安全');
    expect(markup).not.toContain('静态样例');
    expect(markup).not.toContain('Preload 白名单');
    expect(markup).not.toContain('sidecar 生命周期');
    expect(markup).not.toContain('受限 operator 白名单');
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

  it('keeps the observed run detail surface free of obvious English runtime labels in zh-CN', () => {
    globalThis.window = {
      cairnDesktop: {
        app: {
          mode: 'desktop-observer',
          name: 'Cairn Desktop',
        },
      },
      localStorage: createStorage({
        'cairn.desktop.activeView': 'run-detail',
        'cairn.desktop.observedRunId': '01J_RUN',
      }),
    } as unknown as Window & typeof globalThis;

    const markup = renderToStaticMarkup(createElement(DesktopApp));

    expect(markup).toContain('运行编号');
    expect(markup).toContain('回放证据尚未加载');
    expect(markup).toContain('使用“刷新证据”获取 01J_RUN 的最新回放证据。');
    expect(markup).toContain('本地服务');
    expect(markup).toContain('加载中');
    expect(markup).not.toContain('Workspace Core run id');
    expect(markup).not.toContain('Workspace Core 运行');
    expect(markup).not.toContain('Replay inspector');
    expect(markup).not.toContain('Workspace Core');
    expect(markup).not.toContain('Observed run id');
    expect(markup).not.toContain('source-root');
    expect(markup).not.toContain('loading');
  });
});

function createStorage(initialValues: Readonly<Record<string, string>> = {}): Storage {
  const store = new Map(Object.entries(initialValues));

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
