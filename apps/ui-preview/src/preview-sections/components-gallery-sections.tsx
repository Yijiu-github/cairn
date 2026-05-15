import {
  AgentStatusStrip,
  ArtifactCard,
  ArtifactReviewPanel,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CostLatencyMeter,
  DiagnosticExportPanel,
  Dialog,
  DialogAction,
  DialogCancel,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogTitle,
  EmptyState,
  ErrorState,
  EvidenceTimeline,
  HandoffQueueItem,
  InlineAlert,
  Input,
  InterventionComposer,
  MetadataList,
  Progress,
  RunCard,
  Select,
  Skeleton,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TaskTree,
  Textarea,
  Toast,
  ToastViewport,
  Tooltip,
} from '@cairn/ui';

import { componentsGalleryViewModel } from '../preview-models/components-gallery-view-model';

import type { InterventionEffect } from '@cairn/ui';
import type { Dispatch, SetStateAction } from 'react';

export function GalleryFoundationSection() {
  return (
    <section className="preview-section">
      <div className="section-heading">
        <h2>Foundation / Primitives</h2>
        <p>基础控件需要清楚区分 hover、focus、disabled 和危险动作。</p>
      </div>
      <div className="grid two">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <Input
              aria-label="工作区名称"
              placeholder="工作区名称"
              value="local_demo_workspace"
              readOnly
            />
            <Textarea aria-label="运行说明" value="请在本地工作区内生成 UI preview。" readOnly />
            <Select
              aria-label="运行模式"
              options={[
                { label: '本地模式', value: 'local' },
                { label: '远程自托管', value: 'remote' },
              ]}
              value="local"
              disabled
            />
            <Switch checked label="显示证据链" readOnly />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status / Feedback</CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <div className="badge-row">
              <StatusBadge label="运行中" tone="info" />
              <StatusBadge label="已完成" tone="success" />
              <StatusBadge label="需要确认" tone="warning" />
              <StatusBadge label="失败" tone="danger" />
            </div>
            <InlineAlert tone="info">状态不能只靠颜色表达，必须同时有 label。</InlineAlert>
            <Progress label="预算使用率" value={64} />
            <Tooltip content="Tooltip 用于补充解释，不承载关键动作。">
              <Button variant="secondary">悬停查看说明</Button>
            </Tooltip>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function GalleryProductComponentsSection() {
  return (
    <section className="preview-section">
      <div className="section-heading">
        <h2>Cairn Product Components</h2>
        <p>围绕 Run、Task、Artifact、Handoff、Operator action 组织。</p>
      </div>
      <div className="grid two">
        <RunCard
          actions={componentsGalleryViewModel.product.runActions}
          agentLabel={componentsGalleryViewModel.product.run.agentLabel}
          description={componentsGalleryViewModel.product.run.description}
          metrics={componentsGalleryViewModel.product.run.metrics}
          progress={componentsGalleryViewModel.product.run.progress}
          runId={componentsGalleryViewModel.product.run.id}
          status={componentsGalleryViewModel.product.run.status}
          title={componentsGalleryViewModel.product.run.title}
        />

        <HandoffQueueItem
          action={{ label: '打开接管面板', tone: 'primary' }}
          agentLabel="Worker UI"
          description="即将导出诊断包，需要确认是否包含本地路径。"
          kind="approval"
          sourceLabel="DiagnosticExportPanel"
          title="需要 operator 确认导出范围"
          waitedFor="3m 12s"
        />

        <TaskTree items={componentsGalleryViewModel.product.taskItems} selectedId="task_product" />

        <ArtifactCard
          actions={[
            { label: '查看', tone: 'primary' },
            { label: '请求修改', tone: 'secondary' },
          ]}
          artifactId={componentsGalleryViewModel.product.artifact.artifactId}
          kind="document"
          path={componentsGalleryViewModel.product.artifact.path}
          pathDisplayMode="relative"
          reviewState="pending_review"
          sensitivity="none"
          summary={componentsGalleryViewModel.product.artifact.summary}
          title={componentsGalleryViewModel.product.artifact.title}
          verification={componentsGalleryViewModel.product.artifact.verification}
        />
      </div>
    </section>
  );
}

interface GalleryEvidenceRuntimeSectionProps {
  reviewNote: string;
  onReviewNoteChange: Dispatch<SetStateAction<string>>;
}

export function GalleryEvidenceRuntimeSection({
  reviewNote,
  onReviewNoteChange,
}: GalleryEvidenceRuntimeSectionProps) {
  return (
    <section className="preview-section">
      <div className="section-heading">
        <h2>Evidence / Runtime / Review</h2>
        <p>让人类能看懂发生了什么、花了多少、是否该接管。</p>
      </div>
      <div className="grid two">
        <EvidenceTimeline items={componentsGalleryViewModel.evidenceRuntime.evidence} />

        <CostLatencyMeter
          costLabel="$0.04"
          latencyLabel="2.3s p50 / 7.8s p95"
          tokenLabel="18.2k"
          usagePercent={42}
        />

        <AgentStatusStrip agents={componentsGalleryViewModel.evidenceRuntime.agents} />

        <ArtifactReviewPanel
          actions={[
            { label: '批准', tone: 'primary' },
            { label: '请求修改', tone: 'secondary' },
          ]}
          artifactId={componentsGalleryViewModel.evidenceRuntime.review.artifactId}
          note={reviewNote}
          onNoteChange={onReviewNoteChange}
          reviewState="pending_review"
          title={componentsGalleryViewModel.evidenceRuntime.review.title}
        />
      </div>
    </section>
  );
}

interface GalleryProtectedActionsSectionProps {
  composerEffect: InterventionEffect;
  composerMessage: string;
  includeLogs: boolean;
  includePaths: boolean;
  onComposerEffectChange: Dispatch<SetStateAction<InterventionEffect>>;
  onComposerMessageChange: Dispatch<SetStateAction<string>>;
  onIncludeLogsChange: Dispatch<SetStateAction<boolean>>;
  onIncludePathsChange: Dispatch<SetStateAction<boolean>>;
  onProtectedAction: () => void;
}

export function GalleryProtectedActionsSection({
  composerEffect,
  composerMessage,
  includeLogs,
  includePaths,
  onComposerEffectChange,
  onComposerMessageChange,
  onIncludeLogsChange,
  onIncludePathsChange,
  onProtectedAction,
}: GalleryProtectedActionsSectionProps) {
  return (
    <section className="preview-section">
      <div className="section-heading">
        <h2>Operator Intervention / Safety</h2>
        <p>接管动作和危险动作不能藏起来，影响范围必须明确。</p>
      </div>
      <div className="grid two">
        <InterventionComposer
          effect={composerEffect}
          message={composerMessage}
          onEffectChange={onComposerEffectChange}
          onMessageChange={onComposerMessageChange}
          onSubmit={onProtectedAction}
        />

        <DiagnosticExportPanel
          includeLogs={includeLogs}
          includePaths={includePaths}
          onExport={onProtectedAction}
          onIncludeLogsChange={onIncludeLogsChange}
          onIncludePathsChange={onIncludePathsChange}
        />
      </div>
    </section>
  );
}

export function GalleryFeedbackSection() {
  return (
    <section className="preview-section">
      <div className="section-heading">
        <h2>Empty / Error / Toast / Tabs</h2>
        <p>空态、错误归因和轻量通知。</p>
      </div>
      <Tabs value="empty">
        <TabsList aria-label="反馈组件示例">
          <TabsTrigger value="empty">Empty</TabsTrigger>
          <TabsTrigger value="error">Error</TabsTrigger>
          <TabsTrigger value="toast">Toast</TabsTrigger>
        </TabsList>
        <TabsContent value="empty">
          <EmptyState
            title="暂无运行"
            description="创建第一个本地运行后，这里会显示 RunCard 和证据链。"
            action={<Button>创建运行</Button>}
          />
        </TabsContent>
        <TabsContent value="error">
          <ErrorState
            title="执行失败"
            description="Mock runtime 返回非零退出码。"
            layer="execution"
            action={<Button variant="secondary">重试</Button>}
          />
        </TabsContent>
        <TabsContent value="toast">
          <Toast
            title="已保存审阅意见"
            description="operator action trace 已更新。"
            tone="success"
          />
          <ToastViewport />
        </TabsContent>
      </Tabs>
    </section>
  );
}

export function GalleryHiddenDialog() {
  return (
    <Dialog open={false}>
      <DialogPanel>
        <DialogTitle>{componentsGalleryViewModel.feedback.dialogCopy.title}</DialogTitle>
        <DialogDescription>
          {componentsGalleryViewModel.feedback.dialogCopy.description}
        </DialogDescription>
        <DialogFooter>
          <DialogAction>确认</DialogAction>
          <DialogCancel>取消</DialogCancel>
        </DialogFooter>
      </DialogPanel>
    </Dialog>
  );
}

export function GalleryFooter() {
  return (
    <footer className="footer">
      <MetadataList items={componentsGalleryViewModel.footer} />
    </footer>
  );
}
