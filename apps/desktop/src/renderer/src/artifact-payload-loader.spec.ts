// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from 'vitest';

import { ArtifactId } from '@cairn/shared-contracts';

import { loadArtifactPayload } from './artifact-payload-loader.js';

import type { ArtifactPayloadResponse } from '@cairn/shared-contracts';

describe('loadArtifactPayload', () => {
  it('keeps the latest payload request in control when requests resolve out of order', async () => {
    const requestState = { current: 0 };
    let resolveFirst: ((value: ArtifactPayloadResponse) => void) | undefined;
    let resolveSecond: ((value: ArtifactPayloadResponse) => void) | undefined;
    const setArtifactPayloadError = vi.fn();
    const setArtifactPayloadLoadingId = vi.fn();
    const setArtifactPayloads = vi.fn();

    const firstLoad = loadArtifactPayload(
      requestState,
      {
        getArtifactPayload: vi.fn(
          () =>
            new Promise<ArtifactPayloadResponse>((resolve) => {
              resolveFirst = resolve;
            }),
        ),
        setArtifactPayloadError,
        setArtifactPayloadLoadingId,
        setArtifactPayloads,
        toErrorMessage,
      },
      '01J000000000000000000000F0',
    );

    const secondLoad = loadArtifactPayload(
      requestState,
      {
        getArtifactPayload: vi.fn(
          () =>
            new Promise<ArtifactPayloadResponse>((resolve) => {
              resolveSecond = resolve;
            }),
        ),
        setArtifactPayloadError,
        setArtifactPayloadLoadingId,
        setArtifactPayloads,
        toErrorMessage,
      },
      '01J000000000000000000000F1',
    );

    resolveFirst?.(createPayload('01J000000000000000000000F0', 'first payload'));
    await firstLoad;

    expect(setArtifactPayloads).not.toHaveBeenCalled();
    expect(setArtifactPayloadLoadingId.mock.calls).toEqual([
      ['01J000000000000000000000F0'],
      ['01J000000000000000000000F1'],
    ]);

    resolveSecond?.(createPayload('01J000000000000000000000F1', 'second payload'));
    await secondLoad;

    expect(setArtifactPayloads).toHaveBeenCalledTimes(1);
    expect(setArtifactPayloadLoadingId.mock.calls).toEqual([
      ['01J000000000000000000000F0'],
      ['01J000000000000000000000F1'],
      [undefined],
    ]);
    expect(setArtifactPayloadError).toHaveBeenCalledTimes(2);
    expect(setArtifactPayloadError).toHaveBeenNthCalledWith(1, undefined);
    expect(setArtifactPayloadError).toHaveBeenNthCalledWith(2, undefined);
  });

  it('ignores stale payload errors after a newer request starts', async () => {
    const requestState = { current: 0 };
    let rejectFirst: ((error: Error) => void) | undefined;
    const setArtifactPayloadError = vi.fn();

    const firstLoad = loadArtifactPayload(
      requestState,
      {
        getArtifactPayload: vi.fn(
          () =>
            new Promise<ArtifactPayloadResponse>((_, reject) => {
              rejectFirst = reject;
            }),
        ),
        setArtifactPayloadError,
        setArtifactPayloadLoadingId: vi.fn(),
        setArtifactPayloads: vi.fn(),
        toErrorMessage,
      },
      '01J000000000000000000000F0',
    );

    await loadArtifactPayload(
      requestState,
      {
        getArtifactPayload: vi.fn(() =>
          Promise.resolve(createPayload('01J000000000000000000000F1', 'second payload')),
        ),
        setArtifactPayloadError,
        setArtifactPayloadLoadingId: vi.fn(),
        setArtifactPayloads: vi.fn(),
        toErrorMessage,
      },
      '01J000000000000000000000F1',
    );

    rejectFirst?.(new Error('stale payload failed'));
    await firstLoad;

    expect(setArtifactPayloadError).toHaveBeenCalledTimes(2);
    expect(setArtifactPayloadError).toHaveBeenNthCalledWith(1, undefined);
    expect(setArtifactPayloadError).toHaveBeenNthCalledWith(2, undefined);
    expect(setArtifactPayloadError).not.toHaveBeenCalledWith('stale payload failed');
  });
});

function createPayload(artifactId: string, text: string): ArtifactPayloadResponse {
  return {
    artifactId: ArtifactId.parse(artifactId),
    mediaType: 'text/plain',
    text,
    truncated: false,
  };
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown desktop bridge error.';
}
