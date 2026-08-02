import { describe, expect, it } from 'vitest';

import { getEdgeHighlightColor } from './getEdgeHighlightColor';

describe('getEdgeHighlightColor', () => {
  it('returns undefined for empty keys', () => {
    expect(getEdgeHighlightColor([], new Map([['a->b', '#ff0000']]))).toBeUndefined();
  });

  it('returns undefined when no keys are highlighted', () => {
    expect(getEdgeHighlightColor(['a->b'], new Map())).toBeUndefined();
  });

  it('returns the shared color when all keys agree', () => {
    const map = new Map([
      ['a->b', '#ff0000'],
      ['c->d', '#ff0000'],
    ]);
    expect(getEdgeHighlightColor(['a->b', 'c->d'], map)).toBe('#ff0000');
  });

  it('returns undefined when colors are mixed', () => {
    const map = new Map([
      ['a->b', '#ff0000'],
      ['c->d', '#00ff00'],
    ]);
    expect(getEdgeHighlightColor(['a->b', 'c->d'], map)).toBeUndefined();
  });
});
