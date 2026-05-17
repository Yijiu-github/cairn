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
  RuntimeHealthCard,
  StatusBadge,
  TaskTree,
} from '@cairn/ui';

import { runDetailViewModel } from '../preview-models/run-detail-view-model';

import type { InterventionEffect } from '@cairn/ui';
import type { Dispatch, SetStateAction } from 'react';

interface RunDetailHeroSectionProps {
  onProtectedAction: () => void;
}

export function RunDetailHeroSection({ onProtectedAction }: RunDetailHeroSectionProps) {
  return (
    <section className="run-detail-header page-hero" aria-label="运行详情摘要">
      <div className="run-title-block">
        <div className="section-kicker">Run Detail</div>
        <nav className="preview-breadcrumb" aria-label="页面路径">
          <span>Desktop Shell</span>
          <span aria-hidden="true">/</span>
          <span>Home / Inbox</span>
          <span aria-hidden="true">/</span>
          <strong>Run Detail</strong>
        </nav>
        <div className="run-title-row">
          <h2>{runDetailViewModel.run.title}</h2>
          <StatusBadge label="运行中" tone="info" />
        </div>
        <p>{runDetailViewModel.run.summary}</p>
        <div className="run-id-line">
          {runDetailViewModel.run.id} · workspace_id: {runDetailViewModel.run.workspaceId}
        </div>
      </div>
      <div className="run-header-actions">
        <Button>接管</Button>
        <Button variant="secondary">暂停</Button>
        <Button variant="danger" onClick={onProtectedAction}>
          {runDetailViewModel.protectedAction.triggerLabel}
        </Button>
      </div>
    </section>
  );
}

export function RunTaskTreeSection() {
  return (
    <section className="preview-section" aria-labelledby="run-task-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Task Tree</div>
          <h2 id="run-task-heading">任务分解</h2>
          <p>每个可重试执行显示 attempt；阻塞项不能只靠颜色表达。</p>
        </div>
        <StatusBadge label="1 blocked" tone="warning" />
      </div>
      <TaskTree items={runDetailViewModel.run.tasks} selectedId="task_define_risk_copy" />
    </section>
  );
}

export function RunEvidenceSection() {
  return (
    <section className="preview-section" aria-labelledby="evidence-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Evidence</div>
          <h2 id="evidence-heading">证据链</h2>
          <p>按时间展示关键观察、工具结果、风险判断和待验证事项。</p>
        </div>
        <Button variant="secondary">复制摘要</Button>
      </div>
      <EvidenceTimeline items={runDetailViewModel.run.evidence} />
    </section>
  );
}

export function RunArtifactsSection() {
  return (
    <section className="preview-section" aria-labelledby="artifact-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Artifacts</div>
          <h2 id="artifact-heading">本次运行产物</h2>
          <p>产物卡片必须保留来源、路径、审阅状态和下一步动作；“审阅”进入 Artifact Review。</p>
        </div>
        <StatusBadge label="2 pending review" tone="warning" />
      </div>
      <div className="grid two">
        {runDetailViewModel.run.artifacts.map((artifact) => (
          <ArtifactCard
            actions={[
              { label: '打开审阅', tone: 'primary' },
              { label: '复制引用', tone: 'secondary' },
            ]}
            artifactId={artifact.artifactId}
            key={artifact.artifactId}
            kind={artifact.kind}
            path={artifact.path}
            pathDisplayMode="relative"
            reviewState={artifact.reviewState}
            sensitivity={artifact.sensitivity}
            summary={artifact.summary}
            title={artifact.title}
            verification={artifact.verification}
          />
        ))}
      </div>
    </section>
  );
}

interface RunDetailSidebarProps {
  composerEffect: InterventionEffect;
  composerMessage: string;
  onComposerEffectChange: Dispatch<SetStateAction<InterventionEffect>>;
  onComposerMessageChange: Dispatch<SetStateAction<string>>;
  onProtectedAction: () => void;
}

export function RunDetailSidebar({
  composerEffect,
  composerMessage,
  onComposerEffectChange,
  onComposerMessageChange,
  onProtectedAction,
}: RunDetailSidebarProps) {
  return (
    <aside className="run-detail-side" aria-label="运行侧栏">
      <AgentStatusStrip agents={runDetailViewModel.agents} />

      <CostLatencyMeter
        costLabel={runDetailViewModel.cost.costLabel}
        latencyLabel={runDetailViewModel.cost.latencyLabel}
        metrics={runDetailViewModel.cost.metrics}
        tokenLabel={runDetailViewModel.cost.tokenLabel}
        usagePercent={runDetailViewModel.cost.usagePercent}
      />

      <RuntimeHealthCard
        description={runDetailViewModel.runtime.description}
        metrics={runDetailViewModel.runtime.metrics}
        runtimeLabel={runDetailViewModel.runtime.label}
        status={runDetailViewModel.runtime.status}
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
        onEffectChange={onComposerEffectChange}
        onMessageChange={onComposerMessageChange}
        onSubmit={onProtectedAction}
      />

      <Card>
        <CardHeader>
          <CardTitle>错误归因</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <MetadataList items={runDetailViewModel.attribution} />
          <InlineAlert tone="warning">
            详情页必须让人能分清：是任务阻塞、执行失败，还是产物审阅未通过。
          </InlineAlert>
        </CardContent>
      </Card>
    </aside>
  );
}
