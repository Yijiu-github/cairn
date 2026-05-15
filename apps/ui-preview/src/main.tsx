import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { UiPreviewApp } from './ui-preview-app';
import './styles.css';

const rootElement = document.querySelector('#root');

if (rootElement === null) {
  throw new Error('UI preview root element not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <UiPreviewApp />
  </StrictMode>,
);
