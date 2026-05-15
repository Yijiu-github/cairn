import { useState } from 'react';

import { ComponentsGalleryPage } from './pages/components-gallery-page';
import { HomeInboxPreviewPage } from './pages/home-inbox-preview-page';

export function UiPreviewApp() {
  const [page, setPage] = useState<'components' | 'home-inbox'>('home-inbox');

  return (
    <main className="preview-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Cairn UI Preview</p>
          <h1>本地优先的多 Agent 协作工作台原型</h1>
          <p className="hero-copy">
            集中检查组件状态、页面信息架构、证据链表达和人工接管入口。不接 backend，只使用静态 demo
            数据。
          </p>
        </div>
        <nav aria-label="预览页面" className="preview-nav">
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

      {page === 'home-inbox' ? <HomeInboxPreviewPage /> : <ComponentsGalleryPage />}
    </main>
  );
}
