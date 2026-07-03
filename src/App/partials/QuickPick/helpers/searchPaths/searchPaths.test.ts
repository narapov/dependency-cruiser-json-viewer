import { describe, expect, it } from 'vitest';

import type { QuickPickFileItem } from '../../types';
import { buildSearchItems } from './buildSearchItems';
import { getPathSearchTier, PathSearchTier, searchPaths } from './searchPaths';

const sources = ['src/components/App.tsx', 'src/components/Button.tsx', 'src/index.ts', 'package.json'];

const fuzzySources = ['src/TaskTracker/contexts/SearchTaskQueryKeyContext', 'src/components/App.tsx'];

describe('buildSearchItems', () => {
  it('returns all files and folders in tree order', () => {
    expect(buildSearchItems(sources).map(item => item.key)).toEqual([
      'src',
      'src/components',
      'src/components/App.tsx',
      'src/components/Button.tsx',
      'src/index.ts',
      'package.json',
    ]);
  });

  it('marks folders and files correctly', () => {
    const items = buildSearchItems(sources);
    expect(items.find(item => item.key === 'src/components')?.isFolder).toBe(true);
    expect(items.find(item => item.key === 'src/index.ts')?.isFolder).toBe(false);
  });
});

function searchItem(key: string, name = key.split('/').pop() ?? key): QuickPickFileItem {
  return {
    key,
    name,
    isFolder: false,
  };
}

describe('getPathSearchTier', () => {
  it('classifies root and monorepo src paths', () => {
    expect(getPathSearchTier('src/foo.ts')).toBe(PathSearchTier.Src);
    expect(getPathSearchTier('packages/app/src/main.ts')).toBe(PathSearchTier.Src);
  });

  it('classifies root and monorepo lib paths', () => {
    expect(getPathSearchTier('lib/bar.ts')).toBe(PathSearchTier.Lib);
    expect(getPathSearchTier('packages/shared/lib/util.ts')).toBe(PathSearchTier.Lib);
  });

  it('classifies root and nested node_modules paths', () => {
    expect(getPathSearchTier('node_modules/pkg/index.js')).toBe(PathSearchTier.NodeModules);
    expect(getPathSearchTier('packages/foo/node_modules/bar/index.js')).toBe(PathSearchTier.NodeModules);
  });

  it('does not treat lib-like names as lib tier', () => {
    expect(getPathSearchTier('my-lib/index.ts')).toBe(PathSearchTier.Other);
    expect(getPathSearchTier('package.json')).toBe(PathSearchTier.Other);
  });
});

describe('searchPaths', () => {
  const items = buildSearchItems(sources);

  it('returns no items for an empty query', () => {
    expect(searchPaths(items, '')).toEqual([]);
    expect(searchPaths(items, '   ')).toEqual([]);
  });

  it('filters by file name and path', () => {
    expect(searchPaths(items, 'app').map(item => item.key)).toEqual(['src/components/App.tsx']);
    expect(searchPaths(items, 'components').map(item => item.key)).toEqual([
      'src/components',
      'src/components/App.tsx',
      'src/components/Button.tsx',
    ]);
  });

  it('prioritizes exact and prefix name matches', () => {
    expect(searchPaths(items, 'index').map(item => item.key)).toEqual(['src/index.ts']);
  });

  it('is case-insensitive', () => {
    expect(searchPaths(items, 'BUTTON').map(item => item.key)).toEqual(['src/components/Button.tsx']);
  });

  it('matches scattered query characters across the full path', () => {
    const fuzzyItems = buildSearchItems(fuzzySources);

    expect(searchPaths(fuzzyItems, 'srconteSearque').map(item => item.key)).toContain(
      'src/TaskTracker/contexts/SearchTaskQueryKeyContext',
    );
  });

  it('matches subsequence characters in path segments', () => {
    const fuzzyItems = buildSearchItems(fuzzySources);

    expect(searchPaths(fuzzyItems, 'scm').map(item => item.key)).toContain('src/components');
  });

  it('does not match when query letters are out of order', () => {
    const fuzzyItems = buildSearchItems(fuzzySources);

    expect(searchPaths(fuzzyItems, 'rsc').map(item => item.key)).not.toContain('src');
  });

  it('ranks src above lib, other, and node_modules for similar matches', () => {
    const tierItems = [
      searchItem('node_modules/pkg/util.ts', 'util.ts'),
      searchItem('tools/util.ts', 'util.ts'),
      searchItem('lib/util.ts', 'util.ts'),
      searchItem('src/util.ts', 'util.ts'),
    ];

    expect(searchPaths(tierItems, 'util').map(item => item.key)).toEqual([
      'src/util.ts',
      'lib/util.ts',
      'tools/util.ts',
      'node_modules/pkg/util.ts',
    ]);
  });
});
