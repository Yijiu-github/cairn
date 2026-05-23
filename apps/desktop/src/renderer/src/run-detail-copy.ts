// SPDX-License-Identifier: Apache-2.0
import type { DesktopLocaleStrings } from './desktop-locale.js';
import type { ArtifactPayloadResponse } from '@cairn/shared-contracts';
import type { RunReplaySource } from '@cairn/shared-contracts';

export interface EmptyStateCopy {
  readonly body: string;
  readonly title: string;
}

export interface ReplayUnavailableCopy extends EmptyStateCopy {
  readonly description: string;
}

export interface MetadataOnlyArtifactCopy {
  readonly body: string;
  readonly verification: string;
}

export const taskTreeEmptyCopy: EmptyStateCopy = {
  body: 'Replay source loaded, but it does not contain task records for this run yet.',
  title: 'No task records in replay source',
};

export const artifactEmptyCopy: EmptyStateCopy = {
  body: 'Replay source loaded with no artifact metadata. Trace events may still explain what happened.',
  title: 'No artifact metadata recorded',
};

export const metadataOnlyArtifactCopy: MetadataOnlyArtifactCopy = {
  body: 'This artifact only exposes metadata in Run Detail. No bounded payload reference is available, and Desktop keeps storage paths hidden.',
  verification: 'metadata only',
};

type ArtifactCardSource = Pick<
  RunReplaySource['artifacts'][number],
  'artifactRole' | 'kind' | 'sizeBytes' | 'visibility'
>;

export function formatArtifactCardTitle(
  artifact: ArtifactCardSource,
  copy: DesktopLocaleStrings,
): string {
  return `${toArtifactRoleLabel(artifact.artifactRole, copy)} · ${toArtifactKindLabel(
    artifact.kind,
    copy,
  )}`;
}

export function formatArtifactCardSummary(
  artifact: ArtifactCardSource,
  copy: DesktopLocaleStrings,
): string {
  return [
    toArtifactVisibilityLabel(artifact.visibility, copy),
    artifact.sizeBytes === undefined
      ? undefined
      : `${artifact.sizeBytes.toString()} ${copy.artifactCardSizeBytesLabel}`,
  ]
    .filter((value): value is string => value !== undefined)
    .join(' · ');
}

export function formatArtifactPayloadStatus(
  payload: ArtifactPayloadResponse,
  copy: DesktopLocaleStrings,
): string {
  return payload.truncated ? copy.artifactPayloadTruncatedLabel : copy.artifactPayloadLoadedLabel;
}

export function replayUnavailableCopy({
  loading,
  runId,
}: {
  readonly loading: boolean;
  readonly runId: string;
}): ReplayUnavailableCopy {
  return {
    body: loading
      ? `Reading sanitized replay evidence for ${runId}. This does not rerun the task or reveal local files.`
      : `Use Refresh Evidence to fetch the current replay source for ${runId}. Refresh is read-only and does not execute the run again.`,
    description:
      'Desktop has an observed run id, but the read-only replay source has not been loaded yet.',
    title: 'Replay evidence not loaded',
  };
}

function toArtifactRoleLabel(
  role: ArtifactCardSource['artifactRole'],
  copy: DesktopLocaleStrings,
): string {
  if (role === 'input') {
    return copy.artifactCardInputRoleLabel;
  }

  if (role === 'intermediate') {
    return copy.artifactCardIntermediateRoleLabel;
  }

  if (role === 'output') {
    return copy.artifactCardOutputRoleLabel;
  }

  if (role === 'summary') {
    return copy.artifactCardSummaryRoleLabel;
  }

  return copy.artifactCardTraceRoleLabel;
}

function toArtifactKindLabel(kind: ArtifactCardSource['kind'], copy: DesktopLocaleStrings): string {
  if (kind === 'text') {
    return copy.artifactCardTextKindLabel;
  }

  if (kind === 'patch') {
    return copy.artifactCardPatchKindLabel;
  }

  if (kind === 'log') {
    return copy.artifactCardLogKindLabel;
  }

  if (kind === 'file_snapshot') {
    return copy.artifactCardSnapshotKindLabel;
  }

  if (kind === 'json') {
    return copy.artifactCardJsonKindLabel;
  }

  return copy.artifactCardBinaryKindLabel;
}

function toArtifactVisibilityLabel(
  visibility: ArtifactCardSource['visibility'],
  copy: DesktopLocaleStrings,
): string {
  if (visibility === 'public') {
    return copy.artifactCardVisibilityPublicLabel;
  }

  return copy.artifactCardVisibilityOperatorOnlyLabel;
}
