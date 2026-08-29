import { describe, expect, it } from 'vitest';

import { parseDependencyKey } from './parseDependencyKey';

describe('parseDependencyKey', () => {
  it('splits source and target on the first arrow', () => {
    expect(parseDependencyKey('src/a.ts->src/b.ts')).toEqual({
      source: 'src/a.ts',
      target: 'src/b.ts',
    });
  });

  it('returns empty target when the separator is missing', () => {
    expect(parseDependencyKey('src/a.ts')).toEqual({
      source: 'src/a.ts',
      target: '',
    });
  });

  it('keeps content after the first arrow in the target', () => {
    expect(parseDependencyKey('a->b->c')).toEqual({
      source: 'a',
      target: 'b->c',
    });
  });
});
