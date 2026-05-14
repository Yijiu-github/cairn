// SPDX-License-Identifier: Apache-2.0

import type { ArtifactDescriptor } from '@cairn/runtime-gateway';
import type {
  AgentRunId,
  OrchestrationRunId,
  TaskId,
  WorkspaceId,
} from '@cairn/shared-contracts/schemas';

export interface RegisterRuntimeArtifactInput {
  workspaceId: WorkspaceId;
  orchestrationRunId: OrchestrationRunId;
  taskId: TaskId;
  runId: AgentRunId;
  artifact: ArtifactDescriptor;
}

export interface ArtifactStorePort {
  registerRuntimeArtifact(input: RegisterRuntimeArtifactInput): Promise<void>;
}
