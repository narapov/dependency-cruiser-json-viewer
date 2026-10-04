import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot/buildCruiseSnapshot';
import { collectFolderPathsToCollapse, collectFolderPathsToExpand } from './collectFolderPathsByLevel';

function snapshotFrom(sources: string[]) {
  return buildCruiseSnapshot(sources.map(source => ({ source, dependencies: [], dependents: [], valid: true })));
}

describe('collectFolderPathsToExpand', () => {
  const snapshot = snapshotFrom(['src/foo/bar/baz.ts', 'src/foo/file.ts', 'src/other.ts', 'lib/a.ts']);

  it('expands only the start folder at level 1', () => {
    const src = snapshot.nodes.get('src')!;
    expect(collectFolderPathsToExpand([src], 1).toSorted()).toEqual(['src']);
  });

  it('expands start and direct child folders at level 2', () => {
    const src = snapshot.nodes.get('src')!;
    expect(collectFolderPathsToExpand([src], 2).toSorted()).toEqual(['src', 'src/foo']);
  });

  it('expands entire subtree at Infinity', () => {
    const src = snapshot.nodes.get('src')!;
    expect(collectFolderPathsToExpand([src], Infinity).toSorted()).toEqual(['src', 'src/foo', 'src/foo/bar']);
  });

  it('supports multiple start folders', () => {
    const roots = snapshot.tree
      .values()
      .filter(n => n.isFolder)
      .toArray();
    expect(collectFolderPathsToExpand(roots, 1).toSorted()).toEqual(['lib', 'src']);
  });

  it('skips non-folder starts', () => {
    const file = snapshot.nodes.get('src/other.ts')!;
    expect(collectFolderPathsToExpand([file], 2)).toEqual([]);
  });
});

describe('collectFolderPathsToCollapse', () => {
  const snapshot = snapshotFrom(['src/foo/bar/baz.ts', 'src/foo/file.ts']);

  it('collapses descendants at level 1 and keeps the start', () => {
    const src = snapshot.nodes.get('src')!;
    expect(collectFolderPathsToCollapse([src], 1).toSorted()).toEqual(['src/foo', 'src/foo/bar']);
  });

  it('collapses only deeper folders at level 2', () => {
    const src = snapshot.nodes.get('src')!;
    expect(collectFolderPathsToCollapse([src], 2).toSorted()).toEqual(['src/foo/bar']);
  });

  it('returns nothing for Infinity (nothing has depth >= Infinity)', () => {
    const src = snapshot.nodes.get('src')!;
    expect(collectFolderPathsToCollapse([src], Infinity)).toEqual([]);
  });

  it('skips non-folder starts', () => {
    const file = snapshot.nodes.get('src/foo/file.ts')!;
    expect(collectFolderPathsToCollapse([file], 1)).toEqual([]);
  });
});
