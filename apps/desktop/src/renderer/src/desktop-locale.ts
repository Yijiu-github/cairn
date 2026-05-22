// SPDX-License-Identifier: Apache-2.0

export type DesktopLocale = 'zh-CN' | 'en-US';

export interface DesktopLocaleStrings {
  readonly addNote: string;
  readonly agentRunsLabel: string;
  readonly agentBlockedLabel: string;
  readonly agentCompletedLabel: string;
  readonly agentIdleLabel: string;
  readonly agentSummaryLabel: string;
  readonly agentWorkingLabel: string;
  readonly liveAgentsDescription: string;
  readonly liveAgentsTitle: string;
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
  readonly artifactPayloadErrorTitle: string;
  readonly artifactPayloadHiddenBody: string;
  readonly artifactPayloadLoadPrompt: string;
  readonly artifactPayloadNotLoaded: string;
  readonly artifactPayloadStorageHidden: string;
  readonly artifactsLabel: string;
  readonly cancelRun: string;
  readonly connectionLabel: string;
  readonly connectionPending: string;
  readonly defaultRunIdPlaceholder: string;
  readonly desktopBridgeLabel: string;
  readonly desktopModeLabel: string;
  readonly desktopSummary: string;
  readonly desktopWorkspaceLabel: string;
  readonly desktopWorkspaceMode: string;
  readonly desktopWorkspaceSummary: string;
  readonly dispatchMissionLabel: string;
  readonly englishLabel: string;
  readonly errorCountLabel: string;
  readonly evidenceTimelineLabel: string;
  readonly exportShareLabel: string;
  readonly exportShareValue: string;
  readonly fileSystemMutationLabel: string;
  readonly fileSystemMutationValue: string;
  readonly finalArtifactLabel: string;
  readonly finalResponseLabel: string;
  readonly firstFailureLabel: string;
  readonly followSystemLabel: string;
  readonly handoffInboxLabel: string;
  readonly homeTabDescription: string;
  readonly homeTabLabel: string;
  readonly inspectTitle: string;
  readonly languageSwitcherLabel: string;
  readonly lastErrorLabel: string;
  readonly lastErrorNone: string;
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
  readonly processLabel: string;
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
  readonly replaySourceBody: (runId: string) => string;
  readonly replaySourceLabel: string;
  readonly retryableTaskLabel: string;
  readonly retryTask: string;
  readonly rerun: string;
  readonly runDetail: string;
  readonly runDetailOnlyRealEvidenceBody: string;
  readonly runDetailOnlyRealEvidenceDescription: string;
  readonly runDetailOnlyRealEvidenceTitle: string;
  readonly runDetailTabDescription: string;
  readonly runDetailTabLabel: string;
  readonly runIdLabel: string;
  readonly runIdRequiredError: string;
  readonly runIdUnknown: string;
  readonly runCardAgentLabel: string;
  readonly runCardDescription: (input: {
    readonly artifactCount: number;
    readonly taskCount: number;
    readonly traceEventCount: number;
  }) => string;
  readonly runCardTitle: (status: string) => string;
  readonly runEvidenceFailedTitle: string;
  readonly runLabel: string;
  readonly runStateLabel: string;
  readonly runTitle: string;
  readonly runtimeLabel: string;
  readonly serviceChecking: string;
  readonly settingsTabDescription: string;
  readonly settingsTabLabel: string;
  readonly shellStatusLabel: string;
  readonly shellStatusStatic: string;
  readonly shellTitle: string;
  readonly sourceRootsDescription: string;
  readonly sourceRootsEmptyBody: string;
  readonly sourceRootsEmptyDescription: string;
  readonly sourceRootsEmptyTitle: string;
  readonly sourceRootsTitle: string;
  readonly statusLabel: string;
  readonly summaryLabel: string;
  readonly taskCountLabel: string;
  readonly taskLabel: string;
  readonly taskTreeEmptyBody: string;
  readonly taskTreeEmptyDescription: string;
  readonly taskTreeEmptyTitle: string;
  readonly traceDescriptionInlineEmpty: string;
  readonly traceDescriptionInlineKeys: (keys: readonly string[]) => string;
  readonly traceDescriptionPayload: (payloadRef: string) => string;
  readonly traceDescriptionUnavailable: string;
  readonly traceEventsLabel: string;
  readonly warningCountLabel: string;
  readonly workspaceCoreLabel: string;
  readonly workspaceCorePanelDescription: string;
  readonly workspaceCorePanelTitle: string;
  readonly workspaceLabel: string;
  readonly workspaceStaticFixture: string;
  readonly activeAgentCountLabel: string;
  readonly blockedAgentCountLabel: string;
  readonly completedAgentCountLabel: string;
  readonly totalAgentCountLabel: string;
  readonly runInternalTrial: string;
  readonly runInternalTrialEmptyBody: string;
  readonly safetyIpcActionsLabel: string;
  readonly safetyIpcActionsValue: string;
  readonly safetyLocalPathRevealLabel: string;
  readonly safetyLocalPathRevealValue: string;
  readonly safetyReplayValue: string;
  readonly sidecarLifecycleLabel: string;
  readonly sidecarLifecycleValue: string;
  readonly preloadAllowlistLabel: string;
  readonly preloadAllowlistValue: string;
  readonly liveActionsLabel: string;
  readonly liveActionsValue: string;
  readonly missionControlTitle: string;
  readonly missionInputPreviewBody: string;
  readonly recentProgressLabel: string;
  readonly recentProgressDescription: string;
  readonly pathExposurePolicyTitle: string;
  readonly pathExposurePolicyDescription: string;
  readonly pathExposureDisplayLabel: string;
  readonly pathExposureDisplayValue: string;
  readonly reviewActionApproveExport: string;
  readonly reviewActionReject: string;
}

const desktopLocaleStrings: Record<DesktopLocale, DesktopLocaleStrings> = {
  'en-US': {
    addNote: 'Add note',
    agentRunsLabel: 'AgentRuns',
    agentBlockedLabel: 'Blocked',
    agentCompletedLabel: 'Completed',
    agentIdleLabel: 'Idle',
    agentSummaryLabel: 'Agent overview',
    agentWorkingLabel: 'Working',
    liveAgentsDescription: 'Current supervisor and worker activity across the mission queue.',
    liveAgentsTitle: 'Live agents',
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
    dispatchMissionLabel: 'Dispatch to supervisor agent',
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
    processLabel: 'Process',
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
    artifactPayloadErrorTitle: 'Artifact payload failed to load',
    artifactPayloadHiddenBody:
      'Payload text is fetched on demand through Workspace Core. Local storage paths stay hidden.',
    artifactPayloadLoadPrompt: 'Load payload',
    artifactPayloadNotLoaded: 'Payload not loaded',
    artifactPayloadStorageHidden:
      'Artifact storage location remains hidden in the desktop renderer.',
    connectionPending: 'checking sidecar',
    errorCountLabel: 'Errors',
    exportShareLabel: 'Export / share',
    exportShareValue: 'requires explicit future gate',
    fileSystemMutationLabel: 'Filesystem mutation',
    fileSystemMutationValue: 'not available',
    finalArtifactLabel: 'Final artifact',
    firstFailureLabel: 'First failure',
    lastErrorNone: 'none',
    replaySourceBody: (runId: string) => `Showing sanitized Workspace Core evidence for ${runId}.`,
    retryableTaskLabel: 'Retryable task',
    runIdRequiredError: 'Run id is required',
    runIdUnknown: 'unknown',
    runCardAgentLabel: 'Workspace Core',
    runCardDescription: (input: {
      readonly artifactCount: number;
      readonly taskCount: number;
      readonly traceEventCount: number;
    }) =>
      `Replay source contains ${input.taskCount.toString()} task(s), ${input.artifactCount.toString()} artifact(s), and ${input.traceEventCount.toString()} trace event(s).`,
    runCardTitle: (status: string) => `Workspace Core run · ${status}`,
    runEvidenceFailedTitle: 'Run evidence failed to load',
    runLabel: 'Run',
    serviceChecking: 'checking',
    sourceRootsDescription:
      'Settings are read-only until source-root contracts and explicit folder approval are ready.',
    sourceRootsEmptyBody:
      'Choose folder, index metadata, and reveal paths are intentionally unavailable.',
    sourceRootsEmptyDescription:
      'Future desktop builds should request explicit user approval before indexing any local folder.',
    sourceRootsEmptyTitle: 'No source roots connected',
    taskCountLabel: 'Tasks',
    traceDescriptionInlineEmpty: 'Inline payload recorded.',
    traceDescriptionInlineKeys: (keys: readonly string[]) =>
      keys.length === 0 ? 'Inline payload recorded.' : `Inline payload keys: ${keys.join(', ')}.`,
    traceDescriptionPayload: (payloadRef: string) => `Payload stored in artifact ${payloadRef}.`,
    traceDescriptionUnavailable: 'No payload attached.',
    warningCountLabel: 'Warnings',
    workspaceCorePanelDescription:
      'Local loopback sidecar with a per-launch token and a bounded Desktop internal-trial run path.',
    workspaceCorePanelTitle: 'Workspace Core sidecar',
    workspaceLabel: 'Workspace',
    workspaceStaticFixture: 'static fixture',
    activeAgentCountLabel: 'Active agents',
    blockedAgentCountLabel: 'Blocked agents',
    completedAgentCountLabel: 'Completed agents',
    totalAgentCountLabel: 'Total agents',
    runInternalTrial: 'Run Internal Trial',
    runInternalTrialEmptyBody:
      'Run the bounded internal-trial path to create a Workspace Core run and read artifacts, trace, and replay evidence.',
    safetyIpcActionsLabel: 'Real IPC actions',
    safetyIpcActionsValue: 'bounded allowlist',
    safetyLocalPathRevealLabel: 'Local path reveal',
    safetyLocalPathRevealValue: 'redacted by default',
    safetyReplayValue: 'read-only',
    sidecarLifecycleLabel: 'Sidecar lifecycle',
    sidecarLifecycleValue: 'dev bridge only',
    preloadAllowlistLabel: 'Preload allowlist',
    preloadAllowlistValue: 'internal-trial only',
    liveActionsLabel: 'Live actions',
    liveActionsValue: 'bounded operator allowlist',
    missionControlTitle: 'Mission control',
    missionInputPreviewBody:
      'This preview dispatches a bounded internal trial. Free-form supervisor prompts will be enabled after the planner contract lands.',
    recentProgressLabel: 'Recent progress',
    recentProgressDescription: 'Small but durable changes the desktop shell can already observe.',
    pathExposurePolicyTitle: 'Path exposure policy',
    pathExposurePolicyDescription: 'Local absolute paths remain hidden in this shell.',
    pathExposureDisplayLabel: 'Display path',
    pathExposureDisplayValue: 'redacted',
    reviewActionApproveExport: 'Approve export',
    reviewActionReject: 'Reject',
  },
  'zh-CN': {
    addNote: '添加备注',
    agentRunsLabel: 'AgentRuns',
    agentBlockedLabel: '阻塞',
    agentCompletedLabel: '已完成',
    agentIdleLabel: '空闲',
    agentSummaryLabel: 'Agent 总览',
    agentWorkingLabel: '工作中',
    liveAgentsDescription: '当前任务队列里的总 Agent 与子 Agent 动态。',
    liveAgentsTitle: '运行中的 Agent',
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
    dispatchMissionLabel: '派发给总 Agent',
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
    processLabel: '进程',
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
    artifactPayloadErrorTitle: '产物负载加载失败',
    artifactPayloadHiddenBody: '负载文本会按需通过 Workspace Core 获取。本地存储路径保持隐藏。',
    artifactPayloadLoadPrompt: '加载负载',
    artifactPayloadNotLoaded: '负载未加载',
    artifactPayloadStorageHidden: '产物存储位置在桌面渲染器里保持隐藏。',
    connectionPending: '正在检查 sidecar',
    errorCountLabel: '错误',
    exportShareLabel: '导出 / 分享',
    exportShareValue: '需要明确的后续门禁',
    fileSystemMutationLabel: '文件系统变更',
    fileSystemMutationValue: '不可用',
    finalArtifactLabel: '最终产物',
    firstFailureLabel: '首次失败',
    lastErrorNone: '无',
    replaySourceBody: (runId: string) => `正在显示 ${runId} 的脱敏 Workspace Core 证据。`,
    retryableTaskLabel: '可重试任务',
    runIdRequiredError: '需要 run id',
    runIdUnknown: '未知',
    runCardAgentLabel: 'Workspace Core',
    runCardDescription: (input: {
      readonly artifactCount: number;
      readonly taskCount: number;
      readonly traceEventCount: number;
    }) =>
      `replay source 包含 ${input.taskCount.toString()} 个任务、${input.artifactCount.toString()} 个产物和 ${input.traceEventCount.toString()} 条 trace 事件。`,
    runCardTitle: (status: string) => `Workspace Core 运行 · ${status}`,
    runEvidenceFailedTitle: '运行证据加载失败',
    runLabel: '运行',
    serviceChecking: '检查中',
    sourceRootsDescription: '在源目录契约与明确的文件夹批准准备好之前，设置页只读。',
    sourceRootsEmptyBody: '选择文件夹、索引元数据与路径揭示都暂时不可用。',
    sourceRootsEmptyDescription: '未来桌面构建在索引任何本地文件夹前都应请求显式用户批准。',
    sourceRootsEmptyTitle: '还没有连接源目录',
    taskCountLabel: '任务',
    traceDescriptionInlineEmpty: '已记录内联 payload。',
    traceDescriptionInlineKeys: (keys: readonly string[]) =>
      keys.length === 0 ? '已记录内联 payload。' : `内联 payload 键: ${keys.join(', ')}。`,
    traceDescriptionPayload: (payloadRef: string) => `Payload 存储在产物 ${payloadRef} 中。`,
    traceDescriptionUnavailable: '未附加 payload。',
    warningCountLabel: '警告',
    workspaceCorePanelDescription:
      '本地 loopback sidecar，带有每次启动 token 和受限的 Desktop 内部试用运行路径。',
    workspaceCorePanelTitle: 'Workspace Core 本地 sidecar',
    workspaceLabel: 'Workspace',
    workspaceStaticFixture: '静态样例',
    activeAgentCountLabel: '活跃 Agent',
    blockedAgentCountLabel: '阻塞 Agent',
    completedAgentCountLabel: '已完成 Agent',
    totalAgentCountLabel: 'Agent 总数',
    runInternalTrial: '运行内部试用',
    runInternalTrialEmptyBody:
      '点击“运行内部试用”会走受限路径，创建 Workspace Core 运行并读取产物、trace 和 replay 证据。',
    safetyIpcActionsLabel: '真实 IPC 动作',
    safetyIpcActionsValue: '受限白名单',
    safetyLocalPathRevealLabel: '本地路径揭示',
    safetyLocalPathRevealValue: '默认隐藏',
    safetyReplayValue: '只读',
    sidecarLifecycleLabel: 'sidecar 生命周期',
    sidecarLifecycleValue: '仅开发桥接',
    preloadAllowlistLabel: 'Preload 白名单',
    preloadAllowlistValue: '仅内部试用',
    liveActionsLabel: '实时动作',
    liveActionsValue: '受限 operator 白名单',
    missionControlTitle: '派活工作台',
    missionInputPreviewBody:
      '当前预览会派发一条受限内部试用任务；自由输入给总 Agent 的真实任务会在 planner 契约落地后开启。',
    recentProgressLabel: '最近进展',
    recentProgressDescription: '桌面壳已经能稳定观察到的近期进度。',
    pathExposurePolicyTitle: '路径暴露策略',
    pathExposurePolicyDescription: '本 shell 中本地绝对路径保持隐藏。',
    pathExposureDisplayLabel: '显示路径',
    pathExposureDisplayValue: '已脱敏',
    reviewActionApproveExport: '批准导出',
    reviewActionReject: '拒绝',
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
