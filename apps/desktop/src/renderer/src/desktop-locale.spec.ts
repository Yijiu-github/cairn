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

    expect(copy.missionControlTitle).toBe('派活工作台');
    expect(copy.dispatchMissionLabel).toBe('派发给总 Agent');
    expect(copy.agentActivityTitle).toBe('Agent 动态');
    expect(copy.agentActivityRecentLabel).toBe('近期完成');
    expect(copy.agentSummaryLabel).toBe('Agent 状态汇总');
    expect(copy.agentWorkingLabel).toBe('工作中');
    expect(copy.recentProgressLabel).toBe('最近进展');
    expect(copy.liveAgentsTitle).toBe('运行中的 Agent');
    expect(copy.pinnedRunRunningLabel).toBe('进行中');
    expect(copy.pinnedRunsVisibleCountLabel(2)).toBe('显示 2 项');
    expect(copy.missionInputPreviewBody).toContain('任务草稿只保存在当前 renderer');
    expect(copy.missionDraftRequiredError).toContain('先写下');
    expect(copy.workspaceCorePanelTitle).toBe('本地运行服务');
    expect(copy.runInternalTrial).toBe('运行内部试用');
    expect(copy.runInternalTrialEmptyBody).toContain('点击“运行内部试用”');
    expect(copy.artifactPayloadLoadedLabel).toBe('负载已加载，本地路径仍隐藏。');
    expect(copy.artifactPayloadTruncatedLabel).toBe('负载已加载，本地路径仍隐藏；内容已截断。');
    expect(copy.artifactReviewReplaySourceTitle).toBe('来自回放证据');
    expect(copy.artifactReviewReplaySourceBody(2)).toBe(
      '正在审阅已加载回放证据中的 2 个产物。本地路径仍保持隐藏。',
    );
    expect(copy.agentRunsLabel).toBe('AgentRuns');
    expect(copy.processLabel).toBe('进程');
    expect(copy.replaySourceBody('01J_RUN')).toBe('正在显示 01J_RUN 的脱敏本地运行证据。');
    expect(copy.runIdLabel).toBe('运行编号');
    expect(copy.replayUnavailableTitle).toBe('回放证据尚未加载');
    expect(copy.replayNotLoadedValue).toBe('否');
    expect(copy.nextSafeStepTitle).toBe('下一步');
    expect(copy.nextSafeStepDescription).toContain('查看回放证据或产物负载');
    expect(copy.runStateLoadingLabel).toBe('加载中');
    expect(copy.sourceRootsEmptyTitle).toBe('还没有连接源目录');
    expect(copy.safetyLocalPathRevealValue).toBe('默认隐藏');
    expect(copy.shellMetadataLabel).toBe('桌面壳元数据');
    expect(copy.preloadAllowlistLabel).toBe('桌面桥接范围');
    expect(copy.liveActionsValue).toBe('受限接管动作');
    expect(copy.operatorActionApplied).toBe('接管动作已完成');
    expect(copy.operatorNoteRecorded('01J_NOTE')).toBe(
      '备注已记录到本地运行证据；右侧“回放检查器”的“Trace 事件”计数已刷新。记录编号：01J_NOTE。',
    );
    expect(copy.operatorRunCancelled('01J_RUN')).toBe('运行 01J_RUN 已取消。');
    expect(copy.operatorRerunCreated('01J_RERUN', '01J_RUN')).toBe(
      '已从 01J_RUN 创建重新运行 01J_RERUN。',
    );
    expect(copy.operatorTaskRetried('01J_TASK', 2)).toBe('任务 01J_TASK 已进入第 2 次尝试。');
    expect(copy.runDetailReadinessTitle).toBe('演示状态');
    expect(copy.runDetailReadinessReplayLabel).toBe('回放证据');
    expect(copy.runDetailReadinessLoadedValue).toBe('已加载');
    expect(copy.runDetailReadinessOperatorLabel).toBe('接管入口');
    expect(copy.runDetailReadinessOperatorReadyValue).toBe('可记录备注');
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
