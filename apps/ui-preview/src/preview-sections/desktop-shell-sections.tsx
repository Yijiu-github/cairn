import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HandoffQueueItem,
  InlineAlert,
  MetadataList,
  RuntimeHealthCard,
  RunCard,
  StatusBadge,
} from '@cairn/ui';

import {
  desktopShellModeMetrics,
  desktopShellNavigationItems,
  desktopShellOperationsMetrics,
  desktopShellPinnedRuns,
  desktopShellQuickActions,
  desktopShellRuntimeSummary,
  desktopShellStatusLabels,
  desktopShellWorkspaceMetrics,
} from '../preview-data/desktop-shell-data';

export function DesktopShellHeroSection() {
  return (
    <header className="desktop-shell-hero page-hero">
      <div className="desktop-shell-hero-copy">
        <div className="section-kicker">Desktop Shell</div>
        <div className="desktop-shell-title-row">
          <h2>本地优先的主工作台</h2>
          <StatusBadge label={desktopShellStatusLabels.availability} tone="success" />
        </div>
        <p>
          这个壳负责承接桌面端主入口：工作区切换、全局导航、运行态概览、接管入口和系统能力。
          先把壳做对，再把更深的流程逐步塞进来。
        </p>
      </div>
      <div className="hero-actions desktop-shell-actions">
        <Button>新建运行</Button>
        <Button variant="secondary">打开 workspace</Button>
        <Button variant="ghost">检查更新</Button>
      </div>
    </header>
  );
}

export function DesktopShellNavigationSection() {
  return (
    <aside className="desktop-shell-nav" aria-label="主导航">
      <Card>
        <CardHeader>
          <CardTitle>导航</CardTitle>
        </CardHeader>
        <CardContent className="desktop-shell-nav-list">
          {desktopShellNavigationItems.map((item, index) => (
            <button
              className={index === 0 ? 'desktop-shell-nav-item active' : 'desktop-shell-nav-item'}
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>工作区摘要</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <MetadataList items={desktopShellWorkspaceMetrics} />
          <InlineAlert tone="info">
            Desktop Shell 不是简单外壳，它要把系统能力、会话状态和协作核心统一起来。
          </InlineAlert>
        </CardContent>
      </Card>
    </aside>
  );
}

export function DesktopShellInboxSection() {
  return (
    <section className="preview-section" aria-labelledby="desktop-shell-inbox-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Inbox</div>
          <h2 id="desktop-shell-inbox-heading">需要你处理</h2>
          <p>把接管、批准和异常放在最容易扫到的位置。</p>
        </div>
        <StatusBadge label={desktopShellStatusLabels.pending} tone="warning" />
      </div>

      <div className="stack">
        <HandoffQueueItem
          action={{ label: '处理', tone: 'primary' }}
          agentLabel="Supervisor"
          description="当前桌面壳需要确认导航与内容区是否足够分层。"
          kind="approval"
          sourceLabel="Desktop shell"
          title="确认主工作台信息层级"
          waitedFor="48s"
        />
        <HandoffQueueItem
          action={{ label: '处理', tone: 'primary' }}
          agentLabel="Runtime"
          description="本地运行状态可用，但需要检查侧边栏是否足够表达健康度。"
          kind="diagnostic"
          sourceLabel="Local runtime"
          title="查看 runtime 健康检查"
          waitedFor="3m 11s"
        />
      </div>
    </section>
  );
}

export function DesktopShellRunsSection() {
  return (
    <section className="preview-section" aria-labelledby="desktop-shell-runs-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Pinned runs</div>
          <h2 id="desktop-shell-runs-heading">当前运行</h2>
          <p>让主工作台直接看到正在发生什么，不必先钻进详情页。</p>
        </div>
        <Button variant="secondary">查看全部</Button>
      </div>

      <div className="stack">
        {desktopShellPinnedRuns.map((run) => (
          <RunCard
            actions={[
              { label: '打开', tone: 'primary' },
              { label: '接管', tone: 'secondary' },
              ...(run.status === 'blocked' ? [{ label: '取消运行', tone: 'danger' as const }] : []),
            ]}
            agentLabel={run.agentLabel}
            description={run.description}
            key={run.id}
            metrics={run.metrics}
            progress={run.progress}
            runId={run.id}
            status={run.status}
            title={run.title}
          />
        ))}
      </div>
    </section>
  );
}

export function DesktopShellSidebarSection() {
  return (
    <aside className="desktop-shell-side" aria-label="系统状态和快捷信息">
      <RuntimeHealthCard
        description={desktopShellRuntimeSummary.description}
        metrics={desktopShellRuntimeSummary.metrics}
        runtimeLabel={desktopShellRuntimeSummary.label}
        status={desktopShellRuntimeSummary.status}
      />

      <Card>
        <CardHeader>
          <CardTitle>运行模式</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <MetadataList items={desktopShellModeMetrics} />
          <InlineAlert tone="info">
            Desktop Shell 默认按 local-first 设计；远程工作区是后续可选接入，不是本周主目标。
          </InlineAlert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>操作状态</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <MetadataList items={desktopShellOperationsMetrics} />
          <InlineAlert tone="warning">
            同步、备份、更新和通知先只做状态占位，别把桌面壳提前做成全功能自动化平台。
          </InlineAlert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快捷动作</CardTitle>
        </CardHeader>
        <CardContent className="desktop-shell-shortcuts">
          {desktopShellQuickActions.map((action) => (
            <Button key={action.label} variant={action.tone}>
              {action.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
