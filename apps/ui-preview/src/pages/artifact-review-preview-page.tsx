import { useState } from 'react';

import { ProtectedActionDialog } from '@cairn/ui';

import {
  ArtifactOverviewSection,
  ArtifactProvenanceSection,
  ArtifactReviewContextSection,
  ArtifactReviewHeroSection,
  ArtifactReviewSidebar,
} from '../preview-sections/artifact-review-sections';

export function ArtifactReviewPreviewPage() {
  const [reviewNote, setReviewNote] = useState(
    '证据链完整；建议批准页面结构，但要求 styles 在视觉审阅后再标记 approved。',
  );
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includePaths, setIncludePaths] = useState(false);
  const [protectedOpen, setProtectedOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState('diff');

  const openProtectedAction = () => {
    setProtectedOpen(true);
  };

  const closeProtectedAction = () => {
    setProtectedOpen(false);
  };

  return (
    <div className="prototype-page">
      <ArtifactReviewHeroSection onProtectedAction={openProtectedAction} />

      <section className="artifact-review-layout">
        <div className="artifact-review-main">
          <ArtifactOverviewSection />
          <ArtifactProvenanceSection />
          <ArtifactReviewContextSection onReviewTabChange={setReviewTab} reviewTab={reviewTab} />
        </div>

        <ArtifactReviewSidebar
          includeLogs={includeLogs}
          includePaths={includePaths}
          onIncludeLogsChange={setIncludeLogs}
          onIncludePathsChange={setIncludePaths}
          onProtectedAction={openProtectedAction}
          onReviewNoteChange={setReviewNote}
          reviewNote={reviewNote}
        />
      </section>

      <ProtectedActionDialog
        actionKind="artifact_delete"
        impact="会从当前运行的产物列表移除该 artifact；源码文件不会在这个 prototype 中真实删除。"
        onApprove={closeProtectedAction}
        onCancel={closeProtectedAction}
        onDeny={closeProtectedAction}
        open={protectedOpen}
        target="artifact_run_detail_page"
      />
    </div>
  );
}
