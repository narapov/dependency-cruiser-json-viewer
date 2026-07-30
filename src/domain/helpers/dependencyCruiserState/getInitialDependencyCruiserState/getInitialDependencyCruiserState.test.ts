import { describe, expect, it } from 'vitest';

import { getDefaultExpandedKeys } from '../getDefaultExpandedKeys';
import { getDefaultSelectedKeys } from '../getDefaultSelectedKeys';
import { getInitialDependencyCruiserState } from './getInitialDependencyCruiserState';

describe('getInitialDependencyCruiserState', () => {
  it('composes default selected and expanded keys', () => {
    const sources = ['src/foo/a.ts', 'src/bar/b.ts', 'lib/x.ts'];

    expect(getInitialDependencyCruiserState(sources)).toEqual({
      selectedKeys: getDefaultSelectedKeys(sources),
      expandedKeys: getDefaultExpandedKeys(sources),
    });
  });

  it('returns empty keys for empty sources', () => {
    expect(getInitialDependencyCruiserState([])).toEqual({
      selectedKeys: [],
      expandedKeys: [],
    });
  });
});
