import { describe, expect, it } from 'vitest';

import * as cairnComponents from './cairn';
import * as dataDisplay from './data-display';
import * as feedback from './feedback';
import * as primitives from './primitives';
import * as tokens from './tokens';
import { cn } from './utils/cn';

describe('@cairn/ui public surface', () => {
  it('merges utility class names with Tailwind conflict resolution', () => {
    expect(cn('px-2 text-sm', false, 'px-4')).toBe('text-sm px-4');
  });

  it('exports token groups used by shell applications', () => {
    expect(tokens.cairnRadii.panel).toBe('1.5rem');
    expect(tokens.cairnStatusTone.running).toBe('info');
  });

  it('keeps public barrels wired for primitives and product components', () => {
    expect(primitives.Button).toBeTypeOf('object');
    expect(feedback.StatusBadge).toBeTypeOf('function');
    expect(dataDisplay.MetadataList).toBeTypeOf('function');
    expect(cairnComponents.RunCard).toBeTypeOf('function');
  });
});
