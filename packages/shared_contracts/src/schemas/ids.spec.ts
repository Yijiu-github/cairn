// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { VALID_ULIDS, INVALID_ULIDS } from '../__fixtures__/valid-ulids.js';

import { WorkspaceId, TaskId, OrchestrationRunId, TraceId } from './ids.js';

describe('ULID-branded ID schemas', () => {
  describe('WorkspaceId', () => {
    it('accepts a valid 26-char Crockford ULID', () => {
      const result = WorkspaceId.safeParse(VALID_ULIDS.workspace);
      expect(result.success).toBe(true);
    });

    it('rejects strings containing forbidden chars (I/L/O/U)', () => {
      for (const bad of [
        INVALID_ULIDS.containsI,
        INVALID_ULIDS.containsL,
        INVALID_ULIDS.containsO,
        INVALID_ULIDS.containsU,
      ]) {
        expect(WorkspaceId.safeParse(bad).success).toBe(false);
      }
    });

    it('rejects too-short or too-long strings', () => {
      expect(WorkspaceId.safeParse(INVALID_ULIDS.tooShort).success).toBe(false);
      expect(WorkspaceId.safeParse(INVALID_ULIDS.tooLong).success).toBe(false);
    });

    it('rejects lowercase strings', () => {
      expect(WorkspaceId.safeParse(INVALID_ULIDS.lowercase).success).toBe(false);
    });

    it('rejects empty string and non-string values', () => {
      expect(WorkspaceId.safeParse('').success).toBe(false);
      expect(WorkspaceId.safeParse(null).success).toBe(false);
      expect(WorkspaceId.safeParse(123).success).toBe(false);
      expect(WorkspaceId.safeParse(undefined).success).toBe(false);
    });
  });

  describe('Different ID schemas are runtime-equivalent for valid input', () => {
    it.each([
      ['TaskId', TaskId, VALID_ULIDS.task],
      ['OrchestrationRunId', OrchestrationRunId, VALID_ULIDS.orchestrationRun],
      ['TraceId', TraceId, VALID_ULIDS.traceId],
    ])('%s accepts its fixture', (_name, schema, fixture) => {
      expect(schema.safeParse(fixture).success).toBe(true);
    });
  });

  describe('Brand is type-level only (runtime is plain string)', () => {
    it('parsed value is still a string', () => {
      const parsed = WorkspaceId.parse(VALID_ULIDS.workspace);
      expect(typeof parsed).toBe('string');
      expect(parsed).toBe(VALID_ULIDS.workspace);
    });
  });
});
