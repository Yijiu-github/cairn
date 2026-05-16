import {
  AgentStatusStrip,
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

import { homeSummaryItems } from '../preview-data/home-inbox-data';
import { homeInboxViewModel } from '../preview-models/home-inbox-view-model';

export function HomeCommandBarSection() {
  return (
    <section className="home-command-bar page-hero" aria-label="工作区概览">
      <div>
        <div className="section-kicker">Workspace</div>
        <h2>{homeInboxViewModel.workspace.label}</h2>
        <p>
          Home / Inbox 只承接 operator 当前要处理的接管、运行和审阅；工作区身份、全局导航和 runtime
          总览归 Desktop Shell。
        </p>
      </div>
      <div className="hero-actions">
        <Button>新建运行</Button>
        <Button variant="secondary">导入任务</Button>
        <Button variant="ghost">打开设置</Button>
      </div>
    </section>
  );
}

export function HomeHandoffSection() {
  return (
    <section className="preview-section" aria-labelledby="handoff-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Inbox</div>
          <h2 id="handoff-heading">需要你处理</h2>
          <p>人工接管、批准、审阅和诊断请求必须在第一屏可见。</p>
        </div>
        <StatusBadge label="2 high priority" tone="warning" />
      </div>
      <div className="stack">
        {homeInboxViewModel.handoffQueue.map((item) => {
          const waitedForProps = item.waitedFor === undefined ? {} : { waitedFor: item.waitedFor };

          return (
            <HandoffQueueItem
              key={`${item.sourceLabel}-${item.title}`}
              action={{ label: '处理', tone: 'primary' }}
              agentLabel={item.agentLabel}
              description={item.description}
              kind={item.kind}
              sourceLabel={item.sourceLabel}
              title={item.title}
              {...waitedForProps}
            />
          );
        })}
      </div>
    </section>
  );
}

export function HomeRunsSection() {
  return (
    <section className="preview-section" aria-labelledby="runs-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Runs</div>
          <h2 id="runs-heading">当前运行</h2>
          <p>列表卡片优先展示状态、attempt、最近事件和可接管动作。</p>
        </div>
        <Button variant="secondary">查看全部</Button>
      </div>
      <div className="stack">
        {homeInboxViewModel.runs.map((run) => (
          <RunCard
            key={run.id}
            actions={[
              { label: '打开', tone: 'primary' },
              { label: '接管', tone: 'secondary' },
              ...(run.status === 'blocked' ? [{ label: '取消运行', tone: 'danger' as const }] : []),
            ]}
            agentLabel={run.agentLabel}
            description={run.description}
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

export function HomeRuntimeSidebar() {
  return (
    <aside className="home-side-column" aria-label="运行环境和摘要">
      <AgentStatusStrip agents={homeInboxViewModel.agents} />

      <RuntimeHealthCard
        description={homeInboxViewModel.runtime.description}
        metrics={homeInboxViewModel.runtime.metrics}
        runtimeLabel={homeInboxViewModel.runtime.label}
        status={homeInboxViewModel.runtime.status}
      />

      <Card>
        <CardHeader>
          <CardTitle>今日摘要</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <MetadataList items={homeSummaryItems} />
          <InlineAlert tone="info">
            Home / Inbox 的目标是让 operator 在 30 秒内判断：是否要接管、哪里失败、下一步去哪。
          </InlineAlert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>页面边界</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <InlineAlert tone="warning">{homeInboxViewModel.boundaryNote}</InlineAlert>
          <MetadataList
            items={[
              { label: '保留', value: 'handoff / active runs / operator focus' },
              { label: '上移到 Shell', value: 'workspace identity / global nav / runtime summary' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速过滤</CardTitle>
        </CardHeader>
        <CardContent className="filter-pills">
          {homeInboxViewModel.filters.map((label, index) => (
            <button
              className={index === 0 ? 'filter-pill active' : 'filter-pill'}
              key={label}
              type="button"
            >
              {label}
            </button>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
