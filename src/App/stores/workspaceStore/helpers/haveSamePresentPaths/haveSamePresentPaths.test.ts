import { describe, expect, it } from 'vitest';

import { haveSamePresentPaths } from './haveSamePresentPaths';

describe('haveSamePresentPaths', () => {
  it('is true when true keys match regardless of false or omitted keys', () => {
    expect(haveSamePresentPaths({ src: true, a: false }, { src: true })).toBe(true);
    expect(haveSamePresentPaths({}, { x: false })).toBe(true);
  });

  it('is false when a present path is added', () => {
    expect(haveSamePresentPaths({ src: true }, { src: true, 'src/a': true })).toBe(false);
  });

  it('is false when a present path is removed', () => {
    expect(haveSamePresentPaths({ src: true, 'src/a': true }, { src: true, 'src/a': false })).toBe(false);
  });
});
