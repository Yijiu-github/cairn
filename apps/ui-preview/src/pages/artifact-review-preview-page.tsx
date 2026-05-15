import { useState } from 'react';

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
  ProtectedActionDialog,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@cairn/ui';

const provenanceItems = [
  {
    id: 'artifact_provenance_input',
    time: '15:24',
    title: 'Operator 批准生成页面 prototype',
    tone: 'info' as const,
    description: '目标限定在 apps/ui-preview，不触碰 runtime 或真实工作区数据。',
    metadata: 'approval_scope=ui-preview source-only',
  },
  {
    id: 'artifact_provenance_write',
    time: '15:31',
    title: 'Worker 写入 Run Detail 页面',
    tone: 'success' as const,
    description: '新增页面文件并更新 preview 导航，产物进入 pending_review。',
    metadata: 'commit 502dae5',
  },
  {
    id: 'artifact_provenance_scan',
    time: '15:36',
    title: '敏感信息扫描提示',
    tone: 'warning' as const,
    description: '页面包含本地路径示例，导出或分享前建议脱敏用户名与机器名。',
    metadata: 'risk=local_path_disclosure',
  },
  {
    id: 'artifact_provenance_review',
    time: '15:38',
    title: '等待人工审阅',
    tone: 'neutral' as const,
    description: '需要确认产物是否可以合入 PR，或要求补充交互状态。',
  },
];

const relatedArtifacts = [
  {
    artifactId: 'artifact_run_detail_page',
    kind: 'document' as const,
    path: 'apps/ui-preview/src/pages/run-detail-preview-page.tsx',
    reviewState: 'pending_review' as const,
    sensitive: true,
    summary: 'Run Detail 页面 prototype，包含 run id、任务树、证据链、产物和接管入口。',
    title: 'Run Detail preview page',
    verification: 'typecheck passed',
  },
  {
    artifactId: 'artifact_preview_styles',
    kind: 'document' as const,
    path: 'apps/ui-preview/src/styles.css',
    reviewState: 'changes_requested' as const,
    summary: '新增页面布局、侧栏、响应式断点和风险提示样式。',
    title: 'Preview styles',
    verification: 'visual review needed',
  },
  {
    artifactId: 'artifact_build_log',
    kind: 'log' as const,
    path: 'apps/ui-preview/dist/assets/index-BfLy9KfC.js',
    reviewState: 'approved' as const,
    summary: '最近一次 production build 输出。dist 目录不提交，仅用于验证。',
    title: 'Build output log',
    verification: 'build passed',
  },
];

export function ArtifactReviewPreviewPage() {
  const [reviewNote, setReviewNote] = useState(
    '证据链完整；建议批准页面结构，但要求 styles 在视觉审阅后再标记 approved。',
  );
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includePaths, setIncludePaths] = useState(false);
  const [protectedOpen, setProtectedOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState('diff');

  return (
    <div className="prototype-page">
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
          <Button
            variant="danger"
            onClick={() => {
              setProtectedOpen(true);
            }}
          >
            删除产物
          </Button>
        </div>
      </section>

      <section className="artifact-review-layout">
        <div className="artifact-review-main">
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
              {relatedArtifacts.map((artifact) => {
                const sensitiveProps =
                  artifact.sensitive === undefined ? {} : { sensitive: artifact.sensitive };

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

          <section className="preview-section" aria-labelledby="provenance-heading">
            <div className="section-heading split-heading">
              <div>
                <div className="section-kicker">Provenance</div>
                <h2 id="provenance-heading">来源链</h2>
                <p>来源链优先展示 operator approval、写入动作、扫描提示和当前审阅状态。</p>
              </div>
              <StatusBadge label="trace complete" tone="success" />
            </div>
            <EvidenceTimeline items={provenanceItems} />
          </section>

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
                    setReviewTab('diff');
                  }}
                  value="diff"
                >
                  Diff 摘要
                </TabsTrigger>
                <TabsTrigger
                  onClick={() => {
                    setReviewTab('risk');
                  }}
                  value="risk"
                >
                  风险
                </TabsTrigger>
                <TabsTrigger
                  onClick={() => {
                    setReviewTab('decision');
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
                    <MetadataList
                      items={[
                        { label: 'Secret scan', value: 'no tokens detected' },
                        { label: 'Local path', value: 'relative path only in source card' },
                        { label: 'Network action', value: 'none' },
                        { label: 'Destructive action', value: 'delete requires approval' },
                      ]}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="decision">
                <Card>
                  <CardContent className="stack">
                    <InlineAlert tone="info">
                      推荐动作：批准页面结构，要求样式和文案在截图审阅后再标记最终 approved。
                    </InlineAlert>
                    <MetadataList
                      items={[
                        { label: 'Approve scope', value: 'artifact only' },
                        { label: 'Follow-up', value: 'visual QA' },
                        { label: 'Owner', value: 'UI branch maintainer' },
                      ]}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="artifact-review-side" aria-label="审阅操作侧栏">
          <ArtifactReviewPanel
            actions={[
              { label: '批准', tone: 'primary' },
              { label: '请求修改', tone: 'secondary' },
              {
                label: '拒绝',
                tone: 'danger',
                onClick: () => {
                  setProtectedOpen(true);
                },
              },
            ]}
            artifactId="artifact_run_detail_page"
            note={reviewNote}
            onNoteChange={setReviewNote}
            reviewState="pending_review"
            title="审阅决定"
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

          <Card>
            <CardHeader>
              <CardTitle>分享前检查</CardTitle>
            </CardHeader>
            <CardContent className="stack">
              <MetadataList
                items={[
                  { label: '绝对路径', value: includePaths ? 'included' : 'hidden by default' },
                  { label: '日志', value: includeLogs ? 'included, redacted' : 'excluded' },
                  { label: '凭据', value: 'never included' },
                  { label: '批准范围', value: 'one artifact decision' },
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
      </section>

      <ProtectedActionDialog
        actionKind="artifact_delete"
        impact="会从当前运行的产物列表移除该 artifact；源码文件不会在这个 prototype 中真实删除。"
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
        target="artifact_run_detail_page"
      />
    </div>
  );
}
