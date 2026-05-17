// SPDX-License-Identifier: Apache-2.0
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DesktopApp } from './desktop-app';
import './styles.css';

const rootElement = document.querySelector('#root');

if (rootElement === null) {
  throw new Error('Cairn desktop root element not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <DesktopApp />
  </StrictMode>,
);
