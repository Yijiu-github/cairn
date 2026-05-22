import { describe, expect, it } from 'vitest';

import { artifactReviewViewModel } from './artifact-review-view-model';
import { runDetailViewModel } from './run-detail-view-model';

describe('runDetailViewModel', () => {
  it('describes the run detail page artifact with the matching prototype title', () => {
    expect(runDetailViewModel.run.artifacts[0]?.title).toBe('Run Detail 页面 prototype');
  });
});

describe('artifactReviewViewModel', () => {
  it('describes the related run detail artifact with the matching prototype title', () => {
    expect(artifactReviewViewModel.relatedArtifacts[0]?.title).toBe('Run Detail 页面 prototype');
  });
});
