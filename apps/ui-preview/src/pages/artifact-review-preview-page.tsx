import { useState } from 'react';

import { ProtectedActionDialog } from '@cairn/ui';

import { artifactReviewViewModel } from '../preview-models/artifact-review-view-model';
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
        actionKind={artifactReviewViewModel.protectedAction.actionKind}
        impact={artifactReviewViewModel.protectedAction.impact}
        onApprove={closeProtectedAction}
        onCancel={closeProtectedAction}
        onDeny={closeProtectedAction}
        open={protectedOpen}
        target={artifactReviewViewModel.protectedAction.target}
      />
    </div>
  );
}
