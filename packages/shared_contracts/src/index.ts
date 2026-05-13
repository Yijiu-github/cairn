// SPDX-License-Identifier: Apache-2.0
/**
 * @cairn/shared-contracts —— 双端共享的契约层
 *
 * 顶层入口。除非追求 tree-shaking 极致，否则建议从这里导入：
 *
 *   import { OrchestrationRun, runContract, RunEvent } from '@cairn/shared-contracts';
 *
 * 若需 tree-shake，使用子路径导入：
 *
 *   import { ... } from '@cairn/shared-contracts/schemas';
 *   import { ... } from '@cairn/shared-contracts/contracts';
 *   import { ... } from '@cairn/shared-contracts/ws-events';
 */

export * from './schemas/index.js';
export * from './contracts/index.js';
export * from './ws-events/index.js';
