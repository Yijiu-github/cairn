import { useState } from 'react';

import { ProtectedActionDialog } from '@cairn/ui';

import { componentsGalleryViewModel } from '../preview-models/components-gallery-view-model';
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
    useState(componentsGalleryViewModel.protectedActions.initialMessage);
  const [composerEffect, setComposerEffect] =
    useState<InterventionEffect>(componentsGalleryViewModel.protectedActions.defaultEffect);
  const [protectedOpen, setProtectedOpen] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includePaths, setIncludePaths] = useState(false);
  const [reviewNote, setReviewNote] = useState(
    componentsGalleryViewModel.evidenceRuntime.review.initialNote,
  );

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
        actionKind={componentsGalleryViewModel.protectedActions.dialog.actionKind}
        impact={componentsGalleryViewModel.protectedActions.dialog.impact}
        onApprove={closeProtectedAction}
        onCancel={closeProtectedAction}
        onDeny={closeProtectedAction}
        open={protectedOpen}
        target={componentsGalleryViewModel.protectedActions.dialog.target}
      />

      <GalleryFooter />
    </>
  );
}
