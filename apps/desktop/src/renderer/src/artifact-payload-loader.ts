// SPDX-License-Identifier: Apache-2.0
import type { ArtifactPayloadResponse } from '@cairn/shared-contracts';

export interface ArtifactPayloadLoadState {
  current: number;
}

export interface ArtifactPayloadLoadDependencies {
  readonly getArtifactPayload: (artifactId: string) => Promise<ArtifactPayloadResponse>;
  readonly setArtifactPayloadError: (value: string | undefined) => void;
  readonly setArtifactPayloadLoadingId: (value: string | undefined) => void;
  readonly setArtifactPayloads: (
    update: (
      current: Readonly<Record<string, ArtifactPayloadResponse>>,
    ) => Readonly<Record<string, ArtifactPayloadResponse>>,
  ) => void;
  readonly toErrorMessage: (error: unknown) => string;
}

export async function loadArtifactPayload(
  requestState: ArtifactPayloadLoadState,
  dependencies: ArtifactPayloadLoadDependencies,
  artifactId: string,
): Promise<void> {
  const requestId = ++requestState.current;
  dependencies.setArtifactPayloadLoadingId(artifactId);
  dependencies.setArtifactPayloadError(undefined);

  try {
    const payload = await dependencies.getArtifactPayload(artifactId);
    if (requestState.current !== requestId) {
      return;
    }

    dependencies.setArtifactPayloads((current) => ({
      ...current,
      [payload.artifactId]: payload,
    }));
  } catch (error) {
    if (requestState.current !== requestId) {
      return;
    }

    dependencies.setArtifactPayloadError(dependencies.toErrorMessage(error));
  } finally {
    if (requestState.current === requestId) {
      dependencies.setArtifactPayloadLoadingId(undefined);
    }
  }
}
