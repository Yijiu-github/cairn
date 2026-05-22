// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { validateMissionDraft } from './mission-draft.js';

describe('validateMissionDraft', () => {
  it('rejects blank drafts before dispatching the bounded trial', () => {
    expect(validateMissionDraft('   ')).toEqual({
      isValid: false,
      trimmedDraft: '',
    });
  });

  it('keeps the trimmed draft available for the future planner dispatch contract', () => {
    expect(validateMissionDraft('  修复 Desktop 首页体验  ')).toEqual({
      isValid: true,
      trimmedDraft: '修复 Desktop 首页体验',
    });
  });
});
