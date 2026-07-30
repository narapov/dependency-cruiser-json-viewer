import { describe, expect, it } from 'vitest';

import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../../getLeafNodeSize';
import { createTestNode as node } from '../createTestNode';
import { applyGroupSizeToNode, getNodeSizeFromNode, resolveGroupSize } from './resolveGroupSize';

describe('resolveGroupSize', () => {
  it('returns empty-group minimum size when group has no children', () => {
    const nodes = [node('group', { type: 'folderGroup' })];
    const parentByNode = new Map<string, string | null>([['group', null]]);

    expect(resolveGroupSize('group', nodes, parentByNode)).toEqual({
      width: LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2,
      height: GROUP_HEADER + LEAF_NODE_HEIGHT + GROUP_PADDING * 2,
    });
  });

  it('sizes group from max child x+width / y+height plus GROUP_PADDING', () => {
    const nodes = [
      node('group', { type: 'folderGroup' }),
      node('a', { parentId: 'group', position: { x: 10, y: 20 }, width: 100, height: 40 }),
      node('b', { parentId: 'group', position: { x: 50, y: 80 }, width: 120, height: 40 }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['group', null],
      ['a', 'group'],
      ['b', 'group'],
    ]);

    expect(resolveGroupSize('group', nodes, parentByNode)).toEqual({
      width: 50 + 120 + GROUP_PADDING,
      height: 80 + 40 + GROUP_PADDING,
    });
  });

  it('respects minimum width and height floors when children are compact', () => {
    const nodes = [
      node('group', { type: 'folderGroup' }),
      node('a', { parentId: 'group', position: { x: 0, y: 0 }, width: 10, height: 10 }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['group', null],
      ['a', 'group'],
    ]);

    expect(resolveGroupSize('group', nodes, parentByNode)).toEqual({
      width: LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2,
      height: GROUP_HEADER + LEAF_NODE_HEIGHT + GROUP_PADDING,
    });
  });

  it('reads width/height from node.style when node.width/height are missing', () => {
    const nodes = [
      node('group', { type: 'folderGroup' }),
      node('a', {
        parentId: 'group',
        position: { x: 0, y: 0 },
        width: undefined,
        height: undefined,
        style: { width: 200, height: 100 },
      }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['group', null],
      ['a', 'group'],
    ]);

    expect(resolveGroupSize('group', nodes, parentByNode)).toEqual({
      width: 200 + GROUP_PADDING,
      height: 100 + GROUP_PADDING,
    });
  });
});

describe('applyGroupSizeToNode', () => {
  it('sets width, height, and style dimensions without dropping other style keys', () => {
    const result = applyGroupSizeToNode(node('group', { type: 'folderGroup', style: { background: 'red' } }), {
      width: 300,
      height: 200,
    });

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
    expect(result.style).toEqual({ background: 'red', width: 300, height: 200 });
  });
});

describe('getNodeSizeFromNode', () => {
  it('falls back to leaf defaults when dimensions are absent', () => {
    expect(
      getNodeSizeFromNode(
        node('a', {
          width: undefined,
          height: undefined,
          style: undefined,
        }),
      ),
    ).toEqual({ width: LEAF_NODE_MIN_WIDTH, height: LEAF_NODE_HEIGHT });
  });
});
