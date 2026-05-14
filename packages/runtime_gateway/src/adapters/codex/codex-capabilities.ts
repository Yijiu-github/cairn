// SPDX-License-Identifier: Apache-2.0
/**
 * Codex CLI adapter capability profile.
 *
 * S5 本机验证只确认了 `codex exec --json` 的 stdout JSONL 协议。
 * 工具调用、取消和模型清单仍要等真实 adapter 接入时扩展测试。
 */

import type { CapabilityProfile } from '../../runtime-adapter.js';

export const CODEX_ADAPTER_ID = 'codex';

export const codexCapabilities: CapabilityProfile = {
  streaming: true,
  cancellable: true,
  toolCalling: true,
  midStreamInjection: false,
  idempotent: false,
  supportedArtifactKinds: ['text', 'patch', 'log'],
  models: [],
};
