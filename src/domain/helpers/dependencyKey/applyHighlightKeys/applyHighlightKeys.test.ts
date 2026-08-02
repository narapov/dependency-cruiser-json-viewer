import { describe, expect, it } from 'vitest';

import { applyHighlightKeys } from './applyHighlightKeys';

describe('applyHighlightKeys', () => {
  it('returns the previous map when keys are empty', () => {
    const prev = new Map([['a->b', '#ff0000']]);
    expect(applyHighlightKeys(prev, [], '#00ff00')).toBe(prev);
  });

  it('sets the color for each key', () => {
    const next = applyHighlightKeys(new Map(), ['a->b', 'c->d'], '#ff0000');
    expect([...next.entries()]).toEqual([
      ['a->b', '#ff0000'],
      ['c->d', '#ff0000'],
    ]);
  });

  it('overwrites existing colors without mutating the previous map', () => {
    const prev = new Map([
      ['a->b', '#ff0000'],
      ['c->d', '#00ff00'],
    ]);
    const next = applyHighlightKeys(prev, ['a->b'], '#0000ff');
    expect(next.get('a->b')).toBe('#0000ff');
    expect(next.get('c->d')).toBe('#00ff00');
    expect(prev.get('a->b')).toBe('#ff0000');
  });

  it('removes keys when color is null', () => {
    const prev = new Map([
      ['a->b', '#ff0000'],
      ['c->d', '#00ff00'],
    ]);
    const next = applyHighlightKeys(prev, ['a->b'], null);
    expect(next.has('a->b')).toBe(false);
    expect(next.get('c->d')).toBe('#00ff00');
  });
});
