// SPDX-License-Identifier: Apache-2.0
import type { CairnDesktopBridge } from '../../preload';

declare global {
  interface Window {
    readonly cairnDesktop?: CairnDesktopBridge;
  }
}

export {};
