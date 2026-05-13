// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  Iso8601,
  StructuredError,
  PaginationQuery,
  Paginated,
  Visibility,
  ActorRole,
  ResultCompleteness,
  ErrorLayer,
  BudgetHint,
} from './common.js';
import { z } from 'zod';

describe('Iso8601', () => {
  it('accepts an ISO 8601 string with explicit offset', () => {
    expect(Iso8601.safeParse('2026-05-14T01:39:20.123Z').success).toBe(true);
    expect(Iso8601.safeParse('2026-05-14T01:39:20+08:00').success).toBe(true);
  });

  it('rejects unix millis / numbers / loose formats', () => {
    expect(Iso8601.safeParse(1715640000000).success).toBe(false);
    expect(Iso8601.safeParse('2026-05-14').success).toBe(false);
    expect(Iso8601.safeParse('2026/05/14 01:39:20').success).toBe(false);
  });
});

describe('StructuredError', () => {
  it('requires layer / code / message / retryable', () => {
    const valid = StructuredError.safeParse({
      layer: 'execution',
      code: 'AUTH_INVALID',
      message: 'auth token expired',
      retryable: false,
    });
    expect(valid.success).toBe(true);
  });

  it('rejects when layer is outside the enum', () => {
    expect(
      StructuredError.safeParse({
        layer: 'planet', // not a valid ErrorLayer
        code: 'X',
        message: 'y',
        retryable: false,
      }).success,
    ).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(StructuredError.safeParse({ code: 'X', message: 'y' }).success).toBe(false);
  });
});

describe('PaginationQuery', () => {
  it('defaults limit to 50', () => {
    const parsed = PaginationQuery.parse({});
    expect(parsed.limit).toBe(50);
    expect(parsed.cursor).toBeUndefined();
  });

  it('rejects limit outside [1, 200]', () => {
    expect(PaginationQuery.safeParse({ limit: 0 }).success).toBe(false);
    expect(PaginationQuery.safeParse({ limit: 201 }).success).toBe(false);
    expect(PaginationQuery.safeParse({ limit: -1 }).success).toBe(false);
  });

  it('accepts cursor as string', () => {
    const parsed = PaginationQuery.parse({ cursor: 'abc' });
    expect(parsed.cursor).toBe('abc');
  });
});

describe('Paginated(item)', () => {
  it('produces a schema with items + nextCursor + total', () => {
    const PaginatedString = Paginated(z.string());
    const parsed = PaginatedString.parse({
      items: ['a', 'b', 'c'],
      nextCursor: 'cursor-1',
      total: 3,
    });
    expect(parsed.items).toEqual(['a', 'b', 'c']);
    expect(parsed.nextCursor).toBe('cursor-1');
    expect(parsed.total).toBe(3);
  });

  it('requires items but treats nextCursor/total as optional', () => {
    const PaginatedNumber = Paginated(z.number());
    expect(PaginatedNumber.safeParse({ items: [1, 2] }).success).toBe(true);
    expect(PaginatedNumber.safeParse({}).success).toBe(false);
  });
});

describe('Enums sanity', () => {
  it.each([
    ['Visibility.public', Visibility, 'public'],
    ['ActorRole.operator', ActorRole, 'operator'],
    ['ResultCompleteness.partial', ResultCompleteness, 'partial'],
    ['ErrorLayer.task', ErrorLayer, 'task'],
  ])('%s parses', (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it('Visibility rejects garbage', () => {
    expect(Visibility.safeParse('private').success).toBe(false);
  });
});

describe('BudgetHint', () => {
  it('accepts a partial budget hint', () => {
    expect(BudgetHint.safeParse({ maxTokens: 100 }).success).toBe(true);
    expect(BudgetHint.safeParse({ maxSeconds: 60 }).success).toBe(true);
    expect(BudgetHint.safeParse({}).success).toBe(true);
  });

  it('rejects negative values', () => {
    expect(BudgetHint.safeParse({ maxTokens: 0 }).success).toBe(false);
    expect(BudgetHint.safeParse({ maxSeconds: -1 }).success).toBe(false);
    expect(BudgetHint.safeParse({ maxCostUsd: -0.1 }).success).toBe(false);
  });
});
