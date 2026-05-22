// SPDX-License-Identifier: Apache-2.0

export interface MissionDraftValidation {
  readonly isValid: boolean;
  readonly trimmedDraft: string;
}

/** Validates the local Mission Control draft before the bounded preview path runs. */
export function validateMissionDraft(draft: string): MissionDraftValidation {
  const trimmedDraft = draft.trim();

  return {
    isValid: trimmedDraft.length > 0,
    trimmedDraft,
  };
}
