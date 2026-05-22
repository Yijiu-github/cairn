// SPDX-License-Identifier: Apache-2.0
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import {
  AgentStatusStrip,
  ArtifactCard,
  ArtifactReviewPanel,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EvidenceTimeline,
  HandoffQueueItem,
  Input,
  InlineAlert,
  MetadataList,
  RunCard,
  RuntimeHealthCard,
  SegmentedControl,
  SegmentedControlItem,
  StatusBadge,
  TaskTree,
} from '@cairn/ui';

import { loadArtifactPayload as loadArtifactPayloadRequest } from './artifact-payload-loader';
import {
  getDesktopLocaleStrings,
  readStoredDesktopLocale,
  writeStoredDesktopLocale,
} from './desktop-locale';
import { desktopShellModel } from './desktop-model';
import { validateMissionDraft } from './mission-draft';
import { runOperatorAction as runOperatorActionRequest } from './operator-action-runner';
import {
  artifactEmptyCopy,
  metadataOnlyArtifactCopy,
  replayUnavailableCopy,
  taskTreeEmptyCopy,
} from './run-detail-copy';
import { loadRunReplaySource as loadRunReplaySourceRequest } from './run-replay-loader';

import type { DesktopLocale, DesktopLocaleStrings } from './desktop-locale';
import type { DesktopView } from './desktop-model';
import type { ArtifactPayloadResponse, RunReplaySource } from '@cairn/shared-contracts';
import type {
  CairnEvidenceTone,
  CairnRunStatus,
  CairnTaskStatus,
  EvidenceTimelineItem,
  RunCardProps,
  TaskTreeItem,
} from '@cairn/ui';

export function DesktopApp() {
  const [activeView, setActiveView] = useState<DesktopView>(() => readStoredView());
  const [locale, setLocale] = useState<DesktopLocale>(() => readStoredDesktopLocale());
  const [workspaceCoreStatus, setWorkspaceCoreStatus] =
    useState<
      Awaited<ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['getStatus']>>
    >();
  const [trialResult, setTrialResult] =
    useState<
      Awaited<
        ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['runInternalTrial']>
      >
    >();
  const [observedRunId, setObservedRunId] = useState<string | undefined>(() => readObservedRunId());
  const [runReplaySource, setRunReplaySource] = useState<RunReplaySource>();
  const [runReplayLoading, setRunReplayLoading] = useState(false);
  const [runReplayError, setRunReplayError] = useState<string>();
  const [artifactPayloads, setArtifactPayloads] = useState<
    Readonly<Record<string, ArtifactPayloadResponse>>
  >({});
  const [artifactPayloadLoadingId, setArtifactPayloadLoadingId] = useState<string>();
  const [artifactPayloadError, setArtifactPayloadError] = useState<string>();
  const [operatorActionBusy, setOperatorActionBusy] = useState<string>();
  const [operatorActionError, setOperatorActionError] = useState<string>();
  const [operatorActionFeedback, setOperatorActionFeedback] = useState<string>();
  const [manualRunId, setManualRunId] = useState<string>(() => readObservedRunId() ?? '');
  const [workspaceCoreBusy, setWorkspaceCoreBusy] = useState(false);
  const [workspaceCoreError, setWorkspaceCoreError] = useState<string>();
  const artifactPayloadLoadState = useRef({ current: 0 });
  const operatorActionRunState = useRef({ current: 0 });
  const runReplayLoadState = useRef({ current: 0 });
  const bridgeLabel = useMemo(() => window.cairnDesktop?.app.name ?? 'Cairn Desktop', []);
  const copy = getDesktopLocaleStrings(locale);
  const localizedModel = useMemo(() => createLocalizedDesktopModel(copy), [copy]);

  useEffect(() => {
    window.localStorage.setItem('cairn.desktop.activeView', activeView);
  }, [activeView]);

  useEffect(() => {
    writeStoredDesktopLocale(locale);
  }, [locale]);

  useEffect(() => {
    if (observedRunId === undefined) {
      window.localStorage.removeItem('cairn.desktop.observedRunId');
      return;
    }

    window.localStorage.setItem('cairn.desktop.observedRunId', observedRunId);
  }, [observedRunId]);

  useEffect(() => {
    void refreshWorkspaceCoreStatus();
  }, []);

  useEffect(() => {
    if (window.cairnDesktop?.workspaceCore === undefined || observedRunId === undefined) {
      return;
    }

    void loadObservedRunReplaySource(observedRunId, { replaceCurrentSource: true });
  }, [observedRunId]);

  async function refreshWorkspaceCoreStatus() {
    if (window.cairnDesktop?.workspaceCore === undefined) {
      return;
    }

    setWorkspaceCoreBusy(true);
    setWorkspaceCoreError(undefined);
    try {
      setWorkspaceCoreStatus(await window.cairnDesktop.workspaceCore.getStatus());
    } catch (error) {
      setWorkspaceCoreError(toErrorMessage(error));
    } finally {
      setWorkspaceCoreBusy(false);
    }
  }

  async function runInternalTrial() {
    if (window.cairnDesktop?.workspaceCore === undefined) {
      return;
    }

    setWorkspaceCoreBusy(true);
    setWorkspaceCoreError(undefined);
    try {
      const result = await window.cairnDesktop.workspaceCore.runInternalTrial();
      setTrialResult(result);
      setArtifactPayloads({});
      setArtifactPayloadError(undefined);
      setObservedRunId(result.runId);
      setManualRunId(result.runId);
      setRunReplaySource(undefined);
      setRunReplayError(undefined);
      setWorkspaceCoreStatus(await window.cairnDesktop.workspaceCore.getStatus());
      setActiveView('run-detail');
    } catch (error) {
      setWorkspaceCoreError(toErrorMessage(error));
    } finally {
      setWorkspaceCoreBusy(false);
    }
  }

  async function loadObservedRunReplaySource(
    runId: string,
    options: { replaceCurrentSource?: boolean } = {},
  ) {
    if (window.cairnDesktop?.workspaceCore === undefined) {
      return;
    }

    await loadRunReplaySourceRequest(
      runReplayLoadState.current,
      {
        getRunReplaySource: window.cairnDesktop.workspaceCore.getRunReplaySource,
        getStatus: window.cairnDesktop.workspaceCore.getStatus,
        setRunReplayError,
        setRunReplayLoading,
        setRunReplaySource,
        setWorkspaceCoreStatus,
        toErrorMessage,
      },
      runId,
      options,
    );
  }

  async function observeRunId(runId: string) {
    const trimmedRunId = runId.trim();
    if (trimmedRunId.length === 0) {
      setRunReplayError('Enter a Workspace Core run id to observe.');
      return;
    }

    setObservedRunId(trimmedRunId);
    setManualRunId(trimmedRunId);
    setArtifactPayloads({});
    setArtifactPayloadError(undefined);
    setRunReplaySource(undefined);
    setRunReplayError(undefined);
    setActiveView('run-detail');

    if (trimmedRunId === observedRunId) {
      await loadObservedRunReplaySource(trimmedRunId, { replaceCurrentSource: true });
    }
  }

  async function loadArtifactPayload(artifactId: string) {
    if (window.cairnDesktop?.workspaceCore === undefined) {
      return;
    }

    await loadArtifactPayloadRequest(
      artifactPayloadLoadState.current,
      {
        getArtifactPayload: window.cairnDesktop.workspaceCore.getArtifactPayload,
        setArtifactPayloadError,
        setArtifactPayloadLoadingId,
        setArtifactPayloads,
        toErrorMessage,
      },
      artifactId,
    );
  }

  async function runOperatorAction(
    actionLabel: string,
    operation: Parameters<typeof runOperatorActionRequest>[3],
  ) {
    await runOperatorActionRequest(
      operatorActionRunState.current,
      {
        setOperatorActionBusy,
        setOperatorActionError,
        setOperatorActionFeedback,
        toErrorMessage,
      },
      actionLabel,
      operation,
    );
  }

  return (
    <main className="desktop-shell">
      <aside className="desktop-sidebar" aria-label="Desktop navigation">
        <div className="brand-block">
          <div className="brand-mark">C</div>
          <div>
            <p className="eyebrow">{bridgeLabel}</p>
            <h1>{localizedModel.workspace.label}</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {localizedModel.navItems.map((item) => (
            <button
              key={item.id}
              aria-current={activeView === item.id ? 'page' : undefined}
              className="nav-item"
              data-smoke-id={`nav-${item.id}`}
              onClick={() => {
                setActiveView(item.id);
              }}
              type="button"
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>

        <InlineAlert tone="warning" title={copy.previewSafeLabel}>
          {copy.desktopSummary}
        </InlineAlert>

        <div className="sidebar-footer" aria-label="Shell metadata">
          <span>
            {copy.modeLabel}: {window.cairnDesktop?.app.mode ?? 'static-preview'}
          </span>
          <span>
            {copy.statusLabel}: {localizedModel.viewTitle[activeView]}
          </span>
        </div>
      </aside>

      <section className="desktop-main" aria-label={copy.shellTitle}>
        <header className="top-bar">
          <div>
            <p className="eyebrow">{localizedModel.workspace.mode}</p>
            <h2>{localizedModel.viewTitle[activeView]}</h2>
            <p>{localizedModel.workspace.summary}</p>
          </div>
          <div className="top-bar-actions">
            <div
              className="shell-status-row"
              aria-label={copy.shellStatusLabel}
              data-smoke-id="shell-status"
            >
              <StatusBadge
                label={copy.previewSafeLabel}
                tone="success"
                metadata={copy.previewSafeStatus}
              />
              <StatusBadge
                label={copy.workspaceCoreLabel}
                metadata={workspaceCoreStatus?.state ?? 'checking'}
                tone={toStatusTone(workspaceCoreStatus?.state)}
              />
            </div>
            <LanguageSwitcher copy={copy} locale={locale} onLocaleChange={setLocale} />
            <Button
              data-smoke-id="refresh-core"
              disabled={window.cairnDesktop?.workspaceCore === undefined}
              loading={workspaceCoreBusy}
              onClick={() => {
                void refreshWorkspaceCoreStatus();
              }}
              variant="secondary"
            >
              {copy.refreshCore}
            </Button>
          </div>
        </header>

        <AgentStatusStrip agents={localizedModel.statusStrip} />

        {activeView === 'home' ? (
          <HomeView
            copy={copy}
            model={localizedModel}
            onRunInternalTrial={runInternalTrial}
            status={workspaceCoreStatus}
            statusError={workspaceCoreError}
            statusLoading={workspaceCoreBusy}
            trialResult={trialResult}
          />
        ) : undefined}
        {activeView === 'run-detail' ? (
          <RunDetailView
            actionBusy={operatorActionBusy}
            actionError={operatorActionError}
            actionFeedback={operatorActionFeedback}
            artifactPayloadError={artifactPayloadError}
            artifactPayloadLoadingId={artifactPayloadLoadingId}
            artifactPayloads={artifactPayloads}
            observedRunId={observedRunId}
            copy={copy}
            onAddOperatorNote={async (runId) => {
              await runOperatorAction('note', async ({ isCurrent }) => {
                const result = await window.cairnDesktop?.workspaceCore.addOperatorNote(
                  runId,
                  'Operator note from the Cairn Desktop internal trial shell.',
                  'operator_only',
                );
                if (result === undefined || !isCurrent()) {
                  return;
                }
                await loadObservedRunReplaySource(runId);
                if (!isCurrent()) {
                  return;
                }
                return copy.operatorNoteRecorded(result.messageId);
              });
            }}
            onCancelRun={async (runId) => {
              await runOperatorAction('cancel', async ({ isCurrent }) => {
                await window.cairnDesktop?.workspaceCore.cancelRun(
                  runId,
                  'Cancelled from the Cairn Desktop internal trial shell.',
                );
                if (!isCurrent()) {
                  return;
                }
                await loadObservedRunReplaySource(runId);
                if (!isCurrent()) {
                  return;
                }
                return `Run ${runId} was cancelled.`;
              });
            }}
            onLoadArtifactPayload={loadArtifactPayload}
            onObserveRun={observeRunId}
            onRefreshReplay={loadObservedRunReplaySource}
            onRunIdChange={setManualRunId}
            onRerun={async (runId) => {
              await runOperatorAction('rerun', async ({ isCurrent }) => {
                const rerun = await window.cairnDesktop?.workspaceCore.rerun(runId, {
                  operatorNote: 'Rerun requested from the Cairn Desktop internal trial shell.',
                  replan: true,
                });
                if (rerun === undefined || !isCurrent()) {
                  return;
                }
                setArtifactPayloads({});
                setArtifactPayloadError(undefined);
                setObservedRunId(rerun.orchestrationRunId);
                return `Created rerun ${rerun.orchestrationRunId} from ${runId}.`;
              });
            }}
            onRetryTask={async (taskId) => {
              await runOperatorAction('retry', async ({ isCurrent }) => {
                const result = await window.cairnDesktop?.workspaceCore.retryTask(
                  taskId,
                  'Retry requested from the Cairn Desktop internal trial shell.',
                );
                if (result === undefined || !isCurrent()) {
                  return;
                }
                const activeRunId = runReplaySource?.run.orchestrationRunId ?? observedRunId;
                if (activeRunId !== undefined) {
                  await loadObservedRunReplaySource(activeRunId);
                }
                if (!isCurrent()) {
                  return;
                }
                return `Task ${result.taskId} advanced to attempt ${String(result.newAttempt)}.`;
              });
            }}
            replayError={runReplayError}
            replayLoading={runReplayLoading}
            replaySource={runReplaySource}
            runIdInput={manualRunId}
          />
        ) : undefined}
        {activeView === 'artifact-review' ? (
          <ArtifactReviewView copy={copy} model={localizedModel} />
        ) : undefined}
        {activeView === 'settings' ? (
          <SettingsView copy={copy} model={localizedModel} />
        ) : undefined}
      </section>
    </main>
  );
}

type WorkspaceCoreStatus = Awaited<
  ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['getStatus']>
>;

type WorkspaceCoreTrialResult = Awaited<
  ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['runInternalTrial']>
>;

interface LocalizedDesktopModel {
  readonly artifactReview: typeof desktopShellModel.artifactReview;
  readonly handoffs: typeof desktopShellModel.handoffs;
  readonly missionControl: typeof desktopShellModel.missionControl;
  readonly navItems: typeof desktopShellModel.navItems;
  readonly pinnedRuns: typeof desktopShellModel.pinnedRuns;
  readonly runtime: typeof desktopShellModel.runtime;
  readonly statusStrip: typeof desktopShellModel.statusStrip;
  readonly viewTitle: Record<DesktopView, string>;
  readonly workspace: typeof desktopShellModel.workspace;
}

function LanguageSwitcher({
  copy,
  locale,
  onLocaleChange,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly locale: DesktopLocale;
  readonly onLocaleChange: (locale: DesktopLocale) => void;
}) {
  return (
    <SegmentedControl
      aria-label={copy.languageSwitcherLabel}
      className="inline-flex rounded-xl bg-slate-100 p-1 text-sm text-slate-600"
      onValueChange={(value) => {
        onLocaleChange(value === 'en-US' ? 'en-US' : 'zh-CN');
      }}
      value={locale}
    >
      <SegmentedControlItem value="zh-CN">简体中文</SegmentedControlItem>
      <SegmentedControlItem value="en-US">{copy.englishLabel}</SegmentedControlItem>
    </SegmentedControl>
  );
}

function createLocalizedDesktopModel(copy: DesktopLocaleStrings): LocalizedDesktopModel {
  const isSimplifiedChinese = copy.homeTabLabel === '首页 / 收件箱';

  return {
    artifactReview: {
      ...desktopShellModel.artifactReview,
      artifacts: desktopShellModel.artifactReview.artifacts.map((artifact) =>
        artifact.redactionLabel === undefined
          ? artifact
          : {
              ...artifact,
              redactionLabel: copy.artifactSummaryReadOnlyBody,
            },
      ),
      title: copy.artifactReviewTitle,
    },
    handoffs: desktopShellModel.handoffs.map((handoff, index) =>
      !isSimplifiedChinese
        ? handoff
        : index === 0
          ? {
              ...handoff,
              description: '确认第一版桌面壳在 sidecar / IPC 工作开始前仍保持预览安全边界。',
              sourceLabel: 'Desktop skeleton PR',
              title: '审阅桌面壳安全文案',
              waitedFor: 'operator review',
            }
          : {
              ...handoff,
              description:
                '未来 Workspace Core 连接需要明确的 preload allowlist 与 sidecar 生命周期契约。',
              sourceLabel: 'Workspace Core integration',
              title: 'Sidecar 连接仍有意受限',
              waitedFor: 'contract design',
            },
    ),
    missionControl: desktopShellModel.missionControl,
    navItems: [
      {
        description: copy.homeTabDescription,
        id: 'home',
        label: copy.homeTabLabel,
      },
      {
        description: copy.runDetailTabDescription,
        id: 'run-detail',
        label: copy.runDetailTabLabel,
      },
      {
        description: copy.artifactReviewDescription,
        id: 'artifact-review',
        label: copy.artifactReview,
      },
      {
        description: copy.settingsTabDescription,
        id: 'settings',
        label: copy.settingsTabLabel,
      },
    ],
    pinnedRuns: desktopShellModel.pinnedRuns,
    runtime: {
      ...desktopShellModel.runtime,
      description: isSimplifiedChinese
        ? 'Renderer 通过受限 preload bridge 读取 sidecar 状态与 run replay evidence。接管动作限制在 internal-trial allowlist 内。'
        : desktopShellModel.runtime.description,
      runtimeLabel: isSimplifiedChinese ? '桌面观察运行时' : desktopShellModel.runtime.runtimeLabel,
    },
    statusStrip: desktopShellModel.statusStrip,
    viewTitle: {
      'artifact-review': copy.artifactReview,
      'home': copy.homeTabLabel,
      'run-detail': copy.runDetailTabLabel,
      'settings': copy.settingsTabLabel,
    },
    workspace: {
      label: copy.desktopWorkspaceLabel,
      mode: copy.desktopWorkspaceMode,
      summary: copy.desktopWorkspaceSummary,
    },
  };
}

function readStoredView(): DesktopView {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const storedView = window.localStorage.getItem('cairn.desktop.activeView');

  if (
    storedView === 'home' ||
    storedView === 'run-detail' ||
    storedView === 'artifact-review' ||
    storedView === 'settings'
  ) {
    return storedView;
  }

  return 'home';
}

function readObservedRunId(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const storedRunId = window.localStorage.getItem('cairn.desktop.observedRunId');
  return storedRunId === null || storedRunId.length === 0 ? undefined : storedRunId;
}

interface HomeViewProps {
  readonly copy: DesktopLocaleStrings;
  readonly model: LocalizedDesktopModel;
  readonly onRunInternalTrial: () => Promise<void>;
  readonly status?: WorkspaceCoreStatus | undefined;
  readonly statusError?: string | undefined;
  readonly statusLoading: boolean;
  readonly trialResult?: WorkspaceCoreTrialResult | undefined;
}

function HomeView({
  copy,
  model,
  onRunInternalTrial,
  status,
  statusError,
  statusLoading,
  trialResult,
}: HomeViewProps) {
  return (
    <div className="mission-control-layout">
      <section className="content-stack">
        <MissionControlHero
          copy={copy}
          missionControl={model.missionControl}
          onRunInternalTrial={onRunInternalTrial}
          status={status}
          statusError={statusError}
          statusLoading={statusLoading}
          trialResult={trialResult}
        />
        <AgentSummaryStrip copy={copy} missionControl={model.missionControl} />
        <div className="mission-control-columns">
          <div className="content-stack">
            <LiveAgentList copy={copy} missionControl={model.missionControl} />
            <RecentProgressPanel copy={copy} missionControl={model.missionControl} />
          </div>
          <div className="content-stack">
            <section className="content-stack" aria-label={copy.handoffInboxLabel}>
              {model.handoffs.map((handoff) => (
                <HandoffQueueItem key={`${handoff.sourceLabel}-${handoff.title}`} {...handoff} />
              ))}
            </section>
            <div className="run-list">
              {model.pinnedRuns.map((run) => (
                <RunCard key={run.runId} {...run} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeSafetyRail copy={copy} runtime={model.runtime} />
    </div>
  );
}

function MissionControlHero({
  copy,
  missionControl,
  onRunInternalTrial,
  status,
  statusError,
  statusLoading,
  trialResult,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly missionControl: LocalizedDesktopModel['missionControl'];
  readonly onRunInternalTrial: () => Promise<void>;
  readonly status?: WorkspaceCoreStatus | undefined;
  readonly statusError?: string | undefined;
  readonly statusLoading: boolean;
  readonly trialResult?: WorkspaceCoreTrialResult | undefined;
}) {
  const coreAvailable = window.cairnDesktop?.workspaceCore !== undefined;
  const isHealthy = status?.state === 'healthy';
  const [missionDraft, setMissionDraft] = useState('');
  const [missionDraftError, setMissionDraftError] = useState<string>();

  function handleMissionDraftChange(event: ChangeEvent<HTMLInputElement>) {
    setMissionDraft(event.target.value);
    if (missionDraftError !== undefined) {
      setMissionDraftError(undefined);
    }
  }

  function dispatchMissionPreview() {
    const validation = validateMissionDraft(missionDraft);

    if (!validation.isValid) {
      setMissionDraftError(copy.missionDraftRequiredError);
      return;
    }

    setMissionDraftError(undefined);
    void onRunInternalTrial();
  }

  return (
    <section className="mission-hero" aria-label={copy.missionControlTitle}>
      <div className="mission-hero-copy">
        <p className="eyebrow">{copy.homeTabLabel}</p>
        <h3>{copy.missionControlTitle}</h3>
        <p className="mission-hero-summary">{copy.desktopWorkspaceSummary}</p>
        <div className="mission-composer" aria-label={copy.dispatchMissionLabel}>
          <Input
            aria-label={missionControl.taskComposerPlaceholder}
            className="mission-composer-input"
            name="missionDraft"
            onChange={handleMissionDraftChange}
            placeholder={missionControl.taskComposerPlaceholder}
            value={missionDraft}
          />
          <Button
            data-smoke-id="run-internal-trial"
            disabled={!coreAvailable || !isHealthy}
            loading={statusLoading}
            onClick={dispatchMissionPreview}
          >
            {copy.dispatchMissionLabel}
          </Button>
        </div>
        <p className="mission-hero-note">{copy.missionInputPreviewBody}</p>
        {missionDraftError === undefined ? undefined : (
          <InlineAlert tone="danger" title={copy.dispatchMissionLabel}>
            {missionDraftError}
          </InlineAlert>
        )}
      </div>
      <Card className="mission-hero-status workspace-core-panel">
        <CardHeader>
          <div className="card-title-row">
            <div>
              <CardTitle>{copy.workspaceCorePanelTitle}</CardTitle>
              <CardDescription>{copy.workspaceCorePanelDescription}</CardDescription>
            </div>
            <StatusBadge
              label={status?.service ?? 'workspace-core'}
              metadata={status?.state ?? 'checking'}
              tone={toStatusTone(status?.state)}
            />
          </div>
        </CardHeader>
        <CardContent className="content-stack">
          {statusError === undefined ? undefined : (
            <InlineAlert
              data-smoke-id="workspace-core-action-error"
              tone="danger"
              title={copy.workspaceCorePanelTitle}
            >
              {statusError}
            </InlineAlert>
          )}
          <MetadataList
            items={[
              {
                label: copy.connectionLabel,
                value: status?.connectionLabel ?? copy.connectionPending,
              },
              { label: copy.processLabel, value: status?.pid ?? copy.serviceChecking },
              { label: copy.lastErrorLabel, value: status?.lastError ?? copy.lastErrorNone },
              { label: copy.runtimeLabel, value: status?.runtime ?? copy.serviceChecking },
            ]}
          />
          {trialResult === undefined ? undefined : (
            <MetadataList
              items={[
                { label: copy.runLabel, value: `${trialResult.runId} · ${trialResult.runStatus}` },
                {
                  label: copy.taskLabel,
                  value: `${trialResult.taskId} · ${trialResult.taskStatus}`,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function AgentSummaryStrip({
  copy,
  missionControl,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly missionControl: LocalizedDesktopModel['missionControl'];
}) {
  const items = [
    { label: copy.activeAgentCountLabel, value: missionControl.activeAgentCount },
    { label: copy.blockedAgentCountLabel, value: missionControl.blockedAgentCount },
    { label: copy.completedAgentCountLabel, value: missionControl.completedAgentCount },
    { label: copy.totalAgentCountLabel, value: missionControl.totalAgentCount },
  ];

  return (
    <section className="agent-summary-strip" aria-label={copy.agentSummaryLabel}>
      {items.map((item) => (
        <Card key={item.label} className="agent-summary-card">
          <CardContent>
            <p>{item.label}</p>
            <strong>{item.value.toString()}</strong>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function LiveAgentList({
  copy,
  missionControl,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly missionControl: LocalizedDesktopModel['missionControl'];
}) {
  return (
    <section className="content-stack" aria-label={copy.liveAgentsTitle}>
      <div className="section-heading">
        <h3>{copy.liveAgentsTitle}</h3>
        <p>{copy.liveAgentsDescription}</p>
      </div>
      <div className="live-agent-grid">
        {missionControl.liveAgents.map((agent) => (
          <Card key={agent.agentId} className="live-agent-card">
            <CardContent className="content-stack">
              <div className="card-title-row">
                <div>
                  <p className="live-agent-label">{agent.agentId}</p>
                  <h4>{agent.title}</h4>
                </div>
                <StatusBadge
                  label={toMissionAgentStatusLabel(agent.status, copy)}
                  tone={toMissionAgentTone(agent.status)}
                />
              </div>
              <p className="live-agent-summary">{agent.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function RecentProgressPanel({
  copy,
  missionControl,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly missionControl: LocalizedDesktopModel['missionControl'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.recentProgressLabel}</CardTitle>
        <CardDescription>{copy.recentProgressDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="recent-progress-list">
          {missionControl.recentProgressItems.map((item) => (
            <article key={item.itemId} className="recent-progress-item">
              <p>{item.title}</p>
              <span>{item.detail}</span>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HomeSafetyRail({
  copy,
  runtime,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly runtime: LocalizedDesktopModel['runtime'];
}) {
  return (
    <aside className="content-stack home-safety-rail">
      <RuntimeHealthCard {...runtime} />
      <SafetyDefaultsCard copy={copy} />
      <NextSafeStepCard copy={copy} />
    </aside>
  );
}

interface RunDetailViewProps {
  readonly actionBusy?: string | undefined;
  readonly actionError?: string | undefined;
  readonly actionFeedback?: string | undefined;
  readonly artifactPayloadError?: string | undefined;
  readonly artifactPayloadLoadingId?: string | undefined;
  readonly artifactPayloads: Readonly<Record<string, ArtifactPayloadResponse>>;
  readonly copy: DesktopLocaleStrings;
  readonly observedRunId?: string | undefined;
  readonly onAddOperatorNote: (runId: string) => Promise<void>;
  readonly onCancelRun: (runId: string) => Promise<void>;
  readonly onLoadArtifactPayload: (artifactId: string) => Promise<void>;
  readonly onObserveRun: (runId: string) => Promise<void>;
  readonly onRefreshReplay: (runId: string) => Promise<void>;
  readonly onRunIdChange: (runId: string) => void;
  readonly onRerun: (runId: string) => Promise<void>;
  readonly onRetryTask: (taskId: string) => Promise<void>;
  readonly replayError?: string | undefined;
  readonly replayLoading: boolean;
  readonly replaySource?: RunReplaySource | undefined;
  readonly runIdInput: string;
}

function RunDetailView({
  actionBusy,
  actionError,
  actionFeedback,
  artifactPayloadError,
  artifactPayloadLoadingId,
  artifactPayloads,
  copy,
  observedRunId,
  onAddOperatorNote,
  onCancelRun,
  onLoadArtifactPayload,
  onObserveRun,
  onRefreshReplay,
  onRunIdChange,
  onRerun,
  onRetryTask,
  replayError,
  replayLoading,
  replaySource,
  runIdInput,
}: RunDetailViewProps) {
  if (observedRunId === undefined) {
    return (
      <div className="content-grid">
        <section className="content-stack">
          <RunIdObservationForm
            copy={copy}
            disabled={replayLoading}
            onRunIdChange={onRunIdChange}
            onSubmit={onObserveRun}
            runId={runIdInput}
          />
          <Card>
            <CardHeader>
              <CardTitle>{copy.runDetailOnlyRealEvidenceTitle}</CardTitle>
              <CardDescription>{copy.runDetailOnlyRealEvidenceDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel">
                <span aria-hidden="true">◎</span>
                <p>{copy.runDetailOnlyRealEvidenceBody}</p>
              </div>
            </CardContent>
          </Card>
        </section>
        <aside className="content-stack">
          <RunObservationCard
            copy={copy}
            observedRunId={observedRunId}
            replaySource={replaySource}
          />
          <SafetyDefaultsCard copy={copy} />
        </aside>
      </div>
    );
  }

  const run = replaySource === undefined ? undefined : toRunCardProps(replaySource, copy);
  const timelineItems =
    replaySource === undefined ? undefined : toEvidenceTimelineItems(replaySource, copy);
  const taskItems = replaySource === undefined ? undefined : toTaskTreeItems(replaySource);
  const selectedTaskId = replaySource?.tasks[0]?.taskId;
  const activeRunId = replaySource?.run.orchestrationRunId ?? observedRunId;
  const terminalRun =
    replaySource === undefined ? false : isTerminalRunStatus(replaySource.run.status);
  const retryableTaskId = replaySource?.tasks.find((task) => task.status === 'failed')?.taskId;
  const canRetryTask = retryableTaskId !== undefined && replaySource !== undefined && !terminalRun;
  const canRerun = replaySource !== undefined && terminalRun;
  const canCancel = replaySource !== undefined && !terminalRun;
  const replayUnavailable = replayUnavailableCopy({
    loading: replayLoading,
    runId: observedRunId,
  });

  return (
    <div className="content-grid">
      <section className="content-stack">
        <RunIdObservationForm
          copy={copy}
          disabled={replayLoading}
          onRunIdChange={onRunIdChange}
          onSubmit={onObserveRun}
          runId={runIdInput}
        />
        {replayError === undefined || replaySource !== undefined ? undefined : (
          <InlineAlert tone="danger" title={copy.runEvidenceFailedTitle}>
            {replayError}
          </InlineAlert>
        )}
        {actionError === undefined ? undefined : (
          <InlineAlert tone="danger" title={copy.operatorActionFailed}>
            {actionError}
          </InlineAlert>
        )}
        {actionFeedback === undefined ? undefined : (
          <InlineAlert
            data-smoke-id="operator-action-applied"
            tone="success"
            title={copy.operatorActionApplied}
          >
            <span data-smoke-id="operator-action-feedback">{actionFeedback}</span>
          </InlineAlert>
        )}
        {replaySource === undefined ? undefined : (
          <InlineAlert
            data-smoke-id="replay-source-alert"
            tone="success"
            title={copy.replaySourceLabel}
          >
            {copy.replaySourceBody(replaySource.run.orchestrationRunId)}
          </InlineAlert>
        )}
        {run === undefined ? (
          <Card>
            <CardHeader>
              <CardTitle>{replayUnavailable.title}</CardTitle>
              <CardDescription>{replayUnavailable.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel">
                <span aria-hidden="true">{replayLoading ? '…' : '!'}</span>
                <p>{replayUnavailable.body}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <RunCard {...run} />
            <EvidenceTimeline items={timelineItems ?? []} />
          </>
        )}
      </section>
      <aside className="content-stack">
        <RunObservationCard copy={copy} observedRunId={observedRunId} replaySource={replaySource} />
        {taskItems === undefined ? (
          <Card>
            <CardHeader>
              <CardTitle>{taskTreeEmptyCopy.title}</CardTitle>
              <CardDescription>{copy.taskTreeEmptyDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel compact">
                <span aria-hidden="true">⋯</span>
                <p>{taskTreeEmptyCopy.body}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TaskTree items={taskItems} selectedId={selectedTaskId} />
        )}
        {replaySource === undefined ? undefined : (
          <ReplayInspectorCard copy={copy} replaySource={replaySource} />
        )}
        {replaySource === undefined ? undefined : (
          <ArtifactSummaryCard
            artifactPayloadError={artifactPayloadError}
            artifactPayloadLoadingId={artifactPayloadLoadingId}
            artifactPayloads={artifactPayloads}
            copy={copy}
            onLoadArtifactPayload={onLoadArtifactPayload}
            replaySource={replaySource}
          />
        )}
        <Card>
          <CardHeader>
            <CardTitle>{copy.operatorControlsTitle}</CardTitle>
            <CardDescription>{copy.operatorControlsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="content-stack">
            <MetadataList
              items={[
                { label: copy.observedRunLabel, value: activeRunId },
                { label: copy.retryableTaskLabel, value: retryableTaskId ?? copy.runIdUnknown },
                { label: copy.runStateLabel, value: replaySource?.run.status ?? 'loading' },
              ]}
            />
            <div className="button-row">
              <Button
                data-smoke-id="operator-add-note"
                loading={actionBusy === 'note'}
                onClick={() => {
                  void onAddOperatorNote(activeRunId);
                }}
                variant="secondary"
              >
                {copy.addNote}
              </Button>
              <Button
                disabled={!canRetryTask}
                loading={actionBusy === 'retry'}
                onClick={() => {
                  if (retryableTaskId !== undefined) {
                    void onRetryTask(retryableTaskId);
                  }
                }}
                variant="secondary"
              >
                {copy.retryTask}
              </Button>
              <Button
                disabled={!canRerun}
                loading={actionBusy === 'rerun'}
                onClick={() => {
                  void onRerun(activeRunId);
                }}
                variant="secondary"
              >
                {copy.rerun}
              </Button>
              <Button
                disabled={!canCancel}
                loading={actionBusy === 'cancel'}
                onClick={() => {
                  void onCancelRun(activeRunId);
                }}
                variant="danger"
              >
                {copy.cancelRun}
              </Button>
              <Button
                loading={replayLoading}
                onClick={() => {
                  void onRefreshReplay(activeRunId);
                }}
                variant="secondary"
              >
                {copy.refreshEvidence}
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

interface RunIdObservationFormProps {
  readonly copy: DesktopLocaleStrings;
  readonly disabled: boolean;
  readonly onRunIdChange: (runId: string) => void;
  readonly onSubmit: (runId: string) => Promise<void>;
  readonly runId: string;
}

function RunIdObservationForm({
  copy,
  disabled,
  onRunIdChange,
  onSubmit,
  runId,
}: RunIdObservationFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.observedRunTitle}</CardTitle>
        <CardDescription>{copy.loadReplayTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="run-id-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(runId);
          }}
        >
          <Input
            aria-label={copy.runIdLabel}
            disabled={disabled}
            onChange={(event) => {
              onRunIdChange(event.currentTarget.value);
            }}
            placeholder={copy.defaultRunIdPlaceholder}
            value={runId}
          />
          <Button disabled={disabled || runId.trim().length === 0} loading={disabled}>
            {copy.observeRun}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReplayInspectorCard({
  copy,
  replaySource,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly replaySource: RunReplaySource;
}) {
  const inspector = replaySource.inspector;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.replayInspectorTitle}</CardTitle>
        <CardDescription>{copy.replayInspectorDescription}</CardDescription>
      </CardHeader>
      <CardContent data-smoke-id="replay-inspector">
        <MetadataList
          items={[
            { label: 'Tasks', value: inspector.taskCount },
            { label: 'Agent runs', value: inspector.agentRunCount },
            { label: copy.artifactsLabel, value: inspector.artifactCount },
            {
              label: copy.traceEventsLabel,
              value: <span data-smoke-id="trace-event-count">{inspector.traceEventCount}</span>,
            },
            { label: 'Warnings', value: inspector.warningEventCount },
            { label: 'Errors', value: inspector.errorEventCount },
            { label: 'First failure', value: inspector.firstFailureEventType ?? 'none' },
            { label: 'Final artifact', value: inspector.finalArtifactId ?? 'none' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function RunObservationCard({
  copy,
  observedRunId,
  replaySource,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly observedRunId?: string | undefined;
  readonly replaySource?: RunReplaySource | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.observedRunTitle}</CardTitle>
        <CardDescription>
          Desktop stores one bounded run id and refreshes replay evidence from it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            {
              label: 'Observed run id',
              value: <span data-smoke-id="observed-run-id">{observedRunId ?? 'none'}</span>,
            },
            { label: copy.replayLoadedLabel, value: replaySource === undefined ? 'no' : 'yes' },
            { label: copy.runStateLabel, value: replaySource?.run.status ?? 'unknown' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

interface ArtifactSummaryCardProps {
  readonly artifactPayloadError?: string | undefined;
  readonly artifactPayloadLoadingId?: string | undefined;
  readonly artifactPayloads: Readonly<Record<string, ArtifactPayloadResponse>>;
  readonly copy: DesktopLocaleStrings;
  readonly onLoadArtifactPayload: (artifactId: string) => Promise<void>;
  readonly replaySource: RunReplaySource;
}

function ArtifactSummaryCard({
  artifactPayloadError,
  artifactPayloadLoadingId,
  artifactPayloads,
  copy,
  onLoadArtifactPayload,
  replaySource,
}: ArtifactSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.artifactSummaryTitle}</CardTitle>
        <CardDescription>{copy.artifactSummaryDescription}</CardDescription>
      </CardHeader>
      <CardContent className="content-stack">
        {artifactPayloadError === undefined ? undefined : (
          <InlineAlert tone="danger" title={copy.artifactPayloadErrorTitle}>
            {artifactPayloadError}
          </InlineAlert>
        )}
        {replaySource.artifacts.length === 0 ? (
          <div className="empty-state-panel compact">
            <span aria-hidden="true">∅</span>
            <p>{artifactEmptyCopy.body}</p>
          </div>
        ) : (
          <div className="artifact-summary-list">
            {replaySource.artifacts.map((artifact) => {
              const payload = artifactPayloads[artifact.artifactId];
              const payloadAvailable = artifact.payloadRef !== undefined;
              return (
                <div className="artifact-summary-item" key={artifact.artifactId}>
                  <ArtifactCard
                    artifactId={artifact.artifactId}
                    kind={toArtifactCardKind(artifact.kind)}
                    path={artifact.uriOrPath}
                    pathDisplayMode="hidden"
                    redactionLabel={copy.artifactPayloadStorageHidden}
                    reviewState="draft"
                    sensitivity={artifact.sensitivity}
                    summary={toArtifactSummary(artifact)}
                    title={`${artifact.artifactRole} · ${artifact.kind}`}
                    verification={
                      payloadAvailable ? 'payload available' : metadataOnlyArtifactCopy.verification
                    }
                  />
                  {payloadAvailable ? (
                    <div className="artifact-payload-preview">
                      <div className="artifact-payload-header">
                        <span>
                          {payload === undefined
                            ? copy.artifactPayloadNotLoaded
                            : `${payload.mediaType}${payload.truncated ? ' · truncated' : ''}`}
                        </span>
                        <Button
                          loading={artifactPayloadLoadingId === artifact.artifactId}
                          onClick={() => {
                            void onLoadArtifactPayload(artifact.artifactId);
                          }}
                          variant="secondary"
                        >
                          {copy.artifactPayloadLoadPrompt}
                        </Button>
                      </div>
                      {payload === undefined ? (
                        <p>{copy.artifactPayloadHiddenBody}</p>
                      ) : (
                        <pre>{payload.text}</pre>
                      )}
                    </div>
                  ) : (
                    <div className="artifact-payload-preview">
                      <p>{metadataOnlyArtifactCopy.body}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ArtifactReviewView({
  copy,
  model,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly model: LocalizedDesktopModel;
}) {
  return (
    <div className="content-grid">
      <section className="content-stack">
        <ArtifactReviewPanel
          actions={[
            { disabled: true, label: copy.reviewActionApproveExport, tone: 'primary' },
            { disabled: true, label: copy.reviewActionReject, tone: 'danger' },
          ]}
          artifactId={model.artifactReview.artifactId}
          note={model.artifactReview.note}
          reviewState="pending_review"
          title={copy.artifactReviewTitle}
        />
        <div className="artifact-list">
          {model.artifactReview.artifacts.map((artifact) => (
            <ArtifactCard key={artifact.artifactId} {...artifact} />
          ))}
        </div>
      </section>
      <aside className="content-stack">
        <SafetyDefaultsCard copy={copy} />
        <Card>
          <CardHeader>
            <CardTitle>{copy.pathExposurePolicyTitle}</CardTitle>
            <CardDescription>{copy.pathExposurePolicyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <MetadataList
              items={[
                { label: copy.pathExposureDisplayLabel, value: copy.pathExposureDisplayValue },
                { label: copy.exportShareLabel, value: copy.exportShareValue },
                { label: copy.fileSystemMutationLabel, value: copy.fileSystemMutationValue },
              ]}
            />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function SettingsView({
  copy,
  model,
}: {
  readonly copy: DesktopLocaleStrings;
  readonly model: LocalizedDesktopModel;
}) {
  return (
    <div className="content-grid">
      <section className="content-stack">
        <Card>
          <CardHeader>
            <CardTitle>{copy.sourceRootsTitle}</CardTitle>
            <CardDescription>{copy.sourceRootsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <MetadataList
              items={[
                { label: copy.workspaceLabel, value: model.workspace.label },
                { label: copy.connectionLabel, value: copy.workspaceStaticFixture },
                {
                  label: copy.desktopBridgeLabel,
                  value: window.cairnDesktop?.app.mode ?? 'unavailable',
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <CardTitle>{copy.sourceRootsEmptyTitle}</CardTitle>
            <CardDescription>{copy.sourceRootsEmptyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="empty-state-panel">
              <span aria-hidden="true">⌁</span>
              <p>{copy.sourceRootsEmptyBody}</p>
            </div>
          </CardContent>
        </Card>
      </section>
      <aside className="content-stack">
        <RuntimeHealthCard {...model.runtime} />
        <NextSafeStepCard copy={copy} />
      </aside>
    </div>
  );
}

function NextSafeStepCard({ copy }: { readonly copy: DesktopLocaleStrings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.inspectTitle}</CardTitle>
        <CardDescription>{copy.localStorageError}</CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: copy.preloadAllowlistLabel, value: copy.preloadAllowlistValue },
            { label: copy.sidecarLifecycleLabel, value: copy.sidecarLifecycleValue },
            { label: copy.liveActionsLabel, value: copy.liveActionsValue },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function SafetyDefaultsCard({ copy }: { readonly copy: DesktopLocaleStrings }) {
  return (
    <Card variant="handoff">
      <CardHeader>
        <CardTitle>{copy.previewSafeLabel}</CardTitle>
        <CardDescription>{copy.desktopSummary}</CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: copy.replaySourceLabel, value: copy.safetyReplayValue },
            { label: copy.safetyIpcActionsLabel, value: copy.safetyIpcActionsValue },
            { label: copy.safetyLocalPathRevealLabel, value: copy.safetyLocalPathRevealValue },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function toRunCardProps(replaySource: RunReplaySource, copy: DesktopLocaleStrings): RunCardProps {
  return {
    agentLabel: copy.runCardAgentLabel,
    description: copy.runCardDescription({
      artifactCount: replaySource.artifacts.length,
      taskCount: replaySource.tasks.length,
      traceEventCount: replaySource.traceEvents.length,
    }),
    metrics: [
      { label: copy.taskCountLabel, value: replaySource.inspector.taskCount },
      { label: copy.artifactsLabel, value: replaySource.inspector.artifactCount },
      { label: copy.traceEventsLabel, value: replaySource.inspector.traceEventCount },
    ],
    progress: toRunProgress(replaySource.run.status),
    runId: replaySource.run.orchestrationRunId,
    status: toCairnRunStatus(replaySource.run.status),
    title: copy.runCardTitle(replaySource.run.status),
  };
}

function toTaskTreeItems(replaySource: RunReplaySource): readonly TaskTreeItem[] {
  const taskMap = new Map(
    replaySource.tasks.map((task) => [
      task.taskId,
      {
        attempt: task.attempt,
        children: [] as TaskTreeItem[],
        id: task.taskId,
        label: task.title,
        metadata: `${task.taskKind} · ${task.status}`,
        status: toCairnTaskStatus(task.status),
      },
    ]),
  );
  const rootItems: TaskTreeItem[] = [];

  for (const task of replaySource.tasks) {
    const item = taskMap.get(task.taskId);
    if (item === undefined) {
      continue;
    }

    if (task.parentTaskId === undefined) {
      rootItems.push(item);
      continue;
    }

    const parent = taskMap.get(task.parentTaskId);
    if (parent === undefined) {
      rootItems.push(item);
      continue;
    }

    parent.children = [...parent.children, item];
  }

  return rootItems;
}

function toEvidenceTimelineItems(
  replaySource: RunReplaySource,
  copy: DesktopLocaleStrings,
): readonly EvidenceTimelineItem[] {
  return replaySource.traceEvents.map((event) => ({
    description: toTraceDescription(event, copy),
    id: event.traceEventId,
    metadata: [
      `level ${event.level}`,
      `trace ${event.traceId}`,
      event.taskId === undefined ? undefined : `task ${event.taskId}`,
      event.runId === undefined ? undefined : `agent-run ${event.runId}`,
    ]
      .filter((value): value is string => value !== undefined)
      .join(' · '),
    time: formatTraceTime(event.createdAt),
    title: event.eventType,
    tone: toEvidenceTone(event.level),
  }));
}

function toArtifactCardKind(
  kind: RunReplaySource['artifacts'][number]['kind'],
): 'patch' | 'log' | 'other' {
  if (kind === 'patch') {
    return 'patch';
  }

  if (kind === 'log') {
    return 'log';
  }

  return 'other';
}

function toArtifactSummary(artifact: RunReplaySource['artifacts'][number]): string {
  return [
    `kind ${artifact.kind}`,
    `visibility ${artifact.visibility}`,
    artifact.contentType === undefined ? undefined : `content ${artifact.contentType}`,
    artifact.sizeBytes === undefined ? undefined : `${artifact.sizeBytes.toString()} bytes`,
  ]
    .filter((value): value is string => value !== undefined)
    .join(' · ');
}

function toTraceDescription(
  event: RunReplaySource['traceEvents'][number],
  copy: DesktopLocaleStrings,
): string {
  if (event.payloadRef !== undefined) {
    return copy.traceDescriptionPayload(event.payloadRef);
  }

  if (event.payloadInline !== undefined) {
    const payloadKeys = Object.keys(event.payloadInline);
    return payloadKeys.length === 0
      ? copy.traceDescriptionInlineEmpty
      : copy.traceDescriptionInlineKeys(payloadKeys);
  }

  return copy.traceDescriptionUnavailable;
}

function toCairnRunStatus(status: RunReplaySource['run']['status']): CairnRunStatus {
  if (status === 'succeeded') {
    return 'completed';
  }

  if (status === 'queued') {
    return 'idle';
  }

  if (status === 'planning' || status === 'running' || status === 'synthesizing') {
    return 'running';
  }

  if (status === 'paused') {
    return 'blocked';
  }

  if (status === 'cancelled') {
    return 'cancelled';
  }

  return 'failed';
}

function toCairnTaskStatus(status: RunReplaySource['tasks'][number]['status']): CairnTaskStatus {
  if (status === 'succeeded') {
    return 'completed';
  }

  if (status === 'pending' || status === 'ready') {
    return 'todo';
  }

  if (status === 'dispatched' || status === 'running') {
    return 'running';
  }

  if (status === 'cancelled' || status === 'skipped') {
    return 'cancelled';
  }

  return 'failed';
}

function toRunProgress(status: RunReplaySource['run']['status']): number {
  if (
    status === 'succeeded' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'timeout'
  ) {
    return 100;
  }

  if (status === 'running' || status === 'synthesizing') {
    return 65;
  }

  if (status === 'planning') {
    return 25;
  }

  return 10;
}

function toEvidenceTone(level: RunReplaySource['traceEvents'][number]['level']): CairnEvidenceTone {
  if (level === 'error') {
    return 'danger';
  }

  if (level === 'warn') {
    return 'warning';
  }

  if (level === 'debug') {
    return 'neutral';
  }

  return 'info';
}

function isTerminalRunStatus(status: RunReplaySource['run']['status']): boolean {
  return (
    status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'timeout'
  );
}

function formatTraceTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toStatusTone(
  state: WorkspaceCoreStatus['state'] | undefined,
): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (state === 'healthy') {
    return 'success';
  }

  if (state === 'starting' || state === undefined) {
    return 'info';
  }

  if (state === 'stopping' || state === 'stopped') {
    return 'warning';
  }

  return 'danger';
}

function toMissionAgentTone(
  status: LocalizedDesktopModel['missionControl']['liveAgents'][number]['status'],
): CairnEvidenceTone {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'blocked') {
    return 'warning';
  }

  if (status === 'working') {
    return 'info';
  }

  return 'neutral';
}

function toMissionAgentStatusLabel(
  status: LocalizedDesktopModel['missionControl']['liveAgents'][number]['status'],
  copy: DesktopLocaleStrings,
): string {
  if (status === 'blocked') {
    return copy.agentBlockedLabel;
  }

  if (status === 'completed') {
    return copy.agentCompletedLabel;
  }

  if (status === 'idle') {
    return copy.agentIdleLabel;
  }

  return copy.agentWorkingLabel;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown desktop bridge error.';
}
