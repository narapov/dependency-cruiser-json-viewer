import { describe, expect, it } from 'vitest';

import { groupHighlightsByColor } from './groupHighlightsByColor';

describe('groupHighlightsByColor', () => {
  it('returns an empty array for an empty map', () => {
    expect(groupHighlightsByColor(new Map())).toEqual([]);
  });

  it('groups keys by color with sorted keys inside each group', () => {
    const highlights = new Map([
      ['c->d', '#ff0000'],
      ['a->b', '#00ff00'],
      ['e->f', '#ff0000'],
      ['g->h', '#00ff00'],
    ]);

    expect(groupHighlightsByColor(highlights)).toEqual([
      { color: '#00ff00', keys: ['a->b', 'g->h'] },
      { color: '#ff0000', keys: ['c->d', 'e->f'] },
    ]);
  });

  it('orders groups by first appearance of color among sorted keys', () => {
    const highlights = new Map([
      ['z->a', '#aaaaaa'],
      ['a->b', '#bbbbbb'],
      ['m->n', '#aaaaaa'],
    ]);

    expect(groupHighlightsByColor(highlights)).toEqual([
      { color: '#bbbbbb', keys: ['a->b'] },
      { color: '#aaaaaa', keys: ['m->n', 'z->a'] },
    ]);
  });
});
