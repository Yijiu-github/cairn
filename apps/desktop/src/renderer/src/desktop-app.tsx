// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from 'react';

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
  const [activeView, setActiveView] = useState<DesktopView>('home');
  const bridgeLabel = useMemo(() => window.cairnDesktop?.app.name ?? 'Cairn Desktop', []);

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
          This desktop build uses static fixtures only. It does not start Workspace Core or expose
          local paths.
        </InlineAlert>
      </aside>

      <section className="desktop-main" aria-label="Desktop content">
        <header className="top-bar">
          <div>
            <p className="eyebrow">{desktopShellModel.workspace.mode}</p>
            <h2>{viewTitle[activeView]}</h2>
            <p>{desktopShellModel.workspace.summary}</p>
          </div>
          <div className="top-bar-actions">
            <StatusBadge label="Static" tone="neutral" />
            <Button disabled variant="secondary">
              Connect Workspace Core
            </Button>
          </div>
        </header>

        <AgentStatusStrip agents={desktopShellModel.statusStrip} />

        {activeView === 'home' ? <HomeView /> : undefined}
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

function HomeView() {
  return (
    <div className="content-grid">
      <section className="content-stack">
        <section className="content-stack" aria-label="Handoff inbox">
          {desktopShellModel.handoffs.map((handoff) => (
            <HandoffQueueItem
              key={`${handoff.sourceLabel}-${handoff.title}`}
              {...handoff}
            />
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
      </aside>
    </div>
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
              Settings are read-only copy until source-root contracts are ready.
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
      </section>
      <aside className="content-stack">
        <RuntimeHealthCard {...desktopShellModel.runtime} />
      </aside>
    </div>
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
