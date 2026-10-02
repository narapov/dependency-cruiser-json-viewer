import { describe, expect, it } from 'vitest';

import { indexTreeByKey } from './indexTreeByKey';

interface TestNode {
  id: string;
  children?: TestNode[];
}

describe('indexTreeByKey', () => {
  it('returns an empty map for an empty forest', () => {
    expect(indexTreeByKey<TestNode, string>([], node => node.id).size).toBe(0);
  });

  it('indexes nested nodes with shared object refs', () => {
    const leaf: TestNode = { id: 'a.ts' };
    const folder: TestNode = { id: 'src', children: [leaf] };
    const roots = [folder];

    const map = indexTreeByKey(roots, node => node.id);

    expect([...map.keys()].toSorted()).toEqual(['a.ts', 'src']);
    expect(map.get('src')).toBe(folder);
    expect(map.get('a.ts')).toBe(leaf);
  });

  it('passes empty ancestors at roots and nearest-to-root chain for nested nodes', () => {
    const leaf: TestNode = { id: 'x.ts' };
    const mid: TestNode = { id: 'src', children: [leaf] };
    const root: TestNode = { id: 'app', children: [mid] };
    const seen: Array<{ id: string; ancestorIds: string[] }> = [];

    indexTreeByKey([root], (node, ancestors) => {
      seen.push({ id: node.id, ancestorIds: ancestors.map(ancestor => ancestor.id) });
      return node.id;
    });

    expect(seen).toEqual([
      { id: 'app', ancestorIds: [] },
      { id: 'src', ancestorIds: ['app'] },
      { id: 'x.ts', ancestorIds: ['src', 'app'] },
    ]);
  });

  it('keeps the last visited node when keys collide', () => {
    const first: TestNode = { id: 'dup' };
    const second: TestNode = { id: 'dup', children: [] };
    const roots: TestNode[] = [
      { id: 'a', children: [first] },
      { id: 'b', children: [second] },
    ];

    const map = indexTreeByKey(roots, node => node.id);

    expect(map.get('dup')).toBe(second);
  });
});
