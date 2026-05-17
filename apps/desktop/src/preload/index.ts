// SPDX-License-Identifier: Apache-2.0
import { contextBridge } from 'electron';

export interface CairnDesktopBridge {
  readonly app: {
    readonly mode: 'static-preview';
    readonly name: 'Cairn Desktop';
  };
}

const bridge: CairnDesktopBridge = {
  app: {
    mode: 'static-preview',
    name: 'Cairn Desktop',
  },
};

contextBridge.exposeInMainWorld('cairnDesktop', bridge);
