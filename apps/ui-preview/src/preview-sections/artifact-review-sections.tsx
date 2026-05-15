import {
  ArtifactCard,
  ArtifactReviewPanel,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DiagnosticExportPanel,
  EvidenceTimeline,
  InlineAlert,
  MetadataList,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@cairn/ui';

import { artifactReviewViewModel } from '../preview-models/artifact-review-view-model';

import type { Dispatch, SetStateAction } from 'react';

interface ArtifactReviewHeroSectionProps {
  onProtectedAction: () => void;
}

export function ArtifactReviewHeroSection({ onProtectedAction }: ArtifactReviewHeroSectionProps) {
  return (
    <section className="artifact-review-hero page-hero" aria-label="产物审阅摘要">
      <div className="run-title-block">
        <div className="section-kicker">Artifact Review</div>
        <div className="run-title-row">
          <h2>{artifactReviewViewModel.hero.title}</h2>
          {artifactReviewViewModel.hero.badges.map((badge) => (
            <StatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
        </div>
        <p>{artifactReviewViewModel.hero.summary}</p>
        <div className="run-id-line">
          {artifactReviewViewModel.artifact.artifactId} · {artifactReviewViewModel.runId}
        </div>
      </div>
      <div className="run-header-actions">
        <Button>批准</Button>
        <Button variant="secondary">请求修改</Button>
        <Button variant="danger" onClick={onProtectedAction}>
          {artifactReviewViewModel.protectedAction.triggerLabel}
        </Button>
      </div>
    </section>
  );
}

export function ArtifactOverviewSection() {
  return (
    <section className="preview-section" aria-labelledby="artifact-overview-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Overview</div>
          <h2 id="artifact-overview-heading">产物概览</h2>
          <p>把审阅状态、路径、敏感性和验证结论放在同一组卡片里。</p>
        </div>
        <Button variant="secondary">打开源文件</Button>
      </div>
      <div className="grid two">
        {artifactReviewViewModel.relatedArtifacts.map((artifact) => (
          <ArtifactCard
            key={artifact.artifactId}
            actions={[
              { label: '查看', tone: 'primary' },
              artifact.reviewState === 'approved'
                ? { label: '复制引用', tone: 'secondary' }
                : { label: '审阅', tone: 'secondary' },
            ]}
            artifactId={artifact.artifactId}
            kind={artifact.kind}
            path={artifact.path}
            pathDisplayMode="relative"
            redactionLabel="本地路径已隐藏"
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

export function ArtifactProvenanceSection() {
  return (
    <section className="preview-section" aria-labelledby="provenance-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Provenance</div>
          <h2 id="provenance-heading">来源链</h2>
          <p>来源链优先展示 operator approval、写入动作、扫描提示和当前审阅状态。</p>
        </div>
        <StatusBadge label="trace complete" tone="success" />
      </div>
      <EvidenceTimeline items={artifactReviewViewModel.provenance} />
    </section>
  );
}

interface ArtifactReviewContextSectionProps {
  reviewTab: string;
  onReviewTabChange: Dispatch<SetStateAction<string>>;
}

export function ArtifactReviewContextSection({
  reviewTab,
  onReviewTabChange,
}: ArtifactReviewContextSectionProps) {
  return (
    <section className="preview-section" aria-labelledby="diff-heading">
      <div className="section-heading split-heading">
        <div>
          <div className="section-kicker">Preview</div>
          <h2 id="diff-heading">审阅上下文</h2>
          <p>真正接入后这里可以放 diff、截图、日志摘录或渲染预览。</p>
        </div>
      </div>
      <Tabs onValueChange={onReviewTabChange} value={reviewTab}>
        <TabsList aria-label="审阅上下文">
          <TabsTrigger value="diff">Diff 摘要</TabsTrigger>
          <TabsTrigger value="risk">风险</TabsTrigger>
          <TabsTrigger value="decision">决策</TabsTrigger>
        </TabsList>
        <TabsContent value="diff">
          <Card>
            <CardContent className="artifact-code-block">
              <pre>{artifactReviewViewModel.reviewContext.diff}</pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="risk">
          <Card>
            <CardContent className="stack">
              <InlineAlert tone="warning">
                {artifactReviewViewModel.reviewContext.risk.alert}
              </InlineAlert>
              <MetadataList items={artifactReviewViewModel.reviewContext.risk.metrics} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="decision">
          <Card>
            <CardContent className="stack">
              <InlineAlert tone="info">
                {artifactReviewViewModel.reviewContext.decision.alert}
              </InlineAlert>
              <MetadataList items={artifactReviewViewModel.reviewContext.decision.metrics} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

interface ArtifactReviewSidebarProps {
  includeLogs: boolean;
  includePaths: boolean;
  reviewNote: string;
  onIncludeLogsChange: Dispatch<SetStateAction<boolean>>;
  onIncludePathsChange: Dispatch<SetStateAction<boolean>>;
  onProtectedAction: () => void;
  onReviewNoteChange: Dispatch<SetStateAction<string>>;
}

export function ArtifactReviewSidebar({
  includeLogs,
  includePaths,
  reviewNote,
  onIncludeLogsChange,
  onIncludePathsChange,
  onProtectedAction,
  onReviewNoteChange,
}: ArtifactReviewSidebarProps) {
  return (
    <aside className="artifact-review-side" aria-label="审阅操作侧栏">
      <ArtifactReviewPanel
        actions={[
          { label: '批准', tone: 'primary' },
          { label: '请求修改', tone: 'secondary' },
          {
            label: '拒绝',
            tone: 'danger',
            onClick: onProtectedAction,
          },
        ]}
        artifactId={artifactReviewViewModel.artifact.artifactId}
        note={reviewNote}
        onNoteChange={onReviewNoteChange}
        reviewState={artifactReviewViewModel.artifact.reviewState}
        title="审阅决定"
      />

      <DiagnosticExportPanel
        includeLogs={includeLogs}
        includePaths={includePaths}
        onExport={onProtectedAction}
        onIncludeLogsChange={onIncludeLogsChange}
        onIncludePathsChange={onIncludePathsChange}
      />

      <Card>
        <CardHeader>
          <CardTitle>分享前检查</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <MetadataList
            items={[
              {
                label: '绝对路径',
                value: includePaths
                  ? artifactReviewViewModel.diagnosticExport.includePathsVisibleLabel
                  : artifactReviewViewModel.diagnosticExport.includePathsHiddenLabel,
              },
              {
                label: '日志',
                value: includeLogs
                  ? artifactReviewViewModel.diagnosticExport.includeLogsLabel
                  : 'excluded',
              },
              ...artifactReviewViewModel.diagnosticExport.checklistBaseItems,
            ]}
          />
          <InlineAlert tone={includePaths ? 'warning' : 'success'}>
            {includePaths
              ? '已选择包含本地路径：导出前需要二次确认。'
              : '默认隐藏本地路径，适合发给外部协作者。'}
          </InlineAlert>
        </CardContent>
      </Card>
    </aside>
  );
}
