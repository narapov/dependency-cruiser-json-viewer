import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { getDefaultExpandedKeys } from './getDefaultExpandedKeys';

function treeFrom(...sources: string[]) {
  return buildCruiseSnapshot(sources.map(source => ({ source, dependencies: [], dependents: [], valid: true })));
}

describe('getDefaultExpandedKeys', () => {
  it('expands src when present as a folder', () => {
    expect(getDefaultExpandedKeys(treeFrom('src/foo/a.ts'))).toEqual(['src']);
  });

  it('returns empty when src is absent', () => {
    expect(getDefaultExpandedKeys(treeFrom('lib/foo.ts'))).toEqual([]);
  });
});
