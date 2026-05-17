import { useState } from 'react';

import { ArtifactReviewPreviewPage } from './pages/artifact-review-preview-page';
import { ComponentsGalleryPage } from './pages/components-gallery-page';
import { DesktopShellPreviewPage } from './pages/desktop-shell-preview-page';
import { HomeInboxPreviewPage } from './pages/home-inbox-preview-page';
import { RunDetailPreviewPage } from './pages/run-detail-preview-page';

export function UiPreviewApp() {
  const [page, setPage] = useState<
    'artifact-review' | 'components' | 'desktop-shell' | 'home-inbox' | 'run-detail'
  >('desktop-shell');

  return (
    <main className="preview-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Cairn UI Preview</p>
          <h1>Cairn UI 工作台原型</h1>
          <p className="hero-copy">
            覆盖 Desktop Shell、Home、Run Detail、Artifact Review
            与组件图库；用于统一信息架构、审阅路径和人工接管体验。
          </p>
        </div>
        <nav aria-label="预览页面" className="preview-nav">
          <button
            aria-pressed={page === 'desktop-shell'}
            className="preview-nav-item"
            onClick={() => {
              setPage('desktop-shell');
            }}
            type="button"
          >
            Desktop Shell
          </button>
          <button
            aria-pressed={page === 'home-inbox'}
            className="preview-nav-item"
            onClick={() => {
              setPage('home-inbox');
            }}
            type="button"
          >
            Home / Inbox
          </button>
          <button
            aria-pressed={page === 'run-detail'}
            className="preview-nav-item"
            onClick={() => {
              setPage('run-detail');
            }}
            type="button"
          >
            Run Detail
          </button>
          <button
            aria-pressed={page === 'artifact-review'}
            className="preview-nav-item"
            onClick={() => {
              setPage('artifact-review');
            }}
            type="button"
          >
            Artifact Review
          </button>
          <button
            aria-pressed={page === 'components'}
            className="preview-nav-item"
            onClick={() => {
              setPage('components');
            }}
            type="button"
          >
            Components Gallery
          </button>
        </nav>
      </header>

      {page === 'desktop-shell' ? <DesktopShellPreviewPage /> : undefined}
      {page === 'home-inbox' ? <HomeInboxPreviewPage /> : undefined}
      {page === 'run-detail' ? <RunDetailPreviewPage /> : undefined}
      {page === 'artifact-review' ? <ArtifactReviewPreviewPage /> : undefined}
      {page === 'components' ? <ComponentsGalleryPage /> : undefined}
    </main>
  );
}
