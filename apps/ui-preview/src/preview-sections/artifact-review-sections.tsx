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

import {
  artifactDecisionItems,
  artifactReviewProvenanceItems,
  artifactReviewRelatedArtifacts,
  artifactRiskItems,
  artifactShareChecklistBaseItems,
} from '../preview-data/artifact-review-data';

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
          <h2>Run Detail preview page</h2>
          <StatusBadge label="待审阅" tone="info" />
          <StatusBadge label="可能包含敏感路径" tone="warning" />
        </div>
        <p>
          审阅页的目标是回答三个问题：产物从哪来、是否可信、批准后会发生什么。这里刻意把本地路径和导出风险放在第一屏。
        </p>
        <div className="run-id-line">artifact_run_detail_page · run_01JDEMOHOME0000000000001</div>
      </div>
      <div className="run-header-actions">
        <Button>批准</Button>
        <Button variant="secondary">请求修改</Button>
        <Button variant="danger" onClick={onProtectedAction}>
          删除产物
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
        {artifactReviewRelatedArtifacts.map((artifact) => {
          const sensitiveProps = artifact.sensitive === undefined ? {} : { sensitive: artifact.sensitive };

          return (
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
              reviewState={artifact.reviewState}
              summary={artifact.summary}
              title={artifact.title}
              verification={artifact.verification}
              {...sensitiveProps}
            />
          );
        })}
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
      <EvidenceTimeline items={artifactReviewProvenanceItems} />
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
      <Tabs value={reviewTab}>
        <TabsList aria-label="审阅上下文">
          <TabsTrigger
            onClick={() => {
              onReviewTabChange('diff');
            }}
            value="diff"
          >
            Diff 摘要
          </TabsTrigger>
          <TabsTrigger
            onClick={() => {
              onReviewTabChange('risk');
            }}
            value="risk"
          >
            风险
          </TabsTrigger>
          <TabsTrigger
            onClick={() => {
              onReviewTabChange('decision');
            }}
            value="decision"
          >
            决策
          </TabsTrigger>
        </TabsList>
        <TabsContent value="diff">
          <Card>
            <CardContent className="artifact-code-block">
              <pre>{`+ export function RunDetailPreviewPage() {
+   return <TaskTree items={runTasks} selectedId="task_define_risk_copy" />;
+ }

+ .run-detail-layout {
+   grid-template-columns: minmax(0, 1fr) 380px;
+ }`}</pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="risk">
          <Card>
            <CardContent className="stack">
              <InlineAlert tone="warning">
                产物内容安全，但路径可能暴露用户名、项目结构或机器信息；分享前应默认隐藏绝对路径。
              </InlineAlert>
              <MetadataList items={artifactRiskItems} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="decision">
          <Card>
            <CardContent className="stack">
              <InlineAlert tone="info">
                推荐动作：批准页面结构，要求样式和文案在截图审阅后再标记最终 approved。
              </InlineAlert>
              <MetadataList items={artifactDecisionItems} />
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
        artifactId="artifact_run_detail_page"
        note={reviewNote}
        onNoteChange={onReviewNoteChange}
        reviewState="pending_review"
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
              { label: '绝对路径', value: includePaths ? 'included' : 'hidden by default' },
              { label: '日志', value: includeLogs ? 'included, redacted' : 'excluded' },
              ...artifactShareChecklistBaseItems,
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
