// SPDX-License-Identifier: Apache-2.0
import type { CairnDesktopBridge } from '../../preload/bridge';

declare global {
  interface Window {
    readonly cairnDesktop?: CairnDesktopBridge;
  }
}

export {};
