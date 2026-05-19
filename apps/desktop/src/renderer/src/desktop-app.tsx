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
      setWorkspaceCoreStatus(await window.cairnDesktop.workspaceCore.getStatus());
    } catch (error) {
      setWorkspaceCoreError(toErrorMessage(error));
    } finally {
      setWorkspaceCoreBusy(false);
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
        {activeView === 'run-detail' ? <RunDetailView /> : undefined}
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

function RunDetailView() {
  const [run] = desktopShellModel.pinnedRuns;

  if (run === undefined) {
    return <InlineAlert tone="info">No selected run in the static fixture.</InlineAlert>;
  }

  return (
    <div className="content-grid">
      <section className="content-stack">
        <RunCard {...run} />
        <EvidenceTimeline items={desktopShellModel.runDetail.evidence} />
      </section>
      <aside className="content-stack">
        <TaskTree
          items={desktopShellModel.runDetail.tasks}
          selectedId={desktopShellModel.runDetail.selectedTaskId}
        />
        <Card>
          <CardHeader>
            <CardTitle>Operator controls</CardTitle>
            <CardDescription>Disabled until explicit IPC and safety gates exist.</CardDescription>
          </CardHeader>
          <CardContent className="button-row">
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
            { label: 'Live data fetching', value: 'disabled' },
            { label: 'Real IPC actions', value: 'disabled' },
            { label: 'Local path reveal', value: 'redacted by default' },
          ]}
        />
      </CardContent>
    </Card>
  );
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
