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

const activeRuns = [
  {
    id: 'run_01JDEMOHOME0000000000001',
    title: '生成 Run Detail 页面 prototype',
    description: '组合任务树、证据链、产物和人工接管入口，验证单运行详情页的信息密度。',
    status: 'running' as const,
    progress: 62,
    agentLabel: 'Supervisor / 白霓',
    metrics: [
      { label: 'attempt', value: '1' },
      { label: '成本', value: '$0.08' },
      { label: '最近事件', value: '2m ago' },
    ],
  },
  {
    id: 'run_01JDEMOHOME0000000000002',
    title: '审阅 ArtifactCard 状态覆盖',
    description: '检查 pending_review、approved、changes_requested 在列表和详情里的表达。',
    status: 'blocked' as const,
    progress: 78,
    agentLabel: 'Reviewer / UI',
    metrics: [
      { label: 'attempt', value: '2' },
      { label: '等待', value: '12m' },
      { label: '阻塞原因', value: '需要人工确认' },
    ],
  },
  {
    id: 'run_01JDEMOHOME0000000000003',
    title: '导出脱敏诊断包',
    description: '准备给协作者复现 UI preview build 问题，默认隐藏 token 和本地路径。',
    status: 'completed' as const,
    progress: 100,
    agentLabel: 'Diagnostic Worker',
    metrics: [
      { label: 'attempt', value: '1' },
      { label: '产物', value: 'diagnostics.zip' },
      { label: '完成', value: '18m ago' },
    ],
  },
];

const queueItems = [
  {
    agentLabel: 'Worker UI',
    description: '将写入 apps/ui-preview/src/pages/run-detail-preview-page.tsx，需要确认是否继续。',
    kind: 'approval' as const,
    sourceLabel: 'ProtectedActionDialog',
    title: '批准新增 Run Detail prototype 文件',
    waitedFor: '4m 20s',
  },
  {
    agentLabel: 'Reviewer',
    description: 'Artifact Review 页面的敏感路径提示是否足够明显？',
    kind: 'review' as const,
    sourceLabel: 'ArtifactReviewPanel',
    title: '等待审阅产物风险提示',
    waitedFor: '11m 03s',
  },
  {
    agentLabel: 'Runtime Monitor',
    description: '本地 preview server 已停止，但最近一次 build 通过。',
    kind: 'diagnostic' as const,
    sourceLabel: 'RuntimeHealthCard',
    title: '确认是否需要重新启动 preview',
  },
];

export function HomeInboxPreviewPage() {
  return (
    <div className="prototype-page">
      <section className="home-command-bar" aria-label="工作区概览">
        <div>
          <div className="section-kicker">Workspace</div>
          <h2>local_demo_workspace</h2>
          <p>今日 3 个运行，2 个需要接管，1 个 runtime 降级提示。</p>
        </div>
        <div className="hero-actions">
          <Button>新建运行</Button>
          <Button variant="secondary">导入任务</Button>
          <Button variant="ghost">打开设置</Button>
        </div>
      </section>

      <section className="home-layout">
        <div className="home-main-column">
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
              {queueItems.map((item) => {
                const waitedForProps =
                  item.waitedFor === undefined ? {} : { waitedFor: item.waitedFor };

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
              {activeRuns.map((run) => (
                <RunCard
                  key={run.id}
                  actions={[
                    { label: '打开', tone: 'primary' },
                    { label: '接管', tone: 'secondary' },
                    ...(run.status === 'blocked'
                      ? [{ label: '取消运行', tone: 'danger' as const }]
                      : []),
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
        </div>

        <aside className="home-side-column" aria-label="运行环境和摘要">
          <AgentStatusStrip
            agents={[
              {
                id: 'agent_supervisor',
                label: 'Supervisor',
                status: 'running',
                task: '规划页面原型',
              },
              {
                id: 'agent_worker_ui',
                label: 'UI Worker',
                status: 'waiting',
                task: '等待批准写入',
              },
              { id: 'agent_reviewer', label: 'Reviewer', status: 'idle', task: '暂无审阅' },
            ]}
          />

          <RuntimeHealthCard
            description="本地 preview server 当前未运行；最近一次 production build 通过。"
            metrics={[
              { label: '模式', value: 'local-only' },
              { label: '端口', value: '127.0.0.1:5174' },
              { label: '最近 build', value: 'passed' },
            ]}
            runtimeLabel="UI Preview Runtime"
            status="degraded"
          />

          <Card>
            <CardHeader>
              <CardTitle>今日摘要</CardTitle>
            </CardHeader>
            <CardContent className="stack">
              <MetadataList
                items={[
                  { label: '运行总数', value: '3' },
                  { label: '阻塞', value: '1' },
                  { label: '待审阅产物', value: '2' },
                  { label: '预算使用率', value: '42%' },
                ]}
              />
              <InlineAlert tone="info">
                Home / Inbox 的目标是让 operator 在 30 秒内判断：是否要接管、哪里失败、下一步去哪。
              </InlineAlert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快速过滤</CardTitle>
            </CardHeader>
            <CardContent className="filter-pills">
              <button className="filter-pill active" type="button">
                全部
              </button>
              <button className="filter-pill" type="button">
                需要我处理
              </button>
              <button className="filter-pill" type="button">
                运行中
              </button>
              <button className="filter-pill" type="button">
                失败 / 阻塞
              </button>
              <button className="filter-pill" type="button">
                产物待审阅
              </button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
