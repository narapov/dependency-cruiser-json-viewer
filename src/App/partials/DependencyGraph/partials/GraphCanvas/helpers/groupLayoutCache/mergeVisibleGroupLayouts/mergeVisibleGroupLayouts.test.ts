import { describe, expect, it } from 'vitest';

import type { VisibleTreeLayoutedNode } from '../../../types';
import type { LayoutCache } from '../types';
import { collectVisibleGroupLayouts, mergeVisibleGroupLayouts } from './mergeVisibleGroupLayouts';

function fileNode(path: string, position = { x: 0, y: 0 }): VisibleTreeLayoutedNode {
  return {
    path,
    valueCircular: false,
    typeOnlyCircular: false,
    position,
    width: 80,
    height: 32,
  };
}

function folderNode(
  path: string,
  children: VisibleTreeLayoutedNode[],
  position = { x: 0, y: 0 },
  size = { width: 200, height: 120 },
): VisibleTreeLayoutedNode {
  return {
    path,
    valueCircular: false,
    typeOnlyCircular: false,
    position,
    width: size.width,
    height: size.height,
    children,
  };
}

describe('collectVisibleGroupLayouts', () => {
  it('collects root and expanded folder group entries', () => {
    const roots = [
      folderNode('src', [fileNode('src/a.ts', { x: 16, y: 52 })], { x: 10, y: 20 }, { width: 180, height: 100 }),
    ];

    const layouts = collectVisibleGroupLayouts(roots);
    expect(layouts.get(null)?.children.get('src')?.position).toEqual({ x: 10, y: 20 });
    expect(layouts.get('src')?.children.get('src/a.ts')?.position).toEqual({ x: 16, y: 52 });
    expect(layouts.get('src')?.width).toBe(180);
  });
});

describe('mergeVisibleGroupLayouts', () => {
  it('updates visible groups and preserves hidden collapsed entries', () => {
    const cache: LayoutCache = new Map([
      [
        'src/hidden',
        {
          id: 'src/hidden',
          width: 90,
          height: 70,
          children: new Map([
            ['src/hidden/x.ts', { id: 'src/hidden/x.ts', position: { x: 1, y: 2 }, width: 10, height: 10 }],
          ]),
        },
      ],
      [
        'src',
        {
          id: 'src',
          width: 100,
          height: 80,
          children: new Map([['src/old.ts', { id: 'src/old.ts', position: { x: 0, y: 0 }, width: 10, height: 10 }]]),
        },
      ],
    ]);

    const visible = collectVisibleGroupLayouts([
      folderNode('src', [fileNode('src/a.ts', { x: 5, y: 6 })], { x: 0, y: 0 }, { width: 150, height: 110 }),
    ]);

    mergeVisibleGroupLayouts(cache, visible);

    expect(cache.get('src')?.children.get('src/a.ts')?.position).toEqual({ x: 5, y: 6 });
    expect(cache.get('src')?.width).toBe(150);
    expect(cache.get('src/hidden')?.children.get('src/hidden/x.ts')?.position).toEqual({ x: 1, y: 2 });
  });
});
