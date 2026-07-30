import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { getLeafNodeSize } from '../../getLeafNodeSize';
import { applyNodeDimensions, getLeafSizeForPath, toNodeDimensions } from './nodeDimensions';

describe('getLeafSizeForPath', () => {
  it('uses folder kind when the path is a visible folder', () => {
    const visibleNodes = new Map<string, 'folder' | 'file'>([['src/foo', 'folder']]);

    expect(getLeafSizeForPath('src/foo', visibleNodes)).toEqual(getLeafNodeSize('foo', 'folder'));
  });

  it('uses file kind for files and unknown paths', () => {
    const visibleNodes = new Map<string, 'folder' | 'file'>([['src/foo/a.ts', 'file']]);

    expect(getLeafSizeForPath('src/foo/a.ts', visibleNodes)).toEqual(getLeafNodeSize('a.ts', 'file'));
    expect(getLeafSizeForPath('missing.ts', visibleNodes)).toEqual(getLeafNodeSize('missing.ts', 'file'));
  });
});

describe('toNodeDimensions', () => {
  it('mirrors width and height onto style', () => {
    expect(toNodeDimensions({ width: 140, height: 40 })).toEqual({
      width: 140,
      height: 40,
      style: { width: 140, height: 40 },
    });
  });
});

describe('applyNodeDimensions', () => {
  it('updates size while preserving other style keys', () => {
    const node = {
      id: 'n',
      position: { x: 0, y: 0 },
      data: {},
      style: { pointerEvents: 'none', opacity: 0.5 },
    } as Node;

    applyNodeDimensions(node, { width: 160, height: 40 });

    expect(node.width).toBe(160);
    expect(node.height).toBe(40);
    expect(node.style).toEqual({
      pointerEvents: 'none',
      opacity: 0.5,
      width: 160,
      height: 40,
    });
  });
});
