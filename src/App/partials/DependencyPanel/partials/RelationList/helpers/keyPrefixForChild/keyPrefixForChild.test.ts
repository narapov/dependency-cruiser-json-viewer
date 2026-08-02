import { describe, expect, it } from 'vitest';

import { keyPrefixForChild } from './keyPrefixForChild';

describe('keyPrefixForChild', () => {
  it('returns the child path for visible rows', () => {
    expect(keyPrefixForChild('src', 'src/foo')).toBe('src/foo');
  });

  it('keeps the hidden: prefix for nested hidden rows', () => {
    expect(keyPrefixForChild('hidden:src', 'src/foo')).toBe('hidden:src/foo');
  });
});
