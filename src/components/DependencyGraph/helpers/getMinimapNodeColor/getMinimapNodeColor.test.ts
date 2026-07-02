import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { getMinimapNodeColor } from './getMinimapNodeColor';

function node(partial: Partial<Node> & Pick<Node, 'type' | 'data'>): Node {
  return {
    id: 'test',
    position: { x: 0, y: 0 },
    ...partial,
  };
}

describe('getMinimapNodeColor', () => {
  it('boosts folder group colors while preserving hue', () => {
    const graphNode = node({
      type: 'folderGroup',
      data: { backgroundColor: 'hsl(120, 32%, 95%)' },
    });

    expect(getMinimapNodeColor(graphNode, 'light')).toBe('hsl(120, 52%, 76%)');
  });

  it('boosts collapsed folder colors in dark mode', () => {
    const graphNode = node({
      type: 'folder',
      data: { backgroundColor: 'hsl(45, 36%, 22%)' },
    });

    expect(getMinimapNodeColor(graphNode, 'dark')).toBe('hsl(45, 44%, 32%)');
  });

  it('returns non-hsl folder colors unchanged', () => {
    const rgba = 'rgba(0, 0, 0, 0.02)';
    const graphNode = node({
      type: 'folder',
      data: { backgroundColor: rgba },
    });

    expect(getMinimapNodeColor(graphNode, 'light')).toBe(rgba);
  });

  it('returns paper css variable for file nodes', () => {
    const graphNode = node({
      type: 'file',
      data: { label: 'a.ts', path: 'src/a.ts' },
    });

    expect(getMinimapNodeColor(graphNode, 'light')).toBe('var(--mui-palette-background-paper)');
  });
});
