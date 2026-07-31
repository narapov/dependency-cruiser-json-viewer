import { describe, expect, it } from 'vitest';

import type { TreeNodeData } from '../../types';
import { buildTreeIndex, getAllFolderKeys, getAllKeys } from './treeIndex';

const sampleTree: TreeNodeData[] = [
  {
    key: 'src',
    title: 'src',
    children: [
      {
        key: 'src/App',
        title: 'App',
        children: [{ key: 'src/App/App.tsx', title: 'App.tsx' }],
      },
      { key: 'src/main.tsx', title: 'main.tsx' },
    ],
  },
  { key: 'sample.ts', title: 'sample.ts' },
];

describe('buildTreeIndex', () => {
  it('returns an empty map for an empty tree', () => {
    expect(buildTreeIndex([])).toEqual({ descendantsByKey: new Map() });
  });

  it('maps each key to all descendant keys beneath it', () => {
    const { descendantsByKey } = buildTreeIndex(sampleTree);

    expect(descendantsByKey.get('src')).toEqual(['src/App', 'src/App/App.tsx', 'src/main.tsx']);
    expect(descendantsByKey.get('src/App')).toEqual(['src/App/App.tsx']);
    expect(descendantsByKey.get('src/App/App.tsx')).toEqual([]);
    expect(descendantsByKey.get('src/main.tsx')).toEqual([]);
    expect(descendantsByKey.get('sample.ts')).toEqual([]);
  });
});

describe('getAllKeys', () => {
  it('returns an empty array for an empty tree', () => {
    expect(getAllKeys([])).toEqual([]);
  });

  it('collects every key in depth-first order', () => {
    expect(getAllKeys(sampleTree)).toEqual(['src', 'src/App', 'src/App/App.tsx', 'src/main.tsx', 'sample.ts']);
  });
});

describe('getAllFolderKeys', () => {
  it('returns an empty array for an empty tree', () => {
    expect(getAllFolderKeys([])).toEqual([]);
  });

  it('collects only folder keys in depth-first order', () => {
    expect(getAllFolderKeys(sampleTree)).toEqual(['src', 'src/App']);
  });

  it('treats empty children arrays as folders', () => {
    expect(getAllFolderKeys([{ key: 'empty', title: 'empty', children: [] }])).toEqual(['empty']);
  });
});
