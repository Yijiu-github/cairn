// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  artifactEmptyCopy,
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
});
