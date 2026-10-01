import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { getDefaultExpandedKeys } from '../getDefaultExpandedKeys';
import { getDefaultSelectedKeys } from '../getDefaultSelectedKeys';
import { getInitialDependencyCruiserState } from './getInitialDependencyCruiserState';

function treeFrom(...sources: string[]) {
  return buildCruiseSnapshot(sources.map(source => ({ source, dependencies: [], dependents: [], valid: true })));
}

describe('getInitialDependencyCruiserState', () => {
  it('returns default selected and expanded keys for a cruise snapshot', () => {
    const cruiseSnapshot = treeFrom('src/foo/a.ts', 'lib/x.ts');
    expect(getInitialDependencyCruiserState(cruiseSnapshot)).toEqual({
      selectedKeys: getDefaultSelectedKeys(cruiseSnapshot),
      expandedKeys: getDefaultExpandedKeys(cruiseSnapshot),
    });
  });

  it('returns empty keys for an empty cruise snapshot', () => {
    const cruiseSnapshot = buildCruiseSnapshot([]);
    expect(getInitialDependencyCruiserState(cruiseSnapshot)).toEqual({
      selectedKeys: [],
      expandedKeys: [],
    });
  });
});
