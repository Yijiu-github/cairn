import { describe, expect, it } from 'vitest';

import { artifactReviewViewModel } from './artifact-review-view-model';

describe('artifactReviewViewModel', () => {
  it('describes the artifact review page with the matching page title', () => {
    expect(artifactReviewViewModel.hero.title).toBe('Artifact Review preview page');
  });
});
