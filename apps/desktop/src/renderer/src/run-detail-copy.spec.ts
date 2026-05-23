// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { ArtifactId } from '@cairn/shared-contracts';

import { getDesktopLocaleStrings } from './desktop-locale.js';
import {
  artifactEmptyCopy,
  formatArtifactCardSummary,
  formatArtifactCardTitle,
  formatArtifactPayloadStatus,
  metadataOnlyArtifactCopy,
  replayUnavailableCopy,
  taskTreeEmptyCopy,
} from './run-detail-copy.js';

describe('Run Detail copy helpers', () => {
  it('describes replay refresh as a read-only evidence fetch, not a rerun', () => {
    expect(replayUnavailableCopy({ loading: true, runId: '01J_RUN' })).toEqual({
      body: 'Reading sanitized replay evidence for 01J_RUN. This does not rerun the task or reveal local files.',
      description:
        'Desktop has an observed run id, but the read-only replay source has not been loaded yet.',
      title: 'Replay evidence not loaded',
    });
    expect(replayUnavailableCopy({ loading: false, runId: '01J_RUN' }).body).toBe(
      'Use Refresh Evidence to fetch the current replay source for 01J_RUN. Refresh is read-only and does not execute the run again.',
    );
  });

  it('explains empty tasks and artifacts as evidence absence without implying UI failure', () => {
    expect(taskTreeEmptyCopy.body).toBe(
      'Replay source loaded, but it does not contain task records for this run yet.',
    );
    expect(artifactEmptyCopy.body).toBe(
      'Replay source loaded with no artifact metadata. Trace events may still explain what happened.',
    );
  });

  it('labels metadata-only artifacts as intentionally bounded evidence', () => {
    expect(metadataOnlyArtifactCopy.body).toBe(
      'This artifact only exposes metadata in Run Detail. No bounded payload reference is available, and Desktop keeps storage paths hidden.',
    );
    expect(metadataOnlyArtifactCopy.verification).toBe('metadata only');
  });

  it('summarizes loaded artifact payloads without exposing media internals in zh-CN', () => {
    const copy = getDesktopLocaleStrings('zh-CN');

    expect(
      formatArtifactPayloadStatus(
        {
          artifactId: ArtifactId.parse('01J000000000000000000000F0'),
          mediaType: 'text/plain',
          text: 'bounded payload',
          truncated: false,
        },
        copy,
      ),
    ).toBe('负载已加载，本地路径仍隐藏。');
    expect(
      formatArtifactPayloadStatus(
        {
          artifactId: ArtifactId.parse('01J000000000000000000000F0'),
          mediaType: 'application/json',
          text: '{"ok":true}',
          truncated: true,
        },
        copy,
      ),
    ).toBe('负载已加载，本地路径仍隐藏；内容已截断。');
  });

  it('formats artifact cards as user-facing copy instead of raw replay fields', () => {
    const copy = getDesktopLocaleStrings('zh-CN');
    const artifact = {
      artifactRole: 'output',
      kind: 'text',
      sizeBytes: 42,
      visibility: 'operator_only',
    } as const;

    const title = formatArtifactCardTitle(artifact, copy);
    const summary = formatArtifactCardSummary(artifact, copy);

    expect(title).toBe('输出产物 · 文本');
    expect(summary).toBe('仅接管者可见 · 42 字节');
    expect(`${title} ${summary}`).not.toContain('output · text');
    expect(summary).not.toContain('kind text');
    expect(summary).not.toContain('visibility operator_only');
    expect(summary).not.toContain('visibility internal');
  });
});
