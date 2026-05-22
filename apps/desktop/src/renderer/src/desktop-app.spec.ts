// SPDX-License-Identifier: Apache-2.0
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { DesktopApp } from './desktop-app.js';

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
    expect(markup).toContain('Supervisor / Desktop');
    expect(markup).toContain('最近进展');
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
