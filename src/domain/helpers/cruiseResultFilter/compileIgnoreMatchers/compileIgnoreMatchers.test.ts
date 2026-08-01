import { describe, expect, it } from 'vitest';

import { compileIgnoreMatchers } from './compileIgnoreMatchers';

describe('compileIgnoreMatchers', () => {
  it('returns matchers for valid patterns', () => {
    const [matcher] = compileIgnoreMatchers(['**/*.test.ts']);

    expect(matcher?.('src/foo/bar.test.ts')).toBe(true);
    expect(matcher?.('src/foo/bar.ts')).toBe(false);
  });

  it('skips empty and whitespace patterns', () => {
    expect(compileIgnoreMatchers(['', '   ', '**/*.ts'])).toHaveLength(1);
  });

  it('keeps patterns that compile without throwing', () => {
    const [matcher] = compileIgnoreMatchers(['[']);

    expect(matcher?.('src/foo/bar.ts')).toBe(false);
  });
});
