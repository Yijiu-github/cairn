// SPDX-License-Identifier: Apache-2.0

export type DesktopLocale = 'zh-CN' | 'en-US';

export interface DesktopLocaleStrings {
  readonly addNote: string;
  readonly agentRunsLabel: string;
  readonly agentBlockedLabel: string;
  readonly agentCompletedLabel: string;
  readonly agentIdleLabel: string;
  readonly agentStatusTitle: string;
  readonly agentActivityRecentLabel: string;
  readonly agentActivityTitle: string;
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
  readonly artifactSummaryEmptyBody: string;
  readonly artifactSummaryLoadPayload: string;
  readonly artifactSummaryReadOnlyBody: string;
  readonly artifactSummaryTitle: string;
  readonly artifactSummaryVerificationLabel: string;
  readonly artifactPayloadErrorTitle: string;
  readonly artifactPayloadAvailableLabel: string;
  readonly artifactPayloadHiddenBody: string;
  readonly artifactPayloadLoadedLabel: string;
  readonly artifactPayloadLoadPrompt: string;
  readonly artifactPayloadNotLoaded: string;
  readonly artifactPayloadStorageHidden: string;
  readonly artifactPayloadTruncatedLabel: string;
  readonly artifactCardInputRoleLabel: string;
  readonly artifactCardIntermediateRoleLabel: string;
  readonly artifactCardOutputRoleLabel: string;
  readonly artifactCardSummaryRoleLabel: string;
  readonly artifactCardTraceRoleLabel: string;
  readonly artifactCardTextKindLabel: string;
  readonly artifactCardPatchKindLabel: string;
  readonly artifactCardLogKindLabel: string;
  readonly artifactCardSnapshotKindLabel: string;
  readonly artifactCardJsonKindLabel: string;
  readonly artifactCardBinaryKindLabel: string;
  readonly artifactCardVisibilityPublicLabel: string;
  readonly artifactCardVisibilityOperatorOnlyLabel: string;
  readonly artifactCardSizeBytesLabel: string;
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
  readonly navigationLabel: string;
  readonly observeRun: string;
  readonly observedRunDescription: string;
  readonly observedRunLabel: string;
  readonly observedRunTitle: string;
  readonly operatorActionApplied: string;
  readonly operatorActionFailed: string;
  readonly operatorControlsDescription: string;
  readonly operatorControlsTitle: string;
  readonly operatorNoteRecorded: (messageId: string) => string;
  readonly operatorRerunCreated: (newRunId: string, sourceRunId: string) => string;
  readonly operatorRunCancelled: (runId: string) => string;
  readonly operatorTaskRetried: (taskId: string, newAttempt: number) => string;
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
  readonly replayLoadedValue: string;
  readonly replayLoadingBody: (runId: string) => string;
  readonly replayNotLoadedValue: string;
  readonly replaySourceBody: (runId: string) => string;
  readonly replaySourceLabel: string;
  readonly replayUnavailableBody: (runId: string) => string;
  readonly replayUnavailableDescription: string;
  readonly replayUnavailableLoadingBody: (runId: string) => string;
  readonly replayUnavailableTitle: string;
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
  readonly runStateLoadingLabel: string;
  readonly runTitle: string;
  readonly runtimeLabel: string;
  readonly serviceChecking: string;
  readonly settingsTabDescription: string;
  readonly settingsTabLabel: string;
  readonly shellMetadataLabel: string;
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
  readonly missionDraftRequiredError: string;
  readonly missionInputPreviewBody: string;
  readonly missionGuideStepOne: string;
  readonly missionGuideStepThree: string;
  readonly missionGuideStepTwo: string;
  readonly missionGuideTitle: string;
  readonly recentProgressLabel: string;
  readonly recentProgressDescription: string;
  readonly nextSafeStepDescription: string;
  readonly nextSafeStepTitle: string;
  readonly nextStepAgentsLabel: string;
  readonly nextStepAgentsValue: string;
  readonly nextStepDescription: string;
  readonly nextStepDispatchLabel: string;
  readonly nextStepDispatchValue: string;
  readonly nextStepTaskLabel: string;
  readonly nextStepTaskValue: string;
  readonly nextStepTitle: string;
  readonly pendingApprovalLabel: string;
  readonly pendingBlockedLabel: string;
  readonly pendingClarificationLabel: string;
  readonly pendingDiagnosticLabel: string;
  readonly pendingQueueDescription: (handoffCount: number) => string;
  readonly pendingQueueAgentLabel: string;
  readonly pendingQueueSourceLabel: string;
  readonly pendingQueueTitle: string;
  readonly pendingQueueWaitLabel: string;
  readonly pendingReviewLabel: string;
  readonly pathExposurePolicyTitle: string;
  readonly pathExposurePolicyDescription: string;
  readonly pathExposureDisplayLabel: string;
  readonly pathExposureDisplayValue: string;
  readonly pinnedRunBlockedLabel: string;
  readonly pinnedRunCompletedLabel: string;
  readonly pinnedRunFailedLabel: string;
  readonly pinnedRunIdleLabel: string;
  readonly pinnedRunRunningLabel: string;
  readonly pinnedRunsDescription: string;
  readonly pinnedRunsTitle: string;
  readonly pinnedRunsVisibleCountLabel: (visibleCount: number) => string;
  readonly primaryNavigationLabel: string;
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
    agentStatusTitle: 'Agent status',
    agentActivityRecentLabel: 'Recently completed',
    agentActivityTitle: 'Agent activity',
    agentSummaryLabel: 'Agent status summary',
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
    artifactSummaryEmptyBody:
      'Replay source loaded with no artifact metadata. Trace events may still explain what happened.',
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
    homeTabDescription: 'Handoff queue, pinned runs, and agent activity.',
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
    navigationLabel: 'Desktop navigation',
    observeRun: 'Observe Run',
    observedRunDescription:
      'Desktop stores one bounded run id and refreshes replay evidence from it.',
    observedRunLabel: 'Observed run',
    observedRunTitle: 'Observed run',
    operatorActionApplied: 'Operator action completed',
    operatorActionFailed: 'Operator action failed',
    operatorControlsDescription:
      'Internal-trial actions only: cancel run, retry failed task, rerun, and record an operator note.',
    operatorControlsTitle: 'Operator controls',
    operatorNoteRecorded: (messageId: string) =>
      `Note recorded in local run evidence; the Trace events count in Replay inspector was refreshed. Message id: ${messageId}.`,
    operatorRerunCreated: (newRunId: string, sourceRunId: string) =>
      `Created rerun ${newRunId} from ${sourceRunId}.`,
    operatorRunCancelled: (runId: string) => `Run ${runId} was cancelled.`,
    operatorTaskRetried: (taskId: string, newAttempt: number) =>
      `Task ${taskId} advanced to attempt ${newAttempt.toString()}.`,
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
    replayLoadedValue: 'yes',
    replayLoadingBody: (runId: string) =>
      `Reading sanitized replay evidence for ${runId}. This does not rerun the task or reveal local files.`,
    replayNotLoadedValue: 'no',
    replaySourceLabel: 'Live replay source',
    replayUnavailableBody: (runId: string) =>
      `Use Refresh Evidence to fetch the current replay source for ${runId}. Refresh is read-only and does not execute the run again.`,
    replayUnavailableDescription:
      'Desktop has an observed run id, but the read-only replay source has not been loaded yet.',
    replayUnavailableLoadingBody: (runId: string) =>
      `Reading sanitized replay evidence for ${runId}. This does not rerun the task or reveal local files.`,
    replayUnavailableTitle: 'Replay evidence not loaded',
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
    shellMetadataLabel: 'Shell metadata',
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
    artifactPayloadAvailableLabel: 'payload available',
    artifactPayloadHiddenBody:
      'Payload text is fetched on demand through Workspace Core. Local storage paths stay hidden.',
    artifactPayloadLoadedLabel: 'Payload loaded. Local storage paths remain hidden.',
    artifactPayloadLoadPrompt: 'Load payload',
    artifactPayloadNotLoaded: 'Payload not loaded',
    artifactPayloadStorageHidden:
      'Artifact storage location remains hidden in the desktop renderer.',
    artifactPayloadTruncatedLabel:
      'Payload loaded. Local storage paths remain hidden; content is truncated.',
    artifactCardInputRoleLabel: 'Input artifact',
    artifactCardIntermediateRoleLabel: 'Working artifact',
    artifactCardOutputRoleLabel: 'Output artifact',
    artifactCardSummaryRoleLabel: 'Read-only artifact',
    artifactCardTraceRoleLabel: 'Trace artifact',
    artifactCardTextKindLabel: 'text',
    artifactCardPatchKindLabel: 'patch',
    artifactCardLogKindLabel: 'log',
    artifactCardSnapshotKindLabel: 'file snapshot',
    artifactCardJsonKindLabel: 'JSON',
    artifactCardBinaryKindLabel: 'binary',
    artifactCardVisibilityPublicLabel: 'visible to this workspace',
    artifactCardVisibilityOperatorOnlyLabel: 'operator-only evidence',
    artifactCardSizeBytesLabel: 'bytes',
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
    runStateLoadingLabel: 'loading',
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
    missionDraftRequiredError: 'Describe a mission draft before dispatching the bounded preview.',
    missionInputPreviewBody:
      'This draft is kept locally in the renderer. Dispatch still runs the bounded internal trial until the planner contract lands.',
    missionGuideStepOne: '1. Describe the goal',
    missionGuideStepThree: '3. Review agent progress',
    missionGuideStepTwo: '2. Dispatch to the supervisor agent',
    missionGuideTitle: 'Experience guide',
    recentProgressLabel: 'Recent progress',
    recentProgressDescription: 'Small but durable changes the desktop shell can already observe.',
    nextSafeStepDescription:
      'Start with the bounded internal-trial path, then inspect replay evidence or artifact payloads as needed.',
    nextSafeStepTitle: 'Next step',
    nextStepAgentsLabel: 'Agents to watch',
    nextStepAgentsValue: '3 agents',
    nextStepDescription:
      'Check the next action first, then see what is waiting for review and what is already pinned.',
    nextStepDispatchLabel: 'Dispatch path',
    nextStepDispatchValue: 'bounded internal trial',
    nextStepTaskLabel: 'Task focus',
    nextStepTaskValue: 'one goal at a time',
    nextStepTitle: 'Next step / Pending',
    pendingApprovalLabel: 'Awaiting approval',
    pendingBlockedLabel: 'Blocked',
    pendingClarificationLabel: 'Needs clarification',
    pendingDiagnosticLabel: 'Diagnostic',
    pendingQueueDescription: (handoffCount: number) =>
      `${handoffCount.toString()} pending item(s) remain in the first-run surface.`,
    pendingQueueAgentLabel: 'Agent',
    pendingQueueSourceLabel: 'Source',
    pendingQueueTitle: 'Pending queue',
    pendingQueueWaitLabel: 'Waiting for',
    pendingReviewLabel: 'Waiting for review',
    pathExposurePolicyTitle: 'Path exposure policy',
    pathExposurePolicyDescription: 'Local absolute paths remain hidden in this shell.',
    pathExposureDisplayLabel: 'Display path',
    pathExposureDisplayValue: 'redacted',
    pinnedRunBlockedLabel: 'Blocked',
    pinnedRunCompletedLabel: 'Completed',
    pinnedRunFailedLabel: 'Failed',
    pinnedRunIdleLabel: 'Idle',
    pinnedRunRunningLabel: 'Running',
    pinnedRunsDescription: 'Runs you can reopen without losing the current view.',
    pinnedRunsTitle: 'Pinned runs',
    pinnedRunsVisibleCountLabel: (visibleCount: number) => `${visibleCount.toString()} shown`,
    primaryNavigationLabel: 'Primary navigation',
    reviewActionApproveExport: 'Approve export',
    reviewActionReject: 'Reject',
  },
  'zh-CN': {
    addNote: '添加备注',
    agentRunsLabel: 'AgentRuns',
    agentBlockedLabel: '阻塞',
    agentCompletedLabel: '已完成',
    agentIdleLabel: '空闲',
    agentStatusTitle: 'Agent 状态',
    agentActivityRecentLabel: '近期完成',
    agentActivityTitle: 'Agent 动态',
    agentSummaryLabel: 'Agent 状态汇总',
    agentWorkingLabel: '工作中',
    liveAgentsDescription: '当前任务队列里的总 Agent 与子 Agent 动态。',
    liveAgentsTitle: '运行中的 Agent',
    artifactReview: '产物审阅',
    artifactReviewDescription: '脱敏后的路径语言，作为安全审阅入口。',
    artifactReviewEmptyBody: '先从已观察到的运行中选择产物，或在回放证据加载后返回。',
    artifactReviewTitle: '产物审阅占位页',
    artifactSummaryDescription: '当前运行的只读产物元数据与受限负载文本。',
    artifactSummaryEmpty: '未记录产物元数据',
    artifactSummaryEmptyBody: '回放证据已加载，但没有产物元数据。Trace 事件仍可能解释发生了什么。',
    artifactSummaryLoadPayload: '加载负载',
    artifactSummaryReadOnlyBody:
      '这个产物在运行详情里只暴露元数据。没有受限负载引用，桌面也会继续隐藏存储路径。',
    artifactSummaryTitle: '产物摘要',
    artifactSummaryVerificationLabel: '仅元数据',
    artifactsLabel: '产物',
    cancelRun: '取消运行',
    connectionLabel: '连接',
    defaultRunIdPlaceholder: '01J...',
    desktopBridgeLabel: 'Cairn Desktop',
    desktopModeLabel: '桌面观察壳',
    desktopSummary: '用于派发任务、观察进度、查看证据的内部试用工作台，安全边界仍然保留。',
    desktopWorkspaceLabel: 'Cairn 本地工作区',
    desktopWorkspaceMode: '派活工作台',
    desktopWorkspaceSummary:
      '用于派发任务、观察进度、查看回放证据的内部试用工作台，安全边界仍然保留。',
    dispatchMissionLabel: '派发给总 Agent',
    englishLabel: 'English',
    evidenceTimelineLabel: '证据时间线',
    finalResponseLabel: '最终响应',
    followSystemLabel: '跟随系统语言',
    handoffInboxLabel: '接力收件箱',
    homeTabDescription: '接力队列、固定运行与 Agent 动态。',
    homeTabLabel: '首页 / 收件箱',
    inspectTitle: '查看证据',
    languageSwitcherLabel: '界面语言',
    lastErrorLabel: '最近错误',
    loadReplayTitle: '加载回放证据',
    localStorageError: '语言偏好只保存在当前浏览器会话的本地存储中。',
    metadataOnlyBody:
      '这个产物在运行详情里只暴露元数据。没有受限负载引用，桌面也会继续隐藏存储路径。',
    metadataOnlyVerification: '仅元数据',
    modeLabel: '模式',
    navigationLabel: '桌面导航',
    observeRun: '观察运行',
    observedRunDescription: '桌面端会保存一个受限运行编号，并基于它刷新只读回放证据。',
    observedRunLabel: '已观察运行',
    observedRunTitle: '已观察运行',
    operatorActionApplied: '接管动作已完成',
    operatorActionFailed: '接管动作失败',
    operatorControlsDescription:
      '仅内部试用动作：取消运行、重试失败任务、重新运行，以及记录接管备注。',
    operatorControlsTitle: '接管控制',
    operatorNoteRecorded: (messageId: string) =>
      `备注已记录到本地运行证据；右侧“回放检查器”的“Trace 事件”计数已刷新。记录编号：${messageId}。`,
    operatorRerunCreated: (newRunId: string, sourceRunId: string) =>
      `已从 ${sourceRunId} 创建重新运行 ${newRunId}。`,
    operatorRunCancelled: (runId: string) => `运行 ${runId} 已取消。`,
    operatorTaskRetried: (taskId: string, newAttempt: number) =>
      `任务 ${taskId} 已进入第 ${newAttempt.toString()} 次尝试。`,
    previewSafeLabel: '运行安全',
    previewSafeStatus: '静态',
    processLabel: '进程',
    readOnlyReplayDescription: '基于本地运行证据的只读摘要。',
    refreshCore: '刷新 Core',
    refreshEvidence: '刷新证据',
    replayEmptyBody: '回放证据已加载，但这个运行还没有任务记录。',
    replayEmptyDescription: '桌面端已有观察到的运行编号，但只读回放证据还没加载。',
    replayEmptyTitle: '回放证据中没有任务记录',
    replayInspectorDescription: '基于本地运行证据的只读摘要。',
    replayInspectorTitle: '回放检查器',
    replayLoadedLabel: '已加载回放',
    replayLoadedValue: '是',
    replayLoadingBody: (runId: string) =>
      `正在读取 ${runId} 的脱敏回放证据。这不会重新执行任务，也不会暴露本地文件。`,
    replayNotLoadedValue: '否',
    replaySourceLabel: '实时回放证据',
    replayUnavailableBody: (runId: string) =>
      `使用“刷新证据”获取 ${runId} 的最新回放证据。刷新是只读动作，不会重新执行运行。`,
    replayUnavailableDescription: '桌面端已有观察到的运行编号，但只读回放证据还没加载。',
    replayUnavailableLoadingBody: (runId: string) =>
      `正在读取 ${runId} 的脱敏回放证据。这不会重新执行任务，也不会暴露本地文件。`,
    replayUnavailableTitle: '回放证据尚未加载',
    retryTask: '重试任务',
    rerun: '重新运行',
    runDetail: '运行详情',
    runDetailOnlyRealEvidenceBody: '运行详情只渲染真实本地运行证据。当前还没有可观察的运行。',
    runDetailOnlyRealEvidenceDescription: '可以从首页启动内部试用，或粘贴已有运行编号。',
    runDetailOnlyRealEvidenceTitle: '还没有可观察的运行',
    runDetailTabDescription: '所选运行的时间线与接管上下文。',
    runDetailTabLabel: '运行详情',
    runIdLabel: '运行编号',
    runStateLabel: '运行状态',
    runTitle: '本地运行',
    runtimeLabel: '运行时',
    settingsTabDescription: '源目录与桌面壳配置占位。',
    settingsTabLabel: '设置',
    shellMetadataLabel: '桌面壳元数据',
    shellStatusLabel: '壳状态',
    shellStatusStatic: '静态',
    shellTitle: '桌面内容',
    sourceRootsTitle: '源目录',
    statusLabel: '状态',
    summaryLabel: '摘要',
    taskLabel: '任务',
    taskTreeEmptyBody: '回放证据已加载，但这个运行还没有任务记录。',
    taskTreeEmptyDescription: '任务详情来自只读回放证据。',
    taskTreeEmptyTitle: '回放证据中没有任务记录',
    traceEventsLabel: 'Trace 事件',
    workspaceCoreLabel: '本地服务',
    artifactPayloadErrorTitle: '产物负载加载失败',
    artifactPayloadAvailableLabel: '负载可加载',
    artifactPayloadHiddenBody: '负载文本会按需加载。本地存储路径保持隐藏。',
    artifactPayloadLoadedLabel: '负载已加载，本地路径仍隐藏。',
    artifactPayloadLoadPrompt: '加载负载',
    artifactPayloadNotLoaded: '负载未加载',
    artifactPayloadStorageHidden: '产物存储位置在桌面渲染器里保持隐藏。',
    artifactPayloadTruncatedLabel: '负载已加载，本地路径仍隐藏；内容已截断。',
    artifactCardInputRoleLabel: '输入产物',
    artifactCardIntermediateRoleLabel: '处理中产物',
    artifactCardOutputRoleLabel: '输出产物',
    artifactCardSummaryRoleLabel: '只读产物',
    artifactCardTraceRoleLabel: 'Trace 产物',
    artifactCardTextKindLabel: '文本',
    artifactCardPatchKindLabel: '补丁',
    artifactCardLogKindLabel: '日志',
    artifactCardSnapshotKindLabel: '文件快照',
    artifactCardJsonKindLabel: 'JSON',
    artifactCardBinaryKindLabel: '二进制',
    artifactCardVisibilityPublicLabel: '工作区可见',
    artifactCardVisibilityOperatorOnlyLabel: '仅接管者可见',
    artifactCardSizeBytesLabel: '字节',
    connectionPending: '正在检查本地服务',
    errorCountLabel: '错误',
    exportShareLabel: '导出 / 分享',
    exportShareValue: '需要明确的后续门禁',
    fileSystemMutationLabel: '文件系统变更',
    fileSystemMutationValue: '不可用',
    finalArtifactLabel: '最终产物',
    firstFailureLabel: '首次失败',
    lastErrorNone: '无',
    replaySourceBody: (runId: string) => `正在显示 ${runId} 的脱敏本地运行证据。`,
    retryableTaskLabel: '可重试任务',
    runIdRequiredError: '需要 run id',
    runIdUnknown: '未知',
    runCardAgentLabel: '本地服务',
    runCardDescription: (input: {
      readonly artifactCount: number;
      readonly taskCount: number;
      readonly traceEventCount: number;
    }) =>
      `replay source 包含 ${input.taskCount.toString()} 个任务、${input.artifactCount.toString()} 个产物和 ${input.traceEventCount.toString()} 条 trace 事件。`,
    runCardTitle: (status: string) => `运行 · ${status}`,
    runEvidenceFailedTitle: '运行证据加载失败',
    runLabel: '运行',
    runStateLoadingLabel: '加载中',
    serviceChecking: '检查中',
    sourceRootsDescription: '在源目录契约与明确的文件夹批准准备好之前，设置页只读。',
    sourceRootsEmptyBody: '选择文件夹、索引元数据与路径揭示都暂时不可用。',
    sourceRootsEmptyDescription: '未来桌面构建在索引任何本地文件夹前都应请求显式用户批准。',
    sourceRootsEmptyTitle: '还没有连接源目录',
    taskCountLabel: '任务',
    traceDescriptionInlineEmpty: '已记录内联负载。',
    traceDescriptionInlineKeys: (keys: readonly string[]) =>
      keys.length === 0 ? '已记录内联负载。' : `内联负载键: ${keys.join(', ')}。`,
    traceDescriptionPayload: (payloadRef: string) => `负载存储在产物 ${payloadRef} 中。`,
    traceDescriptionUnavailable: '未附加 payload。',
    warningCountLabel: '警告',
    workspaceCorePanelDescription: '本地服务会把运行状态、只读证据和受限接力入口放在一起。',
    workspaceCorePanelTitle: '本地运行服务',
    workspaceLabel: 'Workspace',
    workspaceStaticFixture: '本地样例',
    activeAgentCountLabel: '活跃 Agent',
    blockedAgentCountLabel: '阻塞 Agent',
    completedAgentCountLabel: '已完成 Agent',
    totalAgentCountLabel: 'Agent 总数',
    runInternalTrial: '运行内部试用',
    runInternalTrialEmptyBody:
      '点击“运行内部试用”会走受限路径，创建本地运行并读取产物、Trace 和回放证据。',
    safetyIpcActionsLabel: '接管动作',
    safetyIpcActionsValue: '受限白名单',
    safetyLocalPathRevealLabel: '本地路径揭示',
    safetyLocalPathRevealValue: '默认隐藏',
    safetyReplayValue: '只读',
    sidecarLifecycleLabel: '本地服务生命周期',
    sidecarLifecycleValue: '开发态受限',
    preloadAllowlistLabel: '桌面桥接范围',
    preloadAllowlistValue: '内部试用限定',
    liveActionsLabel: '实时动作',
    liveActionsValue: '受限接管动作',
    missionControlTitle: '派活工作台',
    missionDraftRequiredError: '先写下要交给总 Agent 的任务草稿，再派发受限预览。',
    missionInputPreviewBody:
      '任务草稿只保存在当前 renderer；在 planner 契约落地前，派发仍会执行受限内部试用路径。',
    missionGuideStepOne: '1. 写下目标',
    missionGuideStepThree: '3. 查看 Agent 进展',
    missionGuideStepTwo: '2. 派发给总 Agent',
    missionGuideTitle: '体验指引',
    recentProgressLabel: '最近进展',
    recentProgressDescription: '桌面壳已经能稳定观察到的近期进度。',
    nextSafeStepDescription: '先走受限内部试用路径，再按需查看回放证据或产物负载。',
    nextSafeStepTitle: '下一步',
    nextStepAgentsLabel: '需要关注的 Agent',
    nextStepAgentsValue: '3 个',
    nextStepDescription: '先看下一步需要做什么，再看哪些内容在等待审阅，哪些已经固定。',
    nextStepDispatchLabel: '派发路径',
    nextStepDispatchValue: '受限内部试用',
    nextStepTaskLabel: '任务关注点',
    nextStepTaskValue: '一次只看一个目标',
    nextStepTitle: '下一步 / 待处理',
    pendingApprovalLabel: '等待批准',
    pendingBlockedLabel: '阻塞',
    pendingClarificationLabel: '需要澄清',
    pendingDiagnosticLabel: '诊断请求',
    pendingQueueDescription: (handoffCount: number) =>
      `首轮体验里还有 ${handoffCount.toString()} 个待处理项。`,
    pendingQueueAgentLabel: 'Agent',
    pendingQueueSourceLabel: '来源',
    pendingQueueTitle: '待处理队列',
    pendingQueueWaitLabel: '等待',
    pendingReviewLabel: '等待审阅',
    pathExposurePolicyTitle: '路径暴露策略',
    pathExposurePolicyDescription: '本 shell 中本地绝对路径保持隐藏。',
    pathExposureDisplayLabel: '显示路径',
    pathExposureDisplayValue: '已脱敏',
    pinnedRunBlockedLabel: '阻塞',
    pinnedRunCompletedLabel: '已完成',
    pinnedRunFailedLabel: '失败',
    pinnedRunIdleLabel: '空闲',
    pinnedRunRunningLabel: '进行中',
    pinnedRunsDescription: '可重新打开而不丢失当前视图的运行。',
    pinnedRunsTitle: '已固定运行',
    pinnedRunsVisibleCountLabel: (visibleCount: number) => `显示 ${visibleCount.toString()} 项`,
    primaryNavigationLabel: '主导航',
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
