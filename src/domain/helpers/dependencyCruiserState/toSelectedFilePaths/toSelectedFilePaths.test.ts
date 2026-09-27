import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { toSelectedFilePaths } from './toSelectedFilePaths';

function treeFrom(...sources: string[]) {
  return buildCruiseSnapshot(sources.map(source => ({ source, dependencies: [], dependents: [], valid: true })));
}

describe('toSelectedFilePaths', () => {
  const cruiseSnapshot = treeFrom('src/a.ts', 'src/foo/b.ts', 'src/foo/c.ts', 'lib/x.ts');

  it('keeps file paths as-is', () => {
    expect(toSelectedFilePaths(['src/foo/b.ts', 'lib/x.ts'], cruiseSnapshot)).toEqual(['src/foo/b.ts', 'lib/x.ts']);
  });

  it('expands a folder to its descendantFiles', () => {
    expect(toSelectedFilePaths(['src/foo'], cruiseSnapshot).sort()).toEqual(['src/foo/b.ts', 'src/foo/c.ts']);
  });

  it('expands nested folders without duplicating files', () => {
    expect(toSelectedFilePaths(['src', 'src/foo', 'src/a.ts'], cruiseSnapshot).sort()).toEqual([
      'src/a.ts',
      'src/foo/b.ts',
      'src/foo/c.ts',
    ]);
  });

  it('ignores unknown paths', () => {
    expect(toSelectedFilePaths(['gone.ts', 'src/a.ts'], cruiseSnapshot)).toEqual(['src/a.ts']);
  });

  it('returns empty for an empty path list', () => {
    expect(toSelectedFilePaths([], cruiseSnapshot)).toEqual([]);
  });
});
