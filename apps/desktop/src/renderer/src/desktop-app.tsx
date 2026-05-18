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

import {
  mapWorkspaceCoreConnectionToRuntimeView,
  mapWorkspaceCoreConnectionToStatusBadge,
} from '../../shared/workspace-core-connection.js';

import { desktopShellModel } from './desktop-model';
import {
  mapWorkspaceArtifactsToArtifactCards,
  mapWorkspaceRunsToRunCards,
  mapWorkspaceSourceRootsToSettingsItems,
  mapWorkspaceTasksToTaskTree,
  mapWorkspaceTraceToEvidence,
} from './workspace-snapshot-view';

import type { DesktopView } from './desktop-model';
import type {
  WorkspaceCoreConnectionView,
  WorkspaceCoreRuntimeViewModel,
} from '../../shared/workspace-core-connection.js';
import type { WorkspaceCoreReadSnapshot } from '../../shared/workspace-core-data.js';

export function DesktopApp() {
  const [activeView, setActiveView] = useState<DesktopView>(() => readStoredView());
  const bridgeLabel = useMemo(() => window.cairnDesktop?.app.name ?? 'Cairn Desktop', []);
  const [connectionView, setConnectionView] = useState<WorkspaceCoreConnectionView>(() => ({
    detail: 'Workspace Core status is unavailable in static preview mode.',
    mode: 'packaged',
    state: 'not_started',
    updatedAt: new Date().toISOString(),
  }));
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState<WorkspaceCoreReadSnapshot>();
  const [workspaceReadError, setWorkspaceReadError] = useState<string>();

  useEffect(() => {
    window.localStorage.setItem('cairn.desktop.activeView', activeView);
  }, [activeView]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const refreshStatus = (): void => {
      void window.cairnDesktop?.sidecar.getConnectionStatus().then((snapshot) => {
        if (!cancelled) {
          setConnectionView(snapshot);
          void window.cairnDesktop?.workspace
            .readSnapshot()
            .then((workspace) => {
              if (!cancelled) {
                setWorkspaceSnapshot(workspace);
                setWorkspaceReadError(undefined);
              }
            })
            .catch((error: unknown) => {
              if (!cancelled) {
                setWorkspaceReadError(error instanceof Error ? error.message : 'Unknown error');
              }
            });
          timer = window.setTimeout(refreshStatus, 1000);
        }
      });
    };

    refreshStatus();

    return () => {
      cancelled = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const runtimeView = mapWorkspaceCoreConnectionToRuntimeView(connectionView);
  const statusBadge = mapWorkspaceCoreConnectionToStatusBadge(connectionView);
  const workspaceLoaded = workspaceSnapshot !== undefined;
  const selectedRun = workspaceSnapshot?.selectedRun;

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
          This desktop build uses static fixtures for run and artifact views, but the development
          shell can show Workspace Core connection status through a read-only allowlist. It still
          does not expose live actions or local paths.
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
                label={statusBadge.label}
                tone={statusBadge.tone}
                metadata={statusBadge.metadata}
              />
            </div>
            <Button disabled variant="secondary">
              Connect Workspace Core
            </Button>
          </div>
        </header>

        <AgentStatusStrip agents={desktopShellModel.statusStrip} />

        {workspaceReadError === undefined ? undefined : (
          <InlineAlert tone="warning" title="Workspace read failed">
            {workspaceReadError}
          </InlineAlert>
        )}

        {activeView === 'home' ? (
          <HomeView
            runtimeView={runtimeView}
            {...(workspaceSnapshot === undefined ? {} : { workspaceSnapshot })}
          />
        ) : undefined}
        {activeView === 'run-detail' ? (
          <RunDetailView selectedRun={selectedRun} workspaceLoaded={workspaceLoaded} />
        ) : undefined}
        {activeView === 'artifact-review' ? (
          <ArtifactReviewView selectedRun={selectedRun} workspaceLoaded={workspaceLoaded} />
        ) : undefined}
        {activeView === 'settings' ? (
          <SettingsView
            runtimeView={runtimeView}
            {...(workspaceSnapshot === undefined ? {} : { workspaceSnapshot })}
          />
        ) : undefined}
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

interface RuntimePanelProps {
  readonly runtimeView: WorkspaceCoreRuntimeViewModel;
}

interface WorkspaceSnapshotPanelProps {
  readonly workspaceSnapshot?: WorkspaceCoreReadSnapshot | undefined;
}

function HomeView({
  runtimeView,
  workspaceSnapshot,
}: RuntimePanelProps & WorkspaceSnapshotPanelProps) {
  const runCards =
    workspaceSnapshot === undefined
      ? desktopShellModel.pinnedRuns
      : mapWorkspaceRunsToRunCards(workspaceSnapshot.runs);

  return (
    <div className="content-grid">
      <section className="content-stack">
        <section className="content-stack" aria-label="Handoff inbox">
          {desktopShellModel.handoffs.map((handoff) => (
            <HandoffQueueItem key={`${handoff.sourceLabel}-${handoff.title}`} {...handoff} />
          ))}
        </section>

        <div className="run-list">
          {workspaceSnapshot?.runs.length === 0 ? (
            <EmptyWorkspaceDataCard title="No Workspace Core runs yet" />
          ) : undefined}
          {runCards.map((run) => (
            <RunCard key={run.runId} {...run} />
          ))}
        </div>
      </section>

      <aside className="content-stack">
        <RuntimeHealthCard {...runtimeView} />
        <SafetyDefaultsCard />
        <NextSafeStepCard />
      </aside>
    </div>
  );
}

interface SelectedRunProps {
  readonly selectedRun?: WorkspaceCoreReadSnapshot['selectedRun'];
  readonly workspaceLoaded: boolean;
}

function RunDetailView({ selectedRun, workspaceLoaded }: SelectedRunProps) {
  if (workspaceLoaded && selectedRun === undefined) {
    return <EmptyWorkspaceDataCard title="No selected Workspace Core run yet" />;
  }

  const [fixtureRun] = desktopShellModel.pinnedRuns;
  const run = selectedRun === undefined ? fixtureRun : mapWorkspaceRunsToRunCards([selectedRun])[0];
  const evidence =
    selectedRun === undefined
      ? desktopShellModel.runDetail.evidence
      : mapWorkspaceTraceToEvidence(selectedRun.trace);
  const tasks =
    selectedRun === undefined
      ? desktopShellModel.runDetail.tasks
      : mapWorkspaceTasksToTaskTree(selectedRun.tasks);
  const selectedTaskId = tasks[0]?.id ?? desktopShellModel.runDetail.selectedTaskId;

  if (run === undefined) {
    return <InlineAlert tone="info">No selected run in the static fixture.</InlineAlert>;
  }

  return (
    <div className="content-grid">
      <section className="content-stack">
        <RunCard {...run} />
        {evidence.length === 0 ? <EmptyWorkspaceDataCard title="No trace events yet" /> : undefined}
        {evidence.length === 0 ? undefined : <EvidenceTimeline items={evidence} />}
      </section>
      <aside className="content-stack">
        {tasks.length === 0 ? <EmptyWorkspaceDataCard title="No tasks yet" /> : undefined}
        {tasks.length === 0 ? undefined : <TaskTree items={tasks} selectedId={selectedTaskId} />}
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

function ArtifactReviewView({ selectedRun, workspaceLoaded }: SelectedRunProps) {
  if (workspaceLoaded && selectedRun === undefined) {
    return <EmptyWorkspaceDataCard title="No Workspace Core artifacts yet" />;
  }

  const artifacts =
    selectedRun === undefined
      ? desktopShellModel.artifactReview.artifacts
      : mapWorkspaceArtifactsToArtifactCards(selectedRun.artifacts);
  const artifactId = artifacts[0]?.artifactId ?? desktopShellModel.artifactReview.artifactId;
  const title =
    selectedRun === undefined ? desktopShellModel.artifactReview.title : 'Workspace artifacts';

  return (
    <div className="content-grid">
      <section className="content-stack">
        <ArtifactReviewPanel
          actions={[
            { disabled: true, label: 'Approve export', tone: 'primary' },
            { disabled: true, label: 'Reject', tone: 'danger' },
          ]}
          artifactId={artifactId}
          note={desktopShellModel.artifactReview.note}
          reviewState="pending_review"
          title={title}
        />
        <div className="artifact-list">
          {artifacts.length === 0 ? <EmptyWorkspaceDataCard title="No artifacts yet" /> : undefined}
          {artifacts.map((artifact) => (
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

function EmptyWorkspaceDataCard({ title }: { readonly title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Workspace Core has no read-only data for this view yet.</CardDescription>
      </CardHeader>
    </Card>
  );
}

function SettingsView({
  runtimeView,
  workspaceSnapshot,
}: RuntimePanelProps & WorkspaceSnapshotPanelProps) {
  const sourceRootItems =
    workspaceSnapshot === undefined
      ? []
      : mapWorkspaceSourceRootsToSettingsItems(workspaceSnapshot.sourceRoots);

  return (
    <div className="content-grid">
      <section className="content-stack">
        <Card>
          <CardHeader>
            <CardTitle>
              {workspaceSnapshot === undefined ? 'Source roots placeholder' : 'Source roots'}
            </CardTitle>
            <CardDescription>
              Settings are read-only. Folder approval, reindex, path reveal, and export controls are
              unavailable in this preview-safe desktop shell.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetadataList
              items={[
                { label: 'Workspace', value: desktopShellModel.workspace.label },
                {
                  label: 'Connection',
                  value: workspaceSnapshot === undefined ? 'static fixture' : 'read-only snapshot',
                },
                { label: 'Source roots', value: String(sourceRootItems.length) },
                { label: 'Bridge', value: window.cairnDesktop?.app.mode ?? 'unavailable' },
              ]}
            />
          </CardContent>
        </Card>

        {workspaceSnapshot === undefined ? (
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>No live source roots loaded</CardTitle>
              <CardDescription>
                This placeholder stays preview-safe until Workspace Core provides a read-only
                snapshot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel">
                <span aria-hidden="true">⌁</span>
                <p>
                  Choose folder, reindex, path reveal, and export are intentionally unavailable.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : undefined}

        {workspaceSnapshot !== undefined && sourceRootItems.length === 0 ? (
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>No source roots registered</CardTitle>
              <CardDescription>
                Workspace Core returned a live snapshot with no approved source roots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="empty-state-panel">
                <span aria-hidden="true">⌁</span>
                <p>
                  Folder approval, reindex, path reveal, and filesystem actions remain unavailable.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : undefined}

        {sourceRootItems.map((sourceRoot) => (
          <Card key={sourceRoot.sourceRootId}>
            <CardHeader>
              <div className="source-root-card-heading">
                <div>
                  <CardTitle>{sourceRoot.displayName}</CardTitle>
                  <CardDescription>
                    {sourceRoot.kind.replaceAll('_', ' ')} source root metadata only.
                  </CardDescription>
                </div>
                <StatusBadge
                  label={sourceRoot.status}
                  tone={sourceRoot.hasError ? 'danger' : sourceRoot.indexed ? 'success' : 'info'}
                  metadata={sourceRoot.indexed ? 'indexed' : 'not indexed'}
                />
              </div>
            </CardHeader>
            <CardContent className="source-root-card-content">
              <MetadataList
                items={[
                  { label: 'Include globs', value: String(sourceRoot.includeGlobCount) },
                  { label: 'Exclude globs', value: String(sourceRoot.excludeGlobCount) },
                  {
                    label: 'Last indexed',
                    value: sourceRoot.hasLastIndexedAt ? 'present' : 'none',
                  },
                  { label: 'Error flag', value: sourceRoot.hasError ? 'present' : 'none' },
                  { label: 'Created', value: sourceRoot.createdAt },
                  { label: 'Updated', value: sourceRoot.updatedAt },
                ]}
              />
              <div className="source-root-actions" aria-label="Unavailable source root actions">
                <Button disabled variant="secondary">
                  Approve folder
                </Button>
                <Button disabled variant="secondary">
                  Reindex
                </Button>
                <Button disabled variant="secondary">
                  Reveal path
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <aside className="content-stack">
        <RuntimeHealthCard {...runtimeView} />
        <Card>
          <CardHeader>
            <CardTitle>Source root safety</CardTitle>
            <CardDescription>
              Renderer settings only show sanitized metadata from workspace.readSnapshot().
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetadataList
              items={[
                { label: 'Folder picker', value: 'unavailable' },
                { label: 'Reindex action', value: 'unavailable' },
                { label: 'Path reveal/export', value: 'unavailable' },
              ]}
            />
          </CardContent>
        </Card>
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
