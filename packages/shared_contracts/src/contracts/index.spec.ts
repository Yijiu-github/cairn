// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { rootContract, workspaceContract, runContract, operatorContract, API_V1 } from './index.js';

describe('rootContract', () => {
  it('exposes the three top-level sub-routers', () => {
    // ts-rest 在 c.router({...}) 内部可能 wrap sub-router，
    // 所以这里不用引用相等（toBe），改为结构 + 关键路径检查。
    expect(rootContract.workspace).toBeDefined();
    expect(rootContract.run).toBeDefined();
    expect(rootContract.operator).toBeDefined();
    expect(rootContract.workspace.list.path).toBe(workspaceContract.list.path);
    expect(rootContract.run.startRun.path).toBe(runContract.startRun.path);
    expect(rootContract.operator.cancelRun.path).toBe(operatorContract.cancelRun.path);
  });
});

describe('workspaceContract', () => {
  it('exposes list / get / create / update / archive', () => {
    for (const op of ['list', 'get', 'create', 'update', 'archive'] as const) {
      expect(workspaceContract[op]).toBeDefined();
    }
  });

  it('list is GET with /v1/workspaces path', () => {
    expect(workspaceContract.list.method).toBe('GET');
    expect(workspaceContract.list.path).toBe('/v1/workspaces');
  });

  it('create is POST with same collection path', () => {
    expect(workspaceContract.create.method).toBe('POST');
    expect(workspaceContract.create.path).toBe('/v1/workspaces');
  });
});

describe('runContract', () => {
  it('exposes the full read path set', () => {
    const expected = [
      'listRuns',
      'getRun',
      'startRun',
      'listTasks',
      'getTask',
      'listAgentRuns',
      'getAgentRun',
      'listArtifacts',
      'getArtifact',
      'listTraceEvents',
    ] as const;
    for (const op of expected) {
      expect(runContract[op]).toBeDefined();
    }
  });

  it('startRun is POST under workspace path', () => {
    expect(runContract.startRun.method).toBe('POST');
    expect(runContract.startRun.path).toBe('/v1/workspaces/:workspaceId/runs');
  });

  it('listTraceEvents path is the replay-source endpoint', () => {
    expect(runContract.listTraceEvents.path).toBe('/v1/runs/:runId/trace');
  });
});

describe('operatorContract', () => {
  it('exposes all human-takeover actions', () => {
    const expected = [
      'pauseRun',
      'resumeRun',
      'cancelRun',
      'retryTask',
      'retryAgentRun',
      'rerun',
      'injectNote',
      'approveOrReject',
    ] as const;
    for (const op of expected) {
      expect(operatorContract[op]).toBeDefined();
    }
  });

  it('uses POST for all action endpoints', () => {
    for (const op of [
      'pauseRun',
      'resumeRun',
      'cancelRun',
      'retryTask',
      'retryAgentRun',
      'rerun',
      'injectNote',
      'approveOrReject',
    ] as const) {
      expect(operatorContract[op].method).toBe('POST');
    }
  });

  it('all action endpoints sit under /v1', () => {
    for (const op of [
      'pauseRun',
      'resumeRun',
      'cancelRun',
      'retryTask',
      'retryAgentRun',
      'rerun',
      'injectNote',
      'approveOrReject',
    ] as const) {
      expect(operatorContract[op].path.startsWith('/v1/')).toBe(true);
    }
  });
});

describe('API version constant', () => {
  it('API_V1 equals "/v1"', () => {
    expect(API_V1).toBe('/v1');
  });
});

describe('Contract route coverage vs documented state-machine actions', () => {
  it('contains an operator endpoint for every documented takeover action', () => {
    // 与 docs/design/state-machines.md §5 接管动作矩阵对齐
    const documented = [
      'pauseRun',
      'resumeRun',
      'cancelRun',
      'retryTask',
      'retryAgentRun',
      'rerun',
      'injectNote',
      'approveOrReject',
    ];
    for (const action of documented) {
      expect(operatorContract).toHaveProperty(action);
    }
  });
});
