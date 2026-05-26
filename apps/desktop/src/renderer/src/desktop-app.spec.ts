// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import {
  AgentRunId,
  ArtifactId,
  EventId,
  OrchestrationRunId,
  TaskId,
  TraceEventId,
  TraceId,
  WorkspaceId,
} from '@cairn/shared-contracts';

import { DesktopApp, RunDetailView } from './desktop-app.js';
import { getDesktopLocaleStrings } from './desktop-locale.js';
import { desktopShellModel } from './desktop-model.js';

import type { RunReplaySource } from '@cairn/shared-contracts';

describe('DesktopApp home screen', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('renders the mission-control home layout with dispatch and a consolidated agent activity panel', () => {
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
    expect(markup).toContain('Agent 动态');
    expect(markup).toContain('近期完成');
    expect(markup).toContain('下一步 / 待处理');
    expect(markup).toContain('待处理');
    expect(markup).toContain('已固定运行');
    expect(markup).toContain('显示 2 项');
    expect(markup).toContain('首屏派活壳');
    expect(markup).toContain('产物审阅安全文案');
    expect(markup).toContain('待处理队列');
    expect(markup).not.toContain('Agent 总览');
    expect(markup).not.toContain('<h3>最近进展</h3>');
  });

  it('marks the home surface with the visual-v1 control-room layout classes', () => {
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

    expect(markup).toContain('visual-v1-home');
    expect(markup).toContain('mission-command-center');
    expect(markup).toContain('operator-status-rail');
  });

  it('keeps first-screen summaries in a dedicated right rail for demo readiness', () => {
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
    const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

    expect(markup).toContain('mission-main-stack');
    expect(markup).toContain('mission-right-rail');
    expect(markup.indexOf('Agent 动态')).toBeLessThan(markup.indexOf('下一步 / 待处理'));
    expect(markup.indexOf('下一步 / 待处理')).toBeLessThan(markup.indexOf('已固定运行'));
    expect(styles).toContain('grid-template-columns: minmax(0, 1fr) 340px;');
    expect(styles).toContain('.mission-right-rail {\n  align-self: start;');
  });

  it('prioritizes the command center before the sidebar on narrow desktop surfaces', () => {
    const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

    expect(styles).toContain('@media (max-width: 1100px)');
    expect(styles).toContain('.desktop-main {\n    order: -1;');
    expect(styles).toContain('.desktop-sidebar {\n    min-height: auto;');
    expect(styles).toContain('.nav-list {\n    grid-template-columns: repeat(2, minmax(0, 1fr));');
  });

  it('keeps the mission command center from sharing narrow desktop width with the status rail', () => {
    const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

    expect(styles).toContain('@media (max-width: 1360px)');
    expect(styles).toContain('.mission-control-layout {\n    grid-template-columns: 1fr;');
    expect(styles).toContain('.mission-hero h3 {\n    max-width: none;');
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

    expect(markup).toContain('Agent 状态');
    expect(markup).toContain('运行安全');
    expect(markup).toContain('派活工作台');
    expect(markup).not.toContain('Workspace Core 本地 sidecar');
    expect(markup).not.toContain('预览安全');
    expect(markup).not.toContain('静态样例');
    expect(markup).not.toContain('Preload 白名单');
    expect(markup).not.toContain('sidecar 生命周期');
    expect(markup).not.toContain('受限 operator 白名单');
    expect(markup).not.toContain('agent-supervisor');
    expect(markup).not.toContain('agent-runtime');
    expect(markup).not.toContain('agent-review');
    expect(markup).not.toContain('语言偏好只保存在当前浏览器会话');
    expect(markup).toContain('下一步');
    expect(markup).toContain('先走受限内部试用路径');
  });

  it('prioritizes task dispatch and agent status over service diagnostics on the zh-CN home', () => {
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

    expect(markup).toContain('体验指引');
    expect(markup).toContain('1. 写下目标');
    expect(markup).toContain('2. 派发给总 Agent');
    expect(markup).toContain('3. 查看 Agent 进展');
    expect(markup).toContain('Agent 状态');
    expect(markup).not.toContain('进程');
    expect(markup).not.toContain('运行时');
    expect(markup).not.toContain('本地服务生命周期');
    expect(markup).not.toContain('开发态受限');
    expect(markup).not.toContain('mock sidecar');
    expect(markup).not.toContain('Codex opt-in');
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

  it('localizes navigation accessibility labels on the default zh-CN shell', () => {
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

    expect(markup).toContain('aria-label="桌面导航"');
    expect(markup).toContain('aria-label="主导航"');
    expect(markup).not.toContain('aria-label="Desktop navigation"');
    expect(markup).not.toContain('aria-label="Primary"');
  });

  it('localizes sidebar metadata accessibility labels on the default zh-CN shell', () => {
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

    expect(markup).toContain('aria-label="桌面壳元数据"');
    expect(markup).not.toContain('aria-label="Shell metadata"');
  });

  it('does not keep hard-coded English empty run-id errors in renderer code', () => {
    const appSource = readFileSync(new URL('./desktop-app.tsx', import.meta.url), 'utf8');
    const loaderSource = readFileSync(new URL('./run-replay-loader.ts', import.meta.url), 'utf8');

    expect(`${appSource}\n${loaderSource}`).not.toContain(
      'Enter a Workspace Core run id to observe.',
    );
  });

  it('does not keep hard-coded English operator success feedback in renderer code', () => {
    const appSource = readFileSync(new URL('./desktop-app.tsx', import.meta.url), 'utf8');

    expect(appSource).not.toContain('was cancelled.');
    expect(appSource).not.toContain('Created rerun');
    expect(appSource).not.toContain('advanced to attempt');
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

  it('renders a compact Run Detail readiness strip once replay evidence loads', () => {
    const markup = renderToStaticMarkup(
      createElement(RunDetailView, {
        actionBusy: undefined,
        actionError: undefined,
        actionFeedback: undefined,
        artifactPayloadError: undefined,
        artifactPayloadLoadingId: undefined,
        artifactPayloads: {},
        copy: getDesktopLocaleStrings('zh-CN'),
        observedRunId: '01HZZZZZZZZZZZZZZZZZZZZZR0',
        onAddOperatorNote: noopAsync,
        onCancelRun: noopAsync,
        onLoadArtifactPayload: noopAsync,
        onObserveRun: noopAsync,
        onRefreshReplay: noopAsync,
        onRerun: noopAsync,
        onRetryTask: noopAsync,
        onRunIdChange: noop,
        replayError: undefined,
        replayLoading: false,
        replaySource: createReplaySource(),
        runIdInput: '01HZZZZZZZZZZZZZZZZZZZZZR0',
      }),
    );

    expect(markup).toContain('data-smoke-id="run-detail-readiness-strip"');
    expect(markup).toContain('演示状态');
    expect(markup).toContain('回放证据');
    expect(markup).toContain('已加载');
    expect(markup).toContain('任务');
    expect(markup).toContain('1');
    expect(markup).toContain('产物');
    expect(markup).toContain('1');
    expect(markup).toContain('Trace 事件');
    expect(markup).toContain('2');
    expect(markup).toContain('接管入口');
    expect(markup).toContain('可记录备注');
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

function noop(): void {
  return undefined;
}

function noopAsync(): Promise<void> {
  return Promise.resolve();
}

function createReplaySource(): RunReplaySource {
  const workspaceId = WorkspaceId.parse('01HZZZZZZZZZZZZZZZZZZZZZW0');
  const orchestrationRunId = OrchestrationRunId.parse('01HZZZZZZZZZZZZZZZZZZZZZR0');
  const originEventId = EventId.parse('01HZZZZZZZZZZZZZZZZZZZZZE0');
  const taskId = TaskId.parse('01HZZZZZZZZZZZZZZZZZZZZZT0');
  const agentRunId = AgentRunId.parse('01HZZZZZZZZZZZZZZZZZZZZZA0');
  const artifactId = ArtifactId.parse('01HZZZZZZZZZZZZZZZZZZZZZF0');
  const traceEventId = TraceEventId.parse('01HZZZZZZZZZZZZZZZZZZZZZP0');
  const traceId = TraceId.parse('01HZZZZZZZZZZZZZZZZZZZZZX0');

  return {
    agentRuns: [
      {
        attempt: 1,
        cancelable: false,
        createdAt: '2026-05-21T00:00:00.000Z',
        orchestrationRunId,
        outputRef: artifactId,
        retryable: false,
        runId: agentRunId,
        runtimeType: 'codex',
        status: 'succeeded',
        taskId,
        traceId,
        updatedAt: '2026-05-21T00:01:00.000Z',
        workspaceId,
      },
    ],
    artifacts: [
      {
        artifactId,
        artifactRole: 'output',
        createdAt: '2026-05-21T00:01:00.000Z',
        formatVersion: 'text.v1',
        kind: 'text',
        orchestrationRunId,
        payloadRef: 'artifact-payload://workspace/run/runtime-output.txt',
        producerId: agentRunId,
        producerType: 'agent',
        runId: agentRunId,
        sensitivity: 'none',
        sizeBytes: 42,
        taskId,
        uriOrPath: 'artifact-payload://workspace/run/runtime-output.txt',
        visibility: 'public',
        workspaceId,
      },
    ],
    inspector: {
      agentRunCount: 1,
      artifactCount: 1,
      completedAt: '2026-05-21T00:01:00.000Z',
      durationMs: 60_000,
      errorEventCount: 0,
      finalArtifactId: artifactId,
      firstFailureEventId: undefined,
      firstFailureEventType: undefined,
      startedAt: '2026-05-21T00:00:00.000Z',
      status: 'succeeded',
      taskCount: 1,
      traceEventCount: 2,
      warningEventCount: 0,
    },
    run: {
      completionLevel: 'full',
      createdAt: '2026-05-21T00:00:00.000Z',
      executionMode: 'single_worker',
      finishedAt: '2026-05-21T00:01:00.000Z',
      hasPartialFailures: false,
      orchestrationRunId,
      originEventId,
      resultCompleteness: 'complete',
      startedAt: '2026-05-21T00:00:00.000Z',
      status: 'succeeded',
      traceId,
      updatedAt: '2026-05-21T00:01:00.000Z',
      workspaceId,
    },
    tasks: [
      {
        attempt: 1,
        artifactRefs: [artifactId],
        brief: 'Render the internal-trial run detail path.',
        contextRefs: [],
        createdAt: '2026-05-21T00:00:00.000Z',
        dependsOnTaskIds: [],
        idempotencyKey: 'desktop-run-detail-demo',
        orchestrationRunId,
        priority: 50,
        status: 'succeeded',
        taskId,
        taskKind: 'custom',
        title: 'Run Detail demo',
        updatedAt: '2026-05-21T00:01:00.000Z',
        workspaceId,
      },
    ],
    traceEvents: [
      {
        createdAt: '2026-05-21T00:00:30.000Z',
        eventType: 'task.started',
        level: 'info',
        orchestrationRunId,
        payloadInline: { title: 'Run Detail demo' },
        runId: agentRunId,
        taskId,
        traceEventId,
        traceId,
        workspaceId,
      },
      {
        createdAt: '2026-05-21T00:01:00.000Z',
        eventType: 'task.succeeded',
        level: 'info',
        orchestrationRunId,
        payloadRef: artifactId,
        runId: agentRunId,
        taskId,
        traceEventId: TraceEventId.parse('01HZZZZZZZZZZZZZZZZZZZZZQ0'),
        traceId,
        workspaceId,
      },
    ],
  };
}
