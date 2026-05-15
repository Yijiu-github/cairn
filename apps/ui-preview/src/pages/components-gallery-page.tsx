import { useState } from 'react';

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
  ProtectedActionDialog,
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

import { defaultInterventionEffect, runActions, taskItems } from '../demo-data';

import type { InterventionEffect } from '@cairn/ui';

export function ComponentsGalleryPage() {
  const [composerMessage, setComposerMessage] =
    useState('请先暂停当前写入动作，我要补充边界条件。');
  const [composerEffect, setComposerEffect] =
    useState<InterventionEffect>(defaultInterventionEffect);
  const [protectedOpen, setProtectedOpen] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includePaths, setIncludePaths] = useState(false);
  const [reviewNote, setReviewNote] = useState('证据链完整，可以进入下一步。');

  return (
    <>
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

      <section className="preview-section">
        <div className="section-heading">
          <h2>Cairn Product Components</h2>
          <p>围绕 Run、Task、Artifact、Handoff、Operator action 组织。</p>
        </div>
        <div className="grid two">
          <RunCard
            actions={runActions}
            agentLabel="Supervisor / 白霓"
            description="生成组件预览页面，并检查 UI 组件状态覆盖。"
            metrics={[
              { label: '任务', value: '3 / 5' },
              { label: '耗时', value: '02:18' },
            ]}
            progress={58}
            runId="run_01JDEMOUI000000000000000"
            status="running"
            title="UI preview implementation"
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

          <TaskTree items={taskItems} selectedId="task_product" />

          <ArtifactCard
            actions={[
              { label: '查看', tone: 'primary' },
              { label: '请求修改', tone: 'secondary' },
            ]}
            artifactId="artifact_ui_preview_001"
            kind="document"
            path="apps/ui-preview/src/ui-preview-app.tsx"
            reviewState="pending_review"
            summary="组件预览页面源文件，用于设计和开发共同检查 UI 状态。"
            title="UI preview app"
            verification="typecheck passed"
          />
        </div>
      </section>

      <section className="preview-section">
        <div className="section-heading">
          <h2>Evidence / Runtime / Review</h2>
          <p>让人类能看懂发生了什么、花了多少、是否该接管。</p>
        </div>
        <div className="grid two">
          <EvidenceTimeline
            items={[
              {
                id: 'ev_1',
                time: '13:02',
                title: '读取 AGENTS.md',
                tone: 'info',
                metadata: 'context loaded',
              },
              {
                id: 'ev_2',
                time: '13:07',
                title: '生成 UI preview 骨架',
                tone: 'success',
                metadata: 'apps/ui-preview',
              },
              {
                id: 'ev_3',
                time: '13:11',
                title: '等待截图审阅',
                tone: 'warning',
                description: '需要人工确认视觉密度。',
              },
            ]}
          />

          <CostLatencyMeter
            costLabel="$0.04"
            latencyLabel="2.3s p50 / 7.8s p95"
            tokenLabel="18.2k"
            usagePercent={42}
          />

          <AgentStatusStrip
            agents={[
              {
                id: 'agent_supervisor',
                label: 'Supervisor',
                status: 'running',
                task: '协调 UI preview',
              },
              { id: 'agent_ui', label: 'UI Worker', status: 'thinking', task: '整理组件状态' },
              { id: 'agent_review', label: 'Reviewer', status: 'waiting', task: '等待截图' },
            ]}
          />

          <ArtifactReviewPanel
            actions={[
              { label: '批准', tone: 'primary' },
              { label: '请求修改', tone: 'secondary' },
            ]}
            artifactId="artifact_ui_preview_001"
            note={reviewNote}
            onNoteChange={setReviewNote}
            reviewState="pending_review"
            title="产物审阅"
          />
        </div>
      </section>

      <section className="preview-section">
        <div className="section-heading">
          <h2>Operator Intervention / Safety</h2>
          <p>接管动作和危险动作不能藏起来，影响范围必须明确。</p>
        </div>
        <div className="grid two">
          <InterventionComposer
            effect={composerEffect}
            message={composerMessage}
            onEffectChange={setComposerEffect}
            onMessageChange={setComposerMessage}
            onSubmit={() => {
              setProtectedOpen(true);
            }}
          />

          <DiagnosticExportPanel
            includeLogs={includeLogs}
            includePaths={includePaths}
            onExport={() => {
              setProtectedOpen(true);
            }}
            onIncludeLogsChange={setIncludeLogs}
            onIncludePathsChange={setIncludePaths}
          />
        </div>
      </section>

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

      <Dialog open={false}>
        <DialogPanel>
          <DialogTitle>隐藏 Dialog 示例</DialogTitle>
          <DialogDescription>保留在 preview 中，便于类型和样式检查。</DialogDescription>
          <DialogFooter>
            <DialogAction>确认</DialogAction>
            <DialogCancel>取消</DialogCancel>
          </DialogFooter>
        </DialogPanel>
      </Dialog>

      <ProtectedActionDialog
        actionKind="file_write"
        impact="将更新 apps/ui-preview 下的本地预览代码。"
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
        target="apps/ui-preview"
      />

      <footer className="footer">
        <MetadataList
          items={[
            { label: '模式', value: 'static demo data' },
            { label: 'Backend', value: 'not connected' },
            { label: 'Branch', value: 'feat/ui-desktop-v0' },
          ]}
        />
      </footer>
    </>
  );
}
