// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useState } from 'react';

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
  InlineAlert,
  MetadataList,
  RunCard,
  RuntimeHealthCard,
  StatusBadge,
  TaskTree,
} from '@cairn/ui';

import { desktopShellModel } from './desktop-model';

import type { DesktopView } from './desktop-model';
import type { RunReplaySource } from '@cairn/shared-contracts';
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
  const [smokeResult, setSmokeResult] =
    useState<
      Awaited<ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['runMockSmoke']>>
    >();
  const [observedRunId, setObservedRunId] = useState<string>();
  const [runReplaySource, setRunReplaySource] = useState<RunReplaySource>();
  const [runReplayLoading, setRunReplayLoading] = useState(false);
  const [runReplayError, setRunReplayError] = useState<string>();
  const [workspaceCoreBusy, setWorkspaceCoreBusy] = useState(false);
  const [workspaceCoreError, setWorkspaceCoreError] = useState<string>();
  const bridgeLabel = useMemo(() => window.cairnDesktop?.app.name ?? 'Cairn Desktop', []);

  useEffect(() => {
    window.localStorage.setItem('cairn.desktop.activeView', activeView);
  }, [activeView]);

  useEffect(() => {
    void refreshWorkspaceCoreStatus();
  }, []);

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

  async function runMockSmoke() {
    if (window.cairnDesktop?.workspaceCore === undefined) {
      return;
    }

    setWorkspaceCoreBusy(true);
    setWorkspaceCoreError(undefined);
    try {
      const result = await window.cairnDesktop.workspaceCore.runMockSmoke();
      setSmokeResult(result);
      setObservedRunId(result.runId);
      await loadRunReplaySource(result.runId);
      setWorkspaceCoreStatus(await window.cairnDesktop.workspaceCore.getStatus());
    } catch (error) {
      setWorkspaceCoreError(toErrorMessage(error));
    } finally {
      setWorkspaceCoreBusy(false);
    }
  }

  async function loadRunReplaySource(runId: string) {
    if (window.cairnDesktop?.workspaceCore === undefined) {
      return;
    }

    setRunReplayLoading(true);
    setRunReplayError(undefined);
    try {
      setRunReplaySource(await window.cairnDesktop.workspaceCore.getRunReplaySource(runId));
      setWorkspaceCoreStatus(await window.cairnDesktop.workspaceCore.getStatus());
    } catch (error) {
      setRunReplayError(toErrorMessage(error));
    } finally {
      setRunReplayLoading(false);
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
          This desktop build starts a local Workspace Core sidecar for a bounded mock smoke path. It
          still does not expose local paths or arbitrary system actions.
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
            onRunMockSmoke={runMockSmoke}
            smokeResult={smokeResult}
            status={workspaceCoreStatus}
            statusError={workspaceCoreError}
            statusLoading={workspaceCoreBusy}
          />
        ) : undefined}
        {activeView === 'run-detail' ? (
          <RunDetailView
            observedRunId={observedRunId}
            onRefreshReplay={loadRunReplaySource}
            replayError={runReplayError}
            replayLoading={runReplayLoading}
            replaySource={runReplaySource}
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

type WorkspaceCoreSmokeResult = Awaited<
  ReturnType<NonNullable<typeof window.cairnDesktop>['workspaceCore']['runMockSmoke']>
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

interface HomeViewProps {
  readonly onRunMockSmoke: () => Promise<void>;
  readonly smokeResult?: WorkspaceCoreSmokeResult | undefined;
  readonly status?: WorkspaceCoreStatus | undefined;
  readonly statusError?: string | undefined;
  readonly statusLoading: boolean;
}

function HomeView({
  onRunMockSmoke,
  smokeResult,
  status,
  statusError,
  statusLoading,
}: HomeViewProps) {
  return (
    <div className="content-grid">
      <section className="content-stack">
        <WorkspaceCorePanel
          onRunMockSmoke={onRunMockSmoke}
          smokeResult={smokeResult}
          status={status}
          statusError={statusError}
          statusLoading={statusLoading}
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
  readonly onRunMockSmoke: () => Promise<void>;
  readonly smokeResult?: WorkspaceCoreSmokeResult | undefined;
  readonly status?: WorkspaceCoreStatus | undefined;
  readonly statusError?: string | undefined;
  readonly statusLoading: boolean;
}

function WorkspaceCorePanel({
  onRunMockSmoke,
  smokeResult,
  status,
  statusError,
  statusLoading,
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
              Local loopback sidecar with a per-launch token and bounded mock runtime smoke.
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
            { label: 'Connection', value: status?.baseUrl ?? 'checking sidecar' },
            { label: 'Process', value: status?.pid ?? 'pending' },
            { label: 'Last error', value: status?.lastError ?? 'none' },
            { label: 'Runtime', value: 'mock adapter' },
          ]}
        />

        <div className="button-row">
          <Button
            disabled={!coreAvailable || !isHealthy}
            loading={statusLoading}
            onClick={() => {
              void onRunMockSmoke();
            }}
          >
            Run Mock Smoke
          </Button>
        </div>

        {smokeResult === undefined ? (
          <div className="empty-state-panel compact">
            <span aria-hidden="true">✓</span>
            <p>
              Run the bounded smoke path to create a Workspace Core run and read artifacts/trace.
            </p>
          </div>
        ) : (
          <MetadataList
            items={[
              { label: 'Run', value: `${smokeResult.runId} · ${smokeResult.runStatus}` },
              { label: 'Task', value: `${smokeResult.taskId} · ${smokeResult.taskStatus}` },
              { label: 'AgentRuns', value: smokeResult.agentRunStatuses.join(', ') },
              {
                label: 'Artifacts',
                value: `${smokeResult.artifactCount.toString()} · ${smokeResult.artifactRoles.join(', ')}`,
              },
              { label: 'Trace events', value: smokeResult.traceCount },
              { label: 'Final response', value: smokeResult.finalResponseRef ?? 'none' },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface RunDetailViewProps {
  readonly observedRunId?: string | undefined;
  readonly onRefreshReplay: (runId: string) => Promise<void>;
  readonly replayError?: string | undefined;
  readonly replayLoading: boolean;
  readonly replaySource?: RunReplaySource | undefined;
}

function RunDetailView({
  observedRunId,
  onRefreshReplay,
  replayError,
  replayLoading,
  replaySource,
}: RunDetailViewProps) {
  const staticRun = desktopShellModel.pinnedRuns[0];
  const run = replaySource === undefined ? staticRun : toRunCardProps(replaySource);
  const timelineItems =
    replaySource === undefined
      ? desktopShellModel.runDetail.evidence
      : toEvidenceTimelineItems(replaySource);
  const taskItems =
    replaySource === undefined ? desktopShellModel.runDetail.tasks : toTaskTreeItems(replaySource);
  const selectedTaskId =
    replaySource?.tasks[0]?.taskId ?? desktopShellModel.runDetail.selectedTaskId;

  if (run === undefined) {
    return <InlineAlert tone="info">No selected run is available.</InlineAlert>;
  }

  return (
    <div className="content-grid">
      <section className="content-stack">
        {replayError === undefined ? undefined : (
          <InlineAlert tone="danger" title="Run evidence failed to load">
            {replayError}
          </InlineAlert>
        )}
        {replaySource === undefined ? (
          <InlineAlert tone="info" title="Static Run Detail fallback">
            Run the bounded smoke path from Home to load real Workspace Core replay evidence.
          </InlineAlert>
        ) : (
          <InlineAlert tone="success" title="Live replay source">
            Showing sanitized Workspace Core evidence for {replaySource.run.orchestrationRunId}.
          </InlineAlert>
        )}
        <RunCard {...run} />
        <EvidenceTimeline items={timelineItems} />
      </section>
      <aside className="content-stack">
        <TaskTree items={taskItems} selectedId={selectedTaskId} />
        {replaySource === undefined ? undefined : (
          <ReplayInspectorCard replaySource={replaySource} />
        )}
        <Card>
          <CardHeader>
            <CardTitle>Operator controls</CardTitle>
            <CardDescription>Disabled until explicit IPC and safety gates exist.</CardDescription>
          </CardHeader>
          <CardContent className="button-row">
            <Button
              disabled={observedRunId === undefined}
              loading={replayLoading}
              onClick={() => {
                if (observedRunId !== undefined) {
                  void onRefreshReplay(observedRunId);
                }
              }}
              variant="secondary"
            >
              Refresh Evidence
            </Button>
            <Button disabled>Approve</Button>
            <Button disabled variant="warning">
              Pause
            </Button>
            <Button disabled variant="danger">
              Cancel
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
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
            { label: 'Preload allowlist', value: 'design before wiring' },
            { label: 'Sidecar lifecycle', value: 'contract first' },
            { label: 'Live actions', value: 'disabled until reviewed' },
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
            { label: 'Real IPC actions', value: 'disabled' },
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
  return replaySource.tasks.map((task) => ({
    attempt: task.attempt,
    id: task.taskId,
    label: task.title,
    metadata: task.taskKind,
    status: toCairnTaskStatus(task.status),
  }));
}

function toEvidenceTimelineItems(replaySource: RunReplaySource): readonly EvidenceTimelineItem[] {
  return replaySource.traceEvents.map((event) => ({
    description: `${event.level} · ${event.traceEventId}`,
    id: event.traceEventId,
    metadata: `trace ${event.traceId}`,
    time: formatTraceTime(event.createdAt),
    title: event.eventType,
    tone: toEvidenceTone(event.level),
  }));
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
