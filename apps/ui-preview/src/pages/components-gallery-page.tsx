import { useState } from 'react';

import { ProtectedActionDialog } from '@cairn/ui';

import { defaultInterventionEffect } from '../demo-data';
import {
  GalleryEvidenceRuntimeSection,
  GalleryFeedbackSection,
  GalleryFooter,
  GalleryFoundationSection,
  GalleryHiddenDialog,
  GalleryProductComponentsSection,
  GalleryProtectedActionsSection,
} from '../preview-sections/components-gallery-sections';

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

  const openProtectedAction = () => {
    setProtectedOpen(true);
  };

  const closeProtectedAction = () => {
    setProtectedOpen(false);
  };

  return (
    <>
      <GalleryFoundationSection />
      <GalleryProductComponentsSection />
      <GalleryEvidenceRuntimeSection onReviewNoteChange={setReviewNote} reviewNote={reviewNote} />
      <GalleryProtectedActionsSection
        composerEffect={composerEffect}
        composerMessage={composerMessage}
        includeLogs={includeLogs}
        includePaths={includePaths}
        onComposerEffectChange={setComposerEffect}
        onComposerMessageChange={setComposerMessage}
        onIncludeLogsChange={setIncludeLogs}
        onIncludePathsChange={setIncludePaths}
        onProtectedAction={openProtectedAction}
      />
      <GalleryFeedbackSection />
      <GalleryHiddenDialog />

      <ProtectedActionDialog
        actionKind="file_write"
        impact="将更新 apps/ui-preview 下的本地预览代码。"
        onApprove={closeProtectedAction}
        onCancel={closeProtectedAction}
        onDeny={closeProtectedAction}
        open={protectedOpen}
        target="apps/ui-preview"
      />

      <GalleryFooter />
    </>
  );
}
