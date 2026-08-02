import { describe, expect, it } from 'vitest';

import { makeDependencyKey } from './makeDependencyKey';

describe('makeDependencyKey', () => {
  it('joins source and target with an arrow', () => {
    expect(makeDependencyKey('src/a.ts', 'src/b.ts')).toBe('src/a.ts->src/b.ts');
  });
});
