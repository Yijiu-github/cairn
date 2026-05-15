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

import {
  runDetailAgents,
  runDetailArtifacts,
  runDetailAttributionItems,
  runDetailCostMetrics,
  runDetailEvidenceItems,
  runDetailRuntimeMetrics,
  runDetailTasks,
} from '../preview-data/run-detail-data';

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
        <Button variant="danger" onClick={onProtectedAction}>
          取消运行
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
      <TaskTree items={runDetailTasks} selectedId="task_define_risk_copy" />
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
      <EvidenceTimeline items={runDetailEvidenceItems} />
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
          <p>产物卡片必须保留来源、路径、审阅状态和下一步动作。</p>
        </div>
        <StatusBadge label="2 pending review" tone="warning" />
      </div>
      <div className="grid two">
        {runDetailArtifacts.map((artifact) => (
          <ArtifactCard
            actions={artifact.actions}
            artifactId={artifact.artifactId}
            key={artifact.artifactId}
            kind={artifact.kind}
            path={artifact.path}
            reviewState={artifact.reviewState}
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
      <AgentStatusStrip agents={runDetailAgents} />

      <CostLatencyMeter
        costLabel="$0.08"
        latencyLabel="2.1s p50 / 8.4s p95"
        metrics={runDetailCostMetrics}
        tokenLabel="31.4k"
        usagePercent={58}
      />

      <RuntimeHealthCard
        description="UI preview 使用静态数据，不连接 workspace-core。"
        metrics={runDetailRuntimeMetrics}
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
        onEffectChange={onComposerEffectChange}
        onMessageChange={onComposerMessageChange}
        onSubmit={onProtectedAction}
      />

      <Card>
        <CardHeader>
          <CardTitle>错误归因</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <MetadataList items={runDetailAttributionItems} />
          <InlineAlert tone="warning">
            详情页必须让人能分清：是任务阻塞、执行失败，还是产物审阅未通过。
          </InlineAlert>
        </CardContent>
      </Card>
    </aside>
  );
}
