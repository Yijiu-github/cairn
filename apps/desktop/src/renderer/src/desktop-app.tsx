// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useRef, useState } from 'react';

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
  StatusBadge,
  TaskTree,
} from '@cairn/ui';

import { loadArtifactPayload as loadArtifactPayloadRequest } from './artifact-payload-loader';
import { desktopShellModel } from './desktop-model';
import { loadRunReplaySource as loadRunReplaySourceRequest } from './run-replay-loader';

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
  const runReplayLoadState = useRef({ current: 0 });
  const bridgeLabel = useMemo(() => window.cairnDesktop?.app.name ?? 'Cairn Desktop', []);

  useEffect(() => {
    window.localStorage.setItem('cairn.desktop.activeView', activeView);
  }, [activeView]);

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

  async function runOperatorAction(actionLabel: string, operation: () => Promise<void>) {
    setOperatorActionBusy(actionLabel);
    setOperatorActionError(undefined);
    setOperatorActionFeedback(undefined);
    try {
      await operation();
    } catch (error) {
      setOperatorActionError(toErrorMessage(error));
    } finally {
      setOperatorActionBusy(undefined);
    }
  }

  return (
    <main className="desktop-shell">
      <aside className="desktop-sidebar" aria-label="Desktop navigation">
        <div className="brand-block">
          <div className="brand-mark">C</div>
          <div>
            <p className="eyebrow">{bridgeLabel}</p>
            <h1>{desktopShellModel.workspace.label}</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {desktopShellModel.navItems.map((item) => (
            <button
              key={item.id}
              aria-current={activeView === item.id ? 'page' : undefined}
              className="nav-item"
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

        <InlineAlert tone="warning" title="Preview-safe shell">
          This desktop build starts a local Workspace Core sidecar for a bounded internal-trial run
          path. It still does not expose local paths or arbitrary system actions.
        </InlineAlert>

        <div className="sidebar-footer" aria-label="Shell metadata">
          <span>Mode: {window.cairnDesktop?.app.mode ?? 'static-preview'}</span>
          <span>View: {viewTitle[activeView]}</span>
        </div>
      </aside>

      <section className="desktop-main" aria-label="Desktop content">
        <header className="top-bar">
          <div>
            <p className="eyebrow">{desktopShellModel.workspace.mode}</p>
            <h2>{viewTitle[activeView]}</h2>
            <p>{desktopShellModel.workspace.summary}</p>
          </div>
          <div className="top-bar-actions">
            <div className="shell-status-row" aria-label="Shell status">
              <StatusBadge label="Preview-safe" tone="success" metadata="static" />
              <StatusBadge
                label="Workspace Core"
                metadata={workspaceCoreStatus?.state ?? 'checking'}
                tone={toStatusTone(workspaceCoreStatus?.state)}
              />
            </div>
            <Button
              disabled={window.cairnDesktop?.workspaceCore === undefined}
              loading={workspaceCoreBusy}
              onClick={() => {
                void refreshWorkspaceCoreStatus();
              }}
              variant="secondary"
            >
              Refresh Core
            </Button>
          </div>
        </header>

        <AgentStatusStrip agents={desktopShellModel.statusStrip} />

        {activeView === 'home' ? (
          <HomeView
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
            onAddOperatorNote={async (runId) => {
              await runOperatorAction('note', async () => {
                const result = await window.cairnDesktop?.workspaceCore.addOperatorNote(
                  runId,
                  'Operator note from the Cairn Desktop internal trial shell.',
                  'operator_only',
                );
                if (result === undefined) {
                  return;
                }
                await loadObservedRunReplaySource(runId);
                setOperatorActionFeedback(`Operator note recorded as ${result.messageId}.`);
              });
            }}
            onCancelRun={async (runId) => {
              await runOperatorAction('cancel', async () => {
                await window.cairnDesktop?.workspaceCore.cancelRun(
                  runId,
                  'Cancelled from the Cairn Desktop internal trial shell.',
                );
                await loadObservedRunReplaySource(runId);
                setOperatorActionFeedback(`Run ${runId} was cancelled.`);
              });
            }}
            onLoadArtifactPayload={loadArtifactPayload}
            onObserveRun={observeRunId}
            onRefreshReplay={loadObservedRunReplaySource}
            onRunIdChange={setManualRunId}
            onRerun={async (runId) => {
              await runOperatorAction('rerun', async () => {
                const rerun = await window.cairnDesktop?.workspaceCore.rerun(runId, {
                  operatorNote: 'Rerun requested from the Cairn Desktop internal trial shell.',
                  replan: true,
                });
                if (rerun === undefined) {
                  return;
                }
                setArtifactPayloads({});
                setArtifactPayloadError(undefined);
                setObservedRunId(rerun.orchestrationRunId);
                setOperatorActionFeedback(
                  `Created rerun ${rerun.orchestrationRunId} from ${runId}.`,
                );
              });
            }}
            onRetryTask={async (taskId) => {
              await runOperatorAction('retry', async () => {
                const result = await window.cairnDesktop?.workspaceCore.retryTask(
                  taskId,
                  'Retry requested from the Cairn Desktop internal trial shell.',
                );
                if (result === undefined) {
                  return;
                }
                const activeRunId = runReplaySource?.run.orchestrationRunId ?? observedRunId;
                if (activeRunId !== undefined) {
                  await loadObservedRunReplaySource(activeRunId);
                }
                setOperatorActionFeedback(
                  `Task ${result.taskId} advanced to attempt ${String(result.newAttempt)}.`,
                );
              });
            }}
            replayError={runReplayError}
            replayLoading={runReplayLoading}
            replaySource={runReplaySource}
            runIdInput={manualRunId}
          />
        ) : undefined}
        {activeView === 'artifact-review' ? <ArtifactReviewView /> : undefined}
        {activeView === 'settings' ? <SettingsView /> : undefined}
      </section>
    </main>
  );
}

const viewTitle: Record<DesktopView, string> = {
  'artifact-review': 'Artifact Review',
  'home': 'Home / Inbox',
  'run-detail': 'Run Detail',
  'settings': 'Source Roots / Settings',
};

type WorkspaceCoreStatus = Awaited<
  ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['getStatus']>
>;

type WorkspaceCoreTrialResult = Awaited<
  ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['runInternalTrial']>
>;

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
  readonly onRunInternalTrial: () => Promise<void>;
  readonly status?: WorkspaceCoreStatus | undefined;
  readonly statusError?: string | undefined;
  readonly statusLoading: boolean;
  readonly trialResult?: WorkspaceCoreTrialResult | undefined;
}

function HomeView({
  onRunInternalTrial,
  status,
  statusError,
  statusLoading,
  trialResult,
}: HomeViewProps) {
  return (
    <div className="content-grid">
      <section className="content-stack">
        <WorkspaceCorePanel
          onRunInternalTrial={onRunInternalTrial}
          status={status}
          statusError={statusError}
          statusLoading={statusLoading}
          trialResult={trialResult}
        />

        <section className="content-stack" aria-label="Handoff inbox">
          {desktopShellModel.handoffs.map((handoff) => (
            <HandoffQueueItem key={`${handoff.sourceLabel}-${handoff.title}`} {...handoff} />
          ))}
        </section>

        <div className="run-list">
          {desktopShellModel.pinnedRuns.map((run) => (
            <RunCard key={run.runId} {...run} />
          ))}
        </div>
      </section>

      <aside className="content-stack">
        <RuntimeHealthCard {...desktopShellModel.runtime} />
        <SafetyDefaultsCard />
        <NextSafeStepCard />
      </aside>
    </div>
  );
}

interface WorkspaceCorePanelProps {
  readonly onRunInternalTrial: () => Promise<void>;
  readonly status?: WorkspaceCoreStatus | undefined;
  readonly statusError?: string | undefined;
  readonly statusLoading: boolean;
  readonly trialResult?: WorkspaceCoreTrialResult | undefined;
}

function WorkspaceCorePanel({
  onRunInternalTrial,
  status,
  statusError,
  statusLoading,
  trialResult,
}: WorkspaceCorePanelProps) {
  const coreAvailable = window.cairnDesktop?.workspaceCore !== undefined;
  const isHealthy = status?.state === 'healthy';

  return (
    <Card>
      <CardHeader>
        <div className="card-title-row">
          <div>
            <CardTitle>Workspace Core sidecar</CardTitle>
            <CardDescription>
              Local loopback sidecar with a per-launch token and a bounded Desktop internal-trial
              run path.
            </CardDescription>
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
          <InlineAlert tone="danger" title="Workspace Core action failed">
            {statusError}
          </InlineAlert>
        )}

        <MetadataList
          items={[
            { label: 'Connection', value: status?.connectionLabel ?? 'checking sidecar' },
            { label: 'Process', value: status?.pid ?? 'pending' },
            { label: 'Last error', value: status?.lastError ?? 'none' },
            { label: 'Runtime', value: status?.runtime ?? 'checking' },
          ]}
        />

        <div className="button-row">
          <Button
            disabled={!coreAvailable || !isHealthy}
            loading={statusLoading}
            onClick={() => {
              void onRunInternalTrial();
            }}
          >
            Run Internal Trial
          </Button>
        </div>

        {trialResult === undefined ? (
          <div className="empty-state-panel compact">
            <span aria-hidden="true">✓</span>
            <p>
              Run the bounded internal-trial path to create a Workspace Core run and read artifacts,
              trace, and replay evidence.
            </p>
          </div>
        ) : (
          <MetadataList
            items={[
              { label: 'Run', value: `${trialResult.runId} · ${trialResult.runStatus}` },
              { label: 'Task', value: `${trialResult.taskId} · ${trialResult.taskStatus}` },
              { label: 'AgentRuns', value: trialResult.agentRunStatuses.join(', ') },
              {
                label: 'Artifacts',
                value: `${trialResult.artifactCount.toString()} · ${trialResult.artifactRoles.join(', ')}`,
              },
              { label: 'Trace events', value: trialResult.traceCount },
              { label: 'Final response', value: trialResult.finalResponseRef ?? 'none' },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface RunDetailViewProps {
  readonly actionBusy?: string | undefined;
  readonly actionError?: string | undefined;
  readonly actionFeedback?: string | undefined;
  readonly artifactPayloadError?: string | undefined;
  readonly artifactPayloadLoadingId?: string | undefined;
  readonly artifactPayloads: Readonly<Record<string, ArtifactPayloadResponse>>;
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
            disabled={replayLoading}
            onRunIdChange={onRunIdChange}
            onSubmit={onObserveRun}
            runId={runIdInput}
          />
          <Card>
            <CardHeader>
              <CardTitle>No observed run yet</CardTitle>
              <CardDescription>
                Run the internal-trial path from Home or paste an existing run id from the API smoke
                path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel">
                <span aria-hidden="true">◎</span>
                <p>
                  Run Detail only renders real Workspace Core replay evidence. Nothing has been
                  observed yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
        <aside className="content-stack">
          <RunObservationCard observedRunId={observedRunId} replaySource={replaySource} />
          <SafetyDefaultsCard />
        </aside>
      </div>
    );
  }

  const run = replaySource === undefined ? undefined : toRunCardProps(replaySource);
  const timelineItems =
    replaySource === undefined ? undefined : toEvidenceTimelineItems(replaySource);
  const taskItems = replaySource === undefined ? undefined : toTaskTreeItems(replaySource);
  const selectedTaskId = replaySource?.tasks[0]?.taskId;
  const activeRunId = replaySource?.run.orchestrationRunId ?? observedRunId;
  const terminalRun =
    replaySource === undefined ? false : isTerminalRunStatus(replaySource.run.status);
  const retryableTaskId = replaySource?.tasks.find((task) => task.status === 'failed')?.taskId;
  const canRetryTask = retryableTaskId !== undefined && replaySource !== undefined && !terminalRun;
  const canRerun = replaySource !== undefined && terminalRun;
  const canCancel = replaySource !== undefined && !terminalRun;

  return (
    <div className="content-grid">
      <section className="content-stack">
        <RunIdObservationForm
          disabled={replayLoading}
          onRunIdChange={onRunIdChange}
          onSubmit={onObserveRun}
          runId={runIdInput}
        />
        {replayError === undefined || replaySource !== undefined ? undefined : (
          <InlineAlert tone="danger" title="Run evidence failed to load">
            {replayError}
          </InlineAlert>
        )}
        {actionError === undefined ? undefined : (
          <InlineAlert tone="danger" title="Operator action failed">
            {actionError}
          </InlineAlert>
        )}
        {actionFeedback === undefined ? undefined : (
          <InlineAlert tone="success" title="Operator action applied">
            {actionFeedback}
          </InlineAlert>
        )}
        {replaySource === undefined ? undefined : (
          <InlineAlert tone="success" title="Live replay source">
            Showing sanitized Workspace Core evidence for {replaySource.run.orchestrationRunId}.
          </InlineAlert>
        )}
        {run === undefined ? (
          <Card>
            <CardHeader>
              <CardTitle>Replay evidence unavailable</CardTitle>
              <CardDescription>
                An observed run id exists, but replay evidence is not loaded in the renderer yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel">
                <span aria-hidden="true">{replayLoading ? '…' : '!'}</span>
                <p>
                  {replayLoading
                    ? `Refreshing replay evidence for ${observedRunId}.`
                    : `Use Refresh Evidence to load replay data for ${observedRunId}.`}
                </p>
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
        <RunObservationCard observedRunId={observedRunId} replaySource={replaySource} />
        {taskItems === undefined ? (
          <Card>
            <CardHeader>
              <CardTitle>Task tree</CardTitle>
              <CardDescription>Task detail appears after replay evidence loads.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel compact">
                <span aria-hidden="true">⋯</span>
                <p>No real task tree available yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TaskTree items={taskItems} selectedId={selectedTaskId} />
        )}
        {replaySource === undefined ? undefined : (
          <ReplayInspectorCard replaySource={replaySource} />
        )}
        {replaySource === undefined ? undefined : (
          <ArtifactSummaryCard
            artifactPayloadError={artifactPayloadError}
            artifactPayloadLoadingId={artifactPayloadLoadingId}
            artifactPayloads={artifactPayloads}
            onLoadArtifactPayload={onLoadArtifactPayload}
            replaySource={replaySource}
          />
        )}
        <Card>
          <CardHeader>
            <CardTitle>Operator controls</CardTitle>
            <CardDescription>
              Internal-trial actions only: cancel run, retry failed task, rerun, and record an
              operator note.
            </CardDescription>
          </CardHeader>
          <CardContent className="content-stack">
            <MetadataList
              items={[
                { label: 'Observed run', value: activeRunId },
                { label: 'Retryable task', value: retryableTaskId ?? 'none' },
                { label: 'Run state', value: replaySource?.run.status ?? 'loading' },
              ]}
            />
            <div className="button-row">
              <Button
                loading={actionBusy === 'note'}
                onClick={() => {
                  void onAddOperatorNote(activeRunId);
                }}
                variant="secondary"
              >
                Add note
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
                Retry task
              </Button>
              <Button
                disabled={!canRerun}
                loading={actionBusy === 'rerun'}
                onClick={() => {
                  void onRerun(activeRunId);
                }}
                variant="secondary"
              >
                Rerun
              </Button>
              <Button
                disabled={!canCancel}
                loading={actionBusy === 'cancel'}
                onClick={() => {
                  void onCancelRun(activeRunId);
                }}
                variant="danger"
              >
                Cancel run
              </Button>
              <Button
                loading={replayLoading}
                onClick={() => {
                  void onRefreshReplay(activeRunId);
                }}
                variant="secondary"
              >
                Refresh Evidence
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

interface RunIdObservationFormProps {
  readonly disabled: boolean;
  readonly onRunIdChange: (runId: string) => void;
  readonly onSubmit: (runId: string) => Promise<void>;
  readonly runId: string;
}

function RunIdObservationForm({
  disabled,
  onRunIdChange,
  onSubmit,
  runId,
}: RunIdObservationFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Observe run id</CardTitle>
        <CardDescription>
          Load replay evidence for a Workspace Core run created by Desktop or by the API smoke path.
        </CardDescription>
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
            aria-label="Workspace Core run id"
            disabled={disabled}
            onChange={(event) => {
              onRunIdChange(event.currentTarget.value);
            }}
            placeholder="01J..."
            value={runId}
          />
          <Button disabled={disabled || runId.trim().length === 0} loading={disabled}>
            Observe Run
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReplayInspectorCard({ replaySource }: { readonly replaySource: RunReplaySource }) {
  const inspector = replaySource.inspector;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Replay inspector</CardTitle>
        <CardDescription>
          Read-only summary derived from Workspace Core replay source.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Tasks', value: inspector.taskCount },
            { label: 'Agent runs', value: inspector.agentRunCount },
            { label: 'Artifacts', value: inspector.artifactCount },
            { label: 'Trace events', value: inspector.traceEventCount },
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
  observedRunId,
  replaySource,
}: {
  readonly observedRunId?: string | undefined;
  readonly replaySource?: RunReplaySource | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Observed run</CardTitle>
        <CardDescription>
          Desktop stores one bounded run id and refreshes replay evidence from it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Observed run id', value: observedRunId ?? 'none' },
            { label: 'Replay loaded', value: replaySource === undefined ? 'no' : 'yes' },
            { label: 'Run status', value: replaySource?.run.status ?? 'unknown' },
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
  readonly onLoadArtifactPayload: (artifactId: string) => Promise<void>;
  readonly replaySource: RunReplaySource;
}

function ArtifactSummaryCard({
  artifactPayloadError,
  artifactPayloadLoadingId,
  artifactPayloads,
  onLoadArtifactPayload,
  replaySource,
}: ArtifactSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Artifact summary</CardTitle>
        <CardDescription>
          Read-only artifact metadata and bounded payload text for the observed run.
        </CardDescription>
      </CardHeader>
      <CardContent className="content-stack">
        {artifactPayloadError === undefined ? undefined : (
          <InlineAlert tone="danger" title="Artifact payload failed to load">
            {artifactPayloadError}
          </InlineAlert>
        )}
        {replaySource.artifacts.length === 0 ? (
          <div className="empty-state-panel compact">
            <span aria-hidden="true">∅</span>
            <p>No artifacts recorded for this run.</p>
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
                    redactionLabel="Artifact storage location remains hidden in the desktop renderer."
                    reviewState="draft"
                    sensitivity={artifact.sensitivity}
                    summary={toArtifactSummary(artifact)}
                    title={`${artifact.artifactRole} · ${artifact.kind}`}
                    verification={payloadAvailable ? 'payload available' : 'metadata only'}
                  />
                  {payloadAvailable ? (
                    <div className="artifact-payload-preview">
                      <div className="artifact-payload-header">
                        <span>
                          {payload === undefined
                            ? 'Payload not loaded'
                            : `${payload.mediaType}${payload.truncated ? ' · truncated' : ''}`}
                        </span>
                        <Button
                          loading={artifactPayloadLoadingId === artifact.artifactId}
                          onClick={() => {
                            void onLoadArtifactPayload(artifact.artifactId);
                          }}
                          variant="secondary"
                        >
                          Load payload
                        </Button>
                      </div>
                      {payload === undefined ? (
                        <p>
                          Payload text is fetched on demand through Workspace Core. Local storage
                          paths stay hidden.
                        </p>
                      ) : (
                        <pre>{payload.text}</pre>
                      )}
                    </div>
                  ) : undefined}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ArtifactReviewView() {
  return (
    <div className="content-grid">
      <section className="content-stack">
        <ArtifactReviewPanel
          actions={[
            { disabled: true, label: 'Approve export', tone: 'primary' },
            { disabled: true, label: 'Reject', tone: 'danger' },
          ]}
          artifactId={desktopShellModel.artifactReview.artifactId}
          note={desktopShellModel.artifactReview.note}
          reviewState="pending_review"
          title={desktopShellModel.artifactReview.title}
        />
        <div className="artifact-list">
          {desktopShellModel.artifactReview.artifacts.map((artifact) => (
            <ArtifactCard key={artifact.artifactId} {...artifact} />
          ))}
        </div>
      </section>
      <aside className="content-stack">
        <SafetyDefaultsCard />
        <Card>
          <CardHeader>
            <CardTitle>Path exposure policy</CardTitle>
            <CardDescription>Local absolute paths remain hidden in this shell.</CardDescription>
          </CardHeader>
          <CardContent>
            <MetadataList
              items={[
                { label: 'Display path', value: 'redacted' },
                { label: 'Export/share', value: 'requires explicit future gate' },
                { label: 'Filesystem mutation', value: 'not available' },
              ]}
            />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="content-grid">
      <section className="content-stack">
        <Card>
          <CardHeader>
            <CardTitle>Source roots placeholder</CardTitle>
            <CardDescription>
              Settings are read-only until source-root contracts and explicit folder approval are
              ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetadataList
              items={[
                { label: 'Workspace', value: desktopShellModel.workspace.label },
                { label: 'Connection', value: 'static fixture' },
                { label: 'Bridge', value: window.cairnDesktop?.app.mode ?? 'unavailable' },
              ]}
            />
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <CardTitle>No source roots connected</CardTitle>
            <CardDescription>
              Future desktop builds should request explicit user approval before indexing any local
              folder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="empty-state-panel">
              <span aria-hidden="true">⌁</span>
              <p>Choose folder, index metadata, and reveal paths are intentionally unavailable.</p>
            </div>
          </CardContent>
        </Card>
      </section>
      <aside className="content-stack">
        <RuntimeHealthCard {...desktopShellModel.runtime} />
        <NextSafeStepCard />
      </aside>
    </div>
  );
}

function NextSafeStepCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next safe step</CardTitle>
        <CardDescription>
          UI can keep moving without waiting for Workspace Core by shaping static contracts first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Preload allowlist', value: 'internal-trial only' },
            { label: 'Sidecar lifecycle', value: 'dev bridge only' },
            { label: 'Live actions', value: 'bounded operator allowlist' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function SafetyDefaultsCard() {
  return (
    <Card variant="handoff">
      <CardHeader>
        <CardTitle>Safety defaults</CardTitle>
        <CardDescription>
          First implementation intentionally avoids dangerous capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Replay evidence', value: 'read-only' },
            { label: 'Real IPC actions', value: 'bounded allowlist' },
            { label: 'Local path reveal', value: 'redacted by default' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function toRunCardProps(replaySource: RunReplaySource): RunCardProps {
  return {
    agentLabel: 'Workspace Core',
    description: `Replay source contains ${replaySource.tasks.length.toString()} task(s), ${replaySource.artifacts.length.toString()} artifact(s), and ${replaySource.traceEvents.length.toString()} trace event(s).`,
    metrics: [
      { label: 'Tasks', value: replaySource.inspector.taskCount },
      { label: 'Artifacts', value: replaySource.inspector.artifactCount },
      { label: 'Trace', value: replaySource.inspector.traceEventCount },
    ],
    progress: toRunProgress(replaySource.run.status),
    runId: replaySource.run.orchestrationRunId,
    status: toCairnRunStatus(replaySource.run.status),
    title: `Workspace Core run · ${replaySource.run.status}`,
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

function toEvidenceTimelineItems(replaySource: RunReplaySource): readonly EvidenceTimelineItem[] {
  return replaySource.traceEvents.map((event) => ({
    description: toTraceDescription(event),
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

function toTraceDescription(event: RunReplaySource['traceEvents'][number]): string {
  if (event.payloadRef !== undefined) {
    return `Payload stored in artifact ${event.payloadRef}.`;
  }

  if (event.payloadInline !== undefined) {
    const payloadKeys = Object.keys(event.payloadInline);
    return payloadKeys.length === 0
      ? 'Inline payload recorded.'
      : `Inline payload keys: ${payloadKeys.join(', ')}.`;
  }

  return 'No payload attached.';
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

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown desktop bridge error.';
}
