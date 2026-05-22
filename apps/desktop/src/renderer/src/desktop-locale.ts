// SPDX-License-Identifier: Apache-2.0

export type DesktopLocale = 'zh-CN' | 'en-US';

export interface DesktopLocaleStrings {
  readonly addNote: string;
  readonly artifactReview: string;
  readonly artifactReviewDescription: string;
  readonly artifactReviewEmptyBody: string;
  readonly artifactReviewTitle: string;
  readonly artifactSummaryDescription: string;
  readonly artifactSummaryEmpty: string;
  readonly artifactSummaryLoadPayload: string;
  readonly artifactSummaryReadOnlyBody: string;
  readonly artifactSummaryTitle: string;
  readonly artifactSummaryVerificationLabel: string;
  readonly artifactsLabel: string;
  readonly cancelRun: string;
  readonly connectionLabel: string;
  readonly defaultRunIdPlaceholder: string;
  readonly desktopBridgeLabel: string;
  readonly desktopModeLabel: string;
  readonly desktopSummary: string;
  readonly desktopWorkspaceLabel: string;
  readonly desktopWorkspaceMode: string;
  readonly desktopWorkspaceSummary: string;
  readonly englishLabel: string;
  readonly evidenceTimelineLabel: string;
  readonly finalResponseLabel: string;
  readonly followSystemLabel: string;
  readonly handoffInboxLabel: string;
  readonly homeTabDescription: string;
  readonly homeTabLabel: string;
  readonly inspectTitle: string;
  readonly languageSwitcherLabel: string;
  readonly lastErrorLabel: string;
  readonly loadReplayTitle: string;
  readonly localStorageError: string;
  readonly metadataOnlyBody: string;
  readonly metadataOnlyVerification: string;
  readonly modeLabel: string;
  readonly observeRun: string;
  readonly observedRunLabel: string;
  readonly observedRunTitle: string;
  readonly operatorActionApplied: string;
  readonly operatorActionFailed: string;
  readonly operatorControlsDescription: string;
  readonly operatorControlsTitle: string;
  readonly operatorNoteRecorded: (messageId: string) => string;
  readonly previewSafeLabel: string;
  readonly previewSafeStatus: string;
  readonly readOnlyReplayDescription: string;
  readonly refreshCore: string;
  readonly refreshEvidence: string;
  readonly replayEmptyBody: string;
  readonly replayEmptyDescription: string;
  readonly replayEmptyTitle: string;
  readonly replayInspectorDescription: string;
  readonly replayInspectorTitle: string;
  readonly replayLoadedLabel: string;
  readonly replayLoadingBody: (runId: string) => string;
  readonly replaySourceLabel: string;
  readonly retryTask: string;
  readonly rerun: string;
  readonly runDetail: string;
  readonly runDetailOnlyRealEvidenceBody: string;
  readonly runDetailOnlyRealEvidenceDescription: string;
  readonly runDetailOnlyRealEvidenceTitle: string;
  readonly runDetailTabDescription: string;
  readonly runDetailTabLabel: string;
  readonly runIdLabel: string;
  readonly runStateLabel: string;
  readonly runTitle: string;
  readonly runtimeLabel: string;
  readonly settingsTabDescription: string;
  readonly settingsTabLabel: string;
  readonly shellStatusLabel: string;
  readonly shellStatusStatic: string;
  readonly shellTitle: string;
  readonly sourceRootsTitle: string;
  readonly statusLabel: string;
  readonly summaryLabel: string;
  readonly taskLabel: string;
  readonly taskTreeEmptyBody: string;
  readonly taskTreeEmptyDescription: string;
  readonly taskTreeEmptyTitle: string;
  readonly traceEventsLabel: string;
  readonly workspaceCoreLabel: string;
}

const desktopLocaleStrings: Record<DesktopLocale, DesktopLocaleStrings> = {
  'en-US': {
    addNote: 'Add note',
    artifactReview: 'Artifact Review',
    artifactReviewDescription: 'Safe review entry point with redacted path language.',
    artifactReviewEmptyBody:
      'Choose an artifact from the observed run or switch back after replay evidence loads.',
    artifactReviewTitle: 'Artifact Review placeholder',
    artifactSummaryDescription:
      'Read-only artifact metadata and bounded payload text for the observed run.',
    artifactSummaryEmpty: 'No artifact metadata recorded',
    artifactSummaryLoadPayload: 'Load payload',
    artifactSummaryReadOnlyBody:
      'This artifact only exposes metadata in Run Detail. No bounded payload reference is available, and Desktop keeps storage paths hidden.',
    artifactSummaryTitle: 'Artifact summary',
    artifactSummaryVerificationLabel: 'metadata only',
    artifactsLabel: 'Artifacts',
    cancelRun: 'Cancel run',
    connectionLabel: 'Connection',
    defaultRunIdPlaceholder: '01J...',
    desktopBridgeLabel: 'Cairn Desktop',
    desktopModeLabel: 'Desktop observation shell',
    desktopSummary:
      'Minimal internal-trial console for observing one bounded Workspace Core run through replay evidence, with safety gates still intact.',
    desktopWorkspaceLabel: 'Cairn Local Workspace',
    desktopWorkspaceMode: 'Desktop observation shell',
    desktopWorkspaceSummary:
      'Minimal internal-trial console for observing one bounded Workspace Core run through replay evidence, with safety gates still intact.',
    englishLabel: 'English',
    evidenceTimelineLabel: 'Evidence timeline',
    finalResponseLabel: 'Final response',
    followSystemLabel: 'Follow system language',
    handoffInboxLabel: 'Handoff inbox',
    homeTabDescription: 'Handoff queue, pinned runs, and runtime overview.',
    homeTabLabel: 'Home / Inbox',
    inspectTitle: 'Inspect evidence',
    languageSwitcherLabel: 'Interface language',
    lastErrorLabel: 'Last error',
    loadReplayTitle: 'Load replay evidence',
    localStorageError: 'Language preference is stored locally in this browser session.',
    metadataOnlyBody:
      'This artifact only exposes metadata in Run Detail. No bounded payload reference is available, and Desktop keeps storage paths hidden.',
    metadataOnlyVerification: 'metadata only',
    modeLabel: 'Mode',
    observeRun: 'Observe Run',
    observedRunLabel: 'Observed run',
    observedRunTitle: 'Observed run',
    operatorActionApplied: 'Operator action applied',
    operatorActionFailed: 'Operator action failed',
    operatorControlsDescription:
      'Internal-trial actions only: cancel run, retry failed task, rerun, and record an operator note.',
    operatorControlsTitle: 'Operator controls',
    operatorNoteRecorded: (messageId: string) => `Operator note recorded as ${messageId}.`,
    previewSafeLabel: 'Preview-safe',
    previewSafeStatus: 'static',
    readOnlyReplayDescription: 'Read-only summary derived from Workspace Core replay source.',
    refreshCore: 'Refresh Core',
    refreshEvidence: 'Refresh Evidence',
    replayEmptyBody: 'Replay source loaded, but it does not contain task records for this run yet.',
    replayEmptyDescription:
      'Desktop has an observed run id, but the read-only replay source has not been loaded yet.',
    replayEmptyTitle: 'No task records in replay source',
    replayInspectorDescription: 'Read-only summary derived from Workspace Core replay source.',
    replayInspectorTitle: 'Replay inspector',
    replayLoadedLabel: 'Replay loaded',
    replayLoadingBody: (runId: string) =>
      `Reading sanitized replay evidence for ${runId}. This does not rerun the task or reveal local files.`,
    replaySourceLabel: 'Live replay source',
    retryTask: 'Retry task',
    rerun: 'Rerun',
    runDetail: 'Run Detail',
    runDetailOnlyRealEvidenceBody:
      'Run Detail only renders real Workspace Core replay evidence. Nothing has been observed yet.',
    runDetailOnlyRealEvidenceDescription:
      'Run the internal-trial path from Home or paste an existing run id from the API smoke path.',
    runDetailOnlyRealEvidenceTitle: 'No observed run yet',
    runDetailTabDescription: 'Selected run timeline and operator context.',
    runDetailTabLabel: 'Run Detail',
    runIdLabel: 'Workspace Core run id',
    runStateLabel: 'Run state',
    runTitle: 'Workspace Core run',
    runtimeLabel: 'Runtime',
    settingsTabDescription: 'Source roots and desktop shell configuration placeholders.',
    settingsTabLabel: 'Settings',
    shellStatusLabel: 'Shell status',
    shellStatusStatic: 'static',
    shellTitle: 'Desktop content',
    sourceRootsTitle: 'Source roots placeholder',
    statusLabel: 'Status',
    summaryLabel: 'Summary',
    taskLabel: 'Task',
    taskTreeEmptyBody:
      'Replay source loaded, but it does not contain task records for this run yet.',
    taskTreeEmptyDescription: 'Task detail is derived from read-only replay evidence.',
    taskTreeEmptyTitle: 'No task records in replay source',
    traceEventsLabel: 'Trace events',
    workspaceCoreLabel: 'Workspace Core',
  },
  'zh-CN': {
    addNote: '添加备注',
    artifactReview: '产物审阅',
    artifactReviewDescription: '脱敏后的路径语言，作为安全审阅入口。',
    artifactReviewEmptyBody: '先从已观察到的运行中选择产物，或在 replay evidence 加载后返回。',
    artifactReviewTitle: '产物审阅占位页',
    artifactSummaryDescription: '当前运行的只读产物元数据与受限 payload 文本。',
    artifactSummaryEmpty: '未记录产物元数据',
    artifactSummaryLoadPayload: '加载负载',
    artifactSummaryReadOnlyBody:
      '这个产物在 Run Detail 里只暴露元数据。没有受限 payload 引用，Desktop 也会继续隐藏存储路径。',
    artifactSummaryTitle: '产物摘要',
    artifactSummaryVerificationLabel: '仅元数据',
    artifactsLabel: '产物',
    cancelRun: '取消运行',
    connectionLabel: '连接',
    defaultRunIdPlaceholder: '01J...',
    desktopBridgeLabel: 'Cairn Desktop',
    desktopModeLabel: '桌面观察壳',
    desktopSummary: '用于观察单个受限 Workspace Core 运行的内部试用控制台，安全边界仍然保留。',
    desktopWorkspaceLabel: 'Cairn 本地工作区',
    desktopWorkspaceMode: '桌面观察壳',
    desktopWorkspaceSummary:
      '用于观察单个受限 Workspace Core 运行的内部试用控制台，安全边界仍然保留。',
    englishLabel: 'English',
    evidenceTimelineLabel: '证据时间线',
    finalResponseLabel: '最终响应',
    followSystemLabel: '跟随系统语言',
    handoffInboxLabel: '接力收件箱',
    homeTabDescription: '接力队列、固定运行与运行时总览。',
    homeTabLabel: '首页 / 收件箱',
    inspectTitle: '查看证据',
    languageSwitcherLabel: '界面语言',
    lastErrorLabel: '最近错误',
    loadReplayTitle: '加载 replay 证据',
    localStorageError: '语言偏好只保存在当前浏览器会话的本地存储中。',
    metadataOnlyBody:
      '这个产物在 Run Detail 里只暴露元数据。没有受限 payload 引用，Desktop 也会继续隐藏存储路径。',
    metadataOnlyVerification: '仅元数据',
    modeLabel: '模式',
    observeRun: '观察运行',
    observedRunLabel: '已观察运行',
    observedRunTitle: '已观察运行',
    operatorActionApplied: '接管动作已应用',
    operatorActionFailed: '接管动作失败',
    operatorControlsDescription:
      '仅内部试用动作：取消运行、重试失败任务、rerun，以及记录 operator note。',
    operatorControlsTitle: '接管控制',
    operatorNoteRecorded: (messageId: string) => `Operator note 已记录为 ${messageId}。`,
    previewSafeLabel: '预览安全',
    previewSafeStatus: '静态',
    readOnlyReplayDescription: '基于 Workspace Core replay source 的只读摘要。',
    refreshCore: '刷新 Core',
    refreshEvidence: '刷新证据',
    replayEmptyBody: 'replay source 已加载，但这个运行还没有任务记录。',
    replayEmptyDescription: 'Desktop 已有观察到的 run id，但只读 replay source 还没加载。',
    replayEmptyTitle: 'replay source 中没有任务记录',
    replayInspectorDescription: '基于 Workspace Core replay source 的只读摘要。',
    replayInspectorTitle: 'Replay inspector',
    replayLoadedLabel: '已加载 replay',
    replayLoadingBody: (runId: string) =>
      `正在读取 ${runId} 的脱敏 replay 证据。这不会重新执行任务，也不会暴露本地文件。`,
    replaySourceLabel: '实时 replay source',
    retryTask: '重试任务',
    rerun: '重新运行',
    runDetail: '运行详情',
    runDetailOnlyRealEvidenceBody:
      'Run Detail 只渲染真实 Workspace Core replay 证据。当前还没有可观察的运行。',
    runDetailOnlyRealEvidenceDescription:
      '可以从首页启动内部试用，或粘贴 API smoke 路径里的 run id。',
    runDetailOnlyRealEvidenceTitle: '还没有可观察的运行',
    runDetailTabDescription: '所选运行的时间线与接管上下文。',
    runDetailTabLabel: '运行详情',
    runIdLabel: 'Workspace Core run id',
    runStateLabel: '运行状态',
    runTitle: 'Workspace Core 运行',
    runtimeLabel: '运行时',
    settingsTabDescription: '源目录与桌面壳配置占位。',
    settingsTabLabel: '设置',
    shellStatusLabel: '壳状态',
    shellStatusStatic: '静态',
    shellTitle: '桌面内容',
    sourceRootsTitle: '源目录占位',
    statusLabel: '状态',
    summaryLabel: '摘要',
    taskLabel: '任务',
    taskTreeEmptyBody: 'replay source 已加载，但这个运行还没有任务记录。',
    taskTreeEmptyDescription: '任务详情来自只读 replay evidence。',
    taskTreeEmptyTitle: 'replay source 中没有任务记录',
    traceEventsLabel: 'Trace events',
    workspaceCoreLabel: 'Workspace Core',
  },
};

export function getDesktopLocaleStrings(locale: DesktopLocale): DesktopLocaleStrings {
  return desktopLocaleStrings[locale];
}

export function readStoredDesktopLocale(): DesktopLocale {
  if (typeof window === 'undefined') {
    return 'zh-CN';
  }

  const storedLocale = window.localStorage.getItem('cairn.desktop.locale');
  return storedLocale === 'en-US' ? 'en-US' : 'zh-CN';
}

export function writeStoredDesktopLocale(locale: DesktopLocale): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('cairn.desktop.locale', locale);
}
