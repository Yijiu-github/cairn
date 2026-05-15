import { useState } from 'react';

import { ProtectedActionDialog } from '@cairn/ui';

import {
  RunArtifactsSection,
  RunDetailHeroSection,
  RunDetailSidebar,
  RunEvidenceSection,
  RunTaskTreeSection,
} from '../preview-sections/run-detail-sections';

import type { InterventionEffect } from '@cairn/ui';

export function RunDetailPreviewPage() {
  const [composerMessage, setComposerMessage] =
    useState('请优先确认任务树里的阻塞项，然后再生成截图。');
  const [composerEffect, setComposerEffect] = useState<InterventionEffect>('immediate');
  const [protectedOpen, setProtectedOpen] = useState(false);

  const openProtectedAction = () => {
    setProtectedOpen(true);
  };

  const closeProtectedAction = () => {
    setProtectedOpen(false);
  };

  return (
    <div className="prototype-page">
      <RunDetailHeroSection onProtectedAction={openProtectedAction} />

      <section className="run-detail-layout">
        <div className="run-detail-main">
          <RunTaskTreeSection />
          <RunEvidenceSection />
          <RunArtifactsSection />
        </div>

        <RunDetailSidebar
          composerEffect={composerEffect}
          composerMessage={composerMessage}
          onComposerEffectChange={setComposerEffect}
          onComposerMessageChange={setComposerMessage}
          onProtectedAction={openProtectedAction}
        />
      </section>

      <ProtectedActionDialog
        actionKind="other"
        impact="会停止当前运行，但保留已生成的预览文件和证据链记录。"
        onApprove={closeProtectedAction}
        onCancel={closeProtectedAction}
        onDeny={closeProtectedAction}
        open={protectedOpen}
        target="run_01JDEMOHOME0000000000001"
      />
    </div>
  );
}
