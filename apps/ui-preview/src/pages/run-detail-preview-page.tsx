import { useState } from 'react';

import {
  AgentStatusStrip,
  ArtifactCard,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CostLatencyMeter,
  EvidenceTimeline,
  HandoffQueueItem,
  InlineAlert,
  InterventionComposer,
  MetadataList,
  ProtectedActionDialog,
  RuntimeHealthCard,
  StatusBadge,
  TaskTree,
} from '@cairn/ui';

import type { InterventionEffect } from '@cairn/ui';

const runTasks = [
  {
    id: 'task_plan_run_detail',
    label: '规划 Run Detail 信息架构',
    metadata: 'orchestration layer',
    status: 'completed' as const,
    attempt: 1,
    children: [
      {
        id: 'task_map_operator_actions',
        label: '标记人工接管入口',
        metadata: 'operator visible',
        status: 'completed' as const,
        attempt: 1,
      },
      {
        id: 'task_define_risk_copy',
        label: '补充受保护动作影响范围',
        metadata: 'local trust',
        status: 'running' as const,
        attempt: 2,
      },
    ],
  },
  {
    id: 'task_build_preview',
    label: '实现页面 preview',
    metadata: 'apps/ui-preview',
    status: 'running' as const,
    attempt: 1,
    children: [
      {
        id: 'task_wire_components',
        label: '组合 TaskTree / EvidenceTimeline / ArtifactCard',
        status: 'running' as const,
        attempt: 1,
      },
      {
        id: 'task_validate_build',
        label: '执行 typecheck / lint / build',
        status: 'todo' as const,
      },
    ],
  },
  {
    id: 'task_capture_review',
    label: '等待视觉审阅',
    metadata: 'human handoff',
    status: 'blocked' as const,
    attempt: 1,
  },
];

const evidenceItems = [
  {
    id: 'evidence_read_rules',
    time: '15:22',
    title: '读取 UI 分支规则',
    tone: 'info' as const,
    description: '确认当前分支为 feat/ui-desktop-v0，PR base 为 develop。',
    metadata: 'docs/engineering/git-workflow.md',
  },
  {
    id: 'evidence_home_inbox',
    time: '15:25',
    title: 'Home / Inbox prototype 已推送',
    tone: 'success' as const,
    description: '第一屏已覆盖 Inbox、Runs、Agent 状态和 Runtime 健康。',
    metadata: 'commit ede8a12',
  },
  {
    id: 'evidence_operator_scope',
    time: '15:28',
    title: '发现受保护动作需要明确范围',
    tone: 'warning' as const,
    description: '写入新页面文件前，需要展示目标、影响和批准范围。',
    metadata: 'actionKind=file_write target=apps/ui-preview/src/pages',
  },
  {
    id: 'evidence_build_pending',
    time: '15:31',
    title: '等待最终校验',
    tone: 'neutral' as const,
    description: 'typecheck、lint、build 将在提交前执行。',
  },
];

export function RunDetailPreviewPage() {
  const [composerMessage, setComposerMessage] =
    useState('请优先确认任务树里的阻塞项，然后再生成截图。');
  const [composerEffect, setComposerEffect] = useState<InterventionEffect>('immediate');
  const [protectedOpen, setProtectedOpen] = useState(false);

  return (
    <div className="prototype-page">
      <section className="run-detail-header" aria-label="运行详情摘要">
        <div className="run-title-block">
          <div className="section-kicker">Run Detail</div>
          <div className="run-title-row">
            <h2>生成 Run Detail 页面 prototype</h2>
            <StatusBadge label="运行中" tone="info" />
          </div>
          <p>
            把任务树、证据链、产物、成本延迟和人工接管组合到同一个控制台视图中，验证 operator
            是否能快速判断下一步。
          </p>
          <div className="run-id-line">
            run_01JDEMOHOME0000000000001 · workspace_id: local_demo_workspace
          </div>
        </div>
        <div className="run-header-actions">
          <Button>接管</Button>
          <Button variant="secondary">暂停</Button>
          <Button
            variant="danger"
            onClick={() => {
              setProtectedOpen(true);
            }}
          >
            取消运行
          </Button>
        </div>
      </section>

      <section className="run-detail-layout">
        <div className="run-detail-main">
          <section className="preview-section" aria-labelledby="run-task-heading">
            <div className="section-heading split-heading">
              <div>
                <div className="section-kicker">Task Tree</div>
                <h2 id="run-task-heading">任务分解</h2>
                <p>每个可重试执行显示 attempt；阻塞项不能只靠颜色表达。</p>
              </div>
              <StatusBadge label="1 blocked" tone="warning" />
            </div>
            <TaskTree items={runTasks} selectedId="task_define_risk_copy" />
          </section>

          <section className="preview-section" aria-labelledby="evidence-heading">
            <div className="section-heading split-heading">
              <div>
                <div className="section-kicker">Evidence</div>
                <h2 id="evidence-heading">证据链</h2>
                <p>按时间展示关键观察、工具结果、风险判断和待验证事项。</p>
              </div>
              <Button variant="secondary">复制摘要</Button>
            </div>
            <EvidenceTimeline items={evidenceItems} />
          </section>

          <section className="preview-section" aria-labelledby="artifact-heading">
            <div className="section-heading split-heading">
              <div>
                <div className="section-kicker">Artifacts</div>
                <h2 id="artifact-heading">本次运行产物</h2>
                <p>产物卡片必须保留来源、路径、审阅状态和下一步动作。</p>
              </div>
              <StatusBadge label="2 pending review" tone="warning" />
            </div>
            <div className="grid two">
              <ArtifactCard
                actions={[
                  { label: '打开预览', tone: 'primary' },
                  { label: '请求修改', tone: 'secondary' },
                ]}
                artifactId="artifact_run_detail_page"
                kind="document"
                path="apps/ui-preview/src/pages/run-detail-preview-page.tsx"
                reviewState="pending_review"
                summary="Run Detail 页面 prototype，组合任务树、证据链、产物列表和人工接管。"
                title="Run Detail preview page"
                verification="typecheck pending"
              />
              <ArtifactCard
                actions={[
                  { label: '查看差异', tone: 'primary' },
                  { label: '批准', tone: 'secondary' },
                ]}
                artifactId="artifact_preview_styles"
                kind="document"
                path="apps/ui-preview/src/styles.css"
                reviewState="changes_requested"
                summary="新增详情页布局、侧栏和风险面板样式。"
                title="Preview layout styles"
                verification="visual review needed"
              />
            </div>
          </section>
        </div>

        <aside className="run-detail-side" aria-label="运行侧栏">
          <AgentStatusStrip
            agents={[
              {
                id: 'agent_supervisor',
                label: 'Supervisor',
                status: 'running',
                task: '协调 Run Detail',
              },
              {
                id: 'agent_worker_ui',
                label: 'UI Worker',
                status: 'thinking',
                task: '补齐页面结构',
              },
              { id: 'agent_reviewer', label: 'Reviewer', status: 'waiting', task: '等待本轮提交' },
            ]}
          />

          <CostLatencyMeter
            costLabel="$0.08"
            latencyLabel="2.1s p50 / 8.4s p95"
            metrics={[
              { label: 'attempt', value: '2' },
              { label: 'tool calls', value: '14' },
            ]}
            tokenLabel="31.4k"
            usagePercent={58}
          />

          <RuntimeHealthCard
            description="UI preview 使用静态数据，不连接 workspace-core。"
            metrics={[
              { label: 'runtime', value: 'vite' },
              { label: 'backend', value: 'not connected' },
              { label: 'mode', value: 'source-only' },
            ]}
            runtimeLabel="Preview runtime"
            status="ready"
          />

          <HandoffQueueItem
            action={{ label: '处理', tone: 'primary' }}
            agentLabel="Supervisor"
            description="取消运行会停止当前 Run Detail 生成任务，并保留已产生产物。"
            kind="approval"
            sourceLabel="Run controls"
            title="取消运行需要确认影响范围"
            waitedFor="1m 12s"
          />

          <InterventionComposer
            effect={composerEffect}
            message={composerMessage}
            onEffectChange={setComposerEffect}
            onMessageChange={setComposerMessage}
            onSubmit={() => {
              setProtectedOpen(true);
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>错误归因</CardTitle>
            </CardHeader>
            <CardContent className="stack">
              <MetadataList
                items={[
                  { label: '编排', value: 'ok' },
                  { label: '任务', value: '1 blocked' },
                  { label: '执行', value: 'pending validation' },
                  { label: '产物', value: '2 pending review' },
                ]}
              />
              <InlineAlert tone="warning">
                详情页必须让人能分清：是任务阻塞、执行失败，还是产物审阅未通过。
              </InlineAlert>
            </CardContent>
          </Card>
        </aside>
      </section>

      <ProtectedActionDialog
        actionKind="other"
        impact="会停止当前运行，但保留已生成的预览文件和证据链记录。"
        onApprove={() => {
          setProtectedOpen(false);
        }}
        onCancel={() => {
          setProtectedOpen(false);
        }}
        onDeny={() => {
          setProtectedOpen(false);
        }}
        open={protectedOpen}
        target="run_01JDEMOHOME0000000000001"
      />
    </div>
  );
}
