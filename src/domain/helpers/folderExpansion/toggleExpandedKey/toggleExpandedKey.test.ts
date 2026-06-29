import { describe, expect, it } from 'vitest';

import { toggleExpandedKey } from './toggleExpandedKey';

describe('toggleExpandedKey', () => {
  it('adds path when not expanded', () => {
    expect(toggleExpandedKey(['src'], 'src/foo')).toEqual(['src', 'src/foo']);
  });

  it('removes path when expanded', () => {
    expect(toggleExpandedKey(['src', 'src/foo'], 'src/foo')).toEqual(['src']);
  });
});
