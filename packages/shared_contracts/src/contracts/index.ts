// SPDX-License-Identifier: Apache-2.0
/**
 * Contracts barrel — 重新导出全部 ts-rest contract，并提供合并后的 root contract。
 */

import { initContract } from '@ts-rest/core';

import { contextContract } from './context.contract.js';
import { operatorContract } from './operator.contract.js';
import { runContract } from './run.contract.js';
import { workspaceContract } from './workspace.contract.js';

export { ApiError, commonErrorResponses, API_V1 } from './_common.js';

export { workspaceContract } from './workspace.contract.js';
export { contextContract } from './context.contract.js';
export { runContract, StartRunBody } from './run.contract.js';
export type { StartRunBody as StartRunBodyType } from './run.contract.js';
export { operatorContract } from './operator.contract.js';

const c = initContract();

/**
 * 顶层合并 contract。HTTP server / client 可以引用此处而不是子 contract。
 *
 * 用法（client）：
 *   import { initClient } from '@ts-rest/core';
 *   import { rootContract } from '@cairn/shared-contracts/contracts';
 *   const api = initClient(rootContract, { baseUrl: '...', baseHeaders: {} });
 *   const list = await api.workspace.list({});
 *   const run = await api.run.getRun({ params: { runId: '...' } });
 */
export const rootContract = c.router({
  workspace: workspaceContract,
  context: contextContract,
  run: runContract,
  operator: operatorContract,
});
