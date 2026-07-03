import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { applyActivePathNodeHighlight } from './applyActivePathNodeHighlight';

function nodeAt(id: string, highlighted?: boolean): Node {
  return {
    id,
    type: 'file',
    position: { x: 0, y: 0 },
    data: { label: id, path: id, highlighted, circular: false },
  };
}

describe('applyActivePathNodeHighlight', () => {
  const nodes = [nodeAt('src/foo/a.ts'), nodeAt('src/foo/b.ts'), nodeAt('src/foo')];

  it('returns nodes unchanged when activePath is null', () => {
    expect(applyActivePathNodeHighlight(nodes, null)).toBe(nodes);
  });

  it('highlights only the matching node', () => {
    const result = applyActivePathNodeHighlight(nodes, 'src/foo/a.ts');
    const highlighted = result.find(node => node.id === 'src/foo/a.ts');
    const other = result.find(node => node.id === 'src/foo/b.ts');

    expect(highlighted?.data.highlighted).toBe(true);
    expect(other?.data.highlighted).toBeUndefined();
  });

  it('reuses unchanged node objects', () => {
    const result = applyActivePathNodeHighlight(nodes, 'src/foo/a.ts');
    const unchanged = result.find(node => node.id === 'src/foo/b.ts');

    expect(unchanged).toBe(nodes[1]);
  });

  it('moves highlight when switching activePath on base nodes', () => {
    const result = applyActivePathNodeHighlight(nodes, 'src/foo/b.ts');

    expect(result.find(node => node.id === 'src/foo/a.ts')?.data.highlighted).toBeUndefined();
    expect(result.find(node => node.id === 'src/foo/b.ts')?.data.highlighted).toBe(true);
  });
});
